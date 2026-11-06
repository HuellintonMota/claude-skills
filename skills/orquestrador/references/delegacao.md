# Delegação: roles e prompts

Os agentes de projeto não veem esta conversa. Tudo o que eles sabem vem do
role (contexto permanente) e do prompt (contexto da tarefa). Escreva os dois
como se fosse para um colega competente que acabou de chegar: o que fazer,
onde parar, como responder.

## Role do Maestri (um por projeto, escopo global)

Nome: `Projeto: <projeto>` (ex.: `Projeto: helpdesk-web`). Crie com
`maestri role create "Projeto: <projeto>" "<prompt>" --scope global` só se
`maestri role list` não mostrar. Prompt (troque `<…>` pelo que está no
`projetos.md`):

```
Você é o agente do projeto <projeto>, repositório em <caminho>. Trabalha sob o
orquestrador, que fica no Ground do Maestri e recebe tarefas do Jira (projeto PI).

Ao receber uma tarefa:
- Rode `maestri list` para ver quem está conectado (o orquestrador aparece ali)
  e quais portais você tem.
- Leia o contexto do projeto antes de planejar: <arquivos de contexto do projeto>.
- Mantenha o status do andar — é por ele que o orquestrador acompanha você:
  `maestri floor status "<ID>: <frase curta>" --state working` ao começar,
  `--state blocked` quando parar esperando o usuário no seu terminal (diga o
  quê: "PI-40: esperando nome da branch") e `--state review` quando o PR
  estiver aberto.
- Navegadores: use os portais do Maestri (skill maestri-portal). O de dev é
  para testar à vontade. O de prod é só para olhar — reproduzir o problema,
  conferir um dado, comparar com o dev; nada que crie, altere ou apague
  registro em produção sem o usuário pedir no seu terminal.
- Responda ao orquestrador pelo ask back: `maestri ask "<orquestrador>" "<resultado>"`.

As notas do card ficam com o orquestrador, no Ground: não crie nota de status.
Nunca escreva no Jira (nem comentário, nem transição): o orquestrador consolida
e posta uma vez só pelo card inteiro. Nunca faça merge nem deploy por conta
própria: isso só acontece quando o orquestrador manda o prompt de PUBLICAÇÃO,
com a escolha do usuário.
```

Arquivos de contexto por projeto: helpdesk-web → `CLAUDE.md`, `AGENTS.md`,
`.claude/rules/` da área e `handoff/STYLE-GUIDE.md`; bruning-rh → `CLAUDE.md`,
`AGENTS.md`, `DESIGN.md`; bruning-parceiro → `CLAUDE.md`, `AGENTS.md`,
`DESIGN.md`; indica-eixo → `CLAUDE.md`, `AGENTS.md`, `README.md`; nexus → `README.md` + `CLAUDE.md` do módulo afetado; n8n →
`README.md` + `PLANO.md` do workflow, se houver.

## Briefing para agente sem role

Os agentes fixos dos andares (`Global Helpdesk`, `Global Conecta`,
`Global Parceiros`, `Global Indica`) não têm role. Os três primeiros começam
em `C:\BruningSistemas_dev`; o `Global Indica` já começa no repositório. No
primeiro prompt de cada card para um deles, coloque antes de tudo:

```
Papel: você é o agente do <projeto> neste card. Trabalhe em <caminho do repo>
(rode `cd "<caminho>"` antes de qualquer comando de git ou teste) e leia
<arquivos de contexto> antes de planejar. Responda ao orquestrador com
`maestri ask "<orquestrador>" "..."`, mantenha o `maestri floor status` do seu
andar como descrito abaixo (é por ele que o orquestrador te acompanha; as
notas do card ficam com ele, no Ground), nunca escreva no Jira e nunca faça
merge.
Navegadores: "<portal dev>" (<url dev>) para testar; "<portal prod>"
(<url prod>) só para olhar — nada que crie, altere ou apague registro em
produção sem o usuário pedir no seu terminal.
```

Nos prompts seguintes do mesmo card não repita — ele ainda tem o contexto.

## Prompt da fase de PLANO

