import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Permaneo HQ — Central de Agentes do Demo Day" },
      { name: "description", content: "Coordene os 14 agentes do projeto Permaneo, o quadro Trello e o orçamento rumo ao Demo Day." },
      { property: "og:title", content: "Permaneo HQ — Central de Agentes do Demo Day" },
      { property: "og:description", content: "Coordene os 14 agentes do projeto Permaneo, o quadro Trello e o orçamento rumo ao Demo Day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-hero flex min-h-screen flex-col text-primary-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-6">
        <span className="font-display text-lg font-bold">Permaneo HQ</span>
        <Button asChild variant="secondary"><Link to="/auth">Entrar</Link></Button>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center p-6">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] opacity-80">Demo Day · Prevenção de evasão escolar</p>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.02] md:text-7xl">A central de agentes do Permaneo.</h1>
        <p className="mt-6 max-w-xl text-lg opacity-85">14 agentes, um quadro, uma meta. Acompanhe filas, decisões, custos e integrações com status real — sem execução fingida.</p>
        <div className="mt-10"><Button asChild size="lg" variant="secondary"><Link to="/painel">Abrir a central <ArrowRight /></Link></Button></div>
      </main>
    </div>
  );
}