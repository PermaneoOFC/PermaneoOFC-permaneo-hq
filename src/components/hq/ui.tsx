import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { initials, STATUS_LABEL, type Agent } from "@/lib/hq";

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, action }: {
  title?: string; children: ReactNode; className?: string; action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>
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

const pill = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", {
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
});
export function Pill({ tone, children, className }: VariantProps<typeof pill> & { children: ReactNode; className?: string }) {
  return <span className={cn(pill({ tone }), className)}>{children}</span>;
}

const statusTone: Record<Agent["status"], VariantProps<typeof pill>["tone"]> = {
  disponivel: "success", aguardando_aprovacao: "warning", em_andamento: "info", pausado: "neutral", nao_configurado: "neutral",
};
const dot: Record<Agent["status"], string> = {
  disponivel: "bg-success", aguardando_aprovacao: "bg-warning", em_andamento: "bg-primary", pausado: "bg-muted-foreground", nao_configurado: "bg-muted-foreground",
};
export function StatusPill({ status }: { status: Agent["status"] }) {
  return <Pill tone={statusTone[status]}><span className={cn("size-1.5 rounded-full", dot[status])} />{STATUS_LABEL[status]}</Pill>;
}

export function AgentAvatar({ agent, size = "md" }: { agent: Pick<Agent, "name" | "status" | "is_coordinator">; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "size-8 text-[11px]" : size === "lg" ? "size-16 text-xl" : "size-11 text-sm";
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold",
      agent.is_coordinator ? "bg-hero text-primary-foreground" : "bg-accent text-accent-foreground", s)}>
      {initials(agent.name)}
      <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card", dot[agent.status])} />
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</div>;
}