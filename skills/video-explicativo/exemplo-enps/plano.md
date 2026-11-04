# Vídeo: como funciona o eNPS no Conecta — levantamento e plano

Tarefa avulsa `video-enps` · 03/11/2026 · só leitura do repositório `bruning-rh` (branch `develop`; o eNPS já está em produção).

---

## 1. Como o eNPS funciona de verdade (código)

**Não é um módulo separado: é um tipo de pesquisa.** O RH cria uma pesquisa do tipo `enps` em
*Engajamento › Pesquisas* (`Pesquisa::TIPOS`, `backend/app/Models/Pesquisa.php:15`; seletor em
`frontend/pages/pesquisas/gerenciar/cadastro.vue:278`) e coloca nela uma pergunta do tipo **NPS (0 a 10)**
(`PesquisaPergunta::TIPOS`, `backend/app/Models/PesquisaPergunta.php:13`).

- **Régua fixa 0–10**, imposta pelo servidor (ignora o mínimo/máximo enviado) para o número ser comparável
  entre pesquisas (`PesquisaPergunta.php:73-77`). Pontas padrão: "Nada provável" / "Extremamente provável",
  editáveis (`PesquisaController.php:175-176`). Aceita comentário opcional.
- **Ciclo de vida:** rascunho → aberta → encerrada (`PesquisaService::abrir/encerrar`). Só rascunho é
  editável; para abrir precisa de ao menos 1 pergunta. Janela opcional `data_inicio`/`data_fim`: fora da
  janela a pesquisa não aceita resposta, **sem cron** — o status efetivo é calculado na leitura
  (`PesquisaService::estaAberta`, linha ~56).
- **Periodicidade / disparo:** **não há disparo automático nem recorrência.** O RH abre cada rodada à mão;
  para repetir, usa **Duplicar** (cópia fiel das perguntas como novo rascunho — `PesquisaService::duplicar`).
  **Não há e-mail/notificação** ao abrir.

**Quem responde:** todo usuário vinculado a um colaborador, sem permissão especial
(`PesquisaPolicy`: "Responder é ação própria do colaborador"). A pesquisa aparece no card **"Pesquisas
pendentes"** da tela **Início** (`frontend/pages/index.vue:690-698`, via `GET /pesquisas/disponiveis`),
que lista só as abertas, dentro da janela e ainda não respondidas. Responde-se em
`frontend/pages/pesquisas/responder.vue`: régua de 11 botões, com aviso "Suas respostas são anônimas…
evite citar nomes". **Uma resposta por pessoa** (`PesquisaService::responder`: "Você já respondeu esta
pesquisa"). Responder eNPS **não dá Brunicoins** (sem regra `pesquisa_enps`;
`PesquisaParticipacaoObserver.php:11`).

**Anonimato (o ponto mais importante para o colaborador):**
- O cadastro já vem com **"Anônima" ligado** (`cadastro.vue:42`). Em pesquisa anônima, a resposta é gravada
  **sem o colaborador** (`colaborador_id = null`); o "já respondeu" fica numa tabela separada
  (participação), que não liga a pessoa à nota. Tudo só com a data, sem hora (`PesquisaService.php:17-20,
  152-161`). Os comentários são embaralhados na exibição.
- **Ninguém vê nada com menos de 5 respostas** (`MIN_RESULTADO = 5`); no resultado de uma pesquisa, grupo
  com 1 ou 2 pessoas aparece como oculto (`MIN_CELULA = 3`) e, nesse caso, **o número do NPS também some**
  ("NPS oculto para preservar o anonimato") — senão a conta revelaria o grupo escondido
  (`PesquisaService::apurarNps`, `resultados/ver.vue:203-205`).
- **Recortes** (departamento, líder, líder/liderado, tempo de casa, sexo) — **um por vez**; grupos com
  menos de 5 vão para "Demais", com supressão extra para o total não denunciar o grupo
  (`PesquisaService::agruparEnvios`).

**Cálculo do score** (`PesquisaService::calcularEnps`, linha ~472):
- **Promotores** = notas 9 e 10 · **Neutros** = 7 e 8 · **Detratores** = 0 a 6.
- **eNPS = % promotores − % detratores**, arredondado → vai de **−100 a +100**. Neutros contam no total mas
  não somam nem subtraem.
- Exemplo para o vídeo: 20 respostas → 12 promotores (60%), 5 neutros, 3 detratores (15%) → **eNPS 45**.

**Onde aparece o resultado:**
1. **Resultado da pesquisa** (`pesquisas/resultados/ver.vue`): participação ("X de Y ativos"), grupos
   Detratores/Neutros/Promotores, NPS, comentários embaralhados, recortes. Permissão `pesquisas.resultados`
   (só **Admin RH** no seed — `PesquisaPolicy::resultados`).
