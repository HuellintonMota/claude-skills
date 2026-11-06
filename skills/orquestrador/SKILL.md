---
name: orquestrador
description: >-
  Orquestra uma tarefa do Jira (projeto PI) entre os agentes dos projetos
  internos da Bruning no canvas Maestri: lê o card, define o projeto principal
  pelo título/label ([Helpdesk] → helpdesk-web, [Conecta] → bruning-rh,
  [Portal Parceiros] → bruning-parceiro), detecta projetos complementares pelo
  conteúdo (nexus, n8n ou outro dos três), divide o card em subtarefas, delega
  cada uma ao agente do projeto no andar certo do Maestri, consolida os planos
  para aprovação num lugar só, manda implementar, acompanha por notas de status,
  pergunta se cada PR fica só como PR ou vai para merge, homologação ou deploy,
  e fecha o card no Jira com comentário consolidado + transição, avisando por
  DM no Discord quem abriu o card quando ele é concluído. Também serve
  para "faz o merge e deploy do PR #218" de um card já orquestrado. Use sempre que
  o usuário disser "orquestrar o PI-40", "delegar esse card", "manda pros
  agentes", "distribui essa tarefa", "qual projeto pega essa tarefa", "quem
  resolve isso", colar um link bruning.atlassian.net/browse/PI-... pedindo para
  encaminhar ao agente certo, ou descrever um problema/pedido solto sem card e
  quiser que ele vá para o projeto certo — mesmo sem dizer "orquestrar". Também
  responde a "como está o PI-40?" lendo as notas de status. Se o card é de um
  único projeto e o usuário já está trabalhando dentro dele, o /dev-flow do
  próprio projeto basta.
---

# Orquestrador de tarefas

Você coordena, não implementa. O seu trabalho é decidir **quem** faz o quê,
garantir que cada agente de projeto recebe contexto suficiente para planejar
sozinho, juntar os planos para o usuário aprovar de uma vez e manter o Jira e o
canvas refletindo o estado real. O código é escrito pelos agentes nos andares
de cada projeto, que conhecem as regras do próprio repositório (CLAUDE.md,
rules, dev-flow) muito melhor do que você conseguiria de fora.

O que o usuário pedir fora do fluxo de um card (mexer numa skill, remover um
worktree, apagar dados de teste, investigar um pedido do RH, rodar um script)
vai para o terminal **Executor** no Ground, se ele estiver em "Connected
agents" no `maestri list`. Você monta o pedido, confere o resultado e responde
ao usuário; quem lê arquivos, roda comandos e edita é ele. Fica com você só o
que é orquestração: notas, `floor status`, prompts aos agentes, conferência no
GitHub (`gh pr view`, `gh run view`), o shell Git Manager e **o conteúdo e a
confirmação** de tudo que vai para o Jira e o Discord.

As **escritas** no Jira (criar card, comentar, transicionar, ligar cards) e a
DM no Discord também vão para o Executor: você monta o texto, mostra o preview,
o usuário confirma, e o Executor aplica exatamente aquilo e devolve a prova
(chave, id do comentário, status, HTTP). Leituras no Jira (`getJiraIssue`,
transições disponíveis, busca) continuam com você, porque decidem a
orquestração. Regras em `references/delegacao.md`, seção "Executor". Sem
Executor ligado, faça você mesmo, como antes.

Referências (leia quando chegar na etapa correspondente):
- `references/projetos.md` — mapa dos projetos e regras de classificação.
- `references/delegacao.md` — role do Maestri e prompts de plano/implementação.
- `references/nota-status.md` — notas do card no Ground (status e plano): modelos e fases.
- `references/discord.md` — aviso por DM a quem abriu o card, quando ele é concluído.

Jira: site `bruning.atlassian.net` (cloudId `64acd48c-a13d-414b-953e-b6e4e3eef3de`).
Use as ferramentas `mcp__claude_ai_Atlassian__*`; se o cloudId falhar, chame
`getAccessibleAtlassianResources`. Os tipos de link do site estão em
português: para ligar dois cards use `createIssueLink` com o tipo
`Relacionar` ("relacionado a") — `Relates` não existe e devolve 404. Outros
tipos: `Bloquear`, `Depende`, `Duplicar`, `Clonar`.

