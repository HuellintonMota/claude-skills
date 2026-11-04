#!/usr/bin/env bash
# Python com edge-tts e ffmpeg num .venv da própria skill; Node para o modo vídeo completo.

if py=$(python_do_sistema); then
  dep_ok "Python" "$($py --version 2>&1)"
  venv="$SKILL_DIR/.venv"
  if [ ! -d "$venv" ]; then
    $py -m venv "$venv" || dep_falta "venv da skill" "não consegui criar $venv"
  fi
  vpy=$(python_do_venv "$venv")
  if [ -x "$vpy" ]; then
    if ! "$vpy" -c 'import edge_tts, imageio_ffmpeg' >/dev/null 2>&1; then
      echo "    instalando edge-tts e ffmpeg no venv da skill..."
      "$vpy" -m pip install -q --disable-pip-version-check edge-tts imageio-ffmpeg
    fi
    if "$vpy" -c 'import edge_tts, imageio_ffmpeg' >/dev/null 2>&1; then
      dep_ok "edge-tts e ffmpeg" "$venv"
    else
      dep_falta "edge-tts e ffmpeg" "falhou: $vpy -m pip install edge-tts imageio-ffmpeg"
    fi
  fi
else
  dep_sistema "Python 3.10+" "Python.Python.3.12" "python@3.12" "python3 python3-venv"
fi

# Os scripts .ts do projeto rodam direto no node, o que exige a remoção de tipos nativa (22.18+).
if tem node && node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=18)?0:1)' 2>/dev/null; then
  dep_ok "Node" "$(node --version) (modo vídeo completo)"
elif tem node; then
  dep_falta "Node 22.18+" "versão atual $(node --version); atualize para o modo vídeo completo"
else
  dep_sistema "Node LTS (só para o modo vídeo completo)" "OpenJS.NodeJS.LTS" "node" "nodejs"
fi
