import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Bot, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/hq/ui";
import { OfficeMap } from "@/components/hq/OfficeMap";
import { demoAgents } from "@/lib/demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Permaneo HQ" },
      { name: "description", content: "Nosso espaço para criar, organizar e fazer acontecer." },
    ],
  }),
  component: Index,
});
function Index() {
  const agents = demoAgents;
  const [selectedRoom, setSelectedRoom] = useState("engenharia");
  return (
    <main className="home-page min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img src="/permaneo-logo.svg" className="size-10 rounded bg-white p-1" alt="Permaneo" />
          <span className="font-display font-bold">Permaneo HQ</span>
        </Link>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-8 md:grid-cols-2 md:px-10 md:py-14">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Creative office · Demo Day
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl leading-[1.02]">
            Boas ideias.
            <br />
            <span className="text-primary">Um lugar para acontecer.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Nosso espaço para criar, organizar e fazer acontecer.
          </p>
          <Button asChild className="mt-7 rounded-md">
            <Link to="/auth">
              Entrar no escritório <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">Área interna protegida; acesso sujeito à aprovação.</p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />5 integrantes
            </span>
            <span className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              14 agentes
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />5 salas
            </span>
          </div>
        </div>
        <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#1b343b] shadow-lg">
          <div className="bg-gradient-to-br from-[#1a3039] via-[#23545d] to-[#18433f] px-6 py-8 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#a8e0ed]">Nosso escritório, nossa equipe</p>
            <h2 className="mt-3 mb-6 text-2xl font-bold text-white">Avatares que representam 14 especialidades.</h2>
            <div className="grid grid-cols-4 gap-3">
              {agents.slice(0, 8).map((agent) => (
                <div key={agent.id} className="flex flex-col items-center rounded-lg border border-white/10 bg-white/10 p-2 text-center">
                  <AgentAvatar agent={agent} size="md" />
                  <span className="mt-2 line-clamp-2 text-[10px] leading-tight text-white">{agent.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-[#d3e6e5]">Conheça os agentes no andar virtual abaixo.</p>
          </div>
          <figcaption className="flex items-center justify-between gap-2 p-4 text-sm">
            <span>Permaneo · escritório criativo</span>
            <span className="text-muted-foreground">Demo Day</span>
          </figcaption>
        </figure>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-14 md:px-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Conheça o espaço</p>
            <h2 className="mt-1 text-2xl font-bold">O andar virtual</h2>
          </div>
          <Link to="/auth" className="flex items-center gap-1 text-sm text-primary">
            Acessar escritório <ArrowRight className="size-4" />
          </Link>
        </div>
        <OfficeMap agents={agents} selected={selectedRoom} onSelect={setSelectedRoom} />
        <div className="home-team-feature mt-12 grid gap-6 rounded-2xl border p-7 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">O lado humano do HQ</p>
            <h2 className="mt-3 text-3xl font-bold">5 pessoas. Uma construção coletiva.</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              A equipe dá direção às ideias. Os agentes organizam as especialidades em um espaço
              compartilhado de criação, pesquisa e desenvolvimento.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Users className="size-12 text-primary" />
            <span className="font-display text-7xl font-bold">05</span>
            <span className="text-xs text-muted-foreground">
              integrantes
              <br />
              na equipe
            </span>
          </div>
        </div>
        <div className="mb-6 mt-12 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">
              Conheça seus especialistas
            </p>
            <h2 className="mt-2 text-3xl font-bold">Talentos que se complementam.</h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">
            14 escritórios para explorar
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <Link
              key={a.id}
              to="/agentes/$slug"
              params={{ slug: a.slug }}
              className="agent-directory-card flex items-center gap-3 rounded-xl border bg-card p-4"
            >
              <AgentAvatar agent={a} size="md" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{a.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{a.role_title}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="border-t px-5 py-5 text-center text-xs text-muted-foreground">
        Permaneo HQ · Prévia ilustrativa · acesso interno mediante aprovação
      </footer>
    </main>
  );
}
