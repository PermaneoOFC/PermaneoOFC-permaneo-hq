import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpen, FileText, ExternalLink, Search, ArrowRight } from "lucide-react";
import { agentsQuery, tasksQuery, requestsQuery, TRELLO_BOARD_URL } from "@/lib/hq";
import { PageHeader, Panel, Pill } from "@/components/hq/ui";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/documentacao")({
  head: () => ({ meta: [
    { title: "Documentação — Permaneo HQ" },
    { name: "description", content: "Referências reais do Permaneo e atividades de documentação sincronizadas." },
  ] }),
  component: DocumentacaoPage,
});

const references = [
  {
    title: "Código-fonte do Permaneo HQ",
    summary: "Histórico de alterações, README e estrutura do escritório.",
    url: "https://github.com/PermaneoOFC/PermaneoOFC-permaneo-hq",
    category: "GitHub",
  },
  {
    title: "Código-fonte da plataforma Permaneo",
    summary: "Repositório da plataforma escolar, separado do escritório de agentes.",
    url: "https://github.com/PermaneoOFC/demo-repository",
    category: "GitHub",
  },
  {
    title: "Quadro Demo Day",
    summary: "Atividades, pesquisa, dossiê e responsabilidades do grupo.",
    url: TRELLO_BOARD_URL,
    category: "Trello",
  },
] as const;

function DocumentacaoPage() {
  const [term, setTerm] = useState("");
  const tasks = useQuery(tasksQuery);
  const agents = useQuery(agentsQuery).data ?? [];
  const requests = useQuery(requestsQuery).data ?? [];
  const docAgent = agents.find((agent) => agent.slug === "documentarista");
  const docTasks = useMemo(() => (tasks.data ?? []).filter((task) =>
    /document|dossi[eê]|pesquisa|evid[eê]ncia|relat[oó]rio|registro|reuni[aã]o|roteiro|pitch|apresenta[cç][aã]o|fonte|refer[eê]ncia/i.test(
      [task.name, task.description ?? "", task.list_name].join(" "),
    )
  ), [tasks.data]);
  const filteredTasks = docTasks.filter((task) => [task.name, task.description ?? "", task.list_name]
    .join(" ").toLowerCase().includes(term.trim().toLowerCase()));
  const docRequests = requests.filter((request) => docAgent && request.agent_id === docAgent.id);
  return <>
    <PageHeader eyebrow="Registros e evidências" title="Documentação" description="Acesse fontes oficiais e acompanhe os registros e materiais do projeto, sem recriar documentos inexistentes." />
    <div className="mb-6 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      Esta página lista fontes verificáveis e tarefas que já foram sincronizadas. Não é uma cópia automática dos arquivos do Google Drive; a conexão de arquivos precisa ser configurada separadamente.
    </div>
    <section className="mb-7">
      <div className="mb-3 flex items-center gap-2"><BookOpen className="size-5 text-primary" /><h2 className="font-display text-xl font-bold">Fontes do projeto</h2></div>
      <div className="grid gap-4 md:grid-cols-3">
        {references.map((reference) => <a key={reference.title} href={reference.url} target="_blank" rel="noopener noreferrer" className="group rounded-xl border bg-card p-5 shadow-card transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring">
          <div className="mb-2 flex items-center justify-between"><Pill>{reference.category}</Pill><ExternalLink className="size-4 text-muted-foreground group-hover:text-primary" /></div>
          <p className="mt-3 font-display text-lg font-bold">{reference.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{reference.summary}</p>
        </a>)}
      </div>
    </section>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <Panel title="Atividades e documentos no Trello" action={<Pill>{docTasks.length} encontrados</Pill>}>
        <label className="mb-4 flex items-center gap-2 rounded-lg border bg-background px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <span className="sr-only">Pesquisar documentos e tarefas</span>
          <Input className="border-0 bg-transparent shadow-none focus-visible:ring-0" placeholder="Buscar dossiê, pesquisa, apresentação..." value={term} onChange={(event) => setTerm(event.target.value)} />
        </label>
        {tasks.isLoading ? <p className="text-sm text-muted-foreground">Carregando registros...</p> : tasks.isError ?
          <p role="alert" className="text-sm text-destructive">Não foi possível carregar a sincronização do Trello. Verifique a aba Integrações.</p> :
          filteredTasks.length ? <ul className="space-y-3">{filteredTasks.slice(0, 30).map((task) => <li key={task.id} className="rounded-lg border p-4">
            <div className="flex gap-3"><FileText className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{task.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{task.list_name}{task.last_synced_at ? ` · sincronizado em ${new Date(task.last_synced_at).toLocaleDateString("pt-BR")}` : ""}</p>
                {task.description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{task.description}</p>}
                {task.url && /^https:\/\//.test(task.url) && <a href={task.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Ver card original <ExternalLink className="size-4" /></a>}
              </div>
            </div>
          </li>)}</ul> : <p className="text-sm text-muted-foreground">{term ? "Nenhum resultado encontrado para a busca." : "Ainda não há atividades de documentação sincronizadas. Use o quadro oficial ou sincronize o Trello em Integrações."}</p>
        }
      </Panel>
      <Panel title="Dossiê e solicitações do agente">
        <p className="text-sm text-muted-foreground">O Documentarista organiza decisões, fontes e evidências. Os materiais só aparecem aqui se estiverem registrados nas fontes conectadas.</p>
        {docAgent && <Link to="/agentes/$slug" params={{ slug: docAgent.slug }} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Perfil do Documentarista <ArrowRight className="size-4" /></Link>}
        <h3 className="mt-6 text-sm font-semibold">Solicitações registradas</h3>
        {docRequests.length ? <ul className="mt-3 space-y-2">{docRequests.slice(0, 10).map((request) => <li key={request.id} className="rounded-lg border p-3 text-sm"><p className="font-semibold">{request.title}</p><p className="mt-1 text-xs text-muted-foreground">{request.status}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Não há solicitações para esse agente neste momento.</p>}
        <a href={TRELLO_BOARD_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Abrir quadro do projeto <ExternalLink className="size-4" /></a>
      </Panel>
    </div>
  </>;
}
