# Permaneo HQ — Central de Agentes

Escritório virtual de acompanhamento do projeto Permaneo, com salas interativas, painel, perfis de 14 agentes e solicitações de tarefas.

**Status:** código migrado do projeto Lovable para este repositório em 10/11/2026. A migração foi feita copiando os arquivos da versão do Lovable, **não** ativando uma sincronização contínua Lovable ↔ GitHub.

## Rodar localmente

Requisitos: Node.js compatível com o Vite 8 e npm.

```sh
git clone https://github.com/PermaneoOFC/PermaneoOFC-permaneo-hq.git
cd PermaneoOFC-permaneo-hq
npm install
cp .env.example .env
npm run dev
```

No Windows/PowerShell, use `Copy-Item .env.example .env` em vez de `cp`, se necessário.

Configure as variáveis no arquivo `.env` sem enviá-lo ao GitHub. Os valores originais estão no ambiente do Lovable e precisam ser configurados com cuidado. A migração não copia automaticamente banco de dados, usuários, credenciais, segredos ou serviços gerenciados pelo Lovable.

## Integrações

- **Trello:** https://trello.com/b/IfYN7SWi/demo-day — configurar autenticação e testar sincronização de leitura.
- **Supabase/Lovable Cloud:** dependências e código migrados; credenciais e serviços precisam ser verificados antes de executar fora do Lovable.
- **GitHub/Drive/Vercel:** integrações e implantação ainda precisam de configuração e testes.

## Segurança e limitações

- Nunca enviar `.env`, tokens de API ou chaves privadas ao repositório.
- Solicitações dos agentes são registros de tarefas; isto **não** significa que IA esteja executando ações autonomamente.
- A aplicação utiliza TanStack Start/React e dependências de Lovable Cloud. Não assumir que uma implantação estática comum na Vercel funcionará sem ajustes para execução no servidor.
- O projeto principal do Permaneo permanece em `PermaneoOFC/demo-repository` e não foi alterado.

Projeto fonte Lovable: https://lovable.dev/projects/3253fa0b-776b-4522-b987-048bf9d1cefc
