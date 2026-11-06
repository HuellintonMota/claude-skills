"""Gera a narração de cada cena com edge-tts e grava o tempo de cada palavra.

Uso: python gerar_narracao.py [id_cena ...]   (sem argumentos, gera todas)
O texto falado é a legenda com os números por extenso (scripts/fala.ts) e as trocas de "pronuncia",
para a legenda continuar escrita com algarismos. Voz, velocidade e tom vêm do narracao.json, copiados
da configuração da skill quando o projeto é criado, para o vídeo sair igual se for refeito em outra máquina. Se o edge-tts falhar, o script para com erro: não há voz reserva.
"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
ROTEIRO = json.loads((RAIZ / "scripts" / "narracao.json").read_text(encoding="utf-8"))
SAIDA = RAIZ / "remotion" / "public" / "audio"
TEMPOS = RAIZ / "remotion" / "src" / "tempos.json"


FALAS = json.loads(subprocess.run(["node", str(RAIZ / "scripts" / "fala.ts")], capture_output=True, check=True, text=True, encoding="utf-8").stdout)


def texto_falado(cena: dict) -> str:
    texto = FALAS[cena["id"]]
    for escrito, falado in ROTEIRO["pronuncia"].items():
        texto = texto.replace(escrito, falado)
    return texto


def so_letras(texto: str) -> str:
    return "".join(ch for ch in texto.lower() if ch.isalnum())


async def falar(texto: str) -> tuple[bytes, list[dict]]:
    comunicador = edge_tts.Communicate(texto, ROTEIRO["voz"], rate=ROTEIRO.get("velocidade", "+0%"),
                                       pitch=ROTEIRO.get("tom", "+0Hz"), boundary="WordBoundary")
    palavras = []
    audio = bytearray()
    async for parte in comunicador.stream():
        if parte["type"] == "audio":
            audio.extend(parte["data"])
        elif parte["type"] == "WordBoundary":
            palavras.append({"texto": parte["text"], "inicio": parte["offset"] / 1e7, "fim": (parte["offset"] + parte["duration"]) / 1e7})
    return bytes(audio), palavras


async def gerar(cena: dict) -> dict:
    texto = texto_falado(cena)
    ultima = so_letras(texto.split()[-1])
    for tentativa in range(1, 4):
        audio, palavras = await falar(texto)
        # O edge-tts às vezes fecha o stream no meio da frase sem erro: o mp3 sai curto e a última
        # palavra some. O mp3 dele é de 48 kbit/s, então o tamanho dá a duração.
        duracao = len(audio) * 8 / 48000
        completo = palavras and so_letras(palavras[-1]["texto"]) == ultima and duracao >= palavras[-1]["fim"]
        if completo:
            (SAIDA / f"{cena['id']}.mp3").write_bytes(audio)
            return {"id": cena["id"], "palavras": palavras}
        fim = palavras[-1]["texto"] if palavras else "nada"
        print(f"aviso {cena['id']}: áudio incompleto ({duracao:.2f}s, terminou em '{fim}'), tentativa {tentativa}/3")
    raise RuntimeError(f"edge-tts devolveu áudio incompleto para {cena['id']} três vezes")


async def main() -> None:
    pedidas = set(sys.argv[1:])
    tempos = json.loads(TEMPOS.read_text(encoding="utf-8")) if TEMPOS.exists() else {}
    for cena in ROTEIRO["cenas"]:
        if pedidas and cena["id"] not in pedidas:
            continue
        resultado = await gerar(cena)
        tempos[cena["id"]] = {"legenda": cena["legenda"], "palavras": resultado["palavras"]}
        print(f"ok {cena['id']}: {len(resultado['palavras'])} palavras, fala até {resultado['palavras'][-1]['fim']:.1f}s")
    TEMPOS.write_text(json.dumps(tempos, ensure_ascii=False, indent=1), encoding="utf-8")


asyncio.run(main())
