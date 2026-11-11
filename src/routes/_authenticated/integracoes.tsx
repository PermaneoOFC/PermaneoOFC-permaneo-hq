import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { getTrelloStatus, syncTrello } from "@/lib/trello.functions";
import { syncLogsQuery } from "@/lib/hq";
import { PageHeader, Panel, Pill, Empty } from "@/components/hq/ui";
import { TeamAccessPanel } from "@/components/hq/TeamAccessPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { DEMO_MODE } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated/integracoes")({
  head: () => ({ meta: [{ title: "Integrações — Permaneo HQ" }, { name: "description", content: "Status real do Trello, GitHub, Google Drive e Vercel." }, { property: "og:title", content: "Integrações — Permaneo HQ" }, { property: "og:description", content: "Status real do Trello, GitHub, Google Drive e Vercel." }] }),
  component: Page,
});

function Page() {
  return DEMO_MODE ? <DemoIntegrations /> : <LiveIntegrations />;
}

function DemoIntegrations() {
  return <>
    <PageHeader eyebrow="Demonstração" title="Integrações" description="Conectores não são consultados nem executados neste modo." />
    <div className="grid gap-6 md:grid-cols-2">
      <Panel title="Trello" action={<Pill tone="warning">Sem conexão ao vivo</Pill>}>
        <p className="text-sm text-muted-foreground">Não há leitura do quadro, sincronização nem gravação de tarefas na demonstração.</p>
        <Button className="mt-4" disabled><RefreshCw /> Sincronização indisponível</Button>
      </Panel>
      <Panel title="Acesso da equipe" action={<Pill>Somente leitura</Pill>}>
        <p className="text-sm text-muted-foreground">Login, aprovação de integrantes e dados privados exigem um backend próprio configurado.</p>
      </Panel>
    </div>
  </>;
}

function LiveIntegrations() {
  const status = useServerFn(getTrelloStatus);
  const sync = useServerFn(syncTrello);
  const qc = useQueryClient();
  const st = useQuery({ queryKey: ["trello-status"], queryFn: () => status() });
  const logs = useQuery(syncLogsQuery).data ?? [];
  const [busy, setBusy] = useState(false);
  const { canEdit } = useAuth();
  async function run() {
    setBusy(true);
    try {
      const r = await sync();
      if (r.ok) toast.success(`Sincronizado: ${r.cards} cards`);
      else toast.error(r.error);
    }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false); qc.invalidateQueries();
  }
  return (<>
    <PageHeader eyebrow="Conectores" title="Integrações" description="Nenhuma conexão é presumida. Tokens ficam somente no servidor." />
    <div className="grid gap-6 md:grid-cols-2">
      <Panel title="Trello · Demo Day" action={st.isLoading ? <Pill>Verificando…</Pill> : st.data?.configured ? <Pill tone="success">Configurado</Pill> : <Pill tone="danger">Não conectado</Pill>}>
        {st.error && <p className="mb-3 text-sm text-destructive">{(st.error as Error).message}</p>}
        {!st.data?.configured && <p className="mb-4 text-sm text-muted-foreground">Para conectar: gere uma chave e um token em trello.com/power-ups/admin e peça para salvá-los como segredos TRELLO_API_KEY e TRELLO_TOKEN nas configurações do projeto. Acesso somente leitura.</p>}
        <Button onClick={run} disabled={busy || !canEdit || !st.data?.configured} title={!canEdit ? "Apenas editores podem sincronizar" : undefined}><RefreshCw className={busy ? "animate-spin" : ""} /> Sincronizar agora</Button>
        <h3 className="mb-2 mt-5 text-sm font-semibold">Logs</h3>
        {logs.length ? <ul className="space-y-1 text-xs">{logs.map((l) => <li key={l.id}>{new Date(l.created_at).toLocaleString("pt-BR")} — {l.status}: {l.message}</li>)}</ul> : <Empty>Nenhuma sincronização.</Empty>}
      </Panel>
      {["GitHub", "Google Drive", "Vercel"].map((n) => (
        <Panel key={n} title={n} action={<Pill tone="warning">A configurar</Pill>}>
          <p className="text-sm text-muted-foreground">Sem autenticação configurada. Será conectado via conector seguro, com aprovação humana para qualquer alteração.</p>
          <Button variant="outline" className="mt-4" disabled>Configurar</Button>
        </Panel>))}
    </div>
    <div className="mt-6"><TeamAccessPanel /></div>
  </>);
}
