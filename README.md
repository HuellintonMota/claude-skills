# claude-skills

Skills para o Claude Code.

| Skill | Para quê |
|---|---|
| [`claude-skills-atualizar`](skills/claude-skills-atualizar/SKILL.md) | Atualiza este repositório (pull + setup). Instalada sempre, sem aparecer na escolha. |
| [`orquestrador`](skills/orquestrador/SKILL.md) | Orquestra cards do Jira (projeto PI) entre os agentes dos projetos no canvas Maestri. Pede a URL do webhook do Discord na instalação (fica em `~/.claude/orquestrador.env`, fora do git). |
| [`video-explicativo`](skills/video-explicativo/SKILL.md) | Vídeo explicativo de funcionalidade (Remotion + capturas + narração neural pt-BR + legenda), ou dublar um vídeo que só tem legenda. |

## Instalar

Como o gstack: clona o repositório uma vez e o `setup` pergunta quais skills instalar e liga cada uma em `~/.claude/skills/`
(link no Linux/macOS, junction no Windows; não precisa de administrador). No terminal (Git Bash no Windows):

```bash
git clone https://github.com/HuellintonMota/claude-skills.git ~/.claude/claude-skills && bash ~/.claude/claude-skills/setup
```

Sem perguntar: `setup --todas` ou `setup --skills video-explicativo,orquestrador`.

Abra uma sessão nova do Claude Code e peça "faz um vídeo explicando <funcionalidade>" ou "dubla este
vídeo com a legenda".

## Atualizar

No Claude Code: "atualizar as claude-skills" (skill `claude-skills-atualizar`). Ou no terminal:

```bash
git -C ~/.claude/claude-skills pull --ff-only && bash ~/.claude/claude-skills/setup --atualizar
```

Como as skills são links para o checkout, o `pull` já atualiza as que existem; o `setup --atualizar` religa as instaladas e lista as novas.

## Dependências

O `setup` confere o que cada skill precisa (`skills/<nome>/dependencias.sh`) depois de ligá-la:
- o que fica dentro da pasta da skill (ex.: o `.venv` do vídeo, com edge-tts e ffmpeg) instala sozinho;
- programas do sistema que faltam (Python, Node, gh, git) ele oferece instalar com winget, brew ou apt,
  perguntando antes; `--sim` instala sem perguntar e `--sem-dependencias` pula a conferência;
- o que não dá para instalar daqui (app Maestri, `gh auth login`, conector do Jira) ele só aponta.

Sem terminal interativo (ex.: rodado pelo Claude), ele só lista o que falta.
