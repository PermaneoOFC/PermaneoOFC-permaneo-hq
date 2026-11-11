import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { getTrelloStatus, syncTrello } from "@/lib/trello.functions";
import { syncLogsQuery, tasksQuery } from "@/lib/hq";
import { supabase } from "@/lib/supabase";
import { ExternalLink, FolderOpen } from "lucide-react";
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
  const tasks = useQuery(tasksQuery).data ?? [];
  const docs = useQuery({ queryKey: ["hq-drive-links"], queryFn: async () => {
    const { data, error } = await supabase.from("documents").select("id,title,url,kind").not("url","is",null).order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    return data ?? [];
  } }).data ?? [];
  const driveDocs = docs.filter((d) => d.url?.startsWith("https://drive.google.com/") || d.url?.startsWith("https://docs.google.com/"));
  const trelloTasks = tasks.filter((t) => t.source === "trello" && t.board_id === "IfYN7SWi");
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
        <p className="mb-3 rounded-lg bg-muted p-3 text-xs">Alterações reais no quadro: {st.data?.writesConfigured ? "Credenciais de escrita configuradas. Ações exigem proposta e aprovação." : "Desativadas. A aprovação de proposta não altera o Trello até que TRELLO_API_KEY, TRELLO_TOKEN e HQ_TRELLO_WRITES_ENABLED=true estejam configurados na Preview."}</p>
        <Button onClick={run} disabled={busy || !canEdit || !st.data?.configured} title={!canEdit ? "Apenas editores podem sincronizar" : undefined}><RefreshCw className={busy ? "animate-spin" : ""} /> Sincronizar agora</Button>
        <p className="mt-4 text-sm text-muted-foreground">Último espelho importado: <strong>{trelloTasks.length} cards</strong>. Uma nova sincronização só é possível após configurar a chave e o token Trello neste projeto.</p>
        <a className="mt-2 inline-flex items-center gap-2 text-sm font-medium underline" href="https://trello.com/b/IfYN7SWi/demo-day" target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Abrir quadro oficial</a>
        <h3 className="mb-2 mt-5 text-sm font-semibold">Logs</h3>
        {logs.length ? <ul className="space-y-1 text-xs">{logs.map((l) => <li key={l.id}>{new Date(l.created_at).toLocaleString("pt-BR")} — {l.status}: {l.message}</li>)}</ul> : <Empty>Nenhuma sincronização.</Empty>}
      </Panel>
      <Panel title="Google Drive · Permaneo" action={<Pill tone={driveDocs.length ? "success" : "warning"}>{driveDocs.length ? `${driveDocs.length} referências` : "Sem referências"}</Pill>}>
        <p className="text-sm text-muted-foreground">Links indexados no HQ. Os documentos permanecem no Drive e só abrem para quem já possui permissão. A sincronização automática via OAuth ainda não está autorizada.</p>
        <p className="mt-2 rounded-lg bg-muted p-3 text-xs">O agente Documentarista pode criar documentos internos no HQ. Para criar ou editar arquivos diretamente no Drive, é preciso conectar uma aplicação Google OAuth com permissão explícita. Nenhuma permissão será presumida.</p>
        <a className="mt-3 inline-flex items-center gap-2 text-sm font-medium underline" href="https://drive.google.com/drive/folders/1gmRQFad9CgwEfo3MjVBEW66OVOEK-YAn" target="_blank" rel="noopener noreferrer"><FolderOpen size={16} /> Abrir a pasta central <ExternalLink size={14}/></a>
        <ul className="mt-4 max-h-64 space-y-2 overflow-auto text-sm">
          {driveDocs.filter(d => d.kind !== "pasta").map(d => <li key={d.id}><a className="flex items-center gap-2 hover:underline" href={d.url!} rel="noopener noreferrer" target="_blank"><ExternalLink size={13} /><span className="truncate">{d.title}</span></a></li>)}
        </ul>
      </Panel>
      <Panel title="GitHub · Código" action={<Pill tone="warning">Acesso por link</Pill>}>
        <p className="text-sm text-muted-foreground">Repositório oficial do escritório. Os agentes podem sugerir mudanças, mas o HQ não faz commits nem merges automaticamente.</p>
        <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline" href="https://github.com/PermaneoOFC/PermaneoOFC-permaneo-hq/tree/backend/ativacao-supabase" rel="noopener noreferrer" target="_blank"><ExternalLink size={14}/> Abrir código da Preview</a>
      </Panel>
      <Panel title="Vercel · Hospedagem" action={<Pill tone="warning">Acesso por link</Pill>}>
        <p className="text-sm text-muted-foreground">Projeto hospedado na equipe Permaneo. Deploys continuam sujeitos à revisão humana e às permissões da conta Vercel.</p>
        <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline" href="https://vercel.com/permaneo/permaneo-hq/deployments" rel="noopener noreferrer" target="_blank"><ExternalLink size={14}/> Abrir deploys do HQ</a>
      </Panel>
      <Panel title="Supabase · Banco de dados" action={<Pill tone="success">Backend configurado</Pill>}>
        <p className="text-sm text-muted-foreground">Autenticação, permissões, agentes, documentos e espelho de tarefas do escritório. O acesso ao painel administrativo depende da sua conta Supabase.</p>
        <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline" href="https://supabase.com/dashboard/project/uxheyeqtylarkhqyqics" target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Abrir Supabase</a>
      </Panel>
    </div>
    <div className="mt-6"><TeamAccessPanel /></div>
  </>);
}
