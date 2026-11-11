# Independência do Lovable — plano de execução

Este documento é para a versão **local** mais recente no VS Code. Antes de editar, executar `git status` e preservar alterações locais não publicadas.

## Objetivo imediato: preview acessível sem banco de dados

A interface já compila (relatório local: 5/5 testes). A indisponibilidade de um Supabase independente não impede uma **prévia visual em modo demonstração** desde que ela não simule autenticação, sincronização ou gravação.

1. Criar um modo `VITE_HQ_DEMO_MODE=true`, explicitamente rotulado **Demonstração — sem dados ao vivo**.
2. Fornecer dados locais somente de leitura para os 14 agentes, obtidos da migração `drizzle/migrations/0000_migration.sql` e das salas já existentes. Todas as filas devem começar em zero, estados "Não configurado"; nunca fingir execução de agente.
3. Reutilizar `OfficeMap`, `AppShell`, `PageHeader`, design tokens e identidade visual atual.
4. No modo demo, acessar `/painel`, `/escritorio`, `/agentes` sem login e sem instanciar Supabase; proteger escrita: desabilitar formulários, sincronização Trello, acesso financeiro sensível, gestão de usuários e páginas com dados privados. Os cards de Trello conhecidos só aparecem rotulados como referência sem sincronização.
5. No modo normal, manter a autenticação real e o controle de permissões; negar acesso sem credenciais válidas. Nunca fazer fallback automático para demo em produção por erro de Supabase.
6. Tirar referências desnecessárias à identidade/serviços Lovable; trocar login Google via pacote Lovable por `supabase.auth.signInWithOAuth` no modo com backend, com configuração própria do provedor e redirect. Evitar remover dependências de build antes de testar alternativa funcional.
7. Adicionar banner "Modo demonstração" e instruções de configuração. Não reutilizar o banco de terceiros nem incluir token em código.
8. Revisar `npm test`, `npm run lint`, `npm run build`; conferir `git diff` antes de enviar ao GitHub.
9. Publicar inicialmente como **preview** no projeto Vercel existente `permaneo/permaneo-hq`, ID `prj_bjeTMvY2fq8uVHCEsO5SdCXZ5thJ`. Como o projeto não tem integração Git, publicar da máquina por CLI (`npx.cmd vercel`) apenas com aprovação do responsável.
10. Para login individual e colaboração real: criar um projeto Supabase próprio em outro momento, executar migrações revisadas uma vez, configurar `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` somente em ambiente seguro; validar RLS e equipe de 6 integrantes antes da produção.

## Imagem institucional

Imagem do prédio fornecida pelo responsável: salvar localmente em `public/branding/permaneo-building.png`. Colocar como imagem institucional no login e no painel, respeitando a proporção vertical. Não usar uma imagem diferente como substituta sem autorização.

## Limites explícitos

Modo demonstração não é escritório colaborativo, não executa IA, não lê o Trello e não sincroniza tarefas; essas capacidades exigem integrações configuradas. Repositório principal `PermaneoOFC/demo-repository` permanece intacto.
