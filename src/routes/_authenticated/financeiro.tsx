import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Calculator, ExternalLink, AlertTriangle, ArrowRight } from "lucide-react";
import { agentsQuery, tasksQuery, requestsQuery, TRELLO_BOARD_URL } from "@/lib/hq";
import { PageHeader, Panel, Pill } from "@/components/hq/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [
    { title: "Financeiro — Permaneo HQ" },
    { name: "description", content: "Simule custos, receita e ponto de equilíbrio do Permaneo com premissas explícitas." },
  ] }),
  component: FinanceiroPage,
});

function currency(value: number) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value)
    : "—";
}
function money(value: string) {
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : 0;
}
function Amount({ label, value, setValue, hint }: {
  label: string; value: string; setValue: (value: string) => void; hint?: string;
}) {
  return <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input type="number" min="0" step="any" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} />
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>;
}

function FinanceiroPage() {
  const [schools, setSchools] = useState("0");
  const [students, setStudents] = useState("0");
  const [price, setPrice] = useState("0");
  const [fixedCost, setFixedCost] = useState("0");
  const [variableCost, setVariableCost] = useState("0");
  const agents = useQuery(agentsQuery).data ?? [];
  const tasks = useQuery(tasksQuery).data ?? [];
  const requests = useQuery(requestsQuery).data ?? [];
  const financeAgent = agents.find((agent) => agent.slug === "financeiro");
  const financeTasks = useMemo(() => tasks.filter((task) =>
    /financeir|orçament|custos?|preç|receita|saas|negóci|mercado|infraestrutura|investimento/i.test(
      [task.name, task.description ?? "", task.list_name].join(" "),
    )
  ), [tasks]);
  const financeRequests = requests.filter((request) => financeAgent && request.agent_id === financeAgent.id);
  const nSchools = Math.floor(money(schools));
  const nStudents = Math.floor(money(students));
  const monthRevenue = nSchools * nStudents * money(price);
  const monthVariable = nSchools * nStudents * money(variableCost);
  const monthFixed = money(fixedCost);
  const result = monthRevenue - monthVariable - monthFixed;
  const marginPerStudent = money(price) - money(variableCost);
  const breakEven = marginPerStudent > 0
    ? Math.ceil(monthFixed / marginPerStudent)
    : null;
  const invalidBreakEven = marginPerStudent <= 0 && monthFixed > 0;
  const hasAssumptions = nSchools > 0 && nStudents > 0 && money(price) > 0;

  return <>
    <PageHeader eyebrow="Planejamento" title="Financeiro" description="Simule o modelo SaaS por aluno e acompanhe as tarefas financeiras reais do projeto." />
    <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-50/50 px-4 py-3 text-sm text-foreground dark:bg-amber-900/10">
      <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Simulação, não orçamento aprovado</div>
      <p className="mt-1 text-muted-foreground">Os campos começam em zero para não inventar valores. As premissas são locais nesta página; não são salvas no banco.</p>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <Panel title="Premissas mensais">
        <div className="grid gap-4 sm:grid-cols-2">
          <Amount label="Escolas clientes" value={schools} setValue={setSchools} />
          <Amount label="Alunos por escola" value={students} setValue={setStudents} />
          <Amount label="Preço mensal por aluno (R$)" value={price} setValue={setPrice} />
          <Amount label="Custo variável por aluno/mês (R$)" value={variableCost} setValue={setVariableCost} />
          <div className="sm:col-span-2"><Amount label="Custos fixos mensais (R$)" value={fixedCost} setValue={setFixedCost} hint="Ex.: infraestrutura, suporte, serviços e manutenção" /></div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Cenário simplificado: receita = escolas × alunos por escola × preço. Não considera impostos, inadimplência ou implantação.</p>
      </Panel>
      <Panel title="Resultados calculados">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Receita mensal", currency(monthRevenue)],
            ["Custo variável mensal", currency(monthVariable)],
            ["Custos fixos", currency(monthFixed)],
            ["Resultado operacional estimado", currency(result)],
          ].map(([label, value]) => <div key={label} className="rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-xl font-bold tabular-nums">{value}</p>
          </div>)}
        </div>
        <div className="mt-4 rounded-xl border p-4">
          <div className="flex items-center gap-2"><Calculator className="size-4 text-primary" /><p className="font-semibold">Ponto de equilíbrio</p></div>
          <p className="mt-2 text-2xl font-bold">{breakEven === null ? "Não calculável" : `${breakEven.toLocaleString("pt-BR")} alunos pagantes`}</p>
          <p className="mt-1 text-xs text-muted-foreground">{invalidBreakEven
            ? "O preço por aluno precisa superar o custo variável por aluno."
            : "Quantidade mínima estimada de alunos para cobrir os custos fixos mensais."}</p>
          {!hasAssumptions && <p className="mt-2 text-xs text-muted-foreground">Preencha escolas, alunos e preço para obter um cenário útil.</p>}
        </div>
      </Panel>
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <Panel title="Atividades financeiras do Trello" action={<Pill>{financeTasks.length} encontradas</Pill>}>
        {financeTasks.length ? <ul className="space-y-3">{financeTasks.slice(0, 10).map((task) =>
          <li key={task.id} className="rounded-lg border p-3">
            <p className="text-sm font-semibold">{task.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{task.list_name}{task.last_synced_at ? ` · sincronizado em ${new Date(task.last_synced_at).toLocaleDateString("pt-BR")}` : ""}</p>
            {task.url && /^https:\/\//.test(task.url) && <a href={task.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">Abrir card <ExternalLink className="size-3" /></a>}
          </li>)}</ul> : <p className="text-sm text-muted-foreground">Não há atividades financeiras sincronizadas no HQ. Consulte o quadro oficial ou sincronize pela aba Integrações.</p>}
        <a href={TRELLO_BOARD_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Quadro oficial Demo Day <ExternalLink className="size-4" /></a>
      </Panel>
      <Panel title="Agente financeiro" action={<Pill>{financeRequests.length} solicitações</Pill>}>
        <p className="text-sm text-muted-foreground">O agente cuida de custos, orçamentos e cenários. Seus resultados precisam ser revisados pela equipe.</p>
        {financeAgent ? <Link to="/agentes/$slug" params={{ slug: financeAgent.slug }} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Abrir perfil do agente <ArrowRight className="size-4" /></Link> : <p className="mt-3 text-sm text-muted-foreground">Agente financeiro não encontrado no cadastro.</p>}
        <h3 className="mt-5 text-sm font-semibold">Solicitações registradas</h3>
        {financeRequests.length ? <ul className="mt-2 space-y-2">{financeRequests.slice(0, 6).map((request) => <li key={request.id} className="rounded-lg border p-3 text-sm"><span className="font-medium">{request.title}</span><span className="ml-2 text-xs text-muted-foreground">{request.status}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nenhuma solicitação para esse agente até agora.</p>}
      </Panel>
    </div>
  </>;
}
