---
name: claude-skills-atualizar
description: Atualiza as skills do repositório HuellintonMota/claude-skills (git pull + setup). Use quando pedirem "atualizar as claude-skills", "atualizar a skill de vídeo", "puxar a versão nova das skills".
---

# Atualizar claude-skills

1. Ache o checkout: esta skill é um link para `<checkout>/skills/claude-skills-atualizar`, então
   `<checkout>` é `cd -P "<pasta desta skill>/../.." && pwd`. O padrão de instalação é
   `~/.claude/claude-skills`.
2. `git -C <checkout> status --porcelain`: se houver alteração local, mostre e pergunte antes de seguir.
3. Guarde `git -C <checkout> rev-parse --short HEAD`, rode `git -C <checkout> pull --ff-only` e depois
   `bash <checkout>/setup --atualizar` (religa as instaladas em todos os agentes onde estão; o setup
   interativo não funciona aqui, porque o shell do agente não tem terminal).
4. Repasse a conferência de dependências que o setup imprime: itens com ✗ são o que falta, com o
   comando para resolver. Programa do sistema só se instala com o "sim" da pessoa
   (`bash <checkout>/setup --skills <nome> --sim`).
5. Mostre o que mudou: `git -C <checkout> log --oneline <antes>..HEAD`. Se nada mudou, diga que já
   estava na última versão.
6. Se o setup listar skills novas não instaladas, mostre-as e pergunte quais instalar; instale com
   `bash <checkout>/setup --skills a,b`.
7. Lembre que skills novas só aparecem numa sessão nova do agente.

## Atualização automática e adiamento

Se pedirem para as skills se atualizarem sozinhas (ou para parar), rode
`bash <checkout>/setup --atualizar --auto-atualizar` (ou `--sem-auto-atualizar`). Isso liga ou
desliga um hook `SessionStart` no `settings.json` do Claude Code, que roda `lib/auto-atualizar.sh` uma
vez por dia. Quando ele atualiza, a sessão recebe uma mensagem "claude-skills atualizadas
automaticamente" com os commits: conte à pessoa o que mudou e, se aparecerem skills novas não
instaladas, ofereça instalar.

As outras skills conferem se há versão nova antes de começar (`lib/verificar-atualizacao.sh`) e
oferecem "Atualizar agora" ou "Adiar por 1 dia". O adiamento fica em `.git/adiar-atualizacao-ate` e
também segura a atualização automática; esta skill (pedido explícito) atualiza mesmo adiada e apaga o
adiamento: `rm -f <checkout>/.git/adiar-atualizacao-ate`.
