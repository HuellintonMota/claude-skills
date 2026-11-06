# Caixas de seleção no terminal para o setup, em bash puro (sem dialog, whiptail, fzf ou gum).
#
# Uso: preencha MENU_ROTULOS, MENU_DESCRICOES e MENU_MARCADOS (1 ou 0, um por item) e chame
# `menu_escolher "Título"`. Retorna 0 quando a pessoa confirma (MENU_MARCADOS fica com a escolha) e 1
# quando cancela. Teclas: ↑/↓ ou k/j movem, Espaço marca, a marca ou desmarca todos, Enter confirma,
# q ou Esc cancela.
#
# A lógica (menu_ler_tecla e menu_aplicar) fica separada do desenho para ser testada sem terminal:
# MENU_FD lê as teclas de outro descritor, MENU_SEM_DESENHO=1 não desenha nada e MENU_TAMANHO="linhas
# colunas" troca o tamanho do terminal (testes/menu.sh).

MENU_ROTULOS=()
MENU_DESCRICOES=()
MENU_MARCADOS=()
MENU_POS=0
MENU_TOPO=0
MENU_FIM=""
MENU_TECLA=""
MENU_DESENHADAS=0
MENU_STTY=""

menu_suportado() {
  [ "${CLAUDE_SKILLS_SEM_MENU:-}" != 1 ] && [ -t 0 ] && [ -t 1 ] && [ "${TERM:-}" != dumb ]
}

# Lê uma tecla do descritor $1 e põe o nome em MENU_TECLA: cima, baixo, espaco, todos, enter, sair
# ou outra. Fim da entrada conta como sair, para um teste sem Enter não ficar preso.
menu_ler_tecla() {
  local fd="${1:-0}" c resto espera=1
  # O bash 3.2 do macOS só aceita espera inteira; no 4+ um Esc sozinho responde na hora.
  [ "${BASH_VERSINFO[0]}" -ge 4 ] && espera=0.05
  MENU_TECLA=outra
  if ! IFS= read -rsn1 -u "$fd" c; then
    MENU_TECLA=sair
    return 0
  fi
  case "$c" in
    '') MENU_TECLA=enter ;;
    ' ') MENU_TECLA=espaco ;;
    k|K) MENU_TECLA=cima ;;
    j|J) MENU_TECLA=baixo ;;
    a|A) MENU_TECLA=todos ;;
    q|Q) MENU_TECLA=sair ;;
    $'\e')
      # As setas chegam como Esc + "[A"/"[B" (ou "OA"/"OB" no modo de aplicação do terminal); um Esc
      # sem nada logo depois é a tecla Esc.
      if IFS= read -rsn1 -t "$espera" -u "$fd" c; then
        case "$c" in
          '['|O)
            resto=""
            while IFS= read -rsn1 -t "$espera" -u "$fd" c; do
              resto="$resto$c"
              case "$c" in [A-Za-z~]) break ;; esac
            done
            case "$resto" in
              *A) MENU_TECLA=cima ;;
              *B) MENU_TECLA=baixo ;;
            esac
            ;;
        esac
      else
        MENU_TECLA=sair
      fi
      ;;
  esac
  return 0
}

menu_aplicar() {
  local n=${#MENU_ROTULOS[@]} i todos=1
  case "$1" in
    cima) if [ "$n" -gt 0 ]; then MENU_POS=$(( (MENU_POS - 1 + n) % n )); fi ;;
    baixo) if [ "$n" -gt 0 ]; then MENU_POS=$(( (MENU_POS + 1) % n )); fi ;;
    espaco) if [ "$n" -gt 0 ]; then MENU_MARCADOS[MENU_POS]=$(( 1 - ${MENU_MARCADOS[MENU_POS]:-0} )); fi ;;
    todos)
      for ((i = 0; i < n; i++)); do [ "${MENU_MARCADOS[i]:-0}" = 1 ] || todos=0; done
      for ((i = 0; i < n; i++)); do MENU_MARCADOS[i]=$(( 1 - todos )); done
      ;;
    enter) MENU_FIM=confirmar ;;
    sair) MENU_FIM=cancelar ;;
  esac
  return 0
}

