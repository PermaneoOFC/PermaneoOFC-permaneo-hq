import { AgentAvatar } from "./ui";
import type { Agent } from "@/lib/hq";
import { identity } from "./identities";
import { WorkspaceArt } from "./WorkspaceArt";
export function AgentStudio({ agent }: { agent: Agent }) {
  const p = identity(agent.slug);
  return (
    <figure
      className="studio-scene mb-6 overflow-hidden rounded-2xl border"
      aria-label={`Escritório individual de ${agent.name}`}
    >
      <div className="studio-stage relative">
        <svg
          viewBox="0 0 960 460"
          className="w-full"
          role="img"
          aria-label={`${p.label}: mesa, equipamentos e materiais de ${agent.name}`}
        >
          <WorkspaceArt slug={agent.slug} />
        </svg>
        <div className="studio-avatar">
          <AgentAvatar agent={agent} size="lg" />
        </div>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t bg-card px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-primary">
            Escritório pessoal · {agent.name}
          </p>
          <p className="mt-1 text-lg font-semibold">{p.label}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          Ambiente ilustrado · {agent.role_title}
        </span>
      </figcaption>
    </figure>
  );
}
