"""Dubla um vídeo que já tem legenda e não tem áudio: narra cada fala da legenda com edge-tts no tempo dela.

Uso:
  python dublar.py VIDEO [--legenda X.srt] [--voz pt-BR-ThalitaMultilingualNeural]
                   [--pronuncia pronuncia.json] [--saida X-dublado.mp4] [--ffmpeg CAMINHO]
                   [--acelerar-max 30] [--so-relatorio]

Sem --legenda, procura um .srt com o mesmo nome do vídeo e, se não houver, a primeira faixa de legenda
embutida. Legenda só queimada na imagem não é lida aqui: monte o .srt antes (references/dublagem.md).
Requer: pip install edge-tts; ffmpeg no PATH, em $FFMPEG ou em --ffmpeg.
"""
import argparse
import asyncio
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from array import array
from dataclasses import dataclass
from pathlib import Path

import edge_tts

TAXA = 24000
# Legendas costumam quebrar uma frase em vários blocos; narrar bloco a bloco deixa a entonação picotada.
JUNTAR_SE_INTERVALO_MENOR_QUE = 0.35
FIM_DE_FRASE = re.compile(r"[.!?…]['\"”»)]*$")
FOLGA_ENTRE_FALAS = 0.1
# Passar um pouco do tempo da legenda soa melhor do que acelerar a voz; a fala seguinte só atrasa um pouco.
TOLERANCIA_SEM_ACELERAR = 0.25


@dataclass
class Fala:
    inicio: float
    fim_legenda: float
    texto: str
    limite: float = 0.0


UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
            "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos",
            "oitocentos", "novecentos"]


def ate_mil(n: int) -> str:
    if n == 100:
        return "cem"
    if n < 20:
        return UNIDADES[n]
    if n < 100:
        return DEZENAS[n // 10] + (f" e {UNIDADES[n % 10]}" if n % 10 else "")
    return CENTENAS[n // 100] + (f" e {ate_mil(n % 100)}" if n % 100 else "")


def por_extenso(n: int) -> str:
    if n >= 1_000_000:
        return str(n)
    milhar, resto = divmod(n, 1000)
    if not milhar:
        return ate_mil(resto)
    prefixo = "mil" if milhar == 1 else f"{ate_mil(milhar)} mil"
    if not resto:
        return prefixo
    return f"{prefixo} e {ate_mil(resto)}" if resto < 100 or resto % 100 == 0 else f"{prefixo} {ate_mil(resto)}"


def texto_falado(texto: str, pronuncia: dict[str, str]) -> str:
    # Vozes multilíngues às vezes leem algarismos em outra língua: a fala vai por extenso.
    texto = re.sub(r"(?<![\w.,])[-−](?=\d)", "menos ", texto)
    texto = re.sub(r"(\d+)(%?)", lambda m: por_extenso(int(m.group(1))) + (" por cento" if m.group(2) else ""), texto)
    for escrito, falado in pronuncia.items():
        texto = texto.replace(escrito, falado)
    return texto


def achar_ffmpeg(indicado: str | None) -> str:
    for candidato in (indicado, os.environ.get("FFMPEG"), shutil.which("ffmpeg")):
        if candidato and (Path(candidato).exists() or shutil.which(candidato)):
            return candidato
    sys.exit("ffmpeg não encontrado. Use --ffmpeg, a variável FFMPEG, `npm i ffmpeg-static` "
             "(node_modules/ffmpeg-static/ffmpeg.exe) ou `winget install Gyan.FFmpeg`.")


def sondar(ffmpeg: str, video: Path) -> tuple[float, bool, bool]:
    saida = subprocess.run([ffmpeg, "-hide_banner", "-i", str(video)], capture_output=True, text=True,
                           encoding="utf-8", errors="replace").stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", saida)
    if not m:
        sys.exit(f"Não consegui ler a duração de {video}:\n{saida[-800:]}")
    duracao = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    return duracao, "Audio:" in saida, "Subtitle:" in saida


def relogio_para_seg(t: str) -> float:
    h, m, s = t.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def ler_srt(caminho: Path) -> list[Fala]:
    blocos = re.split(r"\n\s*\n", caminho.read_text(encoding="utf-8-sig").replace("\r\n", "\n").strip())
    falas = []
    for bloco in blocos:
        linhas = bloco.strip().split("\n")
        i = next((k for k, l in enumerate(linhas) if "-->" in l), None)
        if i is None:
            continue
        ini, fim = (p.strip().split(" ")[0] for p in linhas[i].split("-->"))
        texto = re.sub(r"<[^>]+>|\{[^}]+\}", "", " ".join(linhas[i + 1:])).strip()
        if texto:
            falas.append(Fala(relogio_para_seg(ini), relogio_para_seg(fim), re.sub(r"\s+", " ", texto)))
    return sorted(falas, key=lambda f: f.inicio)


def juntar_frases(blocos: list[Fala]) -> list[Fala]:
    falas: list[Fala] = []
    for b in blocos:
        anterior = falas[-1] if falas else None
        if anterior and not FIM_DE_FRASE.search(anterior.texto) and b.inicio - anterior.fim_legenda < JUNTAR_SE_INTERVALO_MENOR_QUE:
            anterior.texto += " " + b.texto
            anterior.fim_legenda = b.fim_legenda
        else:
            falas.append(Fala(b.inicio, b.fim_legenda, b.texto))
    return falas


def legenda_do_video(args, ffmpeg: str, video: Path, tem_legenda_embutida: bool, pasta: Path) -> Path:
    if args.legenda:
        return Path(args.legenda)
    vizinha = video.with_suffix(".srt")
    if vizinha.exists():
        return vizinha
    if tem_legenda_embutida:
        extraida = pasta / "embutida.srt"
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(video), "-map", "0:s:0", str(extraida)], check=True)
        return extraida
    sys.exit("Sem legenda: passe --legenda X.srt. Se a legenda está só queimada na imagem, monte o .srt "
             "primeiro (references/dublagem.md).")


