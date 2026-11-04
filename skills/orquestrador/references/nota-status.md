# Notas do card (Ground)

Todas as notas de um card ficam no **Ground**, no fichário `<ID>`, junto do
orquestrador. Assim o usuário acompanha todos os projetos do card num lugar
só, sem trocar de andar. Ligações nota↔agente só valem dentro de um andar, e
os agentes ficam nos andares dos projetos, então **o agente não mexe nessas
notas**: quem cria e atualiza é sempre o orquestrador. O agente informa o
andamento pelo `maestri floor status` do próprio andar, que o orquestrador lê
com `maestri floor list`.

Duas notas por projeto do card:

| Nota | Nome | Criada quando |
|---|---|---|
| Status | `Status · <ID> · <projeto>` | ao disparar o agente (Etapa 5, junto com o prompt de plano) |
| Plano | `Plano · <ID> · <projeto>` | ao receber o plano do agente (Etapa 6) |

Sem card, use o apelido no lugar do ID. Card retomado: se a nota já existe,
reuse e edite; não crie outra. No fim do card as notas ficam; só apague se o
usuário pedir.

## Como gravar

Rode do terminal do orquestrador (ele está no Ground, então a nota nasce lá):

```bash
maestri note create "$(cat <arquivo>)" --name "Status · PI-40 · helpdesk-web" --stack "PI-40"
```

Monte o conteúdo num arquivo do scratchpad e passe com `$(cat …)`: o texto
tem aspas, crases e quebras de linha que estragam um argumento escrito à mão.
O `maestri` decodifica `\n` e `\t` no conteúdo, então **dobre as barras**
antes (`sed 's/\\/\\\\/g'`) quando o texto tiver caminhos do Windows — senão
`C:\BruningSistemas_dev\nexus` vira uma quebra de linha no meio do caminho.

O `--name` fixa o nome; sem ele, a nota passa a se chamar pela primeira linha.

## Nota de status

```md
# <ID> · <projeto>
**Agente:** <nome> (andar <andar>)   **Papel:** <principal | complementar>
**Fase:** Planejando   **Atualizado:** <AAAA-MM-DD HH:MM>
**Precisa de você?** não

## Subtarefa
<o que cabe a este projeto>

## Progresso
- [ ] Prompt de plano enviado
- [ ] Plano recebido (nota `Plano · <ID> · <projeto>`)
- [ ] Plano aprovado
- [ ] Implementação enviada
- [ ] Branch criada
- [ ] Teste manual do usuário
- [ ] PR aberto
- [ ] Publicação: <só PR | merge | homologação | deploy>
- [ ] Comentário no Jira

## Branch / PR
—

## Dúvidas / bloqueios
—
```

Atualize com `maestri note edit` (trecho exato → trecho novo), nunca `write`:
assim nada do que já está na nota se perde. Troque sempre a linha
**Atualizado** junto com a fase e marque o item do Progresso.

### Fases e de onde o orquestrador tira cada uma

| Fase | Quando | Como o orquestrador sabe |
|---|---|---|
| Aguardando | agente disparado, esperando dependência | ele mesmo decidiu a ordem |
| Planejando | prompt de plano enviado | ele mesmo enviou |
| Plano enviado | plano chegou pelo ask back | a mensagem do agente |
| Aprovado | usuário aprovou na Etapa 6 | a resposta do usuário |
| Implementando | prompt de implementação enviado | ele mesmo enviou |
| Aguardando você no terminal | agente parou numa pergunta (branch, teste manual, commit, PR) — junto com "Precisa de você? sim — <o quê>" | `floor status` do andar em `blocked`, ou `maestri check` |
| Bloqueado | agente não consegue seguir sem decisão/informação | ask back do agente ou `blocked` sem pergunta na tela |
| Publicando | usuário escolheu merge, homologação ou deploy na Etapa 8 | a resposta do usuário + o prompt que ele mesmo enviou |
| Concluído | publicação decidida (inclusive "só o PR") e comentário postado no Jira | ask back + Etapas 8 e 9 |
| Cancelado | usuário cancelou | a resposta do usuário |

Quando o usuário pergunta "como está", atualize as notas **antes** de
responder: `maestri floor list` traz o status de cada andar; se ele não
bastar, `maestri check "<agente>"` mostra a tela do agente sem interromper.

## Nota de plano

Grave o plano como chegou, sem resumir — é ali que o usuário lê o plano com
calma, com a formatação de markdown, em vez de rolar o terminal.

```md
# Plano · <ID> · <projeto> — v1
**Recebido:** <AAAA-MM-DD HH:MM>   **Agente:** <nome>
**Situação:** aguardando aprovação

<plano completo, como o agente mandou>
```

Plano revisado (ajuste da Etapa 6): substitua o conteúdo com `maestri note
write`, subindo a versão no título (`— v2`) e pondo logo abaixo uma linha
`**Mudou na v2:** <o que mudou>`. Aqui `write` é o certo: a versão nova
substitui a anterior, e manter as duas lado a lado confunde qual vale.
Depois da aprovação, troque a **Situação** para `aprovado em <data>`.