## Antes de começar: versão nova?

Rode `bash "$(cd -P "<pasta desta skill>/../.." && pwd)/lib/verificar-atualizacao.sh"`. Sem saída, siga.
Se imprimir `ATUALIZACAO_DISPONIVEL <n>` e os commits, pergunte (AskUserQuestion), mostrando os commits:
- **Atualizar agora** (recomendado): rode o mesmo script com `atualizar` e **leia este SKILL.md de novo**
  antes de seguir, porque ele pode ter mudado.
- **Adiar por 1 dia**: rode com `adiar`; não pergunta mais (nem atualiza sozinho) até amanhã, e siga.

Uma vez por sessão basta. Se o script falhar (sem rede, sem git), siga sem atualizar.

## Modos de entrada

- **ID ou URL de card** (`PI-40`, `https://bruning.atlassian.net/browse/PI-40`):
  fluxo normal a partir da Etapa 1.
- **Texto livre sem card**: vá para "Entrada sem card" abaixo.
- **`--simular`** (em qualquer modo): rode as Etapas 1 e 2 de verdade (só
  leitura no Jira e no git) e mostre o resto como **resumo**, sem chamar
  `maestri` e sem escrever no Jira. Serve para o usuário conferir a
  classificação antes de mobilizar agentes — então a classificação é o
  centro da resposta e o resto é curto. Veja "Formato do --simular".
- **"Como está o PI-40?"**: vá direto para "Acompanhamento".

### Entrada sem card

1. Classifique o texto como na Etapa 2 (palavras características do
   `projetos.md`) e confirme principal + complementares com o usuário.
2. Pergunte com AskUserQuestion o que fazer com o Jira:
   - **Vincular a um card existente** — busque com `searchJiraIssuesUsingJql`:
     `project = PI AND statusCategory != Done AND labels = <label do principal>
     AND text ~ "<2-3 palavras-chave>"` (se vier vazio, tire o filtro de label).
     Mostre até 5 candidatos (chave, título, status) e deixe o usuário escolher.
     Com o card escolhido, siga da Etapa 1.
   - **Criar um card novo** — monte título `[Prefixo] <resumo curto>` no padrão
     do principal, label do principal, tipo Tarefa ou Bug (sugira pelo texto) e
     descrição a partir do texto do usuário. Mostre o preview, confirme, crie com
     `createJiraIssue` no projeto PI e siga da Etapa 1 com a chave nova.
   - **Seguir sem card** — delegue mesmo assim; pule todas as escritas no Jira
     (Etapas 3 e 9). Use um apelido curto em kebab-case no lugar do ID nas notas
     e no fichário (ex.: `painel-tv-zendesk`).

## Etapa 1 — Ler o card

`getJiraIssue` com descrição, comentários, subtarefas, links, labels, tipo e
status. Leia os comentários: muitas vezes é ali que alguém já apontou onde está
o problema ("isso é no nexus", "o webhook do n8n não disparou").

Se a chave não for PI, aplique a regra de fora do escopo do `projetos.md`:
diga para qual repositório o card iria e pare. Não ofereça delegar para
projetos sem andar nem role (job-web, desktop), nem "mesmo assim" — o usuário
trabalha neles por outro caminho, e um agente recrutado lá ficaria sem as
regras e o fluxo daquele repositório.

### Card que já foi entregue

O fluxo PI é `A fazer` → `Fazendo` → `AG. Versão` → `Concluído` (ou
`Descartado`). Se o card estiver em **Concluído**, **Descartado** ou
**AG. Versão**, o trabalho já foi feito (ou abandonado) — orquestrar de novo
faria os agentes refazerem o que está na `main`. Então:

1. Mostre a entrega em poucas linhas: o comentário de fechamento e, se houver,
   os commits/PRs do card (`git log --oneline --all --grep "<ID>"` nos
   repositórios prováveis).
2. Faça a classificação da Etapa 2 normalmente (ela continua útil para o
   usuário saber quem pegaria um retorno).
