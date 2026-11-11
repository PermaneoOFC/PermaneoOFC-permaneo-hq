# Permaneo HQ — automações com segurança

## Estado das integrações
- **Supabase**: contas e histórico reais; o modelo só cria registros internos se a ferramenta correspondente for autorizada no catálogo.
- **Trello**: 40 cards espelhados no Supabase; o motor lê o espelho. Sincronização live exige `TRELLO_API_KEY`, `TRELLO_TOKEN` e `HQ_TRELLO_ENABLED=true`.
- **Trello (ações)**: execução de comentários, criação de checklists e mudança de lista somente quando uma proposta estruturada for explicitamente **aprovada** e alguém clicar **Executar no Trello**. Além da chave e token, requer `HQ_TRELLO_WRITES_ENABLED=true`. Não existe exclusão/arquivamento automático.
- **Google Drive**: documentos existentes indexados por links. O Documentarista pode criar registros internos. OAuth com PKCE e criptografia foi implementado, mas ainda requer configuração do Google Cloud e consentimento do usuário. Depois do OAuth, propostas aprovadas podem criar novos Google Docs; arquivos antigos não são automaticamente autorizados.
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

## Google Drive — como ativar OAuth com permissão limitada
A conexão do Google Drive **no ChatGPT** não fornece tokens à aplicação Vercel. O fluxo de autorização seguro já está codado, mas o usuário deve criar credenciais próprias do Google Cloud.

1. No Google Cloud Console, crie um projeto e habilite **Google Drive API** e **Google Docs API**.
2. Configure a tela de consentimento OAuth e crie um cliente OAuth do tipo **Web application**. Em teste, adicione a conta Google autorizada à lista de usuários de teste.
3. Registre a URL de redirecionamento exata do app: `https://permaneo-hq-git-backend-ativacao-supabase-permaneo.vercel.app/api/google/callback`. Ela precisa corresponder a `GOOGLE_REDIRECT_URI`.
4. Salve na Vercel, somente na Preview da branch `backend/ativacao-supabase`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` e `GOOGLE_TOKEN_ENCRYPTION_KEY` (32 bytes aleatórios codificados em base64). Os segredos nunca devem ser expostos ao navegador.
5. Faça redeploy, acesse Integrações e clique **Autorizar meu Google Drive**. Cada usuário concede permissão para sua conta. O token de refresh fica criptografado no Supabase.
6. Depois da conexão, um agente pode propor `service=google_drive`, `action=create_doc`, com `proposal` JSON `{"title":"Título","content":"Conteúdo"}`. O solicitante aprova, então clica **Criar documento aprovado**. A ação cria um novo documento no Drive do proprietário, sem exclusões automáticas.

**Limitação importante:** `drive.file` autoriza apenas arquivos criados ou abertos pelo aplicativo. Documentos antigos que já estão indexados no HQ não podem ser editados automaticamente. Para isso seria necessário selecioná-los e conceder acesso explícito (por exemplo, com Google Picker), funcionalidade ainda não adicionada. Não conceder escopo amplo de Drive sem revisão de segurança.


## GitHub — agentes de engenharia
- Leitura: ferramentas \`github_repository\` consultam apenas o repositório \`PermaneoOFC/PermaneoOFC-permaneo-hq\`. Se público, não precisa de token; para privado, configure \`GITHUB_TOKEN\` na Preview com acesso de leitura ao repositório.
- Escrita: \`GITHUB_TOKEN\` deve ter permissão **Issues: read/write** apenas para esse repositório; para habilitar, configure \`HQ_GITHUB_WRITES_ENABLED=true\` na Preview. Os agentes só podem propor \`service=github\`, \`action=create_issue\`, com JSON \`{"title":"Título","body":"Descrição"}\`. Depois, o humano aprova e clica em **Criar issue aprovada**; o banco impede reexecução da mesma proposta.
- Não há push, alteração de código, PR ou merge automático.

## Vercel — DevOps e coordenação
- Configure \`VERCEL_API_TOKEN\` na Preview com acesso à equipe Permaneo. O conector valida o projeto \`permaneo-hq\` e consulta o deploy mais recente.
- Para solicitar **apenas novo deploy da branch Preview**, configure separadamente \`HQ_VERCEL_WRITES_ENABLED=true\`; o DevOps pode propor \`service=vercel\`, \`action=redeploy_preview\`, com \`{"branch":"backend/ativacao-supabase","reason":"Motivo do deploy"}\`. Cada execução requer aprovação, clique explícito e é registrada apenas uma vez.
- Produção, rollback e alterações de variáveis de ambiente não são expostos aos agentes.

## LinkedIn — Marketing
- O agente Marketing pode redigir publicações e registrar propostas \`service=linkedin\`, \`action=publish_post\`, com \`{"text":"Conteúdo revisável"}\` **para revisão interna**.
- **Publicação não implementada nem conectada**. Para postar em nome da página Permaneo, é necessário um app LinkedIn Developers autorizado para gestão de página com escopos aprovados, credenciais OAuth da aplicação e autorização de administrador da página. O conector LinkedIn usado neste ChatGPT não fornece esse acesso à aplicação Vercel.
- Nunca afirmar que uma publicação foi enviada, programada ou publicada apenas porque a proposta foi aprovada.

## Central de Conexões
- A página \`/integracoes\` consulta \`/api/integrations\` autenticado e mostra quais serviços foram verificados. Links não significam permissões de edição.
- Nunca coloque tokens em nomes \`VITE_*\`, no GitHub, ou no chat. Use variáveis de servidor restritas à Preview; ative escrita separadamente de leitura. Depois de adicionar as credenciais, faça redeploy e execute uma operação pequena de teste antes de autorizar alterações reais.
- Status do Google Drive significa autorização \`drive.file\` (escopo limitado), não acesso universal a todos os arquivos.