menu_marcados() {
  local i c=0
  for ((i = 0; i < ${#MENU_ROTULOS[@]}; i++)); do [ "${MENU_MARCADOS[i]:-0}" = 1 ] && c=$((c + 1)); done
  echo "$c"
}

# Redesenha no mesmo lugar: sobe as linhas do desenho anterior e limpa cada uma antes de escrever.
# As linhas são cortadas na largura do terminal, porque uma linha quebrada estragaria a conta.
menu_desenhar() {
  local n=${#MENU_ROTULOS[@]} linhas=24 colunas=80 tamanho altura i largura=0 texto seta marca ajuda
  tamanho="${MENU_TAMANHO:-$(stty size 2>/dev/null)}" || tamanho=""
  if [ -n "$tamanho" ]; then linhas="${tamanho% *}"; colunas="${tamanho#* }"; fi
  altura=$(( linhas - 4 ))
  [ "$altura" -lt 1 ] && altura=1
  [ "$altura" -gt "$n" ] && altura=$n
  if [ "$MENU_POS" -lt "$MENU_TOPO" ]; then MENU_TOPO=$MENU_POS; fi
  if [ "$MENU_POS" -ge $(( MENU_TOPO + altura )) ]; then MENU_TOPO=$(( MENU_POS - altura + 1 )); fi
  for ((i = 0; i < n; i++)); do [ ${#MENU_ROTULOS[i]} -gt "$largura" ] && largura=${#MENU_ROTULOS[i]}; done

  [ "$MENU_DESENHADAS" -gt 0 ] && printf '\033[%dA' "$MENU_DESENHADAS"
  for ((i = MENU_TOPO; i < MENU_TOPO + altura; i++)); do
    seta=" "; [ "$i" = "$MENU_POS" ] && [ -z "$MENU_FIM" ] && seta=">"
    marca=" "; [ "${MENU_MARCADOS[i]:-0}" = 1 ] && marca="x"
    texto="$(printf '%s [%s] %-*s  %s' "$seta" "$marca" "$largura" "${MENU_ROTULOS[i]}" "${MENU_DESCRICOES[i]}")"
    printf '\033[2K%s\n' "${texto:0:$(( colunas - 1 ))}"
  done
  case "$MENU_FIM" in
    confirmar) ajuda="  ok: $(menu_marcados) de $n marcado(s)" ;;
    cancelar) ajuda="  cancelado" ;;
    *)
      ajuda="↑↓ mover · Espaço marcar · a todos · Enter confirmar · Esc sair"
      # O trecho vem antes da ajuda para não sumir quando a linha é cortada num terminal estreito.
      if [ "$altura" -lt "$n" ]; then ajuda="($((MENU_TOPO + 1))-$((MENU_TOPO + altura)) de $n) $ajuda"; fi
      ajuda="  $ajuda"
      ;;
  esac
  printf '\033[2K%s\n' "${ajuda:0:$(( colunas - 1 ))}"
  MENU_DESENHADAS=$(( altura + 1 ))
}

menu_restaurar() {
  [ -n "$MENU_STTY" ] && stty "$MENU_STTY" 2>/dev/null
  printf '\033[?25h'
  MENU_STTY=""
}

menu_escolher() {
  local fd="${MENU_FD:-0}" desenhar=true
  [ "${MENU_SEM_DESENHO:-}" = 1 ] && desenhar=false
  MENU_POS=0; MENU_TOPO=0; MENU_FIM=""; MENU_DESENHADAS=0
  [ ${#MENU_ROTULOS[@]} -eq 0 ] && return 0
  if $desenhar; then
    MENU_STTY="$(stty -g 2>/dev/null)" || MENU_STTY=""
    trap 'menu_restaurar; echo; exit 130' INT TERM
    echo "$1"
    printf '\033[?25l'
  fi
  while [ -z "$MENU_FIM" ]; do
    if $desenhar; then menu_desenhar; fi
    menu_ler_tecla "$fd"
    menu_aplicar "$MENU_TECLA"
  done
  if $desenhar; then
    menu_desenhar
    menu_restaurar
    trap - INT TERM
  fi
  [ "$MENU_FIM" = confirmar ]
}
