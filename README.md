# Permaneo Agent Hub

Crie um NOVO aplicativo independente chamado "Permaneo HQ — Central de Agentes", em português brasileiro, para coordenar o projeto educacional Permaneo (prevenção de evasão escolar) no Demo Day. NÃO modifique o site Permaneo existente. Interface premium moderna e responsiva, salas interativas em planta 2D estilizada (não pixel art), painéis, sidebar, modo claro e escuro. Identidade visual: #246579, #A8E0ED, #227457, #F7F9F8, #203C46; fontes Public Sans e Bricolage Grotesque. Criar dashboard com métricas, mural de atividades, salas clicáveis e 14 agentes: Front-end, Back-end, UI/UX, QA & Segurança, Marketing, Documentarista, Pesquisa & Dados, Pitch & Storytelling, Negócios, Project Manager, DevOps, Especialista Educacional, Trello & Scrum, Financeiro. Coordenador central é papel do Project Manager, evitando um 15º agente. Cada agente tem perfil, atribuições, status REAL (não inventar execução), fila de tarefas, histórico e botão 'Solicitar tarefa' que inicialmente abre formulário de solicitação e salva pedido, sem fingir executar IA. Trello oficial https://trello.com/b/IfYN7SWi/demo-day: listas conhecidas Backlog Inicial, Backlog Sprint 3, Atuando, Validando, Feito, CONCORRENTES E VALORES REAIS DO MERCADO. Integração REAL com Trello via API segura do lado servidor e segredos configuráveis, com botão Conectar/Configurar, sincronização sob demanda, estados de erro/carregamento, read-only inicialmente; NUNCA inserir token ou chave Trello no frontend nem inventar tarefas como sincronizadas. Se credenciais não disponíveis, exibir estado 'Não conectado' e orientar configuração; permitir dados de demonstração claramente marcados como exemplo, nunca como dados reais. Preparar conectores GitHub, Google Drive e Vercel com status 'A configurar' até haver autenticação; não alegar conexão existente automaticamente. Mostrar cards reais conhecidos como exemplos de estrutura apenas, identificados como 'Referências do quadro, não sincronizados': Desenvolvimento Front-end, Criação do Dossiê, Orçamento do Projeto, Apresentação. Criar página Financeiro com tabelas de custos, cenários SaaS e cálculos editáveis, valores iniciais 0 e hipóteses explícitas. Criar página Documentação com registro de decisões, changelog e links para evidências. Criar páginas Tarefas, Integrações, Agentes, Escritório e Configurações. Modelagem de banco para agentes, solicitações, tarefas espelhadas, logs de sincronização, documentos, decisões e cenários financeiros; permissões e auditoria de alterações. Usar React e componentes organizados; evitar automações caras: nenhuma chamada IA por navegação; botão executar agente só quando backend IA estiver configurado, com aprovação humana para mudanças no Trello/GitHub. Entregar MVP navegável com UI real e arquitetura extensível.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3253fa0b-776b-4522-b987-048bf9d1cefc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```