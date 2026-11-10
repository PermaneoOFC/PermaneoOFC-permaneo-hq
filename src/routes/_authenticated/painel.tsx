import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, requestsQuery, tasksQuery, syncLogsQuery, REQUEST_STATUS_LABEL } from "@/lib/hq";
import { PageHeader, Panel, Stat, Empty, Pill } from "@/components/hq/ui";
import { OfficeMap } from "@/components/hq/OfficeMap";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Painel — Permaneo HQ" }, { name: "description", content: "Métricas e mural de atividades do Permaneo." }, { property: "og:title", content: "Painel — Permaneo HQ" }, { property: "og:description", content: "Métricas e mural de atividades do Permaneo." }] }),
  component: Page,
});

function Page() {
  const agents = useQuery(agentsQuery).data ?? [];
  const reqs = useQuery(requestsQuery).data ?? [];
  const tasks = useQuery(tasksQuery).data ?? [];
  const logs = useQuery(syncLogsQuery).data ?? [];
  const queue: Record<string, number> = {};
  reqs.filter((r) => r.status === "pendente").forEach((r) => (queue[r.agent_id] = (queue[r.agent_id] ?? 0) + 1));
  const name = (id: string) => agents.find((a) => a.id === id)?.name ?? "—";
  return (<>
    <PageHeader eyebrow="Demo Day" title="Painel da central" description="Visão geral com dados reais registrados na central." />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Agentes" value={agents.length} hint="PM coordena" />
      <Stat label="Solicitações pendentes" value={reqs.filter((r) => r.status === "pendente").length} />
      <Stat label="Cards espelhados do Trello" value={tasks.length} hint={tasks.length ? "Sincronizados" : "Nenhuma sincronização ainda"} />
      <Stat label="Sincronizações" value={logs.length} />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2"><OfficeMap agents={agents} queue={queue} /></div>
      <Panel title="Mural de atividades">
        {reqs.length === 0 && logs.length === 0 ? <Empty>Sem atividades registradas.</Empty> : (
          <ul className="space-y-3 text-sm">
            {reqs.slice(0, 8).map((r) => (<li key={r.id} className="border-b pb-2"><p className="font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">{name(r.agent_id)} · <Pill>{REQUEST_STATUS_LABEL[r.status]}</Pill></p></li>))}
            {logs.slice(0, 4).map((l) => (<li key={l.id} className="text-xs text-muted-foreground">Trello: {l.status} — {l.message}</li>))}
          </ul>)}
        <Link to="/agentes" className="mt-4 inline-block text-sm text-primary">Ver agentes →</Link>
      </Panel>
    </div>
  </>);
}