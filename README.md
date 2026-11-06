# claude-skills

Skills para o Claude Code e para outros agentes que leem skills no formato `SKILL.md`: Codex CLI,
Gemini CLI, Antigravity, Cursor, OpenCode, GitHub Copilot CLI, Kiro e Factory Droid.

| Skill | Para quê | Onde funciona |
|---|---|---|
| [`claude-skills-atualizar`](skills/claude-skills-atualizar/SKILL.md) | Atualiza este repositório (pull + setup). Instalada sempre, sem aparecer na escolha. | Qualquer agente com shell. |
| [`orquestrador`](skills/orquestrador/SKILL.md) | Orquestra cards do Jira (projeto PI) entre os agentes dos projetos no canvas Maestri. Pede a URL do webhook do Discord na instalação (fica em `~/.claude/orquestrador.env`, fora do git). | Claude Code com o app Maestri e o conector Atlassian do claude.ai. |
| [`video-explicativo`](skills/video-explicativo/SKILL.md) | Vídeo explicativo de funcionalidade (Remotion + capturas + narração neural pt-BR + legenda), ou dublar um vídeo que só tem legenda. `/video-explicativo configurar` escolhe voz, velocidade e tom (salvos só na máquina). | Qualquer agente com shell. |

## Instalar em 30 segundos

