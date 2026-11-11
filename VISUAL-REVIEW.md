# Permaneo HQ — revisão visual local

## Implementação

- 14 retratos SVG reutilizáveis, definidos por identidade, com cabelos, tons de pele, roupas, acessórios e identificação de especialidade.
- Cinco salas ilustradas com layouts diferentes, paredes em perspectiva, luminárias, mobiliário, plantas e corredor com área de convivência.
- Escritórios pessoais com arquitetura compartilhada, painéis, paletas e equipamentos específicos para cada uma das 14 funções.
- Home com hero escuro, imagem original `public/permaeo-building.png`, apresentação da equipe de cinco integrantes e diretório dos agentes.
- Sidebar, cartões, mural, estados vazios e caminho de retorno ao andar revisados.
- Arraste horizontal com mouse e toque, distinção entre clique e arraste, cancelamento seguro, zoom por botões, ajuste à largura disponível, indicador de posição e navegação por teclado. A rolagem vertical permanece com a página.

## Arquivos desta reformulação

Em `src/components/hq/`:

- `Portrait.tsx` — novo componente SVG de retrato.
- `identities.ts` — 14 identidades e paletas.
- `FloorRoomArt.tsx` — cenários das cinco salas.
- `WorkspaceArt.tsx` — cenários e equipamentos dos escritórios pessoais.
- `AgentStudio.tsx` — composição responsiva do escritório pessoal.
- `OfficeMap.tsx` — mapa, seleção, exploração, zoom e navegação.
- `OfficeMap.test.tsx` — testes de ajuste, seleção, zoom e arraste.
- `ui.tsx` — integração dos novos avatares.
- `AppShell.tsx` — sidebar e linguagem visual.

Outros arquivos:

- `src/routes/index.tsx` — home.
- `src/routes/_authenticated/painel.tsx` — painel e estados vazios.
- `src/routes/_authenticated/agentes.$slug.tsx` — navegação do perfil.
- `src/styles.css` — aparência, responsividade e transições.

O checkout já continha outras alterações. Elas foram preservadas.

## Validação

- `npm run test`: 13 testes aprovados, em quatro arquivos. Uma execução simultânea com build e navegador excedeu o timeout do teste de acessibilidade; a consulta repetida foi otimizada sem ampliar o timeout e a execução final passou.
- `npm run lint`: zero erros; seis avisos existentes de Fast Refresh em componentes de UI.
- Build com `VITE_HQ_DEMO_MODE=true`: aprovado.
- `git diff --check`: aprovado.
- Chrome headless: inspeção visual em 1440 × 1000 e emulação móvel de 390 × 844; sem transbordamento horizontal da página.
- Arraste real por mouse e toque, ajuste do mapa à viewport e clique de avatar para `/agentes/frontend` verificados.
- Todas as 14 rotas pessoais renderizaram seus cenários.
- Nenhuma exceção de runtime nem chamada externa a Supabase ou Trello durante a navegação final em demonstração.
- Capturas e script de inspeção disponíveis localmente em `qa.local/` (ignorado pelo Git). A emulação móvel não substitui revisão em um aparelho físico.

## Limitação adicional

`npx tsc --noEmit` ainda encontra quatro erros existentes fora dos componentes reformulados: retornos inconsistentes em `RequestDialog.tsx` e `auth.tsx`, e acesso por ponto à variável de ambiente em `demo.ts` e `tarefas.tsx`. O lint, os testes e o build acima passam; a checagem estrita de tipos do repositório ainda não está limpa.

## Abrir para revisão

No PowerShell, na raiz do projeto:

```powershell
$env:VITE_HQ_DEMO_MODE = 'true'
npm run dev -- --host 127.0.0.1
```

Abra a URL local exibida pelo Vite. A flag de demonstração deve estar ativa; nenhuma credencial é necessária. Nenhuma publicação, sincronização Trello, execução de IA ou alteração de banco foi realizada.
