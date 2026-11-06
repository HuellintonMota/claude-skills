"""Liga ou desliga o hook SessionStart que atualiza as claude-skills, no settings.json do Claude Code.

Uso: python registrar_hook.py ligar|desligar|estado SETTINGS_JSON COMANDO

Mexe só na entrada cujo comando termina em lib/auto-atualizar.sh; o resto do arquivo fica como está.
"""
import json
import sys
from pathlib import Path

MARCA = "lib/auto-atualizar.sh"


def eh_nosso(hook: dict) -> bool:
    return MARCA in hook.get("command", "").replace("\\", "/")


def main() -> None:
    acao, arquivo, comando = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
    config = json.loads(arquivo.read_text(encoding="utf-8")) if arquivo.exists() and arquivo.stat().st_size else {}
    grupos = config.get("hooks", {}).get("SessionStart", [])
    ligado = any(eh_nosso(h) for g in grupos for h in g.get("hooks", []))

    if acao == "estado":
        print("ligado" if ligado else "desligado")
        return

    restantes = []
    for grupo in grupos:
        grupo["hooks"] = [h for h in grupo.get("hooks", []) if not eh_nosso(h)]
        if grupo["hooks"]:
            restantes.append(grupo)
    if acao == "ligar":
        restantes.append({"matcher": "startup", "hooks": [{"type": "command", "command": comando, "timeout": 60}]})

    hooks = config.setdefault("hooks", {})
    if restantes:
        hooks["SessionStart"] = restantes
    else:
        hooks.pop("SessionStart", None)
    if not hooks:
        config.pop("hooks")
    arquivo.parent.mkdir(parents=True, exist_ok=True)
    arquivo.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("ligado" if acao == "ligar" else "desligado")


if __name__ == "__main__":
    main()