3. Faça **uma** pergunta, sempre com estas opções:
   - **Abrir card novo ligado a este** (recomendado para retorno ou ajuste) —
     siga como "Criar um card novo" da Entrada sem card, com o link
     "relacionado a <ID>" no preview; depois de criar, ligue com
     `createIssueLink` tipo `Relacionar`.
   - **Reabrir o <ID>** — só se o usuário disser que a entrega não resolveu;
     a transição para `Fazendo` passa pela confirmação da Etapa 3.
   - **Só conferir a classificação** — para aqui.
   - **Cancelar.**

Nunca proponha a transição para `Fazendo` de um card entregue como passo
normal do fluxo; ela só existe dentro da opção "Reabrir".

## Etapa 2 — Classificar e dividir

Aplique as regras do `projetos.md` na ordem: prefixo do título e label definem o
**principal**; o conteúdo indica os **complementares**. O título/label dizem qual
sistema o usuário enxerga, não necessariamente onde está a causa — um
`[Helpdesk] Erro ao fazer backup` foi corrigido no nexus. Por isso, procure
ativamente sinais de complementares mesmo quando o principal é óbvio.

Apresente assim:

```md
## Classificação — PI-40: <título>

| Projeto | Papel | Evidência | Confiança | Subtarefa |
|---|---|---|---|---|
| helpdesk-web | principal | título `[Helpdesk]` + label `helpdesk` | alta | <o que cabe a ele> |
| nexus | complementar | "erro ao gerar dump" no comentário de 12/10 | média | <o que cabe a ele> |

**Andar:** Helpdesk
**Dependências:** <ex.: o endpoint do nexus define o contrato que o proxy do helpdesk-web consome — implementar nexus primeiro>
```

Confirme com AskUserQuestion antes de delegar (aprovar / ajustar projetos /
cancelar). Se não houver prefixo nem label, ou se eles divergirem, pergunte
qual é o principal em vez de decidir sozinho — o andar inteiro depende disso.
Se o principal for nexus ou n8n (sem andar próprio), **pergunte** em qual
andar trabalhar — sugira um, mas não decida.

Em **incidente** (algo que funcionava parou ou quebrou), recomende o menor
conjunto de projetos: só o da causa provável. Os outros entram depois, se a
investigação apontar para eles. Dois agentes num incidente dobram o custo, e
o segundo costuma só ficar esperando o diagnóstico do primeiro. Mantenha a
opção com mais projetos na pergunta, mas não como recomendada.

Faça uma pergunta por vez. Quando a resposta de uma pergunta pode tornar as
seguintes irrelevantes (ex.: card já entregue → "só conferir"), pare na
primeira.

Um card de um projeto só continua sendo orquestrado normalmente. O `/dev-flow`
do próprio projeto só substitui o orquestrador quando o usuário já está
trabalhando dentro daquele repositório — não sugira dispensar o Maestri só
porque há um projeto.

## Etapa 3 — Jira em andamento

`getTransitionsForJiraIssue` e escolha a que leva a `Fazendo` (hoje id 21,
mas confira na lista — ids mudam quando o workflow muda). Mostre ao usuário e
só aplique (`transitionJiraIssue`) depois de confirmar. Se o card já estiver em
`Fazendo`, pule.

## Etapa 4 — Preparar os agentes

Leia `references/delegacao.md` agora.

1. **Maestro.** Rode `maestri floor list`. Se responder "not the Maestro", peça
   ao usuário para ligar o Maestro Mode neste terminal e pare — sem isso não dá
   para recrutar nem enxergar outros andares. Em erros de conexão, `maestri debug`.
2. **Andares.** Confira se existem `Helpdesk`, `Conecta`, `Portal-Parceiros` e
   `Indica-Eixo`.
   Não crie andares; se faltar o do principal, avise e pare. Os andares são
   fixos: nunca rode `floor land` ou `floor delete` neles.
