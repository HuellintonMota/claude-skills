# Mapa dos projetos

Fonte de verdade para classificar um card e para montar `--dir`, `--floor` e
o fluxo de cada agente. Se algo aqui ficar desatualizado (caminho, branch,
label nova), corrija este arquivo — é o único lugar onde isso mora.

## Regras de classificação (nesta ordem)

1. **Chave do card**
   - `PI-n` → segue.
   - `EIXO-n` → **fora do escopo**: é o Eixo Web (`job-web`). Pare e diga isso,
     mesmo que o título cite `[PARCEIROS]` ou `[CRM WEB]` — nesses cards o
     "parceiro" é um cliente do Eixo, não o Portal do Parceiro.
   - `JOB-n` → **fora do escopo**: ERP JOB Desktop (`job-retaguarda`,
     `paf-nfce`, `safe-bruning`).
   - Fora do escopo vale também para **complementares**: se um card PI
     depende de mudança no job-web ou no desktop, não vire agente para eles —
     registre como dependência externa ("precisa de um card EIXO/JOB") e
     siga só com os projetos que têm andar.
   - `PDP-n` → não é mais usado; se aparecer um antigo, trate como PI do
     bruning-parceiro.
2. **Prefixo do título + label → projeto principal**

   | Prefixo no título | Label | Projeto principal |
   |---|---|---|
   | `[Helpdesk]` | `helpdesk` | helpdesk-web |
   | `[Conecta]` | `conecta` | bruning-rh (Conecta é o nome do produto) |
   | `[Portal Parceiros]` | `portal-parceiro` / `portal-parceiros` | bruning-parceiro |
   | `[Indica Eixo]` | `indica-eixo` | indica-eixo (ainda não visto; vale se aparecer) |
   | `[Nexus]` | `nexus` | nexus (ainda não visto; vale se aparecer) |
   | `[n8n]` | `n8n` | n8n (ainda não visto; vale se aparecer) |

   Ignore labels de origem (`via-helpdesk`, `via-discord`) e de tema
   (`hotfix`, `melhoria`, `frigobar`, `relatorios`…) para a classificação —
   `hotfix` é útil depois, para o agente escolher `fix/`.
3. **Sem prefixo e sem label, ou os dois divergem** (ex.: PI-1 a PI-7, mais
   antigos): classifique pelas palavras características abaixo, mostre a
   evidência e **pergunte** qual é o principal.
4. **Complementares → pelo conteúdo** (descrição + comentários). Procure sempre,
   mesmo com principal óbvio. Casos reais:
   - PI-19 `[Helpdesk] Erro ao fazer Backup` → a correção foi no **nexus**
     (quem gera o dump do cliente).
   - PI-14 `[Helpdesk] Opção de tema escuro` → também mexeu no
     **bruning-parceiro**, que embute o CRM do helpdesk-web.

   Sinais típicos:
   - **nexus**: backup/dump de cliente, coleta do Zendesk, Bruninho IA,
     SEFAZ/rejeição NF-e, ponto/banco de horas via Secullum, kanban
     N2/implantação, transcrição de áudio.
   - **Painel TV / dashboards de suporte**: a tela hoje é do **helpdesk-web**
     (`/suporte/painel-tv`, substituiu o `/dashboard_painel_suporte` do nexus),
     mas os dados vêm do nexus (`GET /api/dashboard/tickets/consolidado`, do
     `api_monitoramento_zendesk`, via `NexusController`). Problema de **dado**
     (parou de atualizar, número errado, ticket faltando) → causa provável no
     nexus; problema de **tela** (layout, filtro, cor) → helpdesk-web.
     Problema de dado → recomende **só o nexus** (no andar Helpdesk, que é
     onde o painel vive), e o helpdesk-web entra só se o nexus mostrar que o
     endpoint devolve dado atualizado. O card, se for criado, continua
     `[Helpdesk]` com a label `helpdesk`, porque é o sistema que o usuário vê.
   - **n8n**: workflow, automação, webhook, cron disparado, mensagem no
     Discord/WhatsApp automática, card criado sozinho no Jira, Zendesk→Jira,
     régua de agendamentos, Super Bot.
   - **helpdesk-web** como complementar: CRM embutido, SSO a partir do parceiro,
     dados de licença/cliente que o portal lê.
   - **bruning-parceiro** como complementar: algo que o parceiro vê dentro do
     portal vindo do helpdesk (CRM, "Meus chamados").

   Cada complementar entra com evidência (trecho/comentário) e confiança;
   o usuário confirma.

