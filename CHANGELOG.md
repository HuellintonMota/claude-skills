# Changelog

O que muda para quem instala ou usa as claude-skills. As versões seguem o formato X.Y.Z: X muda o
que quebra a instalação ou o uso, Y traz recurso novo e Z é correção.

## [Não lançado]

## [0.6.0] - 2026-11-10

- Pedidos de melhoria e relatos de problema passam a ser por issue, com formulários próprios.
- orquestrador: ao fechar o card, pergunta se pode limpar o contexto dos terminais usados e apagar o fichário do card no Ground.

## [0.5.0] - 2026-11-06

- No terminal, o setup mostra caixas de seleção para escolher agentes e skills: setas movem, Espaço
  marca, Enter confirma e Esc cancela.
- As skills passam a ter versão (arquivo `VERSION`) e este changelog.
- O aviso de versão nova mostra a versão atual, a nova e o que mudou.
- `setup --versao` mostra a versão instalada.

## [0.4.0] - 2026-11-06

- O setup instala as skills também no Codex, Gemini CLI, Antigravity, Kiro, Factory, Cursor,
  OpenCode e Copilot (`--agente`, ou `-Agente` no PowerShell).
- README novo: instalar em 30 segundos, escolher agentes, atualizar, desinstalar e problemas comuns.
- orquestrador: o terminal Executor faz as escritas no Jira e no Discord.
- orquestrador: o aviso a quem abriu o card sai por DM no portal "Discord" do Maestri, com o nome
  conferido antes e depois do envio.
- orquestrador: no Indica Eixo, `/simplify` e `/code-review` são obrigatórios antes de publicar.

## [0.3.0] - 2026-11-06

- video-explicativo: `/video-explicativo configurar` escolhe a voz, a velocidade e o tom da narração.
- Atualização automática, uma vez por dia, ao abrir o Claude Code. O setup pergunta se liga.
- Antes de usar, as skills avisam quando há versão nova e oferecem atualizar agora ou adiar por 1 dia.
- Instalação pelo PowerShell, com `irm ... | iex`.

## [0.2.0] - 2026-11-06

- O setup confere as dependências de cada skill: instala sozinho o que fica na pasta da skill e
  pergunta antes de instalar programas no sistema.
- video-explicativo: a narração é refeita quando o áudio sai cortado.
- orquestrador: os comandos de publicação que o auto mode bloqueia vão para o shell "Git Manager".
- orquestrador: a tabela de pessoas do Discord fica só na máquina, fora do repositório.
- orquestrador: projeto Indica Eixo e andar Indica-Eixo.

## [0.1.0] - 2026-11-04

- Skill video-explicativo: vídeo explicativo com capturas, narração neural em português e legenda,
  ou só a dublagem de um vídeo que tem legenda.
- Skill orquestrador: distribui os cards do Jira (projeto PI) entre os agentes no canvas Maestri.
- Instalação no estilo do gstack: o `setup` pergunta quais skills instalar e liga cada uma em
  `~/.claude/skills`.
- A skill claude-skills-atualizar vem sempre instalada e atualiza as outras.
