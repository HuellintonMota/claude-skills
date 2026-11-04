# claude-skills

Skills para o Claude Code.

| Skill | Para quê |
|---|---|
| [`video-explicativo`](skills/video-explicativo/SKILL.md) | Vídeo explicativo de funcionalidade (Remotion + capturas + narração neural pt-BR + legenda), ou dublar um vídeo que só tem legenda. |

## Instalar

```bash
git clone https://github.com/HuellintonMota/claude-skills.git
cp -r claude-skills/skills/video-explicativo ~/.claude/skills/
```

No Windows (PowerShell): `Copy-Item -Recurse claude-skills\skills\video-explicativo $HOME\.claude\skills\`.

Depois, no Claude Code: "faz um vídeo explicando <funcionalidade>" ou "dubla este vídeo com a legenda".

Requisitos: Python 3 com `edge-tts` (internet para gerar a voz), Node 20+ para o modo completo, ffmpeg
(o projeto Remotion já traz o `ffmpeg-static`).
