import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Cable,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/demo";
import { DemoBanner } from "@/components/hq/ui";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/escritorio", label: "Escritório", icon: Building2 },
  { to: "/agentes", label: "Agentes", icon: Users },
  { to: "/tarefas", label: "Tarefas", icon: KanbanSquare },
  { to: "/integracoes", label: "Integrações", icon: Cable },
] as const;

export function AppShell() {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className="group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-sidebar-foreground/80 transition-all hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
          activeProps={{ className: "!bg-white/15 !text-white shadow-sm" }}
        >
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );
  const footer = (
    <div className="mt-auto flex gap-2 border-t border-sidebar-border pt-4">
      <button
        onClick={toggle}
        aria-label="Alternar tema"
        className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}{" "}
        {dark ? "Claro" : "Escuro"}
      </button>
      {!DEMO_MODE && (
        <button
          aria-label="Sair"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
          className="rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      )}
    </div>
  );
  const brand = (
    <Link to="/painel" className="mb-5 flex items-center gap-3 px-2">
      <span className="flex size-11 items-center justify-center rounded-xl bg-white/90 p-1.5 shadow-sm">
        <img
          src="/permaneo-logo.svg"
          alt="Símbolo oficial do Permaneo"
          className="h-full w-full object-contain"
        />
      </span>
      <span className="leading-tight">
        <span className="block font-display font-bold text-sidebar-accent-foreground">
          Permaneo HQ
        </span>
        <span className="text-xs text-sidebar-foreground/60">
          Escritório virtual · Central de Agentes
        </span>
      </span>
    </Link>
  );
  return (
    <div className="min-h-screen bg-background">
      <aside className="hq-sidebar fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar p-5 text-sidebar-foreground shadow-xl lg:flex">
        {brand}
        <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.07] p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white/85">
            <span>Nosso time</span>
            <span className="rounded-full bg-white/10 px-2 py-1">5 pessoas</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            Cinco pessoas. Quatorze especialidades. Um lugar para construir.
          </p>
        </div>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          Explorar
        </p>
        {nav}
        {footer}
      </aside>
      <header className="hq-sidebar sticky top-0 z-30 flex items-center justify-between px-4 py-3 text-white shadow-md lg:hidden">
        <div>
          <span className="font-display font-bold">Permaneo HQ</span>
          {DEMO_MODE && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 align-middle text-[10px]">
              <Sparkles className="size-3" />
              Demo
            </span>
          )}
        </div>
        <button aria-label="Menu" onClick={() => setOpen(true)} className="text-sidebar-foreground">
          <Menu />
        </button>
      </header>
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "block" : "hidden")}>
        <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
        <aside className="hq-sidebar absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-5 text-sidebar-foreground shadow-2xl">
          <button
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="mb-2 self-end text-sidebar-foreground"
          >
            <X />
          </button>
          {brand}
          <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.07] p-3 text-xs font-semibold text-white/80">
            Nosso time{" "}
            <span className="float-right rounded-full bg-white/10 px-2 py-1">5 pessoas</span>
            <p className="mt-2 font-normal leading-relaxed text-white/60">
              Cinco pessoas. Quatorze especialidades. Um lugar para construir.
            </p>
          </div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Explorar
          </p>
          {nav}
          {footer}
        </aside>
      </div>
      <main className="px-4 py-8 md:px-8 lg:ml-64 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <DemoBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
