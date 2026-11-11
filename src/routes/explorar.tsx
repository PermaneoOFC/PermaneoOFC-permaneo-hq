import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, LockKeyhole, Users } from "lucide-react";
import { OfficeMap } from "@/components/hq/OfficeMap";
import { demoAgents } from "@/lib/demo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/explorar")({
  head: () => ({ meta: [
    { title: "Explorar o escritório — Permaneo HQ" },
    { name: "description", content: "Conheça livremente as salas e os agentes do Permaneo HQ." },
  ] }),
  component: PublicOffice,
});

function PublicOffice() {
  const [selected, setSelected] = useState("engenharia");
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b pb-5">
          <Link to="/" className="flex items-center gap-3 font-display font-bold">
            <img src="/permaneo-logo.svg" alt="Permaneo" className="size-10 rounded bg-white p-1" />
            Permaneo HQ
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/"><ArrowLeft className="size-4" /> Home</Link></Button>
            <Button asChild><Link to="/painel"><LockKeyhole className="size-4" /> Área da equipe</Link></Button>
          </div>
        </header>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Acesso livre · somente leitura</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Conheça nosso escritório virtual</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Explore as cinco salas e conheça nossos 14 agentes. Não precisa de login para visitar. Execuções de IA, dados internos e alterações exigem acesso autorizado.</p>
        </div>
        <OfficeMap agents={demoAgents} publicView selected={selected} onSelect={setSelected} />
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2 text-sm"><Users className="size-4 text-primary" /> O escritório está aberto para visitação, sem mostrar tarefas ou dados privados.</p>
          <Button asChild><Link to="/painel">Trabalhar com os agentes</Link></Button>
        </div>
      </div>
    </main>
  );
}
