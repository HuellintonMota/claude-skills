"""Configuração de voz da skill: voz, velocidade e tom do edge-tts, salvos só nesta máquina.

Uso:
  python voz.py mostrar
  python voz.py vozes [--idioma pt-BR]
  python voz.py definir [--voz NOME] [--velocidade +10%] [--tom -2Hz]
  python voz.py amostra [--voz NOME ...] [--velocidade +10%] [--tom -2Hz] [--texto "..."] [--saida PASTA]
  python voz.py padrao

A configuração fica em config.json, ao lado desta pasta de scripts (fora do git). O que não for passado
em `amostra` vem da configuração salva, para ouvir a mudança antes de gravar com `definir`.
Velocidade em %, de -50% a +100%; tom em Hz, de -50Hz a +50Hz; 0 é o natural da voz.
"""
import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

ARQUIVO = Path(__file__).resolve().parent.parent / "config.json"
PADRAO = {"voz": "pt-BR-ThalitaMultilingualNeural", "velocidade": "+0%", "tom": "+0Hz"}
FRASE_AMOSTRA = "Olá! Esta é a voz que vai narrar os vídeos explicativos. Dá para ajustar a velocidade e o tom."
LIMITES = {"velocidade": ("%", -50, 100), "tom": ("Hz", -50, 50)}


def normalizar(campo: str, valor: str) -> str:
    unidade, minimo, maximo = LIMITES[campo]
    achado = re.fullmatch(rf"\s*([+-]?)(\d{{1,3}})\s*(?:{unidade})?\s*", valor, re.IGNORECASE)
    if not achado:
        raise ValueError(f"{campo} inválido: '{valor}' (use algo como +10{unidade} ou -5{unidade})")
    numero = int(achado.group(2)) * (-1 if achado.group(1) == "-" else 1)
    if not minimo <= numero <= maximo:
        raise ValueError(f"{campo} fora do intervalo: {numero}{unidade} (de {minimo} a +{maximo})")
    return f"{numero:+d}{unidade}"


def carregar() -> dict:
    salvo = json.loads(ARQUIVO.read_text(encoding="utf-8")) if ARQUIVO.exists() else {}
    return {**PADRAO, **{k: v for k, v in salvo.items() if k in PADRAO}}


def somar_velocidade(base: str, acelerar: int) -> str:
    """Soma a aceleração da dublagem (para a fala caber no tempo) à velocidade configurada."""
    return f"{int(base.rstrip('%')) + acelerar:+d}%"


def salvar(config: dict) -> None:
    ARQUIVO.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def descrever(config: dict) -> str:
    return f"voz {config['voz']}, velocidade {config['velocidade']}, tom {config['tom']}"


async def listar_vozes(idioma: str) -> list[dict]:
    import edge_tts

    return sorted((v for v in await edge_tts.list_voices() if v["Locale"].lower().startswith(idioma.lower())),
                  key=lambda v: v["ShortName"])


async def gerar_amostras(vozes: list[str], velocidade: str, tom: str, texto: str, pasta: Path) -> list[Path]:
    import edge_tts

    pasta.mkdir(parents=True, exist_ok=True)
    arquivos = []
    for voz in vozes:
        destino = pasta / f"amostra-{voz}-vel{velocidade.replace('%', '')}-tom{tom.replace('Hz', '')}.mp3"
        await edge_tts.Communicate(texto, voz, rate=velocidade, pitch=tom).save(str(destino))
        arquivos.append(destino)
    return arquivos


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="acao", required=True)
    sub.add_parser("mostrar")
    sub.add_parser("padrao")
    vozes = sub.add_parser("vozes")
    vozes.add_argument("--idioma", default="pt-BR")
    definir = sub.add_parser("definir")
    amostra = sub.add_parser("amostra")
    for sp in (definir, amostra):
        sp.add_argument("--velocidade")
        sp.add_argument("--tom")
    definir.add_argument("--voz")
    amostra.add_argument("--voz", action="append", help="repita para comparar vozes")
    amostra.add_argument("--texto", default=FRASE_AMOSTRA)
    amostra.add_argument("--saida", default=".", help="pasta das amostras (padrão: a atual)")
    args = p.parse_args()

    config = carregar()
    try:
        if args.acao == "mostrar":
            origem = str(ARQUIVO) if ARQUIVO.exists() else "padrão da skill (nada salvo ainda)"
            print(f"{descrever(config)}\nfonte: {origem}")
        elif args.acao == "padrao":
            ARQUIVO.unlink(missing_ok=True)
            print(f"Configuração apagada; vale o padrão: {descrever(PADRAO)}")
        elif args.acao == "vozes":
            for v in asyncio.run(listar_vozes(args.idioma)):
                print(f"{v['ShortName']:40} {v['Gender']}")
        elif args.acao == "definir":
            if args.voz:
                nomes = {v["ShortName"] for v in asyncio.run(listar_vozes(""))}
                if args.voz not in nomes:
                    raise ValueError(f"voz desconhecida no edge-tts: {args.voz} (veja `voz.py vozes`)")
                config["voz"] = args.voz
            if args.velocidade is not None:
                config["velocidade"] = normalizar("velocidade", args.velocidade)
            if args.tom is not None:
                config["tom"] = normalizar("tom", args.tom)
            salvar(config)
            print(f"Salvo em {ARQUIVO}: {descrever(config)}")
        elif args.acao == "amostra":
            velocidade = normalizar("velocidade", args.velocidade) if args.velocidade is not None else config["velocidade"]
            tom = normalizar("tom", args.tom) if args.tom is not None else config["tom"]
            for arquivo in asyncio.run(gerar_amostras(args.voz or [config["voz"]], velocidade, tom, args.texto, Path(args.saida))):
                print(arquivo.resolve())
    except ValueError as erro:
        sys.exit(f"Erro: {erro}")


if __name__ == "__main__":
    main()
