import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, requestsQuery } from "@/lib/hq";
import { PageHeader, AgentAvatar, StatusPill, Pill } from "@/components/hq/ui";

export const Route = createFileRoute("/_authenticated/agentes/")({
  head: () => ({ meta: [{ title: "Agentes — Permaneo HQ" }, { name: "description", content: "Conheça os 14 agentes do projeto Permaneo." }] }),
  component: Page,
});

function Page() {
  const agents = useQuery(agentsQuery).data ?? [];
  const reqs = useQuery(requestsQuery).data ?? [];
  return <>
    <PageHeader eyebrow="Equipe digital" title="Agentes" description="Conheça as especialidades e os espaços de trabalho de cada agente." actions={<Pill tone="info">5 pessoas na equipe</Pill>} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{agents.map((agent) => (
      <Link key={agent.id} to="/agentes/$slug" params={{ slug: agent.slug }} className="home-card rounded-lg border bg-card p-5 shadow-card focus-visible:outline-2 focus-visible:outline-ring">
        <div className="flex items-center gap-3"><AgentAvatar agent={agent} size="lg" /><div className="min-w-0 flex-1"><p className="font-display text-lg font-bold">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.role_title}</p></div></div>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{agent.description}</p>
        <div className="mt-5 flex flex-wrap gap-2"><StatusPill status={agent.status} />{agent.is_coordinator && <Pill tone="info">Coordenação</Pill>}<Pill>{reqs.filter((request) => request.agent_id === agent.id && request.status === "pendente").length} na fila</Pill></div>
      </Link>))}</div>
  </>;
}
