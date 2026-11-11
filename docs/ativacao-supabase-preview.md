# Permaneo HQ — ativação de Supabase Preview (10/11/2026)

## Verificado na conta conectada

- Projeto Supabase: **Permaneo HQ**, ref `uxheyeqtylarkhqyqics`, região `sa-east-1`, status `ACTIVE_HEALTHY`.
- URL pública do projeto: `https://uxheyeqtylarkhqyqics.supabase.co`.
- Organização: `permaneo`.
- `public`: nenhuma tabela ainda; lista de migrations remotas vazia.
- Projeto Vercel: `permaneo/permaneo-hq`, ID `prj_bjeTMvY2fq8uVHCEsO5SdCXZ5thJ`.
- **Somente Preview**: cadastradas `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Nenhum valor sensível neste documento.
- Em Production, `VITE_HQ_DEMO_MODE=true`; **não alterar** enquanto login, RLS, quotas e execução não estiverem aprovados.
- Em Preview, `VITE_HQ_DEMO_MODE=true` permanece **até** migrar/testar banco, bootstrap seguro e aprovação do acesso.

## Por que ainda não houve migration

O GitHub `main` ainda tem apenas `drizzle/migrations/0000_migration.sql` e `0001_team_approval.sql` com estrutura anterior. O MVP avançado local reportado pelo Codex usa `database/migrations/002_agent_engine.sql` e outras alterações que **ainda não foram enviadas ao remoto**.

**NÃO executar o SQL antigo**: a migration inicial concede admin automaticamente ao primeiro cadastro e editor aos demais; o MVP requer bootstrap administrativo manual e aprovação dos integrantes. Aplicar a versão anterior seria uma configuração incompatível e potencialmente insegura.

## Próximo passo para Codex na máquina Windows

1. Inspecionar `git status`, `git branch -vv` e `git remote -v`. **Não apagar nem resetar alterações locais.**
2. Garantir que a versão visual aprovada Virtual Floor 5.0 e todo o backend MVP estejam preservados.
3. Sincronizar a branch remota `backend/ativacao-supabase` sem perder mudanças locais (ajustar rebase/merge apenas quando seguro, preservar cópia dos untracked).
4. Subir nessa branch, e não no `main`, os arquivos de código, migrations, testes e `docs/backend-implementacao.md`. **Não commitar** `.env`, `.env.local`, tokens, segredos, `.vercel`, `node_modules`.
5. Informar o commit e os arquivos de migration em ordem, incluindo a migration completa de bootstrap seguro.
6. Não implantar, não executar SQL e não desativar a demo. Testes locais `npm.cmd test`, `npm.cmd run lint`, `npx.cmd tsc --noEmit`, `$env:VITE_HQ_DEMO_MODE='true'; npm.cmd run build`.

## Após os arquivos estarem acessíveis

- Revisar a ordem e consistência do SQL completo (incluindo RLS, grants, funções SECURITY DEFINER, proteção do bootstrap de administrador).
- Aplicar migrations revisadas uma vez no projeto próprio recém-criado, após validação.
- Conferir via `list_tables`, `list_migrations`, `get_advisors` (security/performance), tabelas + seed 14 agentes.
- Criar/confirmar o administrador pela forma controlada prevista no backend.
- Configurar **somente servidor** a chave secret/admin necessária e a autenticação AI Gateway, com cotas baixas e validação de permissões.
- Liberar o Preview autenticado, realizar uma execução real do Marketing, comprovar persistência do histórico.
- Pedir autorização separada antes de desativar modo demo na Production.

## Não confundir

O código local atualizado ainda não foi sincronizado com o GitHub. Não considerar o backend ativo só por existirem variáveis em Preview. Nenhum teste de execução IA real foi feito.
