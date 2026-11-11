# Backend independente — implementação local

Esta entrega implementa a Fase 0 e um MVP funcional da Fase 1 do plano `backend-agentes-mvp.md`. Não cria projeto, não publica, não aplica migrations em Supabase e não chama IA paga. Virtual Floor 5.0, identidades, avatares, cenários e CSS aprovados foram preservados. A conversa só aparece no modo autenticado.

## Código e arquitetura

- `vite.config.ts`: TanStack Start, React, Tailwind e Nitro, sem o plugin de build do Lovable. O Nitro seleciona Node localmente (`.output`) e Vercel no ambiente de build correspondente. `vercel.json` identifica TanStack Start e usa npm no projeto existente; não cria projeto nem publica. Antes de um futuro deploy, validar o timeout da função e o stream nesse ambiente. Nenhuma configuração remota foi alterada.
- `src/lib/supabase.ts`, `auth-attacher.ts`, `auth-middleware.ts`: Supabase próprio; login individual por senha e OAuth nativo opcional. Sem broker de sessão do Lovable.
- `src/lib/agents/catalog.ts` e `instructions.ts`: 14 especialidades e allowlists; os nomes/avatares continuam no catálogo visual existente.
- `permissions.server.ts`: verifica token com Supabase Auth, membro aprovado e papel em cada chamada. Revalida durante a execução. Nenhuma role enviada pelo navegador é aceita.
- `config.server.ts`: valida modelo, capacidades e preços no catálogo público atual do Gateway; exige modelo explicitamente configurado. Não escolhe um ID de memória.
- `runner.server.ts`: AI SDK **6.0.329**, `ToolLoopAgent`, `stream`, `stepCountIs`, `maxOutputTokens`, `prepareStep` e `AbortSignal`. Sem retries automáticos. Um motor, 14 perfis.
- `tools/index.server.ts`: documentos autorizados, espelho Trello (identificado como não atualizado ao vivo), cálculo financeiro determinístico e proposta para aprovação. Nenhum executor de escrita externa existe.
- `store.server.ts`, `http.server.ts`: persistência, reservas atômicas, idempotência, disputa de execução, streaming SSE, histórico e cancelamento entre instâncias.
- `AgentConsole.tsx`: tarefa, resposta em streaming, estados, histórico após refresh, início explícito de execução pendente, interrupção e revisão de propostas. HTML produzido pelo modelo nunca é interpretado.

Os arquivos antigos gerados em `src/integrations` foram preservados sem edição. Nenhum código ativo importa o cliente, middleware, broker ou autenticação Lovable. Os tipos legados do banco são usados apenas como tipos da interface existente; os novos contratos estão em `agents/contracts.ts`. As dependências `@lovable.dev/*` foram removidas de `package.json`. O npm lockfile é a referência desta implementação; `bun.lock` é legado e não deve ser usado para instalar esta versão.

## API no mesmo projeto

Todas as rotas exigem `Authorization: Bearer <sessão individual Supabase>`, membro aprovado e backend explicitamente habilitado. Respostas privadas usam `Cache-Control: private, no-store`. A demo bloqueia a API antes de consultar serviços.

