# Funções para os dependencias.sh das skills. Carregado pelo setup, que define:
#   DEP_MODO = perguntar | sim | nao   (instalar programas do sistema)
#   SKILL_DIR = pasta da skill
# Pacotes que ficam dentro da pasta da skill (ex.: .venv) instalam sem perguntar: não mexem no sistema.

DEP_PENDENTES=0

dep_ok() { printf '    ✓ %s%s\n' "$1" "${2:+ — $2}"; }

dep_falta() {
  printf '    ✗ %s — %s\n' "$1" "$2"
  DEP_PENDENTES=$((DEP_PENDENTES + 1))
}

dep_aviso() { printf '    ! %s — %s\n' "$1" "$2"; }

tem() { command -v "$1" >/dev/null 2>&1; }

# Instala um programa do sistema pelo gerenciador disponível, conforme DEP_MODO.
# Uso: dep_sistema "Nome" "id-winget" "pacote-brew" "pacote-apt"
dep_sistema() {
  local nome="$1" winget_id="$2" brew_pkg="$3" apt_pkg="$4" comando=""
  if tem winget && [ -n "$winget_id" ]; then
    comando="winget install --id $winget_id -e --accept-source-agreements --accept-package-agreements"
  elif tem brew && [ -n "$brew_pkg" ]; then
    comando="brew install $brew_pkg"
  elif tem apt-get && [ -n "$apt_pkg" ]; then
    comando="sudo apt-get install -y $apt_pkg"
  fi
  if [ -z "$comando" ]; then
    dep_falta "$nome" "instale manualmente (nenhum gerenciador conhecido: winget, brew ou apt)"
    return 1
  fi
  local instalar=false
  case "$DEP_MODO" in
    sim) instalar=true ;;
    perguntar)
      if [ -t 0 ]; then
        read -r -p "    Instalar $nome agora com \`$comando\`? [S/n] " r
        case "$r" in n|N|nao|não) ;; *) instalar=true ;; esac
      fi
      ;;
  esac
  if ! $instalar; then
    dep_falta "$nome" "instale com: $comando"
    return 1
  fi
  if eval "$comando"; then
    # O PATH deste terminal não vê o programa recém-instalado.
    dep_aviso "$nome" "instalado; abra um terminal novo e rode o setup de novo para concluir"
    DEP_PENDENTES=$((DEP_PENDENTES + 1))
  else
    dep_falta "$nome" "a instalação falhou; tente: $comando"
  fi
  return 1
}

# Imprime o comando de um Python >= 3.10 que funciona (o "python" da Microsoft Store pode ser só um atalho).
python_do_sistema() {
  local c
  for c in python3 python "py -3"; do
    if $c -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

# Python de um .venv, nos dois layouts (Windows: Scripts/, demais: bin/).
python_do_venv() {
  if [ -x "$1/Scripts/python.exe" ]; then echo "$1/Scripts/python.exe"; else echo "$1/bin/python"; fi
}