2. **Indicadores › Clima (e-NPS)** (`frontend/pages/indicadores/index.vue:443-477`, `GET /dashboard/enps`):
   gráfico dos **últimos 5 trimestres** + card "e-NPS atual" com promotores/neutros/detratores, **meta 70**.
   Junta todas as pesquisas tipo eNPS do trimestre (pela data de fim › início › criação) e só mostra o
   trimestre com ≥ 5 respostas (`PesquisaService::enpsTrimestral`). Permissão `indicadores.ver` — **Admin RH
   e Gestor** (o Gestor vê o número da empresa inteira, não só da equipe).

**Observações que achei no caminho (não alterei nada; só para o RH saber o que o vídeo pode prometer):**
- O indicador trimestral soma **todas** as perguntas 0–10 da pesquisa eNPS. Se o RH puser duas perguntas
  0–10 numa pesquisa eNPS, cada pessoa conta duas vezes. Recomendação no vídeo: **uma pergunta NPS por
  pesquisa eNPS**.
- A meta 70 é fixa no código (já listada no `TODOS.md:290`).
- O mínimo de 5 do trimestre conta notas, não pessoas (mesmo efeito da nota acima).
- Pesquisa ainda aberta já entra no trimestre (não espera encerrar).
- O colaborador não tem item "Pesquisas" no menu (não tem `pesquisas.ver`): o único caminho é o card do Início.

---

## 2. Roteiro proposto (~3 min, linguagem não técnica)

| # | Cena | Tela / visual | Narração / legenda | Tempo |
|---|------|---------------|--------------------|-------|
| 1 | Abertura | Logo Conecta + título | "Em uma pergunta, o eNPS mede o quanto você recomendaria a empresa como um bom lugar para trabalhar. Veja como ele funciona no Conecta." | 0:10 |
| 2 | A pergunta | Pergunta grande + régua 0–10 | "A pergunta é sempre a mesma ideia: de 0 a 10, o quanto você recomendaria trabalhar aqui a um amigo? Você escolhe uma nota e, se quiser, deixa um comentário." | 0:15 |
| 3 | Onde responder | Captura do Início, card "Pesquisas pendentes" | "Quando o RH abre uma rodada, ela aparece no seu Início, em Pesquisas pendentes. É só clicar." | 0:15 |
| 4 | Respondendo | Captura de `responder` com o aviso de anonimato | "Toque na nota, comente se quiser e envie. Cada pessoa responde uma vez por rodada." | 0:20 |
| 5 | Anonimato | Animação: nota entra numa urna, o nome fica de fora | "Sua resposta é anônima: o sistema registra que você participou, mas a nota não fica ligada ao seu nome. Com menos de cinco respostas, ninguém vê resultado; grupos pequenos ficam ocultos. Só evite citar nomes no comentário." | 0:30 |
| 6 | A conta | Animação: 3 baldes (0–6, 7–8, 9–10) e o exemplo 60% − 15% = 45 | "Notas 9 e 10 são promotores; 7 e 8, neutros; 0 a 6, detratores. O eNPS é o percentual de promotores menos o de detratores, de −100 a +100. Exemplo: 60% de promotores e 15% de detratores dão eNPS 45." | 0:30 |
| 7 | Para o RH: criar | Captura do cadastro: tipo eNPS, pergunta NPS, Anônima, datas | "No RH: em Pesquisas, crie uma pesquisa do tipo eNPS, adicione uma pergunta NPS — use só uma — e deixe Anônima ligada. Defina início e fim, e abra. Na próxima rodada, use Duplicar." | 0:25 |
| 8 | Para o RH: ler | Captura do resultado da pesquisa + Indicadores › Clima | "No resultado você vê a participação, os três grupos, o eNPS e os comentários, e pode filtrar por um recorte por vez. Em Indicadores, a aba Clima mostra a evolução por trimestre contra a meta de 70." | 0:30 |
| 9 | Fechamento | Mensagem final | "Sua nota sincera é o que faz o número valer. Responda quando aparecer no seu Início." | 0:10 |

**Total ≈ 3:05.** Opção: um corte só para colaboradores (cenas 1–6 + 9, ≈ 2:10) e o vídeo completo para o RH.

---

## 3. Formatos de produção possíveis nesta máquina

**O que está instalado:** Node 24.15 + npx, Python 3, winget, voz do Windows **Microsoft Maria (pt-BR)**
(SAPI, soa robótica). **Não instalados:** ffmpeg/ffprobe, ImageMagick, OBS, Clipchamp, edge-tts,
Playwright/Puppeteer. Tudo que faltar pode ser instalado **fora do repo**, em `C:/BruningSistemas_dev/videos/enps-conecta`.

**A) Vídeo gerado por código — Remotion + capturas reais + narração TTS** ⭐ recomendado
- Cenas em React (Remotion), animações próprias para "urna anônima" e "conta do eNPS", capturas do
  Conecta Dev, narração neural pt-BR (edge-tts: vozes Francisca/Antonio) e legenda queimada + `.srt`.
- Exige: `npm i remotion` na pasta do vídeo (o Remotion baixa o próprio Chrome e ffmpeg); `pip install
  edge-tts` (precisa de internet; API não oficial da Microsoft — fallback: voz Maria local); **portal dev
  com login Admin RH + um colaborador comum**, e uma pesquisa eNPS com ≥ 5 respostas no dev.
