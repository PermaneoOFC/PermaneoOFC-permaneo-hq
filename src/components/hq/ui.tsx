import { Portrait } from "./Portrait";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type Agent } from "@/lib/hq";
import { DEMO_MODE } from "@/lib/demo";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("hq-panel rounded-2xl border bg-card p-5 shadow-card", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const pill = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        info: "bg-accent text-accent-foreground",
        success: "bg-success/15 text-success",
        warning: "bg-warning/25 text-warning-foreground dark:text-warning",
        danger: "bg-destructive/15 text-destructive",
        demo: "border border-dashed border-warning bg-warning/15 text-warning-foreground dark:text-warning",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);
export function Pill({
  tone,
  children,
  className,
}: VariantProps<typeof pill> & { children: ReactNode; className?: string }) {
  return <span className={cn(pill({ tone }), className)}>{children}</span>;
}

const statusTone: Record<Agent["status"], VariantProps<typeof pill>["tone"]> = {
  disponivel: "success",
  aguardando_aprovacao: "warning",
  em_andamento: "info",
  pausado: "neutral",
  nao_configurado: "neutral",
};
const dot: Record<Agent["status"], string> = {
  disponivel: "bg-success",
  aguardando_aprovacao: "bg-warning",
  em_andamento: "bg-primary",
  pausado: "bg-muted-foreground",
  nao_configurado: "bg-muted-foreground",
};
export function StatusPill({ status }: { status: Agent["status"] }) {
  return (
    <Pill tone={statusTone[status]}>
      <span className={cn("size-1.5 rounded-full", dot[status])} />
      {STATUS_LABEL[status]}
    </Pill>
  );
}

export function AgentAvatar({
  agent,
  size = "md",
}: {
  agent: Pick<Agent, "name" | "status" | "is_coordinator" | "slug">;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? 38 : size === "lg" ? 96 : 52;
  return (
    <span
      className="agent-portrait relative inline-flex shrink-0"
      style={{ width: px, height: px * 1.1 }}
    >
      <Portrait slug={agent.slug} name={agent.name} />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card",
          dot[agent.status],
        )}
      />
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "mint",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "mint" | "peach" | "lavender" | "sky";
}) {
  return (
    <div
      className={cn(
        "home-stat home-tint-" + tone,
        "rounded-3xl border border-white/70 p-5 shadow-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex size-10 items-center justify-center rounded-2xl bg-white/70 text-primary">
            <Icon className="size-5" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"
    >
      <strong>Demonstração — sem dados ao vivo.</strong> Conteúdo local somente para visualização;
      sem login, gravações, sincronização Trello ou execução de agentes.
    </div>
  );
}
