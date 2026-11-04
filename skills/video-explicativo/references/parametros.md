# Parâmetros do padrão (vídeo do eNPS, 03/11/2026)

## Voz
- edge-tts `pt-BR-ThalitaMultilingualNeural` (feminina), velocidade e tom padrão (sem `rate`/`pitch`).
- Narração gerada com `boundary="WordBoundary"`; o tempo de cada palavra vai para `tempos.json`.
- A Thalita é multilíngue e às vezes lê algarismos em espanhol: a **fala** leva números por extenso
  ("60%" → "sessenta por cento", "-100" → "menos cem"); a **legenda** mantém os algarismos. Uma função só
  (`textoFalado` em `linhaDoTempo.ts`) faz a troca, e o alinhamento da legenda usa a mesma função.
- Mapa `pronuncia` (escrito → falado) para siglas e nomes que a voz errar.
- Sem voz reserva automática: se o edge-tts falhar, pare com erro.
- Alternativas testadas: `pt-BR-FranciscaNeural` (feminina), `pt-BR-AntonioNeural` (masculina);
  offline, Piper `pt_BR-faber-medium` (`cadu`/`jeff` também; `edresson-low` perde nasais). As vozes do
  Windows (Maria/Daniel) soam robóticas.

## Vídeo
- 1920×1080, 30 fps, H.264, CRF 18, frames JPEG qualidade 92, áudio AAC (`remotion.config.ts`).
- Remotion 4.0.540, React 19.1.0, TypeScript 5.8.3, ffmpeg-static 5.2.0, ffprobe-static 3.1.0.
- Duração da cena = 0,6 s antes da fala + fala + pausa depois (1,4 a 3,0 s; mais longa em cena com
  conta/animação e no fechamento). Fade de entrada e saída de 10 frames.

## Visual
- Fonte Sofia Sans (Google Fonts), pesos 400/600/700/800.
- Paleta: fundo `#F4F7F5`, texto `#1E241A`, texto suave `#5B6360`, marca `#18DF9A`, marca escura
  `#0B8F60`, lilás `#9EA0E5`, cartão `#FFFFFF`, borda `#E2E8E4`; status: vermelho `#E5484D`,
  cinza `#8B8D98`, verde `#12B981`.
- Título da cena: 64 px do topo, 30 px, peso 800, caixa alta, espaçamento 4, cor marca escura; some
  quando a câmera começa a se mover.
- Entradas: easing out-cubic em 0,6 s; molas com damping 16 e stiffness 120.
- Etiquetas: pílula branca, 36 px, peso 700, sombra `0 6px 24px rgba(30,36,26,0.10)`.

## Legenda
- Queimada e em `.srt`, das mesmas contas (`legendasDoCorte`).
- Caixa no rodapé, 56 px da borda; fundo `rgba(20,24,20,0.84)`, raio 16, texto branco 44 px peso 600,
  altura de linha 1,3, largura máxima 1480 px.
- Quebra por frase; frase com mais de 62 caracteres vira blocos equilibrados, preferindo vírgula.
- Bloco entra 0,1 s antes da primeira palavra e fica até 0,1 s antes do próximo.

## Capturas
- Do ambiente de dev, uma por tela, com tamanho real e retângulos dos alvos em `capturas.json`.
- Câmera: área útil 1760×860, foco no alvo com margem de 90 px e zoom máximo 1,35, transição de 0,9 s;
  destaque do alvo e rótulo curto ("Início › Pesquisas pendentes").
- Troca de captura na mesma cena com fade cruzado de 0,5 s.
