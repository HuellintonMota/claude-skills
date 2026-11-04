# Dublagem: quando a legenda está só na imagem

`dublar.py` precisa de um `.srt`. Se a legenda está queimada no vídeo e não há arquivo:

1. Extraia quadros da faixa da legenda (ajuste o recorte à posição dela):
   ```bash
   mkdir quadros
   ffmpeg -i VIDEO.mp4 -vf "fps=4,crop=iw:ih*0.22:0:ih*0.78" quadros/q%05d.png
   ```
   O quadro `qN` está em `(N-1)/4` segundos.
2. Leia os quadros (o Read mostra a imagem) e anote quando cada texto aparece e some. Quadros vizinhos
   com o mesmo texto formam um bloco; olhe em lotes e só nos pontos onde o texto muda.
3. Escreva o `.srt` (início = primeiro quadro com o texto; fim = primeiro quadro sem ele) e mostre à
   pessoa para conferir o texto antes de gerar a voz: erro de leitura vira erro de fala.
4. Siga o modo só dublagem com `--legenda`.

Se a pessoa tiver o roteiro em texto, use-o para corrigir o que foi lido nos quadros.

## Ajustes finos
- Fala que não cabe mesmo acelerada: encurte o texto daquela fala no `.srt` (só para a voz; a legenda
  da imagem não muda) e rode de novo.
- Trocar a voz: `--voz pt-BR-AntonioNeural` (lista completa: `.venv/Scripts/edge-tts --list-voices`).
- Vídeo que já tem áudio (ex.: música): a saída fica só com a narração; para manter a música, misture
  depois com `ffmpeg -i dublado.mp4 -i original.mp4 -filter_complex "[1:a]volume=0.15[m];[0:a][m]amix=inputs=2:duration=first" -map 0:v -c:v copy saida.mp4`.
