# Aviso no Discord a quem abriu o card

> Modelo versionado. O `setup` copia este arquivo para `references/discord.md`,
> que fica fora do git: preencha a tabela "Quem é quem" só lá, porque ela tem
> e-mails e IDs de pessoas.

Quando o card vai para `Concluído` na Etapa 9, quem abriu o card (o
`reporter` no Jira) recebe uma mensagem privada no Discord. Assim fica sabendo
que o pedido está em produção sem ter de olhar o Jira.

## Como enviar

O envio usa o subfluxo do n8n `Discord - Enviar mensagem (subfluxo)`
(`n8n/discord-enviar-mensagem-subfluxo`, workflow `HrV4IGdj1CkR3HSA`). Ele é
compartilhado com outros fluxos: só o chame, nunca o altere.

- URL: `POST $ORQUESTRADOR_DISCORD_WEBHOOK`, lida de `~/.claude/orquestrador.env`
  (fora do git; o `setup` do repositório pergunta a URL ao instalar). Se o
  arquivo ou a variável não existirem, **pule o aviso** e diga ao usuário que
  falta configurar o webhook; não procure a URL em outro lugar.
- Corpo da DM: `{"server_id": "896855669959974992", "user_id": "<id do Discord>", "mensagem": "<texto>"}`
- **Não ponha `channel_id`, nem vazio.** O subfluxo escolhe o ramo pela
  existência do campo, e com ele a mensagem iria para um canal, não para a DM.
- **Não ponha `tag_pergunta_aguardando_resposta`.** Esse campo faz o subfluxo
  esperar uma resposta da pessoa.

Monte o JSON com Python e envie o arquivo. Isso evita problemas de aspas e de
acento:

```bash
python -c "import json,sys; json.dump({'server_id':'896855669959974992','user_id':sys.argv[1],'mensagem':open(sys.argv[2],encoding='utf-8').read()}, open(sys.argv[3],'w',encoding='utf-8'), ensure_ascii=False)" "<user_id>" "<scratchpad>/discord-<ID>.txt" "<scratchpad>/discord-<ID>.json"
. ~/.claude/orquestrador.env && [ -n "$ORQUESTRADOR_DISCORD_WEBHOOK" ]
curl -sS -w "\nHTTP %{http_code}\n" -X POST "$ORQUESTRADOR_DISCORD_WEBHOOK" -H "Content-Type: application/json; charset=utf-8" --data-binary @"<scratchpad>/discord-<ID>.json"
```

Um HTTP 200 só quer dizer que o n8n recebeu o pedido; ele não confirma que a
DM chegou. Se a pessoa disser que não recebeu, olhe as execuções do workflow
no n8n. Os erros "Invalid Recipient" e "Cannot send messages to this user"
querem dizer que o ID está errado ou que a pessoa bloqueia DMs. Nesses casos,
não reenvie.

## Mensagem

O texto é curto, em linguagem para quem pediu, não para dev. Não inclua SHA,
nome de branch, nem nome de arquivo. O Discord aceita no máximo 2000
caracteres por mensagem.

```
✅ O card **<ID> · <título sem o prefixo [Projeto]>**, que você abriu, foi concluído e já está em produção.

<1 a 3 linhas sobre o que muda para quem usa o sistema>

Detalhes: https://bruning.atlassian.net/browse/<ID>
```

## Quem é quem

Pegue o `reporter` do card com `getJiraIssue`: `displayName` e `accountId`.
Procure pelo `accountId` na tabela abaixo. Os cards que chegam pelo Helpdesk
trazem no fim da descrição uma linha `Aberto por: <nome> <e-mail> · … · via
Helpdesk`. Nesses cards, a pessoa que pediu é quem está nessa linha, que pode
ser diferente do `reporter`. Procure então pelo e-mail na tabela.

| Nome | E-mail | Jira accountId | Discord user_id |
|---|---|---|---|

Se a pessoa não estiver na tabela, pergunte o ID ao usuário. No Discord, o ID
se pega em Modo desenvolvedor → clique direito na pessoa → Copiar ID do
usuário. Também dá para escolher pular o aviso. Com o ID em mãos, acrescente
uma linha na tabela, para não perguntar de novo. Não chute o ID pelo nome:
uma DM para a pessoa errada é pior do que nenhuma DM.

## Quando não enviar

- Quando o card foi para `AG. Versão` (o pedido ainda não chegou a quem usa)
  ou para `Descartado`.
- Quando quem abriu o card é o próprio usuário, porque ele já sabe.
- Quando o card foi tocado sem card no Jira ("Seguir sem card").
