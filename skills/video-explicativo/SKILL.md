---
name: video-explicativo
description: Produz vídeos explicativos de funcionalidades de sistema (tutorial, "como funciona", onboarding) no padrão do vídeo do eNPS do Conecta — Remotion + capturas reais do ambiente de dev + narração neural pt-BR (edge-tts, voz Thalita) + legenda queimada e .srt. Também dubla um vídeo que já existe com legenda mas sem faixa de áudio, e guarda na máquina a voz, a velocidade e o tom preferidos ("/video-explicativo configurar"). Use quando pedirem "fazer um vídeo explicando X", "vídeo tutorial do sistema", "vídeo de como funciona", "narrar/dublar este vídeo", "colocar voz num vídeo que só tem legenda", "gerar áudio a partir da legenda", "configurar a voz do vídeo", "deixar a narração mais lenta/grave", mesmo sem citar Remotion ou edge-tts.
---

# Vídeo explicativo

Três modos. Descubra qual pelo pedido; na dúvida, pergunte.

- **Vídeo completo** — do levantamento ao MP4 com narração e legenda.
- **Só dublagem** — já existe o vídeo (com legenda) e falta o áudio.
- **Configurar** (`/video-explicativo configurar`, "trocar a voz", "narração mais rápida") — escolhe a
  voz, a velocidade e o tom que os outros dois modos usam nesta máquina.

Os parâmetros visuais e de voz estão em `references/parametros.md`. O projeto que serviu de modelo
está em `exemplo-enps/` (código, roteiro e plano; sem áudios, capturas e node_modules).

## Antes de começar: versão nova?

Rode `bash "$(cd -P "<pasta desta skill>/../.." && pwd)/lib/verificar-atualizacao.sh"`. Sem saída, siga.
Se imprimir `ATUALIZACAO_DISPONIVEL <versão local> <versão nova> <n commits>`, as linhas seguintes são
as novidades: as seções do CHANGELOG entre as duas versões, ou os commits quando a versão não mudou
("?" é uma versão anterior ao controle de versão). Pergunte (AskUserQuestion) "Há versão nova das
claude-skills: <local> → <nova>", com as novidades no texto da pergunta:
- **Atualizar agora** (recomendado): rode o mesmo script com `atualizar` e **leia este SKILL.md de novo**
  antes de seguir, porque ele pode ter mudado.
- **Adiar por 1 dia**: rode com `adiar`; não pergunta mais (nem atualiza sozinho) até amanhã, e siga.

Uma vez por sessão basta. Se o script falhar (sem rede, sem git), siga sem atualizar.

## Ambiente (os dois modos)

Trabalhe numa pasta própria do vídeo (ex.: `videos/<nome>`), **nunca dentro do repositório do sistema**.

O `setup` do repositório cria o `.venv` **da skill** com edge-tts e ffmpeg (imageio-ffmpeg). Use esse
Python nos comandos abaixo; chamado aqui de `$PY`:
- Windows: `<pasta desta skill>/.venv/Scripts/python.exe`
- Linux/macOS: `<pasta desta skill>/.venv/bin/python`

Se ele não existir, rode `bash ~/.claude/claude-skills/setup --skills video-explicativo`. O edge-tts
precisa de internet. O modo completo precisa também de Node 22.18+ (o setup confere).

## Configuração de voz (todos os modos)

`$PY <pasta desta skill>/scripts/voz.py` guarda a voz, a velocidade e o tom em `config.json`, na pasta
da skill. O arquivo fica fora do git: cada máquina tem o seu, e a atualização da skill não o apaga.
Sem ele, vale o padrão (Thalita, `+0%`, `+0Hz`).

- `voz.py mostrar`: o que está valendo e de onde veio.
- `voz.py vozes [--idioma pt-BR]`: as vozes do edge-tts.
- `voz.py amostra [--voz A --voz B] [--velocidade +10%] [--tom -3Hz] [--texto "..."] --saida <pasta>`:
  gera mp3 para ouvir. O que não for passado vem da configuração salva.
- `voz.py definir [--voz NOME] [--velocidade +10%] [--tom -3Hz]`: grava.
- `voz.py padrao`: apaga a configuração e volta ao padrão.

Velocidade vai de -50% a +100% e tom de -50Hz a +50Hz; 0 é o natural da voz. Na prática, ±5 a 15% de
velocidade e ±2 a 6Hz de tom já mudam bastante.

## Modo configurar

