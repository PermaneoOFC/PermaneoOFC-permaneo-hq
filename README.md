# Permaneo HQ — Central de Agentes

## Backend independente — implementação local

O backend agora usa TanStack Start + Supabase próprio + Vercel AI SDK/Gateway, com 14 perfis no mesmo motor, aprovação de integrantes, RLS, histórico, streaming e limites. O Virtual Floor 5.0 foi preservado. Nenhuma migration real, credencial ou publicação foi executada.

Leia [o relatório e o procedimento do primeiro agente real](docs/backend-implementacao.md). As migrations revisadas para banco novo estão em `database/migrations/`; não aplique as antigas migrations de bootstrap automático. A configuração padrão de `.env.example` mantém a demonstração e desabilita o backend real.

Validação: `npm test`, `npm run test:browser`, `npm run typecheck`, `npm run lint`, `npm run build`. Use npm e `package-lock.json`; `bun.lock` é legado.

## Demonstração local sem backend

Defina `VITE_HQ_DEMO_MODE=true` antes de iniciar ou compilar para abrir a demonstração sem Supabase. Ela usa dados locais somente de leitura, identifica claramente a ausência de dados ao vivo, mantém os 14 agentes e as salas existentes, e não autentica, grava, sincroniza o Trello ou executa agentes. Painel, escritório e perfis de agentes ficam disponíveis; tarefas mostram apenas cartões de referência estáticos. Integrações e gestão de equipe ficam desativadas.

Sem essa opção, o app mantém o fluxo autenticado com Supabase. A demonstração não é fallback para falhas do backend. A produção atual deve continuar com `VITE_HQ_DEMO_MODE=true` até uma futura aprovação de publicação.

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

Configure as variáveis locais com um Supabase próprio e autenticação AI Gateway, sem enviá-las ao GitHub. Não reutilize credenciais ou banco gerenciado pelo Lovable. Consulte o procedimento completo em `docs/backend-implementacao.md` antes de habilitar execuções reais.

## Integrações

- **Trello:** https://trello.com/b/IfYN7SWi/demo-day — configurar autenticação e testar sincronização de leitura.
- **Supabase próprio:** Auth e PostgreSQL/RLS independentes; migrations preparadas, ainda não aplicadas em um serviço real.
- **GitHub/Drive/Vercel:** integrações e implantação ainda precisam de configuração e testes.

## Segurança e limitações

- Nunca enviar `.env`, tokens de API ou chaves privadas ao repositório.
- Solicitações dos agentes são registros de tarefas; isto **não** significa que IA esteja executando ações autonomamente.
- A aplicação utiliza TanStack Start/React e Nitro com backend Node; não é uma implantação estática. Build e login não dependem operacionalmente do Lovable.
- O projeto principal do Permaneo permanece em `PermaneoOFC/demo-repository` e não foi alterado.

Projeto fonte Lovable: https://lovable.dev/projects/3253fa0b-776b-4522-b987-048bf9d1cefc
