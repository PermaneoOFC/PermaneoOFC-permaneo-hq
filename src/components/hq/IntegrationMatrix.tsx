import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, ShieldCheck } from "lucide-react";
import { Panel, Pill } from "@/components/hq/ui";

type Connection = { service: string; ready: boolean; access: string; detail: string };
type Result = { connections: Connection[]; github?: { accessible?: boolean; previewSha?: string | null }; vercel?: { accessible?: boolean; latestState?: string | null } };
const labels: Record<string, { name: string; agents: string; url: string; setup: string }> = {
  trello: { name: "Trello", agents: "Trello & Scrum · Project Manager", url: "https://trello.com/b/IfYN7SWi/demo-day", setup: "TRELLO_API_KEY + TRELLO_TOKEN + HQ_TRELLO_ENABLED=true (Preview)" },
  google_drive: { name: "Google Drive", agents: "Documentarista · Pesquisa & Dados", url: "https://drive.google.com/drive/folders/1gmRQFad9CgwEfo3MjVBEW66OVOEK-YAn", setup: "Configure OAuth Google Cloud e autorize a conta no painel abaixo" },
  github: { name: "GitHub", agents: "Front-end · Back-end · QA · Project Manager", url: "https://github.com/PermaneoOFC/PermaneoOFC-permaneo-hq", setup: "Repositório público: leitura sem chave; se privado, GITHUB_TOKEN somente leitura" },
  linkedin: { name: "LinkedIn", agents: "Marketing · Pitch", url: "https://www.linkedin.com/company/", setup: "OAuth com permissão de organização aprovada pelo LinkedIn. Publicação automática ainda não disponível" },
  vercel: { name: "Vercel", agents: "DevOps · Project Manager", url: "https://vercel.com/permaneo/permaneo-hq/deployments", setup: "VERCEL_API_TOKEN com acesso de leitura ao projeto na Preview" },
};
async function status(): Promise<Result> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Faça login no escritório para consultar as conexões.");
  const response = await fetch("/api/integrations", {
    headers: { Authorization: "Bearer " + data.session.access_token },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível verificar as integrações.");
  return response.json() as Promise<Result>;
}
export function IntegrationMatrix() {
  const query = useQuery({ queryKey: ["integration-matrix"], queryFn: status, staleTime: 30000 });
  return <Panel title="Conexões por agente" action={<Button type="button" size="sm" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"}/> Verificar</Button>}>
    <p className="mb-4 text-sm text-muted-foreground">Estado verificado pelo servidor. Os aplicativos conectados ao ChatGPT não são automaticamente autorizados no HQ. Permissões de leitura e escrita são diferentes.</p>
    {query.error && <p role="alert" className="mb-3 text-sm text-destructive">{query.error.message}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      {(query.data?.connections ?? []).map((entry) => {
        const info = labels[entry.service];
        if (!info) return null;
        return <div key={entry.service} className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <strong>{info.name}</strong>
            <Pill tone={entry.ready ? "success" : "warning"}>{entry.ready ? "Leitura autorizada" : "Pendente"}</Pill>
          </div>
          <p className="mt-1 text-xs font-medium">{info.agents}</p>
          <p className="mt-2 text-xs text-muted-foreground">{entry.detail}</p>
          <p className="mt-2 text-xs text-muted-foreground"><strong>Para ativar:</strong> {info.setup}</p>
          {entry.service !== "linkedin" && <a href={info.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline">Abrir serviço <ExternalLink className="size-3"/></a>}
          {entry.service === "linkedin" && <p className="mt-3 text-xs text-muted-foreground">Publicações geradas pelo Marketing ficam como propostas; a conta ou página deve ser autorizada no aplicativo próprio.</p>}
        </div>;
      })}
    </div>
    {!query.data && !query.error && <p className="text-sm text-muted-foreground">Consultando permissões reais…</p>}
    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4"/> Nenhum conector desta tela exclui arquivos, publica em redes sociais ou aciona deploys automaticamente.</p>
  </Panel>;
}
