import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { demoAgents } from "@/lib/demo";
import { ROOMS } from "@/lib/hq";
import { AgentAvatar, Empty } from "@/components/hq/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/explorar/$slug")({
  head: () => ({ meta: [{ title: "Agentes — Permaneo HQ" }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { slug } = Route.useParams();
  const agent = demoAgents.find((candidate) => candidate.slug === slug);
  if (!agent) return <div className="mx-auto max-w-xl p-8"><Empty>Agente não encontrado.</Empty><Link to="/explorar">Voltar ao escritório</Link></div>;
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" asChild><Link to="/explorar"><ArrowLeft className="size-4" /> Voltar às salas</Link></Button>
          <Button asChild><Link to="/agentes/$slug" params={{ slug: agent.slug }}><LockKeyhole className="size-4" /> Trabalhar com agente</Link></Button>
        </div>
        <section className="rounded-2xl border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{ROOMS[agent.room]?.label ?? "Agente"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <AgentAvatar agent={agent} size="lg" />
            <div>
              <h1 className="font-display text-3xl font-bold">{agent.name}</h1>
              <p className="mt-1 text-muted-foreground">{agent.role_title}</p>
            </div>
          </div>
          <p className="mt-5 text-sm">{agent.description}</p>
          <h2 className="mt-6 font-semibold">O que este agente faz</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {agent.responsibilities.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">Perfil público informativo. Nenhuma IA está sendo executada e nenhum dado privado foi carregado. Para criar tarefas ou usar créditos da equipe, entre com uma conta aprovada.</p>
        </section>
      </div>
    </main>
  );
}
