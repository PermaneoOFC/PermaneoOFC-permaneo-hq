import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Bot, ClipboardList, Sparkles, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  agentsQuery,
  requestsQuery,
  tasksQuery,
  syncLogsQuery,
  REQUEST_STATUS_LABEL,
} from "@/lib/hq";
import { DEMO_MODE } from "@/lib/demo";
import { PageHeader, Panel, Stat, Empty, Pill } from "@/components/hq/ui";
import { OfficeMap } from "@/components/hq/OfficeMap";
import { WorkflowPanel } from "@/components/hq/WorkflowPanel";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Permaneo HQ" },
      { name: "description", content: "Um retrato leve do escritório virtual do Permaneo." },
      { property: "og:title", content: "Painel — Permaneo HQ" },
      { property: "og:description", content: "Um retrato leve do escritório virtual do Permaneo." },
    ],
  }),
  component: Page,
});

function Page() {
  const agents = useQuery(agentsQuery).data ?? [];
  const reqs = useQuery(requestsQuery).data ?? [];
  const tasks = useQuery(tasksQuery).data ?? [];
  const logs = useQuery(syncLogsQuery).data ?? [];
  const queue: Record<string, number> = {};
  reqs
    .filter((request) => request.status === "pendente")
    .forEach((request) => {
      queue[request.agent_id] = (queue[request.agent_id] ?? 0) + 1;
    });
  const agentName = (id: string) => agents.find((agent) => agent.id === id)?.name ?? "—";

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Workspace / Visão geral"
          title="Seu ponto de partida."
          description={
            DEMO_MODE
              ? "Este é um retrato demonstrativo do nosso espaço, sem dados ao vivo."
              : "Um panorama do que está acontecendo na nossa central."
          }
        />
        {DEMO_MODE && (
          <Pill tone="demo">
            <Sparkles className="size-3.5" />
            Modo demonstração
          </Pill>
        )}
      </div>
      <div className="mb-7"><WorkflowPanel /></div>
      <section
        aria-label="Resumo do escritório"
        className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          label="Pessoas na equipe"
          value="5"
          hint="Todo mundo no mesmo espaço"
          icon={UsersRound}
          tone="peach"
        />
        <Stat
          label="Agentes"
          value={agents.length}
          hint="14 perfis para conhecer"
          icon={Bot}
          tone="mint"
        />
        <Stat
          label="Pedidos na fila"
          value={reqs.filter((request) => request.status === "pendente").length}
          hint={DEMO_MODE ? "Fila demonstrativa vazia" : "Acompanhe os próximos passos"}
          icon={ClipboardList}
          tone="lavender"
        />
        <Stat
          label="Trello ao vivo"
          value={DEMO_MODE ? "—" : tasks.length}
          hint={
            DEMO_MODE
              ? "Nenhuma sincronização nesta demo"
              : tasks.length
                ? "Cards sincronizados"
                : "Ainda sem cards sincronizados"
          }
          icon={Activity}
          tone="sky"
        />
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)]">
        <Panel
          title="Um giro pelo escritório"
          action={
            <Link
              to="/escritorio"
              className="group inline-flex items-center gap-1 text-sm font-bold text-primary"
            >
              Passear{" "}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          }
        >
          <p className="mb-4 text-sm text-muted-foreground">
            Cada sala tem seu clima. Clique em uma delas para espiar quem está por lá.
          </p>
          <OfficeMap agents={agents} queue={queue} />
        </Panel>
        <Panel
          title="Atividade da equipe"
          action={<Activity className="size-4 text-muted-foreground" />}
        >
          {reqs.length === 0 && logs.length === 0 ? (
            <div className="space-y-4">
              <Empty>
                {DEMO_MODE
                  ? "Nenhuma atividade real na demonstração."
                  : "Sem atividades por enquanto."}
              </Empty>
              <p className="rounded-2xl bg-secondary p-4 text-sm leading-relaxed text-muted-foreground">
                Explore as salas e conheça as atribuições dos especialistas. A demonstração não
                executa agentes nem sincroniza atividades.
              </p>
            </div>
          ) : (
            <ul className="space-y-3 text-sm">
              {reqs.slice(0, 8).map((request) => (
                <li key={request.id} className="rounded-2xl bg-muted/70 p-3">
                  <p className="font-semibold">{request.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {agentName(request.agent_id)} ·{" "}
                    <Pill>{REQUEST_STATUS_LABEL[request.status]}</Pill>
                  </p>
                </li>
              ))}
              {logs.slice(0, 4).map((log) => (
                <li
                  key={log.id}
                  className="rounded-2xl bg-muted/70 p-3 text-xs text-muted-foreground"
                >
                  Trello: {log.status} — {log.message}
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/agentes"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary"
          >
            Conhecer os agentes <ArrowRight className="size-4" />
          </Link>
        </Panel>
      </div>
    </>
  );
}
