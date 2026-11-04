---
name: video-explicativo
description: Produz vídeos explicativos de funcionalidades de sistema (tutorial, "como funciona", onboarding) no padrão do vídeo do eNPS do Conecta — Remotion + capturas reais do ambiente de dev + narração neural pt-BR (edge-tts, voz Thalita) + legenda queimada e .srt. Também dubla um vídeo que já existe com legenda mas sem faixa de áudio. Use quando pedirem "fazer um vídeo explicando X", "vídeo tutorial do sistema", "vídeo de como funciona", "narrar/dublar este vídeo", "colocar voz num vídeo que só tem legenda", "gerar áudio a partir da legenda", mesmo sem citar Remotion ou edge-tts.
---

# Vídeo explicativo

Dois modos. Descubra qual pelo pedido; na dúvida, pergunte.

- **Vídeo completo** — do levantamento ao MP4 com narração e legenda.
- **Só dublagem** — já existe o vídeo (com legenda) e falta o áudio.

Os parâmetros visuais e de voz estão em `references/parametros.md`. O projeto que serviu de modelo
está em `exemplo-enps/` (código, roteiro e plano; sem áudios, capturas e node_modules).

## Ambiente (os dois modos)

Trabalhe numa pasta própria do vídeo (ex.: `videos/<nome>`), **nunca dentro do repositório do sistema**.

```bash
python -m venv .venv && .venv/Scripts/pip install edge-tts   # Linux/macOS: .venv/bin/pip
```

ffmpeg: use o do PATH ou instale `ffmpeg-static` com npm (no modo completo ele já vem com o projeto
Remotion: `remotion/node_modules/ffmpeg-static/ffmpeg.exe`). O edge-tts precisa de internet.

## Modo só dublagem

1. **Legenda.** Precisa de um `.srt` com tempos.
   - `.srt` ao lado do vídeo ou faixa de legenda embutida: o script acha sozinho.
   - Legenda só queimada na imagem: monte o `.srt` antes, como em `references/dublagem.md`.
2. **Amostra de voz.** Gere a frase da primeira fala em 2–3 vozes e deixe a pessoa escolher
   (padrão: `pt-BR-ThalitaMultilingualNeural`; alternativas na referência).
3. **Relatório antes do vídeo:**
   `.venv/Scripts/python scripts/dublar.py VIDEO.mp4 --so-relatorio [--legenda X.srt] [--voz ...]`
   Mostra cada fala, o tempo de voz contra o espaço que ela tem, as que foram aceleradas e as que
   atrasaram. Mais de 3 falas aceleradas acima de 15% ou atrasos acumulando: a legenda tem texto demais
   para o tempo; avise a pessoa antes de seguir (encurtar o texto da fala no .srt resolve).
4. **Dublar:** o mesmo comando sem `--so-relatorio`. Saída: `VIDEO-dublado.mp4` (vídeo copiado sem
   recodificar, narração AAC, legendas embutidas mantidas).
5. Siglas ou nomes lidos errado: `--pronuncia pronuncia.json` com `{"escrito": "falado"}`.

O script junta blocos de legenda da mesma frase (a entonação fica natural), fala números por extenso,
acelera a voz no máximo 30% quando a fala não cabe e, se ainda assim não couber, atrasa a seguinte.

## Modo vídeo completo

1. **Levantamento (só leitura do código).** Como a funcionalidade funciona de verdade, com
   arquivo:linha, e o que o vídeo pode e não pode prometer. Grave em `plano.md`
   (ver `exemplo-enps/plano.md`, seção 1).
2. **Roteiro em tabela:** `# | Cena | Tela/visual | Narração (= legenda) | Tempo`. Linguagem não
   técnica, frases curtas, uma ideia por cena. Se houver dois públicos (ex.: usuário e gestor/RH),
   proponha dois cortes do mesmo projeto. **Pare e mostre o roteiro com as dúvidas** antes de produzir.
3. **Voz.** Amostras da frase da cena 1 em 3–4 vozes; a pessoa escolhe.
4. **Projeto.** Copie `exemplo-enps/remotion` e `exemplo-enps/scripts` para a pasta do vídeo e
   `npm install` em `remotion/`. Troque:
   - `scripts/narracao.json`: voz, cenas (`id`, `legenda`) e `pronuncia`;
   - `remotion/src/linhaDoTempo.ts`: `CORTES` e `PAUSA_DEPOIS`;
   - `remotion/src/cenasAnimadas.tsx` / `cenasCaptura.tsx` e o mapa `CENAS` em `Raiz.tsx`;
   - logos em `remotion/public/`; nomes dos arquivos de saída em `package.json` e `scripts/gerar-srt.ts`.
5. **Narração:** `.venv/Scripts/python scripts/gerar_narracao.py [cena ...]` → áudio por cena em
   `remotion/public/audio/` e tempo de cada palavra em `remotion/src/tempos.json`. A duração das cenas
   e a legenda saem desse arquivo.
6. **Capturas** do ambiente de **dev**, nunca de produção: `scripts/capturar.sh NOME '{"alvo":[x,y,w,h]}'`
   (portal do Maestri; troque pelo screenshot que tiver) registra a imagem e os alvos em
   `capturas.json`. Antes, anonimize na página com um script como `scripts/cosmetico*.js` (nomes
   reais → "Colaborador", títulos de teste → títulos de produção, esconda listas com pessoas reais).
7. **Dados de teste**, se as telas precisarem: crie só no banco de dev, com prefixo `[VÍDEO]`, registre
   os IDs num `registro-dev.json` e entregue um script de remoção que só apaga esse prefixo e recusa
   rodar fora do dev (modelo: `exemplo-enps/scripts/dev-remover-dados.php`). Avise a pessoa para
   rodá-lo quando o vídeo for aceito.
8. **Prévia por cena** (`npx remotion render src/index.ts Previa-c3 ../previas/c3.mp4`) para aprovar;
   depois `npm run render:<corte>` e `node scripts/gerar-srt.ts`.
9. **Entrega:** `saida/<nome>-<corte>.mp4` + `.srt`, e a seção "Produção" no `plano.md` (voz, como
   refazer, capturas usadas, dados de teste a remover).

## Cuidados

- Ancore animações e zooms na **fala** (`momento('c3', 'é só clicar')`), não em segundos fixos: ao
  mudar o texto, tudo se realinha.
- Nunca mostre dado pessoal real em captura nem em prévia.
- Re-renderizar não precisa de internet; só gerar narração precisa.