- Prós: reproduzível, fácil de corrigir texto e re-renderizar, legenda sincronizada, sem gravar voz,
  dá para gerar os dois cortes do mesmo projeto. Contras: voz sintética; ~1 tarde de trabalho; depende
  dos dados de teste no dev.

**B) Gravação de tela do Conecta Dev com narração do usuário**
- Exige: alguém navegar e narrar (Ferramenta de Captura do Windows grava tela; para áudio bom, OBS via
  `winget install OBSProject.OBSStudio`); eu entrego roteiro com cliques e o texto para ler, e corto/
  legendo depois com ffmpeg (`winget install Gyan.FFmpeg`).
- Prós: voz humana, mostra o app "de verdade". Contras: depende do tempo de quem grava, regravação cara a
  cada erro, não tem a animação da conta (dá para inserir depois).

**C) Só roteiro + capturas + legenda para outra pessoa produzir**
- Eu entrego roteiro final, capturas em alta (PNG) de cada cena, `.srt` e o texto da narração.
- Prós: menor esforço meu, liberdade para o RH usar o editor que quiser. Contras: o vídeo fica para
  outra pessoa fazer.

**Recomendação: A**, com a voz neural; se o RH quiser voz humana, o mesmo projeto aceita um áudio gravado
no lugar do TTS (híbrido A+B).

---

## 4. Dúvidas para o usuário

1. **Público:** um vídeo só (≈3 min, com bloco "Para o RH") ou dois cortes (colaborador ≈2 min + RH completo)?
2. **Formato:** OK com A (narração sintética neural)? Ou prefere voz de alguém do RH?
3. **Capturas:** posso usar o **portal dev** com login Admin RH e um colaborador comum? Para ter resultado
   na tela preciso **criar no dev uma pesquisa eNPS com ≥ 5 respostas** (5 colaboradores de teste) —
   o banco de dev é dividido com o Global Conecta (PI-44); pode? Alternativa sem tocar dados: telas
   recriadas em HTML a partir do código (fiel, mas não é captura real).
4. **Pergunta oficial:** qual é o enunciado exato que o RH usa (ou vai usar) na pergunta eNPS?
5. **Meta 70 e "uma pergunta NPS por pesquisa":** o vídeo pode citar a meta e orientar o RH assim?
6. **Gestor:** o vídeo deve dizer que o Gestor vê o eNPS da empresa em Indicadores?
7. **Entrega:** MP4 1080p horizontal basta, ou precisa de vertical (celular/WhatsApp)? Onde publicar?

---

## 5. Produção (03/11/2026)

**Entregas** (`saida/`): `enps-conecta-colaboradores.mp4` + `.srt` (1:34, cenas 1–6 + 9) e
`enps-conecta-rh.mp4` + `.srt` (2:15, cenas 1–9). MP4 1920×1080 H.264 + AAC, legenda queimada.

**Voz:** edge-tts `pt-BR-ThalitaMultilingualNeural`, velocidade normal. Números são falados por extenso
(`textoFalado` em `remotion/src/linhaDoTempo.ts`), porque a voz multilíngue lia algarismos em espanhol; a
legenda mantém algarismos. Áudios já gerados em `remotion/public/audio/`: re-renderizar não precisa de
internet; só mudar a narração precisa (`scripts/gerar_narracao.py`).

**Como refazer:** editar `scripts/narracao.json` → `.venv/Scripts/python scripts/gerar_narracao.py [cX]`
→ `cd remotion && npm run render:colab && npm run render:rh` → `node scripts/gerar-srt.ts`.

**Capturas** (portal "Vídeo Dev", `remotion/public/capturas/`): Início e resposta com a conta de um
colaborador comum (Colaborador; não enviou resposta); cadastro, lista, resultado e Indicadores com o Admin RH.
Ajustes só visuais no navegador antes da captura (`scripts/cosmetico*.js`): nome → "Colaborador",
"[VÍDEO] eNPS teste…" → "eNPS — <mês>/2026", outras pesquisas de dev e o card "Minhas pendências"
(nomes reais) ocultos.

**Dados de teste no banco de DEV (`bruning_rh` local) — remover depois:**
- `pesquisas` #8 "[VÍDEO] eNPS teste — T2" (encerrada), #9 "— T3" (encerrada), #10 "[VÍDEO] eNPS teste"
  (aberta até 13/11/2026), #11 "— rascunho"; com as `pesquisa_perguntas`, `pesquisa_participacoes`,
  `pesquisa_envios`, `pesquisa_respostas` (40 respostas, colaboradores 66–85) e os `audit_logs` delas.
- Remoção: `php C:/BruningSistemas_dev/videos/enps-conecta/scripts/dev-remover-dados.php`
  (lê `registro-dev.json`, só apaga títulos "[VÍDEO] eNPS teste%", recusa banco que não seja o de dev).
