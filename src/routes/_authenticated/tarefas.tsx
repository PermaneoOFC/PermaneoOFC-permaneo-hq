import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { tasksQuery, TRELLO_KNOWN_LISTS, TRELLO_REFERENCE_CARDS, TRELLO_BOARD_URL } from "@/lib/hq";
import { PageHeader, Panel, Pill, Empty } from "@/components/hq/ui";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — Permaneo HQ" }, { name: "description", content: "Cards espelhados do quadro Trello Demo Day." }, { property: "og:title", content: "Tarefas — Permaneo HQ" }, { property: "og:description", content: "Cards espelhados do quadro Trello Demo Day." }] }),
  component: Page,
});

function Page() {
  const demo = import.meta.env["VITE_HQ_DEMO_MODE"] === "true";
  const tasks = useQuery(tasksQuery).data ?? [];
  const lists = Array.from(new Set([...TRELLO_KNOWN_LISTS, ...tasks.map((t) => t.list_name ?? "Sem lista")]));
  return (<>
    {demo && <p className="mb-4 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">Demonstração — exemplos estáticos, sem dados do Trello ou sincronização.</p>}
    <PageHeader eyebrow="Trello" title="Tarefas" description="Somente cards realmente sincronizados aparecem nas colunas." actions={<a className="text-sm text-primary" href={TRELLO_BOARD_URL} target="_blank" rel="noreferrer">Abrir quadro ↗</a>} />
    <Panel title="Referências do quadro, não sincronizados" className="mb-6" action={<Pill tone="demo">Exemplo</Pill>}>
      <div className="flex flex-wrap gap-2">{TRELLO_REFERENCE_CARDS.map((c) => <span key={c} className="rounded-lg border border-dashed px-3 py-2 text-sm">{c}</span>)}</div>
    </Panel>
    <div className="flex gap-4 overflow-x-auto pb-4">{lists.map((l) => { const items = tasks.filter((t) => (t.list_name ?? "Sem lista") === l); return (
      <div key={l} className="w-72 shrink-0 rounded-2xl bg-muted p-3"><p className="mb-3 text-sm font-semibold">{l} <span className="text-muted-foreground">({items.length})</span></p>
        {items.length ? <div className="space-y-2">{items.map((t) => <a key={t.id} href={t.url ?? "#"} target="_blank" rel="noreferrer" className="block rounded-xl bg-card p-3 text-sm shadow-card">{t.name}</a>)}</div> : <Empty>Não sincronizado</Empty>}
      </div>); })}</div>
  </>);
}