3. **Agentes.** `maestri list`. Cada andar já tem um agente fixo do projeto
   principal (`Global Helpdesk`, `Global Conecta`, `Global Parceiros`,
   `Global Indica` — ver
   `projetos.md`); use-o para aquele projeto. Para os demais projetos do card,
   procure no andar um agente com o role `Projeto: <projeto>`. Reuse sempre
   que existir — recrutar duplicado custa um terminal e uma sessão de modelo ao
   usuário.
   **O agente precisa estar ligado a você.** Ele tem de aparecer em
   "Connected agents" no `maestri list`; sem a ligação, `ask` não chega nele
   e ele não consegue responder. `maestri connect` não resolve para os Global:
   ele recusa ("No connection to …") agentes que não estão na sua árvore de
   time. Nesse caso, pare e peça ao usuário para puxar a corda do terminal
   "Orquestrador" até o agente no app, e espere ele confirmar.
   Os agentes Global não têm role e rodam em `C:\BruningSistemas_dev`: no
   **primeiro** prompt que mandar a cada um, comece com o briefing do papel
   (`delegacao.md`, "Briefing para agente sem role"), que traz o caminho do
   repositório e os dois navegadores do agente (dev e prod, em
   `projetos.md`). Não use `maestri role assign` neles sem o usuário pedir — isso
   reinicia o agente e apaga o histórico dele.
4. **Faltou alguém** (complementar sem agente no andar): `maestri role list`;
   se o role `Projeto: <projeto>` não existir, crie-o (global) com o template
   do `delegacao.md`. Depois:
   `maestri recruit "<codinome>" --floor "<andar do principal>" --role "Projeto: <projeto>" --dir "<caminho do repo>"`.
   Complementares (nexus, n8n, ou outro dos três) entram **no andar do
   principal**, com `--dir` do próprio repositório — assim tudo de um card fica
   num andar só. Invente codinomes curtos e variados a cada recrutamento (não
   use o nome do projeto nem repita codinomes de outros cards).
   Dê alguns segundos para o agente subir antes do primeiro `ask`.
5. **Seu nome** para o ask back: o que aparece em `You:` no `maestri list`
   (ou `Nome @ Workspace`, se o agente estiver em outro workspace).

## Etapa 5 — Planos em paralelo

Leia `references/nota-status.md` agora. Para cada agente, **crie a nota
`Status · <ID> · <projeto>` no Ground** (fichário `<ID>`, fase Planejando)
no momento em que for dispará-lo — é ela que o usuário olha para acompanhar
o card, e quem a mantém é você, não o agente.

**Plan mode.** Antes de disparar, `maestri check "<agente>"`: se o rodapé
mostrar "plan mode on", o agente não consegue rodar o `maestri ask` de volta
e para no menu "Ready to code?" com o plano num arquivo
`~/.claude/plans/<nome>.md`. Peça ao usuário para tirá-lo do plan mode
(Shift+Tab no terminal dele) antes de mandar o prompt. Se o usuário preferir
deixar, leia o plano pelo caminho do arquivo que aparece na tela e trate-o
como se tivesse chegado pelo ask back. A resposta àquele menu é a aprovação da
Etapa 6: só mande por `--raw` a opção que o usuário escolheu (aprovar, ou
continuar planejando com o ajuste).

Monte um prompt de PLANO por agente (template no `delegacao.md`) e dispare
todos juntos:

```bash
maestri ask --batch '{"<agente A>": "<prompt A>", "<agente B>": "<prompt B>"}'
```

Timeout do Bash: 600000 ms. O plano chega pelo ask back. Se estourar o tempo,
**não reenvie** — rode `maestri floor list` (status do andar) ou
`maestri check "<agente>"` e espere de novo. Reenviar faz o agente começar outro plano por cima do
primeiro.

Mesmo quando há dependência de implementação, o planejamento é paralelo: cada
agente declara no plano o contrato que expõe ou consome, e é você quem confere
se os dois lados batem.

## Etapa 6 — Aprovação consolidada

A cada plano que chegar, grave-o inteiro na nota `Plano · <ID> · <projeto>`
no Ground (modelo no `nota-status.md`) e passe a nota de status para "Plano
enviado". O terminal é ruim para ler um plano longo; a nota mostra o
markdown formatado e fica ao lado das outras do card.

Mostre ao usuário, num bloco só:
- o plano de cada projeto, resumido, com arquivos, riscos e testes, e o nome
  da nota onde está o plano completo;
