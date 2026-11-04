#!/usr/bin/env bash
# Chamado pelo setup do repositório ao instalar o orquestrador: grava a URL do webhook do Discord fora do git.
ARQUIVO="$HOME/.claude/orquestrador.env"
if [ -f "$ARQUIVO" ] && grep -q '^ORQUESTRADOR_DISCORD_WEBHOOK=.' "$ARQUIVO"; then
  echo "  orquestrador: webhook do Discord já configurado em $ARQUIVO"
  exit 0
fi
if [ ! -t 0 ]; then
  echo "  orquestrador: sem webhook do Discord; o aviso por DM fica desligado até criar $ARQUIVO"
  exit 0
fi
read -r -p "  URL do webhook do n8n para as DMs do Discord (Enter para pular): " url
if [ -z "$url" ]; then
  echo "  orquestrador: aviso por DM desligado; rode o setup de novo para configurar"
  exit 0
fi
umask 077
printf 'ORQUESTRADOR_DISCORD_WEBHOOK=%s\n' "$url" > "$ARQUIVO"
echo "  orquestrador: webhook gravado em $ARQUIVO"
