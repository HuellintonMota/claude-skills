# Versão das claude-skills (arquivo VERSION) e novidades do CHANGELOG.md, para as mensagens de
# atualização. Carregado por verificar-atualizacao.sh e auto-atualizar.sh, que definem RAIZ.

# Versão gravada num commit; "?" quando o commit é anterior ao arquivo VERSION.
versao_em() {
  local v
  v="$(git -C "$RAIZ" show "$1:VERSION" 2>/dev/null | head -1 | tr -d '\r ')"
  echo "${v:-?}"
}

# Seções do CHANGELOG.md do commit $1 mais novas que a versão $2, sem a "[Não lançado]". Com a versão
# antiga desconhecida ("?"), mostra só a seção mais nova, para não despejar o histórico inteiro.
novidades_em() {
  git -C "$RAIZ" show "$1:CHANGELOG.md" 2>/dev/null | tr -d '\r' | awk -v antiga="$2" '
    /^## \[/ {
      v = $0; sub(/^## \[/, "", v); sub(/\].*/, "", v)
      if (v !~ /^[0-9]/) { dentro = 0; next }
      if (v == antiga || (antiga == "?" && vistas >= 1)) exit
      vistas++; dentro = 1
    }
    dentro && NF { print }
  ' | head -60
}

# Novidades entre dois commits: as seções do changelog quando a versão mudou; senão, os commits.
novidades_entre() {
  local de="$1" para="$2" antiga nova
  antiga="$(versao_em "$de")"
  nova="$(versao_em "$para")"
  if [ "$nova" != "?" ] && [ "$antiga" != "$nova" ] && [ -n "$(novidades_em "$para" "$antiga")" ]; then
    novidades_em "$para" "$antiga"
  else
    git -C "$RAIZ" log --oneline --no-decorate "$de..$para"
  fi
}
