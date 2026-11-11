import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { agentsQuery, requestsQuery, ROOMS, REQUEST_STATUS_LABEL } from "@/lib/hq";
import { PageHeader, Panel, AgentAvatar, StatusPill, Empty, Pill } from "@/components/hq/ui";
import { RequestDialog } from "@/components/hq/RequestDialog";
import { Button } from "@/components/ui/button";
import { AgentStudio } from "@/components/hq/AgentStudio";

export const Route = createFileRoute("/_authenticated/agentes/$slug")({
  head: () => ({ meta: [{ title: "Perfil do agente — Permaneo HQ" }, { name: "description", content: "Perfil, fila e histórico do agente." }, { property: "og:title", content: "Perfil do agente — Permaneo HQ" }, { property: "og:description", content: "Perfil, fila e histórico do agente." }] }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const agents = useQuery(agentsQuery).data ?? [];
  const reqs = useQuery(requestsQuery).data ?? [];
  const a = agents.find((x) => x.slug === slug);
  if (!a) return <Empty>Carregando agente…</Empty>;
  const mine = reqs.filter((r) => r.agent_id === a.id);
  const open = mine.filter((r) => ["pendente", "aprovado", "em_andamento"].includes(r.status));
  const done = mine.filter((r) => !open.includes(r));
  return (<>
    <PageHeader eyebrow={ROOMS[a.room]?.label} title={a.name} description={a.description}
      actions={<><RequestDialog agent={a} /><Button variant="outline" disabled title="Backend de IA não configurado"><Bot /> Executar agente</Button></>} />
    <AgentStudio agent={a} />
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Perfil"><div className="flex items-center gap-4"><AgentAvatar agent={a} size="lg" /><div><p className="font-medium">{a.role_title}</p><StatusPill status={a.status} /></div></div>
        <h3 className="mb-2 mt-5 text-sm font-semibold">Atribuições</h3><ul className="list-disc space-y-1 pl-5 text-sm">{a.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="mt-5 text-xs text-muted-foreground">Execução por IA desativada: nenhum backend de IA configurado. Mudanças no Trello/GitHub exigirão aprovação humana.</p></Panel>
      <Panel title={`Fila (${open.length})`}>{open.length ? <ul className="space-y-2">{open.map((r) => <li key={r.id} className="rounded-lg border p-3 text-sm"><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.priority} · <Pill>{REQUEST_STATUS_LABEL[r.status]}</Pill></p></li>)}</ul> : <Empty>Fila vazia.</Empty>}</Panel>
      <Panel title="Histórico">{done.length ? <ul className="space-y-2 text-sm">{done.map((r) => <li key={r.id}>{r.title} — {REQUEST_STATUS_LABEL[r.status]}</li>)}</ul> : <Empty>Sem histórico.</Empty>}</Panel>
    </div>
  </>);
}