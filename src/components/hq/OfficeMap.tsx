import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ROOMS, type Agent } from "@/lib/hq";
import { AgentAvatar } from "./ui";

const layout: Record<string, string> = {
  coordenacao: "md:col-span-2 md:row-span-1",
  engenharia: "md:col-span-2 md:row-span-2",
  estudio: "md:col-span-1 md:row-span-2",
  biblioteca: "md:col-span-2 md:row-span-1",
  negocios: "md:col-span-1 md:row-span-1",
};

export function OfficeMap({ agents, selected, onSelect, queue }: {
  agents: Agent[]; selected?: string | null; onSelect?: (room: string) => void; queue: Record<string, number>;
}) {
  return (
    <div className="grid auto-rows-[minmax(150px,auto)] gap-3 rounded-3xl border-8 border-room-wall bg-room-wall p-1 md:grid-cols-5">
      {Object.entries(ROOMS).map(([key, room]) => {
        const here = agents.filter((a) => a.room === key);
        return (
          <button key={key} type="button" onClick={() => onSelect?.(key)}
            className={cn("room-floor group relative flex flex-col rounded-2xl p-4 text-left transition-all hover:shadow-lift focus-visible:outline-2 focus-visible:outline-ring",
              layout[key], selected === key && "ring-2 ring-primary")}>
            <span className="absolute left-1/2 top-0 h-1.5 w-12 -translate-x-1/2 rounded-b bg-card" aria-hidden />
            <div className="mb-3">
              <p className="font-display text-sm font-bold">{room.label}</p>
              <p className="text-xs text-muted-foreground">{room.hint}</p>
            </div>
            <div className="flex flex-1 flex-wrap content-start gap-3">
              {here.map((a) => (
                <Link key={a.id} to="/agentes/$slug" params={{ slug: a.slug }} onClick={(e) => e.stopPropagation()}
                  className="flex w-20 flex-col items-center gap-1 rounded-xl bg-card/80 p-2 text-center shadow-card transition-transform hover:-translate-y-0.5">
                  <AgentAvatar agent={a} size="sm" />
                  <span className="line-clamp-2 text-[11px] font-medium leading-tight">{a.name}</span>
                  {(queue[a.id] ?? 0) > 0 && <span className="text-[10px] text-primary">{queue[a.id]} na fila</span>}
                </Link>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}