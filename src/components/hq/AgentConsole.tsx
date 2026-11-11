import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Panel } from "./ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_MODE } from "@/lib/demo";
import { useAuth } from "@/hooks/use-auth";
import { agentFetch, agentJson } from "@/lib/agents/client";
import type { Run, RunDetail, RunStatus } from "@/lib/agents/contracts";

const statusLabel: Record<RunStatus, string> = {
  queued: "Na fila",
  running: "Executando",
  awaiting_approval: "Aguardando revisão humana",
  completed: "Concluída",
  failed: "Falhou",
  cancelled: "Interrompida",
};

// Keep the approved demo profile exactly as it is; no auth hook, query or paid request mounts.
export function AgentConsole({ slug }: { slug: string }) {
  if (DEMO_MODE) return null;
  return <AuthenticatedConsole key={slug} slug={slug} />;
}

function AuthenticatedConsole({ slug }: { slug: string }) {
  const { user, canEdit, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const replay = useRef<{ prompt: string; key: string } | null>(null);
  const activeStream = useRef<AbortController | null>(null);
  useEffect(() => () => activeStream.current?.abort(), []);
  const history = useInfiniteQuery({
    queryKey: ["agent-runs", user?.id, slug],
    enabled: Boolean(user),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      agentJson<{ runs: Run[] }>(
        `runs?agent=${encodeURIComponent(slug)}${pageParam ? `&before=${encodeURIComponent(pageParam)}` : ""}`,
      ),
    getNextPageParam: (last) =>
      last.runs.length === 30 ? last.runs.at(-1)?.created_at : undefined,
    refetchInterval: 5000,
  });
  const historyRuns = history.data?.pages.flatMap((page) => page.runs) ?? [];
  const id = selected ?? historyRuns[0]?.id;
  const detail = useQuery({
    queryKey: ["agent-run", user?.id, id],
    enabled: Boolean(user && id),
    queryFn: () => agentJson<RunDetail>(`runs/${id}`),
    refetchInterval: (query) =>
      ["queued", "running"].includes(query.state.data?.run.status ?? "") ? 1500 : false,
  });
  const run = detail.data?.run;
  const owns = run && (run.user_id === user?.id || isAdmin);
  const running = run && ["queued", "running"].includes(run.status);
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["agent-runs"] }),
      qc.invalidateQueries({ queryKey: ["agent-run"] }),
    ]);
  };
  async function execute(runId: string) {
    const controller = new AbortController();
    activeStream.current = controller;
    const response = await agentFetch(`runs/${runId}/execute`, {
      method: "POST",
      signal: controller.signal,
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error("STREAM_UNAVAILABLE");
    const decoder = new TextDecoder();
    let pending = "";
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      pending += decoder.decode(part.value, { stream: true });
      let end: number;
      while ((end = pending.indexOf("\n\n")) >= 0) {
        const frame = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (!frame.startsWith("data: ")) continue;
        const event = JSON.parse(frame.slice(6)) as { type: string; text?: string; code?: string };
        if (event.type === "delta") setStreamText((text) => text + (event.text ?? ""));
        if (event.code) setError(event.code);
      }
    }
    activeStream.current = null;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || busy) return;
    setBusy(true);
    setError("");
    setStreamText("");
    if (replay.current?.prompt !== prompt) replay.current = { prompt, key: crypto.randomUUID() };
    try {
      const { run: created } = await agentJson<{ run: Run }>("runs", {
        agentSlug: slug,
        prompt,
        idempotencyKey: replay.current.key,
      });
      setSelected(created.id);
      await refresh();
      if (created.status === "queued") await execute(created.id);
      replay.current = null;
      setPrompt("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "EXECUTION_FAILED");
    } finally {
      setBusy(false);
      await refresh();
    }
  }
  async function resume() {
    if (!run || busy) return;
    setBusy(true);
    setError("");
    setStreamText("");
    try {
      await execute(run.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "EXECUTION_FAILED");
    } finally {
      setBusy(false);
      await refresh();
    }
  }
  async function cancel() {
    if (!run) return;
    try {
      await agentJson(`runs/${run.id}/cancel`, {});
      activeStream.current?.abort();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CANCEL_FAILED");
    }
  }
  async function decide(approvalId: string, approve: boolean) {
    try {
      await agentJson(`approvals/${approvalId}`, { approve });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "APPROVAL_FAILED");
    }
  }
  async function applyExternal(approvalId: string) {
    try {
      const result = await agentJson<{ executed: boolean; service: string; action: string }>(
        "approvals/" + approvalId + "/apply", {},
      );
      setError(result.executed ? "Ação aplicada no Trello. Consulte o quadro oficial para confirmar a atualização." : "ACTION_NOT_EXECUTED");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "EXTERNAL_ACTION_FAILED");
    }
  }
  return (
    <section id="agent-console" className="my-6 space-y-4" aria-label="Conversa com o agente">
      <Panel title="Trabalho com o agente">
        <p className="mb-4 text-sm text-muted-foreground">
          Cada solicitação inicia uma execução com contexto dos documentos autorizados. O histórico
          fica salvo para a equipe. Propostas externas exigem revisão humana.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="agent-prompt" className="text-sm font-medium">
            Sua solicitação
          </label>
          <Textarea
            id="agent-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={4000}
            required
            rows={4}
            disabled={!canEdit || busy}
            placeholder="Descreva a tarefa, o contexto e o resultado esperado…"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canEdit || busy || Boolean(running) || !prompt.trim()}>
              {busy ? "Executando…" : "Executar agente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              disabled={!canEdit || !owns || !running}
            >
              Interromper
            </Button>
            <Button type="button" variant="outline" onClick={refresh}>
              Ver histórico
            </Button>
            {run?.status === "queued" && owns && canEdit && (
              <Button type="button" variant="outline" disabled={busy} onClick={resume}>
                Iniciar execução pendente
              </Button>
            )}
          </div>
          {!canEdit && (
            <p className="text-xs text-muted-foreground">
              Somente integrantes aprovados como editor ou administrador podem executar.
            </p>
          )}
        </form>
        {(error || history.error || detail.error) && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error || history.error?.message || detail.error?.message}. Se o backend não estiver
            configurado, nenhuma resposta de IA será simulada.
          </p>
        )}
      </Panel>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Execuções recentes">
          {!historyRuns.length && (
            <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p>
          )}
          <ul className="space-y-2">
            {historyRuns.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={busy}
                  aria-pressed={id === item.id}
                  onClick={() => {
                    setSelected(item.id);
                    setStreamText("");
                    setError("");
                  }}
                  className="w-full rounded-lg border p-3 text-left text-sm hover:bg-muted"
                >
                  <span className="line-clamp-2">{item.prompt}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {statusLabel[item.status]} · {new Date(item.created_at).toLocaleString("pt-BR")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {history.hasNextPage && (
            <Button
              variant="outline"
              className="mt-3"
              disabled={history.isFetchingNextPage || busy}
              onClick={() => history.fetchNextPage()}
            >
              Carregar anteriores
            </Button>
          )}
        </Panel>
        <div className="lg:col-span-2">
          <Panel title={run ? `Conversa · ${statusLabel[run.status]}` : "Resposta"}>
            {run && (
              <>
                <p className="mb-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
                  {run.prompt}
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Modelo: {run.model} · reserva máxima: US$ {Number(run.reserved_usd).toFixed(4)}
                </p>
              </>
            )}
            <div
              role="log"
              aria-live="polite"
              aria-label="Resposta do agente"
              className="whitespace-pre-wrap break-words text-sm"
            >
              {(busy ? streamText : "") || run?.response || "Aguardando uma execução real."}
            </div>
            {run?.error_code && (
              <p className="mt-3 text-sm text-destructive">
                Execução não concluída: {run.error_code}. O texto parcial acima não é um resultado
                concluído.
              </p>
            )}
            {detail.data?.approvals.map((approval) => (
              <div key={approval.id} className="mt-4 space-y-2 rounded-lg border p-3 text-sm">
                <p className="font-semibold">
                  Proposta: {approval.service} · {approval.action}
                </p>
                <p className="whitespace-pre-wrap">{approval.proposal}</p>
                <p>Revisão: {approval.status}. A aprovação não executa alterações externas sozinha.</p>
                {approval.status === "approved" && approval.service === "trello" &&
                  ["add_comment", "add_checklist", "move_card"].includes(approval.action) &&
                  owns && canEdit && (
                    <Button size="sm" variant="outline" onClick={() => void applyExternal(approval.id)}>
                      Executar no Trello (ação aprovada)
                    </Button>
                  )}
                {approval.status === "approved" && approval.service !== "trello" &&
                  <p className="text-xs text-muted-foreground">Esta integração ainda exige autorização externa; aprovação apenas registra a decisão.</p>}

                {approval.status === "pending" &&
                  run?.status === "awaiting_approval" &&
                  canEdit &&
                  owns && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => decide(approval.id, true)}>
                        Aprovar proposta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide(approval.id, false)}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </section>
  );
}
