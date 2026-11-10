import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Building2, Cable, KanbanSquare, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, Users, Wallet, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/escritorio", label: "Escritório", icon: Building2 },
  { to: "/agentes", label: "Agentes", icon: Users },
  { to: "/tarefas", label: "Tarefas", icon: KanbanSquare },
  { to: "/integracoes", label: "Integrações", icon: Cable },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/documentacao", label: "Documentação", icon: BookOpen },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell() {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-sidebar-primary" }}>
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );
  const footer = (
    <div className="mt-auto flex gap-2 border-t border-sidebar-border pt-4">
      <button onClick={toggle} aria-label="Alternar tema" className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />} {dark ? "Claro" : "Escuro"}
      </button>
      <button aria-label="Sair" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
        className="rounded-xl px-3 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent"><LogOut className="size-4" /></button>
    </div>
  );
  const brand = (
    <Link to="/painel" className="mb-8 flex items-center gap-3 px-2">
      <span className="flex size-11 items-center justify-center rounded-xl bg-white/90 p-1.5 shadow-sm"><img src="/permaneo-logo.svg" alt="Símbolo oficial do Permaneo" className="h-full w-full object-contain" /></span>
      <span className="leading-tight"><span className="block font-display font-bold text-sidebar-accent-foreground">Permaneo HQ</span><span className="text-xs text-sidebar-foreground/60">Escritório virtual · Central de Agentes</span></span>
    </Link>
  );
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar p-4 lg:flex">{brand}{nav}{footer}</aside>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <span className="font-display font-bold text-sidebar-accent-foreground">Permaneo HQ</span>
        <button aria-label="Menu" onClick={() => setOpen(true)} className="text-sidebar-foreground"><Menu /></button>
      </header>
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "block" : "hidden")}>
        <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
        <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-4">
          <button aria-label="Fechar" onClick={() => setOpen(false)} className="mb-2 self-end text-sidebar-foreground"><X /></button>
          {brand}{nav}{footer}
        </aside>
      </div>
      <main className="px-4 py-8 md:px-8 lg:ml-64 lg:px-12"><div className="mx-auto max-w-7xl"><Outlet /></div></main>
    </div>
  );
}