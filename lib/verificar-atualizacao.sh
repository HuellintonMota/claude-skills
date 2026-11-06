#!/usr/bin/env bash
# Confere se há versão nova das claude-skills antes de uma skill ser usada.
#
# Uso: verificar-atualizacao.sh            não imprime nada se está em dia, se não há rede ou se a
#                                          pessoa adiou; senão, "ATUALIZACAO_DISPONIVEL <versão local>
#                                          <versão nova> <n commits>" e as novidades do CHANGELOG
#                                          (ou os commits, quando a versão não mudou)
#      verificar-atualizacao.sh atualizar  pull --ff-only + setup --atualizar
#      verificar-atualizacao.sh adiar      não pergunta mais até amanhã (vale também para a automática)
#
# O adiamento e o horário da última consulta ficam dentro do .git: são desta máquina e não vão para o
# repositório.
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADIAR="$RAIZ/.git/adiar-atualizacao-ate"
# shellcheck source=versao.sh
. "$RAIZ/lib/versao.sh"
hoje="$(date +%Y-%m-%d)"

case "${1:-verificar}" in
  adiar)
    amanha="$(date -d tomorrow +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)"
    echo "$amanha" > "$ADIAR"
    echo "Atualização adiada: pergunto de novo a partir de $amanha."
    ;;
  atualizar)
    rm -f "$ADIAR"
    if [ -n "$(git -C "$RAIZ" status --porcelain --untracked-files=no)" ]; then
      echo "Há alterações locais em $RAIZ; atualize pela skill claude-skills-atualizar, que mostra o que é."
      exit 1
    fi
    antes="$(git -C "$RAIZ" rev-parse --short HEAD)"
    versao_antes="$(versao_em HEAD)"
    git -C "$RAIZ" pull --ff-only -q || exit 1
    bash "$RAIZ/setup" --atualizar
    echo "Atualizado de $versao_antes ($antes) para $(versao_em HEAD) ($(git -C "$RAIZ" rev-parse --short HEAD))."
    ;;
  verificar)
    # Datas em AAAA-MM-DD comparam como texto: adiado enquanto hoje for antes da data gravada.
    ate="$(cat "$ADIAR" 2>/dev/null)"
    [ -n "$ate" ] && [[ "$hoje" < "$ate" ]] && exit 0
    # Um fetch por chamada deixaria cada uso de skill mais lento; dez minutos de cache bastam.
    fetch="$RAIZ/.git/FETCH_HEAD"
    if [ ! -f "$fetch" ] || [ -n "$(find "$fetch" -mmin +10 2>/dev/null)" ]; then
      limite=""
      command -v timeout >/dev/null 2>&1 && limite="timeout 10"
      $limite git -C "$RAIZ" fetch -q 2>/dev/null || exit 0
    fi
    atras="$(git -C "$RAIZ" rev-list --count HEAD..@{u} 2>/dev/null)" || exit 0
    [ "${atras:-0}" -gt 0 ] || exit 0
    echo "ATUALIZACAO_DISPONIVEL $(versao_em HEAD) $(versao_em '@{u}') $atras"
    novidades_entre HEAD '@{u}'
    ;;
  *)
    sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
