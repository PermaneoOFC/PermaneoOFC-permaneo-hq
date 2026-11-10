import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { agentsQuery, requestsQuery, ROOMS } from "@/lib/hq";
import { PageHeader, Panel, AgentAvatar, StatusPill, Empty } from "@/components/hq/ui";
import { OfficeMap } from "@/components/hq/OfficeMap";

export const Route = createFileRoute("/_authenticated/escritorio")({
  head: () => ({ meta: [{ title: "Escritório — Permaneo HQ" }, { name: "description", content: "Planta 2D interativa das salas dos agentes." }, { property: "og:title", content: "Escritório — Permaneo HQ" }, { property: "og:description", content: "Planta 2D interativa das salas dos agentes." }] }),
  component: Page,
});

function Page() {
  const agents = useQuery(agentsQuery).data ?? [];
  const reqs = useQuery(requestsQuery).data ?? [];
  const [room, setRoom] = useState<string | null>("coordenacao");
  const queue: Record<string, number> = {};
  reqs.filter((r) => r.status === "pendente").forEach((r) => (queue[r.agent_id] = (queue[r.agent_id] ?? 0) + 1));
  const here = agents.filter((a) => a.room === room);
  return (<>
    <PageHeader eyebrow="Planta" title="Escritório" description="Clique numa sala para ver quem está lá." />
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2"><OfficeMap agents={agents} queue={queue} selected={room} onSelect={setRoom} /></div>
      <Panel title={room ? ROOMS[room]?.label : "Sala"}>
        {here.length === 0 ? <Empty>Selecione uma sala.</Empty> : <ul className="space-y-3">{here.map((a) => (
          <li key={a.id}><Link to="/agentes/$slug" params={{ slug: a.slug }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted">
            <AgentAvatar agent={a} /><div className="flex-1"><p className="font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.role_title}</p></div><StatusPill status={a.status} /></Link></li>))}</ul>}
      </Panel>
    </div>
  </>);
}