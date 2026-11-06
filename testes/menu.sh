#!/usr/bin/env bash
# Testa as caixas de seleção do setup (lib/menu.sh) sem terminal: as teclas entram por um descritor.
# Uso: bash testes/menu.sh
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=../lib/menu.sh
. "$RAIZ/lib/menu.sh"

falhas=0
CIMA=$'\e[A'
BAIXO=$'\e[B'
CIMA_APP=$'\eOA'
ESC=$'\e'
ENTER=$'\n'

# rodar "teclas" "marcados iniciais" → imprime "<retorno> <marcados finais> <posição>"
rodar() {
  local teclas="$1" i
  read -r -a MENU_MARCADOS <<< "$2"
  MENU_ROTULOS=(); MENU_DESCRICOES=()
  for i in "${!MENU_MARCADOS[@]}"; do MENU_ROTULOS+=("item$i"); MENU_DESCRICOES+=("descrição $i"); done
  local ret=0
  MENU_SEM_DESENHO=1 MENU_FD=3 menu_escolher "teste" 3< <(printf '%s' "$teclas") || ret=$?
  echo "$ret ${MENU_MARCADOS[*]} $MENU_POS"
}

confere() {
  if [ "$2" = "$3" ]; then
    echo "  ok    $1"
  else
    echo "  FALHA $1: esperado \"$3\", veio \"$2\""
    falhas=$((falhas + 1))
  fi
}

echo "Caixas de seleção:"
confere "Enter confirma sem mudar nada"            "$(rodar "$ENTER" '1 0 0')"               "0 1 0 0 0"
confere "seta para baixo e Espaço marcam o 2º"     "$(rodar "$BAIXO $ENTER" '1 0 0')"        "0 1 1 0 1"
confere "j, j e Espaço marcam o 3º"                "$(rodar "jj $ENTER" '0 0 0')"            "0 0 0 1 2"
confere "Espaço desmarca o já marcado"             "$(rodar " $ENTER" '1 1 0')"              "0 0 1 0 0"
confere "seta para cima dá a volta para o último"  "$(rodar "$CIMA $ENTER" '0 0 0')"         "0 0 0 1 2"
confere "seta no modo de aplicação (Esc O A)"      "$(rodar "$CIMA_APP $ENTER" '0 0 0')"     "0 0 0 1 2"
confere "k sobe"                                   "$(rodar "jjk $ENTER" '0 0 0')"           "0 0 1 0 1"
confere "a marca todos quando falta algum"         "$(rodar "a$ENTER" '1 0 1')"              "0 1 1 1 0"
confere "a desmarca todos quando todos estão"      "$(rodar "a$ENTER" '1 1 1')"              "0 0 0 0 0"
confere "Esc cancela"                              "$(rodar "$ESC" '1 0 0')"                 "1 1 0 0 0"
confere "q cancela"                                "$(rodar 'jq' '1 0 0')"                   "1 1 0 0 1"
confere "fim da entrada cancela"                   "$(rodar ' ' '0 0 0')"                    "1 1 0 0 0"
confere "outras teclas são ignoradas"              "$(rodar "xz9$ENTER" '0 1 0')"            "0 0 1 0 0"
confere "lista de 1 item"                          "$(rodar "$BAIXO $ENTER" '0')"            "0 1 0"
confere "lista vazia confirma sem ler tecla"       "$(rodar 'q' '')"                         "0  0"

echo "Desenho (sem terminal, saída num arquivo):"
saida="$(mktemp)"
MENU_ROTULOS=(um dois tres); MENU_DESCRICOES=(a b c); MENU_MARCADOS=(1 0 0)
MENU_FD=3 menu_escolher "Título" 3< <(printf '%s' "$BAIXO $ENTER") > "$saida"
confere "título uma vez"                    "$(grep -c '^Título$' "$saida")"                          "1"
confere "cursor escondido e mostrado"       "$(grep -c $'\e\\[?25[lh]' "$saida")"                     "2"
confere "sobe 4 linhas a cada redesenho"    "$(grep -o $'\e\\[4A' "$saida" | wc -l | tr -d ' ')"     "3"
confere "estado final"                      "$(sed $'s/\e\\[[0-9;?]*[A-Za-z]//g' "$saida" | tail -4 | tr '\n' '|')" \
  "  [x] um    a|  [x] dois  b|  [ ] tres  c|  ok: 2 de 3 marcado(s)|"

MENU_ROTULOS=(); MENU_DESCRICOES=(); MENU_MARCADOS=()
for i in 0 1 2 3 4 5 6 7 8 9; do MENU_ROTULOS+=("item$i"); MENU_DESCRICOES+=("uma descrição comprida que passa da largura"); MENU_MARCADOS+=(0); done
MENU_TAMANHO="7 40" MENU_FD=3 menu_escolher "Lista grande" 3< <(printf '%s' "jjjjj $ENTER") > "$saida"
limpo="$(sed $'s/\e\[[0-9;?]*[A-Za-z]//g' "$saida")"
confere "rola: mostra só 3 linhas por vez"   "$(grep -o $'\e\[4A' "$saida" | wc -l | tr -d ' ')"   "7"
confere "rola: a janela acompanha o cursor"  "$(echo "$limpo" | grep -c '^> \[ \] item5')"          "1"
confere "rola: ajuda diz o trecho"           "$(echo "$limpo" | grep -c '^  (4-6 de 10) ')"            "2"
confere "corta na largura do terminal"       "$(echo "$limpo" | awk '{ if (length($0) > 39) n++ } END { print n + 0 }')" "0"
confere "estado final da lista grande"       "$(echo "$limpo" | tail -4 | tr '\n' '|')" \
  "  [ ] item3  uma descrição comprida que|  [ ] item4  uma descrição comprida que|  [x] item5  uma descrição comprida que|  ok: 1 de 10 marcado(s)|"
rm -f "$saida"

if [ "$falhas" -gt 0 ]; then
  echo "$falhas teste(s) falharam."
  exit 1
fi
echo "Todos os testes passaram."