async def sintetizar(texto: str, voz: str, acelerar: int, mp3: Path) -> None:
    taxa = f"+{acelerar}%" if acelerar else "+0%"
    await edge_tts.Communicate(texto, voz, rate=taxa).save(str(mp3))
    if not mp3.exists() or mp3.stat().st_size == 0:
        raise RuntimeError(f"edge-tts não devolveu áudio para: {texto[:60]}")


def decodificar(ffmpeg: str, mp3: Path) -> array:
    wav = mp3.with_suffix(".wav")
    subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(mp3), "-ac", "1", "-ar", str(TAXA), "-sample_fmt", "s16", str(wav)], check=True)
    with wave.open(str(wav)) as w:
        amostras = array("h", w.readframes(w.getnframes()))
    if sys.byteorder == "big":
        amostras.byteswap()
    return amostras


async def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("video")
    p.add_argument("--legenda")
    p.add_argument("--voz", default="pt-BR-ThalitaMultilingualNeural")
    p.add_argument("--pronuncia", help="JSON {\"escrito\": \"falado\"} para siglas e nomes que a voz erra")
    p.add_argument("--saida")
    p.add_argument("--ffmpeg")
    p.add_argument("--acelerar-max", type=int, default=30, help="aceleração máxima da voz, em %%, para caber na fala")
    p.add_argument("--so-relatorio", action="store_true", help="gera e mede as falas, sem montar o vídeo")
    args = p.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    ffmpeg = achar_ffmpeg(args.ffmpeg)
    video = Path(args.video).resolve()
    duracao, tem_audio, tem_legenda = sondar(ffmpeg, video)
    if tem_audio:
        print("Aviso: o vídeo já tem faixa de áudio; a saída fica só com a narração.")
    pronuncia = json.loads(Path(args.pronuncia).read_text(encoding="utf-8")) if args.pronuncia else {}
    saida = Path(args.saida) if args.saida else video.with_name(f"{video.stem}-dublado{video.suffix}")

    with tempfile.TemporaryDirectory(prefix="dublagem-") as tmp:
        pasta = Path(tmp)
        falas = juntar_frases(ler_srt(legenda_do_video(args, ffmpeg, video, tem_legenda, pasta)))
        if not falas:
            sys.exit("A legenda não tem falas.")
        for i, f in enumerate(falas):
            f.limite = (falas[i + 1].inicio if i + 1 < len(falas) else duracao) - FOLGA_ENTRE_FALAS

        trilha = array("h", bytes(2 * math.ceil(duracao * TAXA)))
        fim_anterior = 0.0
        aceleradas, atrasadas, cortadas = [], [], []
        for i, f in enumerate(falas, 1):
            texto = texto_falado(f.texto, pronuncia)
            mp3 = pasta / f"f{i:03}.mp3"
            await sintetizar(texto, args.voz, 0, mp3)
            som = decodificar(ffmpeg, mp3)
            espaco = f.limite - f.inicio
            if len(som) / TAXA > espaco + TOLERANCIA_SEM_ACELERAR and espaco > 0:
                acelerar = min(args.acelerar_max, math.ceil((len(som) / TAXA / espaco - 1) * 100) + 2)
                await sintetizar(texto, args.voz, acelerar, mp3)
                som = decodificar(ffmpeg, mp3)
                aceleradas.append((i, acelerar))
            inicio = max(f.inicio, fim_anterior + FOLGA_ENTRE_FALAS)
            if inicio > f.inicio + 0.3:
                atrasadas.append((i, inicio - f.inicio))
            base = round(inicio * TAXA)
            cabe = max(0, min(len(som), len(trilha) - base))
            if cabe < len(som):
                cortadas.append(i)
            for k in range(cabe):
                trilha[base + k] = som[k]
            fim_anterior = inicio + len(som) / TAXA
            print(f"fala {i:3}/{len(falas)}  {f.inicio:7.2f}s  {len(som) / TAXA:5.2f}s de voz em {espaco:5.2f}s  {f.texto[:60]}")

        print(f"\n{len(falas)} falas, voz {args.voz}.")
        if aceleradas:
            print("Aceleradas para caber: " + ", ".join(f"fala {i} (+{a}%)" for i, a in aceleradas))
        if atrasadas:
            print("Começaram mais de 0,3 s depois da legenda: " + ", ".join(f"fala {i} (+{d:.2f}s)" for i, d in atrasadas))
        if cortadas:
            print("Cortadas no fim do vídeo: " + ", ".join(f"fala {i}" for i in cortadas))
        if args.so_relatorio:
            return

        if sys.byteorder == "big":
            trilha.byteswap()
        narracao = pasta / "narracao.wav"
        with wave.open(str(narracao), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(TAXA)
            w.writeframes(trilha.tobytes())
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(video), "-i", str(narracao),
                        "-map", "0:v:0", "-map", "1:a:0", "-map", "0:s?", "-c:v", "copy", "-c:s", "copy",
                        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(saida)], check=True)
    print(f"\nVídeo dublado: {saida}")


if __name__ == "__main__":
    asyncio.run(main())
