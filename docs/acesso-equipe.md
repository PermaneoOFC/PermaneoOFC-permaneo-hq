# Acesso compartilhado — Permaneo HQ

## O que está implementado no código

- Login individual por e-mail (fluxo Google depende da autenticação externa estar configurada).
- Proteção da rota autenticada: só usuários com papel autorizado acessam o escritório.
- Área **Integrações → Acesso da equipe** com lista de contas e aprovação administrativa.
- Papéis: **admin** (controle total), **editor** (tarefas e registros) e **viewer** (visualização).
- SQL de políticas de leitura e aprovação em `drizzle/migrations/0001_team_approval.sql`.

## Ativação obrigatória (ainda não executada no banco)

1. Garanta que a conta do responsável já esteja registrada como `admin` no banco Supabase/Lovable Cloud existente.
2. Faça backup do banco e aplique `drizzle/migrations/0001_team_approval.sql` pelo editor SQL do **mesmo projeto Supabase usado pelo HQ**, com a conta proprietária do banco.
3. Confira políticas e funções, especialmente `list_team_members` e `set_team_member_role`, e teste com uma conta de convidado criada após a migração.
4. Configure URL e chaves públicas de Supabase no ambiente do servidor e no build. **Jamais** envie chaves secretas ao GitHub.
5. Depois de hospedar, equipe acessa o endereço do site, cria conta, confirma o e-mail e aguarda sua aprovação em Integrações → Acesso da equipe.
6. Só após testar fluxo de aprovação e permissões distribua o link de produção à equipe.

**Atenção:** o script de migração está versionado no GitHub, mas não foi aplicado ao banco pela conexão disponível aqui. Portanto o fluxo de aprovação NÃO é seguro para uso público até a aplicação e validação do SQL.

## Limitações atuais

- Não envia convites por e-mail; integrantes registram suas contas, e administrador aprova.
- A sincronização Trello exige configuração das credenciais no backend.
- O banco de dados/usuários do Lovable não são copiados ao importar o GitHub.
- O plano Vercel Hobby recusou o deploy direto do repositório privado na organização. Hospedar em repositório privado pessoal ou mudar plano/visibilidade após revisão são alternativas, ainda não configuradas.
- O painel de 14 agentes organiza tarefas; não executa IA sozinho.