1. `voz.py mostrar` e conte à pessoa o que está valendo.
2. Pergunte (AskUserQuestion) a voz, a velocidade e o tom, com o valor atual como primeira opção.
   Vozes: as pt-BR de `voz.py vozes` (Thalita, Francisca, Antonio). Velocidade: mais lenta (-10%),
   natural (+0%), um pouco mais rápida (+8%), rápida (+15%). Tom: mais grave (-4Hz), natural (+0Hz),
   mais agudo (+4Hz). A pessoa pode digitar outro valor em "Other".
3. Gere a amostra com a escolha numa pasta temporária (o scratchpad, se houver) e passe o caminho do
   mp3 para a pessoa ouvir. Se ela quiser comparar, gere uma amostra por variação.
4. Com o "pode salvar", `voz.py definir ...` e mostre o resultado do `voz.py mostrar`.
5. Diga que vale para as próximas dublagens e para os próximos vídeos. Um vídeo já criado mantém a voz
   do `narracao.json` dele; para refazer a narração com a voz nova, troque lá e rode
   `gerar_narracao.py` de novo.

## Modo só dublagem

1. **Legenda.** Precisa de um `.srt` com tempos.
   - `.srt` ao lado do vídeo ou faixa de legenda embutida: o script acha sozinho.
   - Legenda só queimada na imagem: monte o `.srt` antes, como em `references/dublagem.md`.
2. **Voz.** Use a configuração salva (`voz.py mostrar`). Se a pessoa quiser outra só para este vídeo,
   gere a frase da primeira fala com `voz.py amostra` em 2–3 opções e passe a escolhida com
   `--voz/--velocidade/--tom` (vale só para esta execução; para guardar, modo configurar).
3. **Relatório antes do vídeo:**
   `$PY <pasta desta skill>/scripts/dublar.py VIDEO.mp4 --so-relatorio [--legenda X.srt] [--voz ...] [--velocidade ...] [--tom ...]`
   Mostra cada fala, o tempo de voz contra o espaço que ela tem, as que foram aceleradas e as que
   atrasaram. Mais de 3 falas aceleradas acima de 15% ou atrasos acumulando: a legenda tem texto demais
   para o tempo; avise a pessoa antes de seguir (encurtar o texto da fala no .srt resolve).
4. **Dublar:** o mesmo comando sem `--so-relatorio`. Saída: `VIDEO-dublado.mp4` (vídeo copiado sem
   recodificar, narração AAC, legendas embutidas mantidas).
5. Siglas ou nomes lidos errado: `--pronuncia pronuncia.json` com `{"escrito": "falado"}`.

O script junta blocos de legenda da mesma frase (a entonação fica natural), fala números por extenso,
acelera a voz no máximo 30% além da velocidade configurada quando a fala não cabe e, se ainda assim não couber, atrasa a seguinte.

## Modo vídeo completo

1. **Levantamento (só leitura do código).** Como a funcionalidade funciona de verdade, com
   arquivo:linha, e o que o vídeo pode e não pode prometer. Grave em `plano.md`
   (ver `exemplo-enps/plano.md`, seção 1).
2. **Roteiro em tabela:** `# | Cena | Tela/visual | Narração (= legenda) | Tempo`. Linguagem não
   técnica, frases curtas, uma ideia por cena. Se houver dois públicos (ex.: usuário e gestor/RH),
   proponha dois cortes do mesmo projeto. **Pare e mostre o roteiro com as dúvidas** antes de produzir.
3. **Voz.** Parta da configuração salva (`voz.py mostrar`): gere a frase da cena 1 com ela
   (`voz.py amostra --texto "..."`) e, se a pessoa quiser comparar, em mais 2–3 opções.
4. **Projeto.** Copie `exemplo-enps/remotion` e `exemplo-enps/scripts` para a pasta do vídeo e
   `npm install` em `remotion/`. Troque:
   - `scripts/narracao.json`: `voz`, `velocidade` e `tom` (os escolhidos no passo 3), cenas (`id`,
     `legenda`) e `pronuncia`. Ficam no projeto para o vídeo sair igual se for refeito em outra máquina;
   - `remotion/src/linhaDoTempo.ts`: `CORTES` e `PAUSA_DEPOIS`;
   - `remotion/src/cenasAnimadas.tsx` / `cenasCaptura.tsx` e o mapa `CENAS` em `Raiz.tsx`;
   - logos em `remotion/public/`; nomes dos arquivos de saída em `package.json` e `scripts/gerar-srt.ts`.
5. **Narração:** `$PY scripts/gerar_narracao.py [cena ...]` → áudio por cena em
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