Precisa de: [Git](https://git-scm.com/) (no Windows, o Git for Windows, que traz o Git Bash) e um dos
agentes da lista abaixo.

**Git Bash, macOS ou Linux:**

```bash
git clone https://github.com/HuellintonMota/claude-skills.git ~/.claude/claude-skills && bash ~/.claude/claude-skills/setup
```

**PowerShell (Windows):**

```powershell
irm https://raw.githubusercontent.com/HuellintonMota/claude-skills/main/install.ps1 | iex
```

O setup pergunta em quais agentes instalar e quais skills. Depois, abra uma sessão nova do agente e
peça, por exemplo, "faz um vídeo explicando <funcionalidade>".

O `install.ps1` instala o Git for Windows com winget se faltar (pergunta antes). Depois clona o
repositório, ou atualiza se ele já existe, e roda o mesmo `setup` com o bash do Git.

## Escolher os agentes

| Agente | `--agente` | Pasta das skills | Fonte |
|---|---|---|---|
| Claude Code | `claude` | `~/.claude/skills` | [docs](https://code.claude.com/docs/en/skills) |
| Codex CLI | `codex` | `~/.agents/skills` | [docs](https://developers.openai.com/codex/skills) |
| Gemini CLI | `gemini` | `~/.agents/skills` (apelido de `~/.gemini/skills`) | [docs](https://geminicli.com/docs/cli/skills/) |
| Antigravity (app e CLI `agy`) | `antigravity` ou `agy` | `~/.gemini/config/skills` | [docs](https://antigravity.google/docs/skills) |
| Kiro | `kiro` | `~/.kiro/skills` | [docs](https://kiro.dev/docs/skills/) |
| Factory Droid | `factory` ou `droid` | `~/.factory/skills` | [docs](https://docs.factory.ai/cli/configuration/skills) |
| Cursor | `cursor` | `~/.cursor/skills` | [docs](https://cursor.com/docs/skills) |
| OpenCode | `opencode` | `~/.config/opencode/skills` | [docs](https://opencode.ai/docs/skills) |
| GitHub Copilot CLI | `copilot` | `~/.copilot/skills` | [docs](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) |

**No modo interativo**, o setup mostra o Claude Code e os agentes que achou na máquina. Ele procura o
comando do agente ou a pasta de configuração dele. Vêm marcados os agentes onde as skills já estão
instaladas. Na primeira vez, vem marcado só o Claude Code. Enter mantém os marcados.

**Sem perguntar:**

```bash
bash ~/.claude/claude-skills/setup --agente claude,codex --todas
bash ~/.claude/claude-skills/setup --agente auto --skills video-explicativo   # todos os detectados
bash ~/.claude/claude-skills/setup --agentes                                 # lista agentes e pastas
```

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1 -Agente claude,codex -Todas
```

Sem `--agente`, o setup usa os agentes onde as skills já estão instaladas. Na primeira vez, usa só o
Claude Code. Um `--agente` explícito não mexe nos outros agentes.

Detalhes:
- Codex e Gemini CLI usam a mesma pasta, `~/.agents/skills`. Instalar num serve para os dois.
- Cursor, OpenCode e Copilot também leem `~/.claude/skills` e `~/.agents/skills`. Se as skills já
  estão numa dessas pastas, o setup não cria link próprio para eles. Assim nenhuma skill aparece
  duas vezes.

**Ficaram de fora:**
- **DeepSeek** é um modelo, não um agente com pasta de skills. Para usar as skills com ele, rode o
  modelo num agente da lista que aceite outros provedores, como o OpenCode. Há CLIs da comunidade
  para DeepSeek (Deep Code, DeepSeek-TUI), mas sem pasta de skills em documentação oficial.
- **OpenClaw, Hermes e Slate**: o próprio gstack não instala neles direto. Também ficaram de fora.
- Outro agente só entra na lista quando tiver uma pasta de skills documentada.

## O que funciona fora do Claude Code

As skills foram escritas para o Claude Code. Nos outros agentes:
- **Perguntas com opções** (`AskUserQuestion`): o agente usa a ferramenta de pergunta que tiver.
  Sem ela, pergunta em texto.
- **`video-explicativo` e `claude-skills-atualizar`** rodam em qualquer agente que execute comandos
  no shell (bash).
- **`orquestrador`** depende do app Maestri (comando `maestri` e canvas) e do conector Atlassian do
  claude.ai, que lê e escreve no Jira. Num agente sem esse conector, ele não acessa o Jira. Na
  prática, use o orquestrador no Claude Code.

## O que o setup faz

1. Pergunta em quais agentes instalar (ou usa `--agente`).
2. Pergunta quais skills instalar (ou usa `--todas` ou `--skills`). A `claude-skills-atualizar`
   vai sempre.
3. Liga cada skill na pasta de cada agente: link simbólico no Linux e no macOS, junction no Windows.
   A junction não precisa de administrador. Nada é copiado: os links apontam para o checkout.
4. Se já existe na pasta um item com o mesmo nome que não veio daqui, ele pula e avisa.
5. Roda a configuração da skill, quando ela tem uma. O orquestrador, por exemplo, pede a URL do
   webhook.
6. Confere as dependências (veja abaixo).
7. Se o Claude Code está entre os agentes, pergunta se liga a atualização automática.

| Opção do `setup` | Opção do `install.ps1` | O que faz |
|---|---|---|
| `--agente a,b` (ou `--host`) | `-Agente a,b` | Em quais agentes instalar. `auto` = todos os detectados. |
| `--agentes` | | Lista os agentes, as pastas e quais foram detectados. |
| `--todas` | `-Todas` | Instala todas as skills, sem perguntar. |
| `--skills a,b` | `-Skills a,b` | Instala só essas skills, sem perguntar. |
| `--atualizar` | | Religa as skills já instaladas, em cada agente, e lista as novas. |
| `--sim` | `-Sim` | Instala as dependências do sistema que faltam, sem perguntar. |
| `--sem-dependencias` | | Não confere as dependências. |
| `--auto-atualizar` | `-AutoAtualizar` | Liga a atualização automática (Claude Code). |
| `--sem-auto-atualizar` | `-SemAutoAtualizar` | Desliga a atualização automática. |
| | `-Destino C:\caminho` | Onde clonar. Padrão: `~\.claude\claude-skills`. |

## Atualizar

Todos os agentes apontam para o mesmo checkout. Atualizar o checkout atualiza as skills em todos.

**Automática (só Claude Code).** O setup pergunta se liga. Também dá para usar `--auto-atualizar` e
`--sem-auto-atualizar`. Ligada, um hook `SessionStart` no `~/.claude/settings.json` roda
`lib/auto-atualizar.sh` ao abrir o Claude Code, no máximo uma vez por dia. Ele faz
`git pull --ff-only`, religa as skills em todos os agentes e conta na sessão o que mudou. Sem rede,
ou com alteração local no checkout, não faz nada. Para editar o `settings.json` o setup usa Python.
Sem Python, ele mostra o hook para colar à mão. Os outros agentes não têm esse hook. Se o Claude
Code também está instalado com a automática ligada, ela já atualiza o checkout de todos.

**Antes de usar (qualquer agente com shell).** Cada skill confere se há versão nova
(`lib/verificar-atualizacao.sh`, com um `git fetch` a cada 10 minutos no máximo). Se houver, pergunta:
**Atualizar agora** ou **Adiar por 1 dia**.

**Adiar.** "Adiar por 1 dia" para de perguntar até o dia seguinte. Também segura a atualização
automática.

**Na hora.** Peça ao agente "atualizar as claude-skills" (skill `claude-skills-atualizar`). Ou, no
terminal:

```bash
git -C ~/.claude/claude-skills pull --ff-only && bash ~/.claude/claude-skills/setup --atualizar
```

O `pull` já atualiza as skills existentes, porque elas são links. O `setup --atualizar` religa as
instaladas e lista as novas.

## Desinstalar

1. Desligue a atualização automática: `bash ~/.claude/claude-skills/setup --sem-auto-atualizar`.
2. Remova os links. Remova só o link, sem `-r`: com `-r`, o comando apagaria o conteúdo do checkout.

   Git Bash, macOS ou Linux:

   ```bash
   for l in ~/.claude/skills/* ~/.agents/skills/* ~/.gemini/config/skills/* ~/.kiro/skills/* \
            ~/.factory/skills/* ~/.cursor/skills/* ~/.config/opencode/skills/* ~/.copilot/skills/*; do
     [ -L "$l" ] && case "$(readlink "$l")" in */claude-skills/skills/*) rm "$l" && echo "removido $l" ;; esac
   done
   ```

   PowerShell:

   ```powershell
   $pastas = '.claude\skills', '.agents\skills', '.gemini\config\skills', '.kiro\skills', '.factory\skills', '.cursor\skills', '.config\opencode\skills', '.copilot\skills' | ForEach-Object { Join-Path $HOME $_ }
   Get-ChildItem $pastas -ErrorAction SilentlyContinue | Where-Object { $_.LinkType -and "$($_.Target)" -like '*\claude-skills\skills\*' } | ForEach-Object { $_.Delete(); "removido $($_.FullName)" }
   ```

3. Apague o checkout (`~/.claude/claude-skills`) e, se usou o orquestrador, `~/.claude/orquestrador.env`.

## Requisitos

- Git. No Windows, o Git for Windows: o setup e os scripts das skills são bash.
- Python, para ligar a atualização automática e para o orquestrador.
- O que cada skill pede (veja "Dependências").

## Problemas comuns

- **"pulei X: já existe em ... e não veio daqui"**: há na pasta do agente uma pasta com o mesmo nome,
  por exemplo uma cópia antiga. Mova ou apague essa pasta e rode o setup de novo.
- **A skill não aparece**: abra uma sessão nova do agente. No Gemini CLI e no Copilot CLI, também
  dá para usar `/skills reload`.
- **A skill aparece duas vezes** (Cursor, OpenCode, Copilot): ela está na pasta própria do agente e
  em `~/.claude/skills` ou `~/.agents/skills`. Remova o link da pasta própria.
- **"Sem terminal interativo"**: o setup foi chamado por um agente, sem terminal. Use `--agente` com
  `--todas` ou `--skills`.
- **O PowerShell bloqueia o script**: rode com `powershell -ExecutionPolicy Bypass -File install.ps1`.
- **"atualização automática pulada, há alterações locais"**: alguém editou arquivos no checkout. Veja
  com `git -C ~/.claude/claude-skills status` e resolva antes de atualizar.

## Dependências

O `setup` confere o que cada skill precisa (`skills/<nome>/dependencias.sh`) depois de ligá-la:
- O que fica dentro da pasta da skill (por exemplo, o `.venv` do vídeo, com edge-tts e ffmpeg) ele
  instala sozinho.
- Programas do sistema que faltam (Python, Node, gh, git) ele oferece instalar com winget, brew ou
  apt, perguntando antes. `--sim` instala sem perguntar. `--sem-dependencias` pula a conferência.
- O que não dá para instalar daqui (app Maestri, `gh auth login`, conector do Jira) ele só aponta.

Sem terminal interativo (por exemplo, rodado por um agente), ele só lista o que falta.
