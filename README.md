# claude-skills

Skills para o Claude Code.

| Skill | Para quê |
|---|---|
| [`claude-skills-atualizar`](skills/claude-skills-atualizar/SKILL.md) | Atualiza este repositório (pull + setup). Instalada sempre, sem aparecer na escolha. |
| [`orquestrador`](skills/orquestrador/SKILL.md) | Orquestra cards do Jira (projeto PI) entre os agentes dos projetos no canvas Maestri. Pede a URL do webhook do Discord na instalação (fica em `~/.claude/orquestrador.env`, fora do git). |
| [`video-explicativo`](skills/video-explicativo/SKILL.md) | Vídeo explicativo de funcionalidade (Remotion + capturas + narração neural pt-BR + legenda), ou dublar um vídeo que só tem legenda. `/video-explicativo configurar` escolhe voz, velocidade e tom (salvos só na máquina). |

## Instalar

Como o gstack: clona o repositório uma vez e o `setup` pergunta quais skills instalar e liga cada uma em `~/.claude/skills/`
(link no Linux/macOS, junction no Windows; não precisa de administrador). No terminal (Git Bash no Windows):

```bash
git clone https://github.com/HuellintonMota/claude-skills.git ~/.claude/claude-skills && bash ~/.claude/claude-skills/setup
```

Ou no PowerShell (Windows), sem abrir o Git Bash:

```powershell
irm https://raw.githubusercontent.com/HuellintonMota/claude-skills/main/install.ps1 | iex
```

O `install.ps1` instala o Git for Windows com winget se faltar (pergunta antes), clona ou atualiza o
repositório e roda o mesmo `setup` com o bash do Git. Com opções, baixe o arquivo e rode
`powershell -ExecutionPolicy Bypass -File install.ps1 -Skills video-explicativo -AutoAtualizar`
(também `-Todas`, `-Sim`, `-SemAutoAtualizar` e `-Destino`).

Sem perguntar: `setup --todas` ou `setup --skills video-explicativo,orquestrador`.

Abra uma sessão nova do Claude Code e peça "faz um vídeo explicando <funcionalidade>" ou "dubla este
vídeo com a legenda".

## Atualizar

**Sozinho:** o `setup` pergunta se deve atualizar as skills automaticamente (ou use `--auto-atualizar`
e `--sem-auto-atualizar`). Ligado, um hook `SessionStart` no `~/.claude/settings.json` roda
`lib/auto-atualizar.sh` ao abrir o Claude Code, no máximo uma vez por dia: faz `git pull --ff-only`,
religa as skills e conta na sessão o que mudou. Sem rede, ou com alteração local no checkout, ele não
faz nada. Para editar o `settings.json` o setup usa Python; sem Python, ele mostra o hook para colar à mão.

**Antes de usar:** cada skill confere se há versão nova (`lib/verificar-atualizacao.sh`, com um
`git fetch` a cada 10 min no máximo) e pergunta: **Atualizar agora** ou **Adiar por 1 dia**. Adiar
também segura a atualização automática até o dia seguinte.

**Na hora:** no Claude Code, "atualizar as claude-skills" (skill `claude-skills-atualizar`). Ou no terminal:

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