## Navegadores (portais do Maestri)

Cada agente Global tem dois portais ligados a ele: um de **dev** (testar à
vontade) e um de **prod** (só olhar: reproduzir o problema, conferir um dado,
comparar com o dev — nada que crie, altere ou apague registro sem o usuário
pedir). Os nomes estão em cada projeto abaixo; passe-os no briefing.

- Os portais pertencem ao agente Global. Um complementar recrutado no andar
  não os recebe: se ele precisar testar tela, peça ao usuário para ligá-lo ao
  portal no app, ou deixe o teste de tela com o Global do andar.
- Portas de dev, uma por projeto, para os três subirem juntos: bruning-rh
  com o Nuxt em 3000 e a API em 8000 (`API_URI` do `frontend/.env`);
  helpdesk-web em **8010**, bruning-parceiro em **8020** e indica-eixo em
  **8030** (`SERVER_PORT` no
  `.env` de cada um, que o `php artisan serve` lê). Se um agente subir o
  servidor com `--port` fixo ou achar outra coisa na porta, ele deve avisar,
  não trocar de porta por conta própria — o portal aponta para essa.

## helpdesk-web
- **Caminho:** `C:\BruningSistemas_dev\helpdesk-web\helpdesk-web` (pasta aninhada — a de cima não é o repo)
- **Andar:** `Helpdesk` — agente fixo `Global Helpdesk`
- **Navegadores:** `Helpdesk Dev` (http://localhost:8010) e `Helpdesk Prod` (https://helpdesk.bruningsistemas.com.br)
- **Stack:** Laravel 12 + Sanctum, Vue 3 + Vite + Pinia em `resources/js/`. 8 conexões MySQL (`mysql_helpdesk` em UTC; `mysql_999`, `mysql_job`, `mysql_interip` em horário de Brasília).
- **Branch base:** `main`. Branches `feat/PI-n-slug` / `fix/PI-n-slug`.
- **Publicação:** só existe a `main`, e o push nela dispara o `deploy-vps.yml` (Actions, publica na VPS e roda migrations). Merge = deploy; não há homologação. Opções: **só o PR** ou **merge + deploy**.
- **Fluxo:** `/dev-flow` (novo) ou `/dev-flow-fix` (retorno de QA: subtarefas de QA abertas ou comentário "voltou do QA"). Outras skills úteis no plano: `cenarios-gherkin`, `helpdesk-desktop` (regra de negócio do legado VB), `impact-analysis`.
- **Contexto:** `CLAUDE.md`, `AGENTS.md`, `.claude/rules/*.md`, `handoff/STYLE-GUIDE.md`.
- **Palavras:** licenças, suporte, painel TV, chamados, meus chamados, backups de clientes, acesso temporário, adicionais Eixo Web, CRM, negociação, leads, cupons, trial, Começar, NPS, CS, cliente híbrido, CEO, inadimplência, vendas, parcerias, Clicksign, LTV, dashboard.
- **Relações:** faz proxy para o nexus (trait `ProxiesUpstream`) e o Bruninho; recebe do n8n o disparo do cron (`helpdesk-ativador-do-cron`) e o webhook de backups (`helpdesk-backups-de-clientes`); lê o banco do Eixo (`mysql_job`); dá SSO ao parceiro (`ParceiroSsoController`).
- **Cuidado:** não confundir com `C:\BruningSistemas_dev\helpdesk` (desktop VB legado, fora do escopo — só consultado pela skill `helpdesk-desktop`).

## bruning-rh (Conecta)
- **Caminho:** `C:\BruningSistemas_dev\bruning-rh` (`backend/` Laravel, `frontend/` Nuxt)
- **Andar:** `Conecta` — agente fixo `Global Conecta`
- **Navegadores:** `Conecta Dev` (http://localhost:3000) e `Conecta Prod` (https://rh.bruningsistemas.com.br)
- **Stack:** Laravel 12 + Sanctum + spatie/permission; Nuxt 3 SPA + Vue 3 + TypeScript + Bootstrap 5/Tabler + lib proprietária Logos.
- **Branch base:** **`develop`**. PR volta para `develop`, nunca para `main` (`develop` → cherry-pick → `deploy` → fast-forward → `main`, ver `AGENTS.md`).
- **Publicação:** todas as opções existem.
  - **Merge:** `gh pr merge --merge` na `develop`, sem publicar nada.
  - **Homologação:** cherry-pick só dos commits do card para a `deploy`, com os testes antes do push. A `deploy` não publica sozinha.
  - **Deploy:** depois da homologação, `merge --ff-only deploy` na `main` e push. O push dispara o "Deploy produção (VPS)" (Actions), que roda migrations e cria a tag da versão.
  - Antes, confira `git log origin/main..origin/deploy`: o que já estiver na `deploy` vai junto para produção.
  - Exemplo: o PI-36 foi publicado assim na v0.3.8.
- **Fluxo:** padrão (não tem dev-flow).
- **Contexto:** `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `A11Y.md`, `EXAMPLES.md`.
- **Palavras:** colaborador, avaliação de desempenho, experiência/marco, 1:1, combinados, PDI, feedback, reconhecimento, gamificação, celebração, clima, humor, pesquisa, NPS interno, holerite, férias, atestado, certificado, admissão, recrutamento, organograma, treinamentos, NR-01, ouvidoria, indicações, frigobar/consumo/competência, carreira, presença (Secullum), patrimônio, relatórios.
- **Relações:** o n8n dispara o agendador (`rh-agendador`) e cuida de `rh-controle-de-patrimonios`; integra com a Secullum (o nexus também).

## bruning-parceiro (Portal do Parceiro)
- **Caminho:** `C:\BruningSistemas_dev\bruning-parceiro`
- **Andar:** `Portal-Parceiros` — agente fixo `Global Parceiros`
- **Navegadores:** `Parceiro Dev` (http://localhost:8020) e `Parceiro Prod` (https://parceiro.bruningsistemas.com.br)
- **Stack:** Laravel 11 + Sanctum (Bearer, sem sessão/CSRF), Vue 3 + Pinia + Bootstrap 5/Tabler, Vitest.
- **Branch base:** `main`. **Merge na `main` = deploy em produção.**
- **Publicação:** igual ao helpdesk-web. O push na `main` dispara o `deploy.yml` (Actions, VPS e migrations). Opções: **só o PR** ou **merge + deploy**. Chave nova no `.env` da VPS só vale depois de recachear a config (ver `CLAUDE.md`): se o PR depende de uma, avise antes do deploy.
- **Fluxo:** `/dev-flow` ou `/dev-flow-fix`. Também `qa-scan`, `origem-bug`.
- **Contexto:** `CLAUDE.md` (longo e detalhado), `AGENTS.md`, `DESIGN.md`.
- **Palavras:** parceiro, revenda, clientes do parceiro, plano web, tenant Eixo, cliente híbrido, churn, inativação, reativados, cupom, meta semanal, crédito, mural, Downloads & Links, lembretes, sino, WhatsApp cross-sell, contratação, cobrança, gerente de contas, comissão, extrato financeiro, "Meus chamados".
- **Relações:** SSO com o BruningDesk e com o helpdesk-web (embute o CRM dele); cria tenant na API do Eixo; avisa no Discord.

## indica-eixo (Indica Eixo)
- **Caminho:** `C:\BruningSistemas_dev\indica-eixo` (monorepo Laravel + Inertia, sem API separada)
- **Andar:** `Indica-Eixo` — agente fixo `Global Indica` (roda direto no repositório)
- **Navegadores:** `Indica Dev` (http://localhost:8030). Ainda não há produção.
- **Stack:** Laravel 13 + Inertia v3 + Vue 3 + Tailwind v4 + Vite 8; MySQL também nos testes (`indicacao_marketing` / `indicacao_marketing_test`, nada de SQLite); Laravel Boost como MCP (`.mcp.json`).
- **Branch base:** `main` (a `indica-eixo` remota está no mesmo commit). Branches `feat/PI-n-slug` / `fix/PI-n-slug`.
- **Publicação:** ainda não há deploy (sem Actions nem servidor). Opções: **só o PR** ou **merge**. Quando houver produção, atualize aqui.
- **Fluxo:** padrão. Formatação com Pint; testes com `composer test`.
- **Dev:** `php artisan serve --port=8030` com os assets do build (não precisa do Vite). Usuários do seed: `admin@`, `marketing@`, `sucesso@`, `comercial@`, `financeiro@` e `demo@indicacao.test` (cliente). O Boost só sobe depois de existirem `vendor/` e `.env`; se a sessão abriu antes, reconecte pelo `/mcp`.
- **Contexto:** `CLAUDE.md`, `AGENTS.md`, `README.md` (regras de negócio) e as skills em `.claude/skills/`.
- **Palavras:** Indica Eixo, indicar empresa/oficina, indicação de cliente, contador ou parceiro, campanha de indicação, recompensa, PIX de indicação, desconto na mensalidade, funil de indicação, regulamento, CAC/MRR das indicações.
- **Cuidado:** "indicações" no Conecta (bruning-rh) é a indicação de candidatos pelos colaboradores, outro sistema. Indicação de **empresa/cliente com recompensa** é aqui.
- **Relações:** nenhuma integração ainda.

## nexus (complementar)
- **Caminho:** `C:\BruningSistemas_dev\nexus` (monorepo Python/Flask)
- **Andar:** o do principal do card. Se o nexus for o principal (ele não tem andar próprio), pergunte em qual andar trabalhar, sugerindo o do sistema que o usuário enxerga (ex.: painel de suporte → `Helpdesk`, ponto/Secullum → `Conecta`).
- **Módulos:** `api_monitoramento_zendesk` (porta 5000: Zendesk, Secullum, SEFAZ/TecnoSpeed, Whisper, backups), `api_agente_suporte` (5200: Bruninho IA), `dashboard_monitoramento_zendesk` (5100), `supervisor_monitoramento_zendesk` (bot Discord), `nexus_audio_whatsapp` e `nexus_downloader` (extensões de navegador).
- **Branch base:** `main`. Branches `fix/PI-n-slug`.
- **Publicação:** o merge na `main` não publica, porque não há Actions. O deploy é manual: o `sobe_projeto_vps.bat` envia por scp para a VPS (`/opt/apps/...`) e o serviço é reiniciado no servidor. Não há homologação. Opções: **só o PR**, **merge** ou **merge + deploy**. O agente só roda o script depois de confirmar com o usuário no terminal; o reinício fica com o usuário.
- **Fluxo:** padrão.
- **Contexto:** `README.md` da raiz + o `CLAUDE.md` **do módulo** afetado (cada módulo principal tem o seu).
- **Relações:** recebe proxy do helpdesk-web; chama webhooks do n8n; lê o banco `helpdesk_bruning`.

## n8n (complementar)
- **Caminho:** `C:\BruningSistemas_dev\n8n` (um diretório por workflow com `workflow.json`, script `exportar.mjs`)
- **Andar:** o do principal do card. Se o n8n for o principal, pergunte o andar, como no nexus.
- **Instância:** a instância própria da Bruning (o endereço fica fora deste repositório).
- **Branch base:** `main`.
- **Publicação:** o merge só atualiza o repositório. "Publicar" é importar o `workflow.json` na instância (Import from File) e preencher credenciais e o nó `Config`, e quem faz isso é o usuário, pela interface. Opções: **só o PR**, **merge** ou **merge + publicação**; na última, o agente entrega o checklist de importação.
- **Fluxo:** padrão. Regras do `README.md`: nomes em kebab-case, `dry_run`, tags por sistema, **nada de segredo no JSON**. Alterar o JSON no repo não publica nada; ativar ou importar na instância só com OK explícito do usuário.
- **Palavras:** ver sinais de n8n acima; nomes de pasta (`bruningdesk-*`, `helpdesk-*`, `jira-*`, `rh-*`, `discord-*`) ajudam a achar o workflow.