- **os contratos entre projetos** lado a lado, apontando qualquer divergência
  (nome de campo, formato de data, rota) — esse é o ponto que nenhum agente
  isolado consegue ver;
- as dúvidas que os agentes levantaram, agrupadas.

AskUserQuestion: **Aprovar tudo** / **Ajustar um projeto** / **Cancelar**.
Se algum plano mexe no que o usuário vê (tela nova, layout, componente
visual, fluxo de tela, mensagens), inclua também **Rodar /plan-design-review**
e recomende-a. Ela roda no terminal do agente daquele projeto, que já tem o
plano e o código; mande `maestri ask "<agente>" "Rode /plan-design-review no
plano de <ID> e me devolva o plano revisado pelo ask back, com as dúvidas que
surgirem"`. O plano revisado volta para esta etapa como v2. No PI-36, a
revisão levou a nota de design do plano de 4 para 8 antes de uma linha de
código.
Se o plano é grande (muitos arquivos, dependência nova, composable ou serviço
compartilhado, migration, contrato entre projetos), inclua também **Rodar
/plan-eng-review** e recomende-a. O pedido é o mesmo, trocando o nome da
skill. Ela confere a arquitetura, os casos de borda e a cobertura de testes
antes do código. No PI-42, ela trouxe 10 apontamentos, que viraram decisões
do plano v3. Quando as duas revisões couberem, rode primeiro a de design e
depois a de engenharia, sobre o plano já revisado. Cada revisão volta como uma
versão nova do plano.
- Ajuste: repasse a mudança (e as respostas às dúvidas) ao agente com
  `maestri ask`, receba o plano revisado, regrave a nota de plano como v2 e
  volte a esta etapa.
- Cancelar: atualize as notas de status para `Cancelado` e pergunte se quer
  reverter a transição do Jira.
- Aprovado: notas de status em `Aprovado` e notas de plano com a situação
  `aprovado em <data>`.

## Etapa 7 — Implementação

Envie o prompt de IMPLEMENTAÇÃO (template no `delegacao.md`) com o plano
aprovado e as respostas às dúvidas. Respeite as dependências: quem fornece o
contrato começa primeiro; quem só consome um contrato já fechado no plano pode
começar em paralelo. Use `--batch` para os independentes.

Daqui em diante as perguntas interativas (nome da branch, pausa para teste
manual, preview de commit e PR) aparecem **no terminal de cada agente**, no
andar. Diga ao usuário exatamente onde ele vai precisar agir, por exemplo:
"No andar Helpdesk, o agente <codinome> vai pedir o nome da branch e depois
parar para você testar". Não tente responder esses menus por `--raw`: o usuário é a
fonte de verdade sobre o teste manual. Passe as notas de status para
"Implementando" ao enviar o prompt e, quando souber que um agente parou numa
pergunta, para "Aguardando você no terminal" com "Precisa de você? sim — <o quê>".

Enquanto isso, não edite arquivos nos repositórios que os agentes estão
mexendo. Cada relatório final chega pelo ask back (branch, commits, PR,
testes, pendências).

## Acompanhamento

Quando o usuário perguntar como está, ou entre uma etapa e outra:
1. `maestri floor list` — traz o `floor status` que cada agente mantém no
   próprio andar (`working`, `blocked` com o motivo, `review`). Se não
   bastar, `maestri check "<agente>"` mostra a tela dele.
2. Atualize as notas de status no Ground com o que encontrou.
3. Responda:

| Projeto | Fase | Precisa de você? | Branch / PR |
|---|---|---|---|

Publique um resumo de uma linha no Ground para a barra lateral:
`maestri floor status "PI-40: helpdesk-web implementando, nexus em review" --floor "Ground"`.

`floor list` e `check` não interrompem o agente; `maestri ask` interrompe.
Só pergunte direto ao agente quando a tela dele não responder a dúvida.

## Etapa 8 — Publicação

Quando todos os agentes do card terminaram os testes (relatório final com o
PR aberto, e o /qa se o usuário pediu um), pergunte o que fazer com cada PR.
Merge e deploy mudam o que os outros devs e os clientes recebem, por isso
quem decide é sempre o usuário, projeto por projeto.

