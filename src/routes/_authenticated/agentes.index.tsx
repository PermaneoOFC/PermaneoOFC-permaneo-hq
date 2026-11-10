import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, requestsQuery } from "@/lib/hq";
import { PageHeader, AgentAvatar, StatusPill, Pill } from "@/components/hq/ui";

export const Route = createFileRoute("/_authenticated/agentes/")({
  head: () => ({ meta: [{ title: "Agentes — Permaneo HQ" }, { name: "description", content: "Os 14 agentes do projeto Permaneo." }, { property: "og:title", content: "Agentes — Permaneo HQ" }, { property: "og:description", content: "Os 14 agentes do projeto Permaneo." }] }),
  component: Page,
});

function Page() {
  const agents = useQuery(agentsQuery).data ?? [];
  const reqs = useQuery(requestsQuery).data ?? [];
  return (<>
    <PageHeader eyebrow="Equipe" title="Agentes" description="O Project Manager é o coordenador central." />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{agents.map((a) => (
      <Link key={a.id} to="/agentes/$slug" params={{ slug: a.slug }} className="rounded-2xl border bg-card p-5 shadow-card transition hover:shadow-lift">
        <div className="flex items-center gap-3"><AgentAvatar agent={a} /><div className="flex-1"><p className="font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.role_title}</p></div></div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
        <div className="mt-4 flex flex-wrap gap-2"><StatusPill status={a.status} />{a.is_coordinator && <Pill tone="info">Coordenador</Pill>}
          <Pill>{reqs.filter((r) => r.agent_id === a.id && r.status === "pendente").length} na fila</Pill></div>
      </Link>))}</div>
  </>);
}