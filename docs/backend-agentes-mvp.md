# Permaneo HQ — Backend independente e 14 agentes reais

## Estado de referência

O repositório original tem React + TanStack Start, Supabase client, migrations SQL, 14 agentes definidos em `drizzle/migrations/0000_migration.sql`, solicitações `agent_requests`, quadro Trello em leitura `src/lib/trello.functions.ts`, e botão de execução indisponível. **A versão visual mais nova (Virtual Floor 5.0) está na pasta local, não necessariamente no GitHub.** Preserve e implemente nela; nunca sobrescreva os assets/cenários e rotas recém-aprovados.

A produção atual usa `VITE_HQ_DEMO_MODE=true`: **leitura e visualização apenas**. Não habilitar chamadas de IA pagas ou dados privados para visitantes públicos por meio do modo demo.

## Entrega desejada

Cinco integrantes autorizados conseguem entrar individualmente; selecionar qualquer um dos 14 agentes, enviar tarefa, obter resposta IA real com especialidade, acompanhar streaming/estado/resultado, consultar histórico, recuperar trabalho após refresh e solicitar aprovação de ações externas. Todos os 14 são perfis do mesmo motor, NÃO 14 servidores independentes.

### Papéis reais (slugs já existentes)

| Sala | Agentes |
|---|---|
| Coordenação | `project-manager`, `trello-scrum` |
| Engenharia | `frontend`, `backend`, `devops`, `qa-seguranca` |
| Estúdio Criativo | `ui-ux`, `marketing`, `pitch` |
| Biblioteca | `documentarista`, `pesquisa-dados`, `educacional` |
| Negócios | `negocios`, `financeiro` |

Usar responsabilidades e nomes reais dos agentes do banco/catálogo local. Não alterar seus avatares/ambientes.

## Stack recomendada

- **TanStack Start server functions / server routes**, backend no mesmo projeto, sem criar serviço paralelo sem necessidade.
- **Supabase independente do Lovable**: projeto próprio, PostgreSQL + Auth e Row Level Security. Reutilizar e revisar as migrações existentes em uma instalação nova, com ordem e dependências verificadas. Não aplicar nenhuma migração sem consentimento.
- **Vercel AI SDK 6** (`ai`) e **Vercel AI Gateway**, para o motor dos 14 agentes com `ToolLoopAgent` ou `generateText/streamText`, conforme documentação da versão instalada. Não inventar APIs nem IDs de modelos; verificar documentação e modelo configurado no gateway.
- **Trello** como fonte de tarefas inicialmente **somente leitura** (quadro oficial `IfYN7SWi`). GitHub e Drive como integrações de leitura em estágio posterior, apenas quando autorizadas/configuradas.
- Segredos exclusivamente no servidor; variáveis de ambiente configuradas no Vercel depois de revisar as permissões.

## Fase 0 — Preparação e segurança (sem deploy)

1. `git status`, preservar as mudanças locais do escritório 5.0; não dar `git reset`, não reformatar tudo.
2. Corrigir os quatro erros TypeScript relatados, validar `tsc --noEmit` conforme `tsconfig` existente.
3. Separar explicitamente o modo demo de endpoints reais: Demo nunca envia request IA nem abre leitura/gravação de dados reais. A API real exige autenticação em **cada chamada**, e confirma membro aprovado.
4. Não reutilizar o backend Lovable. Conferir se `@lovable.dev/*` ainda participa de login/build e planejar substituição quando seguro.
5. Revisar migration `0000` e `0001` em **banco novo**, principalmente auto-elevação do primeiro usuário, RLS, papel admin/editor/viewer, segurança das funções `security definer` e grants. Não permitir que qualquer visitante vire admin. Criar processo de bootstrap controlado/convite. Nunca expor `SUPABASE_SERVICE_ROLE_KEY` a client.
6. Rate limit por usuário, quota/custo por período, timeout e limite de passos por execução. Validar inputs e proteger contra prompt injection nas ferramentas e nos documentos externos.

## Fase 1 — Motor IA real (primeiro MVP)