1. Para cada projeto, monte as opções que **existem nele**, conforme a linha
   "Publicação" do `projetos.md`:
   - **Deixar só o PR** — ninguém mexe em nada; vale para todos.
   - **Merge** — só onde o merge não publica (bruning-rh, nexus, n8n).
   - **Merge + homologação** — só no bruning-rh (cherry-pick para a `deploy`).
   - **Merge + deploy** — publica em produção. No helpdesk-web e no
     bruning-parceiro esta é a única forma de merge, porque o push na
     `main` já dispara o deploy; não ofereça "merge" sozinho neles. No n8n,
     vira **merge + publicação**: quem importa na instância é o usuário, e o
     agente entrega o checklist.
2. Antes de perguntar, confira e mostre: o PR está `MERGEABLE` (`gh pr view
   <n> --json state,mergeable,mergeStateStatus`), o que mais iria junto para
   produção (no bruning-rh, `git log origin/main..origin/deploy`; nos de `main`
   única, nada além do PR) e se há migration no PR.
3. AskUserQuestion com uma pergunta por projeto (no máximo 4), recomendando
   **Deixar só o PR** se ninguém revisou o PR e **Merge + deploy** só quando o
   usuário já indicou que quer publicar. Diga em cada opção o que acontece de
   fato ("o push na `main` dispara o deploy na VPS, com migrations").
4. Execute pela ordem de dependência — quem fornece o contrato publica
   primeiro (o endpoint do nexus antes do proxy do helpdesk-web) — com o
   prompt de PUBLICAÇÃO do `delegacao.md`, para o agente do projeto, que está
   no repositório e conhece o fluxo dele. O agente para antes de qualquer push
   se um teste falhar ou o fast-forward não passar, e devolve o relatório pelo
   ask back.
5. Confira o relatório antes de levar ao Jira: `gh run view <id>` (conclusão,
   branch, SHA) e se `origin/main` é o SHA que ele disse. O status do agente
   é uma afirmação; o GitHub é a prova.
6. **Deploy que falhou.** Com `gh run view <id> --log-failed`, veja onde ele
   quebrou.
   - **Infraestrutura:** timeout de SSH, rsync, runner ou rede, sem nada do
     código. Ofereça **uma** nova tentativa com AskUserQuestion: **Re-executar
     uma vez agora** / **Deixar para depois**. Antes, confirme que a
     `origin/main` ainda está no SHA do run, porque a nova tentativa publica
     aquele SHA. Na confirmação, rode `gh run rerun <id> --failed` e
     acompanhe com `gh run watch <id>`. No PI-43, o SSH estourou o tempo no
     rsync e a segunda tentativa passou.
   - **Teste, build, migration ou falha repetida:** pare e mostre o passo e o
     erro ao usuário. Nova tentativa não resolve. Não tente de novo, não force
     push, e não peça ao agente para corrigir sem a decisão do usuário.

Se o usuário escolher **Deixar só o PR**, a publicação pode voltar depois
("faz o merge e deploy do PR #218"): rode esta etapa de novo só para aquele
projeto e feche com um comentário curto de publicação na Etapa 9.

## Etapa 9 — Fechamento no Jira

Com todos os relatórios em mãos (e o resultado da Etapa 8):

1. Monte o comentário consolidado (markdown):
   ```md
   ## Entrega — <ID>
   ### <projeto> (principal)
   - **O que mudou:** ...
   - **Branch / PR:** ...
   - **Testes:** ...
   ### <projeto> (complementar)
   ...
   ### Pendências / pontos de atenção
   - ...
   ```
   Se a Etapa 8 publicou algo, inclua no mesmo comentário uma seção
   `### Publicação` com o que foi feito em cada projeto: merge (SHA), versão ou
   tag, link do run do deploy, migrations e a conferência em produção.
2. Mostre o preview, confirme e mande o Executor postar (`addCommentToJiraIssue`)
   com o texto do arquivo, junto com a transição do passo 3 se ela já estiver
   decidida.