```
Tarefa <ID> — <título do card>
Link: https://bruning.atlassian.net/browse/<ID>
Seu papel neste card: <principal | complementar>
Sua subtarefa: <o que cabe a este projeto, 2–5 linhas>
Outros projetos neste card: <projeto: subtarefa curta> (ou "nenhum")
Dependência: <ex.: "você expõe o endpoint que o helpdesk-web vai consumir" | "nenhuma">

Contexto que já levantei do card (resumo da descrição e dos comentários relevantes):
<resumo — inclua trechos que motivaram a classificação>

Status do andar agora: `maestri floor status "<ID>: planejando" --state working`.

O que fazer AGORA — só planejar:
<se helpdesk-web ou bruning-parceiro>
- Siga o /dev-flow (ou /dev-flow-fix, se for retorno de QA) até a etapa
  "Apresentar planejamento detalhado", inclusive. Pode ler o card no Jira.
<se bruning-rh, nexus ou n8n>
- Leia o card no Jira, o contexto do projeto e o código envolvido, e monte o
  plano no formato abaixo.
- NÃO use AskUserQuestion: o usuário não está olhando o seu terminal agora.
  Coloque toda dúvida na seção "Dúvidas" do plano; ele responde pelo orquestrador.
- NÃO crie branch, NÃO altere arquivos, NÃO escreva no Jira.

Formato do plano:
## Plano — <projeto> (<ID>)
### Arquivos a criar/alterar
### Mudanças por camada
### Regras do projeto que se aplicam
### Contrato com outros projetos   ← obrigatório se houver dependência:
    rota/método, payload de entrada e saída com tipos, formatos (datas, fuso),
    códigos de erro. É isto que o orquestrador compara com o outro lado.
### Testes
### Riscos / pontos de atenção
### Dúvidas

Ao terminar: `maestri floor status "<ID>: plano enviado" --state review` e
responda com
maestri ask "<orquestrador>" "<plano completo>"
```

## Prompt da fase de IMPLEMENTAÇÃO

```
Plano APROVADO — <ID> / <projeto>.
<plano final, incluindo ajustes pedidos pelo usuário>
Respostas às dúvidas: <…>
Contrato fechado com os outros projetos: <…>   (se houver)

`maestri floor status "<ID>: implementando" --state working` e siga:
<se helpdesk-web ou bruning-parceiro>
- Continue o /dev-flow a partir da etapa "Setup da branch" (o plano já está
  aprovado — não reapresente). PULE a etapa "Comentar no Jira": o orquestrador
  faz isso pelo card inteiro.
<se bruning-rh, nexus ou n8n>
- Atualize a branch base (<develop | main>) e crie `feat/<ID>-<slug>` ou
  `fix/<ID>-<slug>` (fix se o card for Bug ou tiver label hotfix). Confirme o
  nome com o usuário no seu terminal.
- Implemente seguindo o CLAUDE.md/AGENTS.md do projeto. Rode os testes que o
  projeto tiver.
- Teste a tela no portal de dev antes de chamar o usuário; use o de prod só
  para comparar com o comportamento atual.
- Pare para o usuário testar manualmente no seu terminal antes do commit.
- Commit em Conventional Commits PT-BR: `tipo(escopo): descrição (<ID>)`.
- Push e PR para <develop | main>. Nunca faça merge.
<sempre>
- Sempre que parar esperando o usuário no seu terminal,
  `maestri floor status "<ID>: esperando <o quê>" --state blocked`. Ao seguir,
  volte para `--state working`.
- Não escreva no Jira.

Ao terminar: `maestri floor status "<ID>: PR aberto" --state review` e
responda com
maestri ask "<orquestrador>" "<relatório: o que mudou, branch, commits, link do PR, testes rodados, pendências>"
```

## Prompt da fase de PUBLICAÇÃO

Mande só depois da escolha do usuário na Etapa 8. Inclua o que você já
conferiu, para o agente não refazer, e só os passos da escolha feita (veja
"Publicação" no `projetos.md`):

