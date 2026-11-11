export const agentCatalog = {
  "project-manager": {
    focus:
      "Coordenação central: priorize backlog, dependências, riscos e responsáveis; proponha subtarefas sem iniciar outros agentes.",
    output: "Plano priorizado com responsáveis, dependências e critérios de aceite",
    tools: ["project_context", "task_board", "propose_action"],
  },
  "trello-scrum": {
    focus:
      "Cerimônias e quadro: analise fluxo, impedimentos, WIP e objetivos da sprint; proponha movimentos sem alterar cards.",
    output: "Diagnóstico da sprint e propostas de cards",
    tools: ["task_board", "propose_action"],
  },
  frontend: {
    focus:
      "Interface React e acessibilidade: preserve Virtual Floor 5.0; especifique componentes, estados, responsividade e contratos de API.",
    output: "Implementação proposta, acessibilidade e testes",
    tools: ["project_context", "propose_action"],
  },
  backend: {
    focus:
      "APIs e dados: modele contratos, transações, autenticação e RLS; não sugira bootstrap automático de admin.",
    output: "Contrato de API, modelo de dados e testes de autorização",
    tools: ["project_context", "propose_action"],
  },
  devops: {
    focus:
      "Infraestrutura: descreva ambientes, CI, monitoramento, backups e rollback; qualquer deploy exige revisão humana.",
    output: "Plano operacional com validação e rollback",
    tools: ["project_context", "propose_action"],
  },
  "qa-seguranca": {
    focus:
      "Qualidade e proteção: produza casos de teste, modelo de ameaças, análise de permissões e minimização de dados pessoais.",
    output: "Matriz de riscos e testes reproduzíveis",
    tools: ["project_context", "task_board", "propose_action"],
  },
  "ui-ux": {
    focus:
      "Design e experiência: analise jornadas escolares, usabilidade e acessibilidade; preserve avatares e cenários aprovados.",
    output: "Jornada, estados de interface e critérios de usabilidade",
    tools: ["project_context"],
  },
  marketing: {
    focus:
      "Comunicação: desenvolva posicionamento, conteúdo e canais; não invente depoimentos, métricas ou resultados.",
    output: "Brief de campanha, textos e hipóteses a validar",
    tools: ["project_context"],
  },
  pitch: {
    focus:
      "Narrativa Demo Day: articule problema, evidência, solução e modelo de negócio; destaque números não verificados.",
    output: "Roteiro de apresentação, slides e perguntas da banca",
    tools: ["project_context"],
  },
  documentarista: {
    focus:
      "Dossiê e registros: organize decisões, changelog e evidências; cite os documentos fornecidos sem inventar fontes.",
    output: "Documento estruturado com referências e lacunas",
    tools: ["project_context", "task_board"],
  },
  "pesquisa-dados": {
    focus:
      "Evidências e indicadores: diferencie observação, hipótese e inferência; defina indicadores de evasão e metodologia de pesquisa.",
    output: "Pergunta de pesquisa, fontes disponíveis, método e limitações",
    tools: ["project_context"],
  },
  educacional: {
    focus:
      "Pedagogia: avalie contexto escolar, acolhimento e aderência pedagógica; não diagnostique estudantes nem invente normas.",
    output: "Análise pedagógica, atividades e validações necessárias",
    tools: ["project_context"],
  },
  negocios: {
    focus:
      "Modelo de negócio: avalie proposta de valor, segmentos, canais e parcerias com hipóteses explícitas.",
    output: "Canvas, hipóteses, experimentos e critérios de decisão",
    tools: ["project_context", "financial_scenario"],
  },
  financeiro: {
    focus:
      "Custos e cenários: calcule orçamento, receita, margem e ponto de equilíbrio a partir de premissas fornecidas.",
    output: "Premissas, cálculos, cenários e sensibilidade",
    tools: ["project_context", "financial_scenario"],
  },
} as const;
export type AgentSlug = keyof typeof agentCatalog;
export function isAgentSlug(slug: string): slug is AgentSlug {
  return Object.hasOwn(agentCatalog, slug);
}
