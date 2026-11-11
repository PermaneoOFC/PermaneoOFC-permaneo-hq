# Permaneo HQ — automações com segurança

## Estado das integrações
- **Supabase**: contas e histórico reais; o modelo só cria registros internos se a ferramenta correspondente for autorizada no catálogo.
- **Trello**: 40 cards espelhados no Supabase; o motor lê o espelho. Sincronização live exige `TRELLO_API_KEY`, `TRELLO_TOKEN` e `HQ_TRELLO_ENABLED=true`.
- **Trello (ações)**: execução de comentários, criação de checklists e mudança de lista somente quando uma proposta estruturada for explicitamente **aprovada** e alguém clicar **Executar no Trello**. Além da chave e token, requer `HQ_TRELLO_WRITES_ENABLED=true`. Não existe exclusão/arquivamento automático.
- **Google Drive**: documentos existentes indexados por links. O Documentarista pode criar registros no banco interno, sem modificar arquivos do Google. Edição remota depende de uma conexão OAuth específica, ainda não implantada.
- **GitHub / Vercel**: atalhos e propostas; nenhuma execução externa automática.

## Automações internas
- Project Manager / Trello & Scrum: ferramenta `create_hq_task`, no máximo 2 tarefas internas por execução.
- Documentarista: `create_hq_document`, no máximo 1 registro interno por execução.
- O fluxo coordenado do painel tem no máximo 2 chamadas de IA por clique. Um fluxo falhado não inicia a próxima etapa.
- Orçamento e limites continuam regidos por `HQ_RUN_BUDGET_USD`, `HQ_USER_DAILY_BUDGET_USD`, `HQ_TEAM_DAILY_BUDGET_USD` e `HQ_MAX_STEPS`.

## Como conectar o Trello ao HQ
1. Em sua própria conta Trello, obtenha uma API Key e token de acesso à sua equipe e ao quadro `https://trello.com/b/IfYN7SWi/demo-day`.
2. Nas **variáveis de ambiente Preview, restritas à branch `backend/ativacao-supabase`** do projeto Vercel, salve `TRELLO_API_KEY` e `TRELLO_TOKEN` como segredos, nunca em `VITE_*`.
3. Configure `HQ_TRELLO_ENABLED=true`. Isso habilita apenas a sincronização manual, sob demanda, pelo painel.
4. Para permitir a execução explícita de ações já aprovadas, configure `HQ_TRELLO_WRITES_ENABLED=true`, exclusivamente na mesma Preview.
5. Faça um novo deploy e verifique o status em Integrações. A ferramenta confirma ao vivo se o card e a lista pertencem ao quadro oficial antes de agir, usa gravação idempotente no banco e não repete automaticamente chamadas falhadas.

**Não envie tokens ou senhas no chat.** Não habilite escrita na Production sem revisar permissões e teste em Preview.

## Propostas de ação do Trello
A ferramenta `propose_action` gera uma proposta, e não escreve no Trello. Os tipos aceitos pelo executor são:
- `service="trello"`, `action="add_comment"`, `proposal={"cardId":"<id de 24 hex>","text":"mensagem"}`
- `action="add_checklist"`, `proposal={"cardId":"<id de 24 hex>","name":"nome"}`
- `action="move_card"`, `proposal={"cardId":"<id de 24 hex>","targetListId":"<id de 24 hex>"}`

O executor recusa propostas incompletas, outras ações, recursos fora do quadro e execuções duplicadas. O modelo tem acesso a IDs dos cards espelhados via `task_board`; nunca deve inventar IDs.

## Google Drive — dependência pendente
A conexão do Google Drive **no ChatGPT** não fornece tokens à aplicação Vercel. Para criar/editar Google Docs pelo HQ será necessária configuração OAuth em um projeto Google Cloud, autorização do usuário e escopos minimizados. Até existir isso, o HQ mostra os links existentes e registros internos sem alegar que alterou arquivos externos.
