"""Gera a narração de cada cena com edge-tts e grava o tempo de cada palavra.

Uso: python gerar_narracao.py [id_cena ...]   (sem argumentos, gera todas)
O texto falado é a legenda com os números por extenso (scripts/fala.ts) e as trocas de "pronuncia",
para a legenda continuar escrita com algarismos. Se o edge-tts falhar, o script para com erro: não há voz reserva.
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


async def gerar(cena: dict) -> dict:
    comunicador = edge_tts.Communicate(texto_falado(cena), ROTEIRO["voz"], boundary="WordBoundary")
    palavras = []
    audio = bytearray()
    async for parte in comunicador.stream():
        if parte["type"] == "audio":
            audio.extend(parte["data"])
        elif parte["type"] == "WordBoundary":
            palavras.append({"texto": parte["text"], "inicio": parte["offset"] / 1e7, "fim": (parte["offset"] + parte["duration"]) / 1e7})
    if not audio:
        raise RuntimeError(f"edge-tts não devolveu áudio para {cena['id']}")
    (SAIDA / f"{cena['id']}.mp3").write_bytes(bytes(audio))
    return {"id": cena["id"], "palavras": palavras}


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