1. Adicionar `src/lib/agents/`: `catalog.ts` (todos os 14 slugs e responsabilidades), `instructions.ts`, `runner.server.ts`, `permissions.server.ts`, `tools/` (allowlist inicial somente leitura).
2. Catálogo central: persona/instruções específicas, limite de ferramentas, formato de resultado esperado para cada especialidade. Gerar respostas reais do modelo, sem respostas fictícias de demonstração. Especialização = prompt, contexto, ferramentas e testes; **um motor compartilhado**.
3. Endpoint/server function autenticado `createAgentRun(agentSlug, prompt, requestId?)`; verificar autorização server-side, tamanho, quota, disponibilidade e status demo antes de rodar.
4. Streaming de resposta para UI (adaptado ao TanStack Start) com estados: `queued`, `running`, `awaiting_approval`, `completed`, `failed`, `cancelled`; distinguir status de execução dos status de `agent_requests` existentes.
5. Modelar tabelas `agent_runs`, `agent_messages`, `agent_artifacts`, `agent_tool_calls`/`approvals`, `usage_logs` com RLS. Cada registro tem `user_id`, `agent_id`, timestamps; no backend, escopo de equipe. Mensagens persistem sem armazenar segredos.
6. Página de agente reaproveita cenário/avatares e ganha chat, caixa de tarefa, botões **Executar**, **Interromper**, **Ver histórico**. No modo demo, esses controles permanecem desativados e claramente identificados.
7. Mock do provedor nos testes para evitar custo; testes para os 14 slugs e regras de permissão. Para validar execução real, usar projeto de teste com credenciais próprias.

## Fase 2 — Ferramentas que fazem trabalho

- Projeto: agente consegue consultar contexto e documentos autorizados; separar dados informados/confirmados de inferências.
- Trello: listar quadro, listas e cards primeiro em leitura autenticada; criar/editar/mover card **somente após aprovação humana explícita na UI** e rechecagem de autorização no servidor.
- GitHub: acesso read-only a arquivos, issues e PRs autorizados; qualquer commit, branch, PR ou merge exige confirmação e permissões específicas. Não executar códigos gerados sem isolamento e revisão.
- Documentos/pitch/pesquisas: criar versões e artefatos no HQ; não publicar nem enviar para terceiros automaticamente.
- Coordenação: Project Manager pode propor subtarefas para outros agentes, com limites de recursão/orçamento, mas não consegue contornar aprovação nem identidade do solicitante.
- Integrações são desabilitadas por padrão, em caso de ausência de token falham claramente e nunca retornam sucesso falso.

## Fase 3 — Equipe, observabilidade e produção

- Cinco contas/convites individuais; admin aprova, editor pode solicitar tarefas, viewer visualiza sem criar execuções (ajustável por regra explícita). Roles sempre verificadas no servidor.
- Auditoria de solicitante, ferramenta, aprovação, resultado e duração; logs removem segredos e PII desnecessária.
- Monitor de custo por usuário/agente e limites baixos configuráveis, prevenção de requisições duplicadas e abort/cancel.
- Não mudar `VITE_HQ_DEMO_MODE` em Production antes de testar o login e o bloqueio de rotas. Usar **Preview** para backend real e manter produção demonstrativa até aprovação.
- Configurar Vercel env **Preview** para teste autenticado, depois migração segura de Production quando aprovado.
- Evitar acesso público ao backend sem autenticação mesmo se home for pública.

## Variáveis a documentar por **nome**, sem exibir valores

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- Autenticação AI Gateway: OIDC Vercel ou `AI_GATEWAY_API_KEY`, conforme ambiente. **Nunca `VITE_AI_GATEWAY_API_KEY`**.
- `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID=IfYN7SWi` quando a integração for ativada.

## Critérios de aceitação

- Os 14 agentes fazem ao menos uma resposta real, específica e não mockada em ambiente de teste autenticado.
- Demo público só lê dados estáticos; não consegue chamar endpoints pagos ou consultar dados privados.
- Solicitações, mensagens e resultados sobrevivem a refresh e são isolados pelas regras de acesso.
- Tools externas nunca alteram Trello/GitHub sem confirmação.
- Testes: 14 agentes, auth/403, quota/429, validação/400, replay idempotente, cancelamento, persistência, falha de provedor, não exposição de segredo.
- `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build` e TypeScript passam; verificar rotas realmente renderizadas e sem erros de hidratação.
- Produção `permaneo-hq.vercel.app` continua demo até aprovação. Não alterar `PermaneoOFC/demo-repository`.

## Primeira tarefa para Codex (começar agora)

**Implementar Fase 0 + scaffolding funcional da Fase 1**, isolado e testado, com driver de modelo injetável/mocado para testes, sem chamar o modelo real antes de haver autenticação e credenciais. Não publicar, não migrar banco e não habilitar execuções públicas. Ao final, relatório claro do que foi implementado, o que falta configurar e qual é o primeiro teste real possível, solicitando autorização antes de ações externas.

Documentação técnica para confirmar APIs reais: https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent e https://vercel.com/docs/ai-gateway/authentication-and-byok.