```
<ID> — publicação do PR #<n> (<projeto>). O usuário escolheu no orquestrador: <merge | merge + homologação | merge + deploy>.
Estado que conferi: <PR MERGEABLE/CLEAN; o que mais iria junto; migrations: sim/não>.

Passos (siga o fluxo de branches do AGENTS.md/CLAUDE.md do projeto):
1. `git status` limpo; se houver mudança local, pare e me avise.
2. `gh pr merge <n> --merge` (merge commit, sem squash: os SHAs do card ficam iguais).
<homologação — bruning-rh>
3. `git fetch origin develop deploy main` e `git checkout -B deploy origin/deploy`;
   `git cherry-pick <SHAs do card, em ordem>` e só eles; confira com
   `git diff origin/develop -- .` que nada do card ficou de fora e nada de outro
   PR entrou; rode os testes do backend e do frontend; se algo falhar, PARE
   antes do push. `git push origin deploy`.
<deploy — bruning-rh>
4. `git checkout -B main origin/main && git merge --ff-only deploy && git push origin main`.
   Se o --ff-only falhar, PARE: não force nem reancore sem me avisar.
<deploy — helpdesk-web / bruning-parceiro>
3. O merge na `main` já dispara o deploy; não há outro passo.
<deploy — nexus>
3. Confirme com o usuário no seu terminal antes de rodar o `sobe_projeto_vps.bat`;
   o reinício no servidor fica com ele, a menos que peça.
<merge + publicação — n8n>
3. Nada a rodar: monte o checklist de importação (workflow, credenciais, campos
   do nó Config, se precisa ativar) para o usuário fazer na instância.
<sempre>
- Se o auto mode bloquear um comando desta lista (o `gh pr merge` ou um push),
  não peça ao usuário para rodar: mande
  `maestri ask "<orquestrador>" "BLOQUEADO: <comando exato, com caminho absoluto: git -C <repo> …>"`
  e espere. Eu rodo no shell "Git Manager" e respondo com a saída; aí você
  confere (`git fetch` + `git log`/`git status`) e segue. Use
  `--state blocked` enquanto espera.
<sempre que houver deploy>
- Acompanhe o workflow de deploy com `gh run watch` até o fim. Se falhar,
  traga o passo e o erro e não tente de novo por conta própria.
- Se passar, abra o portal de prod só para ver se o app carrega — nada de
  login com escrita, lançamento ou cadastro em produção.
- Volte para a branch base atualizada (`git checkout <develop | main> && git pull --ff-only`).

`maestri floor status "<ID>: publicando" --state working`; ao fim,
`"<ID>: <em produção | em homologação | merge feito>" --state review`.
Não escreva no Jira.

Ao terminar, responda com
maestri ask "<orquestrador>" "<relatório: SHA do merge, SHAs promovidos, testes, link e resultado do run, versão/tag, conferência em prod, branch atual>"
```

### Comando bloqueado: o shell "Git Manager"

O auto mode costuma bloquear o `gh pr merge` e o push na `main` (que dispara
o deploy). Para o usuário não precisar digitá-los, há no canvas um shell
PowerShell chamado **Git Manager**, ligado ao orquestrador (confira em
"Connected agents" no `maestri list`). Quando um agente pedir
`BLOQUEADO: <comando>`:

1. Confira que o comando é um passo da publicação que o usuário escolheu na
   Etapa 8, para este PR. Se não for, recuse e avise o usuário. O shell não
   muda quem decide.
2. Recuse force push (`--force`, `-f`, `--force-with-lease`), `reset --hard`,
   apagar branch remota ou qualquer coisa fora da lista do prompt.
3. Rode com o caminho absoluto:
   `maestri ask "Git Manager" --raw "git -C <repo> push origin main\n"`. Ele é
   PowerShell 5.1: nada de `&&`; encadeie com `;`.
4. Leia a saída com `maestri check "Git Manager"`. Push e merge podem demorar
   mais que o retorno do `--raw`, então espere o prompt
   `PS C:\BruningSistemas_dev>` voltar.
5. Devolva a saída ao agente com
   `maestri ask "<agente>" "Rodei no Git Manager: <saída, ex.: f6089049..6d3e4fc0 main -> main>. Confira e siga."`.
   Se deu erro, mande o erro e não tente de novo por conta própria.

Se o Git Manager não estiver ligado, peça ao usuário para rodar o comando no
terminal do agente com `!`, como antes.

## Ajustes e mensagens avulsas

Para repassar um ajuste de plano ou uma resposta, mande só o delta com
`maestri ask "<agente>" "Ajuste no plano de <ID>: … Reenvie o plano revisado
pelo ask back."` — não reenvie o prompt inteiro, o agente ainda tem o contexto.
