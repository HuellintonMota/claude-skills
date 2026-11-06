#!/usr/bin/env bash
# Hook SessionStart do Claude Code (ligado pelo setup com --auto-atualizar): atualiza o checkout das
# claude-skills no máximo uma vez por dia. Não diz nada quando não há novidade; quando atualiza, a linha
# impressa entra no contexto da sessão, e o Claude pode contar à pessoa o que mudou.
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MARCA="$RAIZ/.git/ultima-atualizacao-automatica"
hoje="$(date +%Y-%m-%d)"

[ "$(cat "$MARCA" 2>/dev/null)" = "$hoje" ] && exit 0
# "Adiar por 1 dia" (verificar-atualizacao.sh adiar) também segura a automática.
ate="$(cat "$RAIZ/.git/adiar-atualizacao-ate" 2>/dev/null)"
[ -n "$ate" ] && [[ "$hoje" < "$ate" ]] && exit 0
echo "$hoje" > "$MARCA"

# Alteração local num arquivo versionado faria o pull falhar ou misturar trabalho; a pessoa decide.
if [ -n "$(git -C "$RAIZ" status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  echo "claude-skills: atualização automática pulada, há alterações locais em $RAIZ."
  exit 0
fi

antes="$(git -C "$RAIZ" rev-parse HEAD 2>/dev/null)" || exit 0
limite=""
command -v timeout >/dev/null 2>&1 && limite="timeout 20"
# Sem rede, ou com o histórico divergente, fica para o dia seguinte sem atrapalhar a sessão.
$limite git -C "$RAIZ" pull --ff-only -q >/dev/null 2>&1 || exit 0
depois="$(git -C "$RAIZ" rev-parse HEAD)"
[ "$antes" = "$depois" ] && exit 0

novas="$(bash "$RAIZ/setup" --atualizar --sem-dependencias 2>/dev/null | sed -n '/^Não instaladas/,/^Pronto/p' | sed '/^Pronto/d')"
echo "claude-skills atualizadas automaticamente (${antes:0:7} → ${depois:0:7}):"
git -C "$RAIZ" log --oneline --no-decorate "$antes..$depois" | sed 's/^/  /'
[ -n "$novas" ] && echo "$novas"
echo "Se alguma skill reclamar de dependência, peça \"atualizar as claude-skills\" para conferir."
exit 0
