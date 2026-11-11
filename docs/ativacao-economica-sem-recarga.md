# Ativação segura do Permaneo HQ — modo econômico sem recarga

Status em 2026-11-10: **somente preparação**. O backend real está desligado no Preview `HQ_BACKEND_ENABLED=false`, e a demo continua habilitada em Preview e Produção (`VITE_HQ_DEMO_MODE=true`). Não marcar IA como funcional antes do teste autenticado.

## Ambiente e isolamento

- Projeto Vercel: `permaneo-hq`; repositório `PermaneoOFC/PermaneoOFC-permaneo-hq`; implementação na branch `backend/ativacao-supabase`.
- Supabase novo e independente: `uxheyeqtylarkhqyqics`. Migrations `001_independent_baseline`, `002_agent_engine`, `003_restrict_anon_membership` aplicadas. Nunca executar SQL no banco antigo do Permaneo/Lovable.
- O HQ principal em produção deve continuar com demo ligada até testes de Preview completos.

## Pré-requisitos obrigatórios antes de ligar a IA

1. Confirmar **fora do banco** a titularidade do e-mail do único usuário que recebeu o convite. Verificar `auth.users.email_confirmed_at`, UUID e e-mail. Executar `database/bootstrap-admin.sql` apenas com os dois identificadores corretos, pelo operador autorizado. Não atribuir admin ao primeiro signup automaticamente.
2. No Vercel **Preview apenas**: fornecer `SUPABASE_SERVICE_ROLE_KEY` como variável sensível/servidor, nunca `VITE_`, nunca em Git ou no chat. URLs e publishable key já estão em Preview.
3. No Vercel AI Gateway: verificar a existência de créditos gratuitos, **desabilitar recarga automática**, confirmar que não há compra automática de créditos, e configurar orçamento externo do menor escopo possível (projeto quando usando OIDC; API key quando usando chave), mais teto para a equipe. Orçamentos são *soft caps*, não garantia matemática de custo zero. Não habilitar BYOK pago nem fallback para outro provedor.
4. Autenticação Gateway: usar OIDC do deploy Vercel se disponível para o projeto, ou criar uma chave de Gateway restrita com orçamento, adicionada apenas como variável de ambiente protegida. **Nunca** usar chave VITE_ ou commitar segredos.
5. A configuração econômica definida em Preview: `AI_GATEWAY_MODEL=openai/gpt-5-nano`; reserva por run US$ 0,05, por usuário/dia US$ 0,25, equipe/dia US$ 1. Validar modelo/preço/capacidades contra `https://ai-gateway.vercel.sh/v1/models` antes do primeiro uso.
6. Revisar avisos de segurança Supabase restantes (funções SECURITY DEFINER expostas para usuários autenticados, embora com controles internos) e verificar que o site exige usuário autorizado.
7. **Somente depois dessas verificações**: mudar `VITE_HQ_DEMO_MODE=false`, `HQ_BACKEND_ENABLED=true` para **Preview**, fazer novo deploy e testar primeiro autenticação, depois 1 única resposta do agente Marketing. Inspecionar logs Gateway, tokens e custo; não publicar produção até validação humana.

## Como verificar

- Login sem papel: deve ficar sem acesso; somente admin autorizado pode conceder editor/viewer.
- Verificar que 14 agentes estão cadastrados em `public.agents` e RLS está habilitado em todas as tabelas públicas.
- Sem credencial Gateway: API de execução deve negar sem fazer chamada ao provedor.
- Limites de custo devem bloquear novas reservas quando ultrapassados; a reserva de custo não é fatura real.
- Testar cancelamento, histórico, acesso viewer e persistência antes de liberar integrantes.

## Não confundir

- O site em estado `READY` é um deploy de código, **não é prova** de que os modelos respondem.
- `HQ_*_BUDGET_USD` define limites na aplicação, mas não substitui os orçamentos no AI Gateway.
- Créditos gratuitos dependem de elegibilidade e saldo; nem Vercel Hobby nem um crédito promocional garantem automaticamente custo zero em todos os serviços.
