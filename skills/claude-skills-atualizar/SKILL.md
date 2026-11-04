---
name: claude-skills-atualizar
description: Atualiza as skills do repositório HuellintonMota/claude-skills (git pull + setup). Use quando pedirem "atualizar as claude-skills", "atualizar a skill de vídeo", "puxar a versão nova das skills".
---

# Atualizar claude-skills

1. Ache o checkout: o alvo do link `~/.claude/skills/claude-skills-atualizar` aponta para
   `<checkout>/skills/claude-skills-atualizar`. O padrão de instalação é `~/.claude/claude-skills`.
2. `git -C <checkout> status --porcelain`: se houver alteração local, mostre e pergunte antes de seguir.
3. Guarde `git -C <checkout> rev-parse --short HEAD`, rode `git -C <checkout> pull --ff-only` e depois
   `bash <checkout>/setup --atualizar` (religa as instaladas; o setup interativo não funciona aqui,
   porque o Bash do Claude Code não tem terminal).
4. Mostre o que mudou: `git -C <checkout> log --oneline <antes>..HEAD`. Se nada mudou, diga que já
   estava na última versão.
5. Se o setup listar skills novas não instaladas, mostre-as e pergunte quais instalar; instale com
   `bash <checkout>/setup --skills a,b`.
6. Lembre que skills novas só aparecem numa sessão nova do Claude Code.
