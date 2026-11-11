import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { agentsQuery, requestsQuery } from "@/lib/hq";
import { OfficeMap } from "@/components/hq/OfficeMap";

export const Route = createFileRoute("/_authenticated/escritorio")({
  head: () => ({ meta: [{ title: "Andar Virtual — Permaneo HQ" }, { name: "description", content: "Explore as salas e os agentes do escritório virtual do Permaneo." }] }),
  component: Page,
});

function Page() {
  const agents = useQuery(agentsQuery).data ?? [];
  const requests = useQuery(requestsQuery).data ?? [];
  const [room, setRoom] = useState<string>("engenharia");
  const queue: Record<string, number> = {};
  requests.filter((request) => request.status === "pendente").forEach((request) => { queue[request.agent_id] = (queue[request.agent_id] ?? 0) + 1; });
  return <>
    <section className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Permaneo · escritório virtual</p><h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Andar virtual</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Cinco espaços de trabalho, conectados por um corredor central. Escolha uma sala para conhecer o time.</p></div>
    </section>
    <OfficeMap agents={agents} queue={queue} selected={room} onSelect={setRoom}/>
  </>;
}
