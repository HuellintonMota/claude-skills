#!/usr/bin/env bash
# CLIs que o orquestrador chama; o conector do Jira e o Maestri não se instalam por aqui.

if tem maestri; then
  dep_ok "maestri" "$(command -v maestri)"
else
  dep_falta "maestri" "vem com o app Maestri; instale o app e ligue o Maestro Mode no terminal do orquestrador"
fi

if tem gh; then
  if gh auth status >/dev/null 2>&1; then
    dep_ok "gh" "autenticado"
  else
    dep_falta "gh" "rode: gh auth login"
  fi
else
  dep_sistema "GitHub CLI (gh)" "GitHub.cli" "gh" "gh"
fi

if python_do_sistema >/dev/null; then
  dep_ok "Python" "monta o JSON da DM do Discord"
else
  dep_sistema "Python 3.10+" "Python.Python.3.12" "python@3.12" "python3"
fi

tem curl && dep_ok "curl" || dep_falta "curl" "necessário para a DM do Discord"

if [ -d "$HOME/.claude/skills/gstack" ]; then
  dep_ok "gstack" "revisões /plan-design-review, /plan-eng-review, /qa"
else
  dep_aviso "gstack (recomendado)" "git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup"
fi

dep_aviso "conector Atlassian (Jira)" "não dá para conferir daqui; no Claude Code, confira em /mcp que o Atlassian do claude.ai está conectado"