| Método / rota                                              | Comportamento                                                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/agents/runs`                                    | `{agentSlug,prompt,idempotencyKey,requestId?}`; editor/admin; reserva custo e grava solicitação. Replay da mesma chave retorna o mesmo run; mudança de payload retorna 409. |
| `POST /api/agents/runs/:id/execute`                        | Reivindica execução `queued` uma única vez e responde SSE. Só proprietário editor ou administrador.                                                                         |
| `GET /api/agents/runs?agent=backend&before=<ISO opcional>` | Histórico da equipe, 30 por página. Viewer aprovado pode ler.                                                                                                               |
| `GET /api/agents/runs/:id`                                 | Estado, resposta parcial/final, mensagens e propostas.                                                                                                                      |
| `POST /api/agents/runs/:id/cancel`                         | Interrompe run do proprietário ou de administrador; estado persistido, observado pelo worker em aproximadamente 1 segundo mais latência da rede.                            |
| `POST /api/agents/approvals/:id`                           | `{approve:boolean}`; registra decisão humana imutável de proprietário editor/admin. **Não executa alterações externas.**                                                    |

Erros principais: 400 entrada inválida; 401 sessão inválida; 403 demo/membro/papel; 409 conflito/replay/execução ativa; 413 corpo grande; 429 taxa/orçamento; 503 configuração/serviço indisponível. Falhas do provedor não retornam payloads upstream, credenciais ou stacks.

## Banco, aprovação e RLS

`database/migrations/001_independent_baseline.sql` é uma substituição revisada das antigas migrations 0000/0001 para **banco vazio próprio**. Não aplicar junto com as antigas nem no banco Lovable. Foi removido o trigger que promovia o primeiro cadastro a admin/editor. O cadastro não concede qualquer papel. Aprovação pelo painel exige admin; aceita editor/viewer, protege admins existentes e serializa o limite de cinco integrantes.

`002_agent_engine.sql` acrescenta runs, mensagens, artefatos, ferramentas, aprovações, uso e eventos de estado. Novas tabelas têm RLS: equipe aprovada lê; nenhuma escrita direta é concedida a `authenticated`, inclusive admin. Mutação operacional exige servidor; aprovação usa RPC que verifica `auth.uid()`. Funções privilegiadas fixam `search_path`, revogam execução pública e restringem grants.

O bootstrap inicial é exclusivamente uma operação DBA manual em `database/bootstrap-admin.sql`, com UUID e e-mail confirmados do proprietário e equipe vazia. Não há endpoint de bootstrap, segredo no código, autoelevação por ordem de cadastro ou opção para escolher papel no signup. A UI existente aprova os outros quatro membros. Revogação emergencial deve remover a role pelo administrador do banco; não foi criado painel de remoção de integrantes nesta etapa.

## Limites e ciclo de vida

- Padrão: três chamadas de modelo por execução, 1.000 tokens de saída por chamada, 60 segundos, oito chamadas de ferramenta, uma execução ativa por usuário, três novas execuções por minuto.
- Reserva antes de IA: `2 × passos × (32.000 × preço_input + max_output × preço_output)`; rejeitada se superar US$ 0,25/run, US$ 1/usuário/dia ou US$ 5/equipe/dia. Janela diária UTC; configurações têm tetos no servidor.
- Contexto serializado limitado a 24 KB antes de cada passo; os 32 mil tokens estimados incluem folga para instruções, schemas e framing. Ferramentas retornam no máximo 5.000 caracteres. Modelo/cotação é verificado novamente antes de iniciar.
- A quota contabiliza a reserva inteira, inclusive falha/cancelamento. Isso evita liberar saldo quando a cobrança upstream é incerta. `usage_logs` armazena tokens e custo **estimado**, não uma fatura confirmada. Configurar também orçamento no Gateway antes de liberar uso pago; preços, roteamento e cobrança upstream não constituem um teto financeiro matemático garantido pela aplicação.
- Reserva e verificação de limites usam lock transacional PostgreSQL, portanto não dependem da memória de uma instância. `queued → running` é compare-and-set. Cancelamento vence conclusão concorrente.
- O stream mantém a requisição aberta; não há trabalho solto em background. Fechar a conexão solicita cancelamento. Refresh recupera texto já persistido e status; não reconecta a geração nem inicia outra cobrança automaticamente. Runs órfãos/expirados são marcados como falha no próximo acesso autenticado. Não há fila durável ou agendamento externo nesta fase.
- Cada execução é independente. Histórico persistido não é reenviado automaticamente ao modelo; inclua o contexto necessário na nova solicitação. A API aceita vínculo a `agent_requests`; a UI de chat cria runs diretamente e a fila antiga continua sendo triagem humana separada.
- Integração Trello existente agora exige backend real, membro aprovado e `HQ_TRELLO_ENABLED=true`. É leitura externa com gravação do espelho local. GitHub, Drive e executores externos continuam indisponíveis.

## Primeiro agente com resposta real

1. Após aprovação separada, disponibilizar um **Supabase próprio vazio**, com e-mail confirmado, URLs de redirect corretas e contas individuais. Não reutilizar o banco gerenciado pelo Lovable.
2. Revisar e aplicar, nessa ordem, `001_independent_baseline.sql` e `002_agent_engine.sql` nesse banco. Nada foi aplicado por esta entrega.
3. Criar/verificar a conta do responsável, revisar e executar manualmente `bootstrap-admin.sql`; aprovar os outros quatro integrantes no painel. Confirmar RLS com anon, pendente e viewer antes de liberar IA.
4. Criar `.env.local` a partir de `.env.example` e preencher os nomes de variáveis abaixo por um meio seguro. Nunca colar segredos em chat ou versioná-los. URL e publishable key do navegador/servidor devem apontar para o mesmo projeto.
5. Somente no ambiente local de teste: `VITE_HQ_DEMO_MODE=false`, `HQ_BACKEND_ENABLED=true`. Manter produção demo. Reiniciar o servidor após alterar variáveis.
6. Selecionar ID exato de modelo de linguagem com `tool-use` no catálogo Gateway. Informar `AI_GATEWAY_MODEL` e autenticação Gateway, com orçamento baixo revisado. O preflight pode rejeitar modelos caros; escolher um compatível com a reserva calculada.
7. `npm ci`, `npm run dev`; entrar como editor/admin; abrir `/agentes/backend`; pedir: “Proponha um contrato de API para cadastro de escolas, com validações e testes. Não altere serviços externos.” Clicar **Executar agente** somente quando o uso pago estiver autorizado.
8. Confirmar resposta real, status, refresh, mensagens, artefato, uso e erro/cancelamento. Conferir a cobrança nos logs do Gateway. Depois repetir uma tarefa específica com cada um dos outros 13 agentes. Esse critério de aceitação real **ainda não foi executado**.

Variáveis: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `AI_GATEWAY_MODEL`, `AI_GATEWAY_API_KEY` local **ou** OIDC gerenciado na Vercel. Flags e limites estão em `.env.example`. Nenhuma credencial foi configurada. Trello é opcional e não é necessário para a primeira resposta real.

## Validação e limites da evidência

- `npm test`: testes de catálogo, motor com **MockLanguageModelV3 somente em testes**, falhas, autorização, demo, HTTP, validação e persistência/RLS em PostgreSQL WASM descartável (`PGlite`). Não acessa Supabase nem IA reais.
- `npm run test:database`: executa as duas migrations no PostgreSQL em memória e verifica bootstrap, aprovação/capacidade, RLS, replay, cota, artefatos, histórico e cancelamento. Não configura nem migra um banco real.
- `npm run test:browser`: Edge headless, servidor local com demo e backend desabilitado; verifica o andar virtual, 14 perfis, erros de hidratação, ausência de chamadas privadas e HTTP 403 da API real. Captura local em `test-results/virtual-floor-5.png` (ignorada no git).
- `npm run typecheck`, `npm run lint`, `npm run build`. Lint possui avisos preexistentes de Fast Refresh nos componentes shadcn. Build Windows pode exigir acesso fora do sandbox para rastreamento de arquivos do Nitro.

Pendências de validação real: Supabase Auth (SMTP/OAuth), PostgREST/RLS no Supabase próprio, Gateway autenticado e custo faturado, execução real dos 14 agentes, comportamento de conexão no futuro ambiente Vercel e teste com os cinco integrantes. Não há deploy, alterações remotas ou publicação nesta etapa.

Resultados locais desta etapa: **57 testes automatizados e 2 testes de navegador aprovados**, TypeScript sem erros, build aprovado e verificação de 30 bundles JavaScript sem runtime de IA, chaves de servidor, mocks ou autenticação Lovable. Lint: zero erros e seis avisos preexistentes de Fast Refresh. A auditoria levou à atualização corretiva de Vite para 8.3.7 e Zod para 4.6.7; após essas correções, restaram 11 avisos moderados em dependências de desenvolvimento (cadeias Drizzle/eslint), sem aplicar `audit fix --force` ou atualizações amplas.

APIs verificadas nas [docs versionadas do AI SDK 6](https://v6.ai-sdk.dev/docs/agents/building-agents), no pacote instalado `node_modules/ai/docs` e `src`, na [documentação do Gateway](https://vercel.com/docs/ai-gateway/getting-started), no [catálogo de modelos](https://ai-gateway.vercel.sh/v1/models), nas [rotas do TanStack Start](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) e em [RLS do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).
