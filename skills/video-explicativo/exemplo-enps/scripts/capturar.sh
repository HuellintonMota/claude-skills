#!/usr/bin/env bash
# Uso: capturar.sh NOME 'ALVOS_JSON' — screenshot do portal + registro com o tamanho real da imagem.
set -e
f=$(maestri portal screenshot "Vídeo Dev")
dim=$(powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; \$i=[System.Drawing.Image]::FromFile('$f'); \"\$(\$i.Width) \$(\$i.Height)\"; \$i.Dispose()" | tr -d '\r')
node "$(dirname "$0")/registrar-captura.mjs" "$1" "$f" $dim "$2"
echo "$f ($dim)"