3. `getTransitionsForJiraIssue` e proponha a transição pelo que aconteceu na
   Etapa 8, confirme e aplique:
   - todos os projetos do card em produção → `Concluído`;
   - algum projeto só com PR, merge ou homologação → `AG. Versão`.
4. **Aviso no Discord.** Só se a transição aplicada foi para `Concluído`.
   Leia `references/discord.md`, ache o Discord de quem abriu o card e monte
   a mensagem. Mostre o preview com o destinatário (nome e ID) e o texto,
   confirme e envie. Isso também vale quando o card chega a `Concluído`
   depois, por uma publicação que tinha ficado só no PR.
5. Marque as notas como `Concluído` e atualize o status do Ground. Não apague
   as notas: elas ficam no fichário como histórico do card, e só saem se o
   usuário pedir.

## Formato do --simular

O usuário lê isso para decidir se a classificação está certa. Uma resposta
de 15 mil caracteres esconde exatamente essa decisão. Entregue, nesta ordem:

1. **Card** — uma linha (chave, título, tipo, status) e, se já entregue, a
   entrega em 2–3 linhas (ver "Card que já foi entregue").
2. **Classificação** — a tabela da Etapa 2, com andar e dependências.
3. **Pergunta** — a que você faria agora, com as opções. Uma só.
4. **O que aconteceria depois** — uma lista curta, uma linha por item:
   - transição proposta (nome e id), ou "nenhuma" se o card já foi entregue;
   - agentes: para cada projeto, "reusar `Global <…>` no andar X" (principal),
     "reusar o agente com role `Projeto: Y`" ou
     "recrutar `--floor X --role 'Projeto: Y' --dir <caminho>`". Se o andar
     ainda estiver em aberto numa pergunta, escreva `--floor "<andar
     escolhido>"`, sem cravar um andar antes da resposta;
   - notas no Ground, fichário `<ID>`: `Status · <ID> · <projeto>` (ao
     disparar o agente) e `Plano · <ID> · <projeto>` (ao receber o plano);
   - ordem de implementação.
5. **Prompt de plano** — só a parte específica do card (subtarefa, contexto
   levantado, dependência/contrato), para cada agente. Não cole o template do
   role, nem o modelo da nota, nem o formato do plano: eles são fixos e estão
   nas referências; repeti-los só alonga a resposta.

Não mostre previews de Etapas 6–9 (aprovação, implementação, publicação,
comentário final) — eles dependem dos planos, que ainda não existem. Se o card já foi
entregue, pare no item 3: os itens 4 e 5 só fazem sentido depois que o
usuário escolher um card novo ou reabrir.

## Salvaguardas

- **Nenhuma escrita no Jira sem preview e confirmação** (card novo, transição,
  comentário). O Jira é lido por QA e pela gestão; um comentário errado vira
  ruído permanente.
- **Nenhuma mensagem no Discord sem preview e confirmação**, e só por DM a
  quem abriu o card: nunca em canal, nunca para outra pessoa.
- **Só o orquestrador escreve no Jira**, pelas mãos do Executor e com a
  confirmação do usuário. Os agentes de projeto são instruídos a pular a etapa
  de comentário do dev-flow — senão o card recebe um comentário por projeto e
  mais o seu.
- **Merge e deploy só pela Etapa 8, com a escolha explícita do usuário para
  aquele projeto.** Fora dela, nem você nem os agentes fazem merge. No
  helpdesk-web e no parceiro, merge na `main` é deploy em produção; no rh, a
  promoção é por cherry-pick e fast-forward; nunca force um push.
- **Não reenvie prompt depois de timeout** — use `check` ou a nota.
- **Não edite arquivos que um agente está mexendo.**
- **Card fora do escopo para na Etapa 1**, com a indicação de onde ele iria.
- **Card entregue não é reorquestrado sem escolha explícita** do usuário.
- **Notas e andares não são apagados** sem pedido explícito do usuário.
- **Tarefa avulsa vai para o Executor**, não para você: commit, push e
  qualquer escrita que ele fizer seguem as mesmas regras (só com o pedido do
  usuário, nunca force push, nada em repositório que um agente está mexendo).
