import "@tanstack/react-start/server-only";
import { z } from "zod";
import { authenticate, assertEditor, assertOwner } from "./permissions.server";
import { ApiError, createRunInput, type Run } from "./contracts";
import { isAgentSlug } from "./catalog";
import { limits, modelConfiguration } from "./config.server";
import { adminDatabase, checkDatabase, runStore } from "./store.server";
import { buildTools } from "./tools/index.server";
import { executeRun } from "./runner.server";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers });
}
async function body(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "JSON_REQUIRED");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "BODY_REQUIRED");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 20000) {
        await reader.cancel();
        throw new ApiError(413, "BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "INVALID_JSON");
  }
}

export async function handleAgents(request: Request): Promise<Response> {
  try {
    const { actor, db } = await authenticate(request);
    // Bearer tokens only, no cookie fallback; also reject cross-origin browser mutations.
    const origin = request.headers.get("origin");
    if (request.method !== "GET" && origin && origin !== new URL(request.url).origin)
      throw new ApiError(403, "ORIGIN_REJECTED");
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/agents\/?/, "").split("/");
    const admin = adminDatabase(),
      store = runStore(admin);
    await store.reap();
    if (path[0] === "runs" && path.length === 1) {
      if (request.method === "GET") {
        const slug = url.searchParams.get("agent");
        if (!slug || !isAgentSlug(slug)) throw new ApiError(400, "UNKNOWN_AGENT");
        let query = db
          .from("agent_runs")
          .select("*")
          .eq("agent_slug", slug)
          .order("created_at", { ascending: false })
          .limit(30);
        const before = url.searchParams.get("before");
        if (before) query = query.lt("created_at", z.string().datetime().parse(before));
        const { data, error } = await query;
        checkDatabase(error);
        return json({ runs: data });
      }
      if (request.method === "POST") {
        assertEditor(actor);
        const input = createRunInput.parse(await body(request));
        if (!isAgentSlug(input.agentSlug)) throw new ApiError(400, "UNKNOWN_AGENT");
        const config = limits(),
          model = await modelConfiguration(config, input.agentSlug);
        const { data, error } = await admin.rpc("reserve_agent_run", {
          p_user: actor.id,
          p_slug: input.agentSlug,
          p_prompt: input.prompt,
          p_key: input.idempotencyKey,
          p_request: input.requestId ?? null,
          p_model: model.model,
          p_reserve: model.reserve,
          p_input_price: model.inputPrice,
          p_output_price: model.outputPrice,
          p_daily: config.dailyUsd,
          p_team_daily: config.teamDailyUsd,
          p_per_minute: config.perMinute,
        });
        checkDatabase(error);
        return json({ run: data }, 201);
      }
    }
    if (path[0] === "runs" && path[1]) {
      const id = z.string().uuid().parse(path[1]);
      const { data, error } = await db.from("agent_runs").select("*").eq("id", id).maybeSingle();
      checkDatabase(error);
      if (!data) throw new ApiError(404, "RUN_NOT_FOUND");
      const run = data as Run;
      if (request.method === "GET" && path.length === 2) {
        const [messages, approvals] = await Promise.all([
          db.from("agent_messages").select("id,role,content").eq("run_id", id).order("created_at"),
          db.from("agent_approvals").select("*").eq("run_id", id).order("created_at"),
        ]);
        checkDatabase(messages.error);
        checkDatabase(approvals.error);
        return json({ run, messages: messages.data, approvals: approvals.data });
      }
      assertOwner(actor, run.user_id);
      if (request.method === "POST" && path.length === 3 && path[2] === "cancel") {
        await store.cancel(id, actor.id);
        return json({ run: await store.get(id) });
      }
      if (request.method === "POST" && path.length === 3 && path[2] === "execute") {
        if (!isAgentSlug(run.agent_slug)) throw new ApiError(400, "UNKNOWN_AGENT");
        const config = limits(),
          model = await modelConfiguration(config, run.agent_slug);
        if (
          model.model !== run.model ||
          model.reserve > Number(run.reserved_usd) ||
          model.inputPrice > Number(run.input_price) ||
          model.outputPrice > Number(run.output_price)
        )
          throw new ApiError(409, "MODEL_CONFIGURATION_CHANGED");
        const claimed = await store.claim(id, config.timeoutMs, actor.id);
        const disconnected = new AbortController();
        const signal = AbortSignal.any([request.signal, disconnected.signal]);
        const checkAccess = async () => {
          const current = await authenticate(request);
          assertOwner(current.actor, claimed.user_id);
          // An admin cannot execute on behalf of a requester whose edit access was revoked.
          const { data: canEdit, error: roleError } = await admin.rpc("can_edit", {
            _user_id: claimed.user_id,
          });
          checkDatabase(roleError);
          if (!canEdit) throw new ApiError(403, "REQUESTER_ACCESS_REVOKED");
        };
        const tools = buildTools(run.agent_slug, claimed, admin, db, async () => {
          signal.throwIfAborted();
          await checkAccess();
          const current = await store.get(id);
          if (current.status !== "running") throw new ApiError(409, "RUN_STOPPED");
          if (Date.now() >= Date.parse(current.deadline_at)) throw new ApiError(408, "RUN_TIMEOUT");
        });
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const emit = (event: object) => {
              if (!disconnected.signal.aborted)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            };
            try {
              emit({ type: "status", status: "running" });
              await executeRun({
                run: claimed,
                store,
                model: model.model,
                tools,
                limits: config,
                signal,
                checkAccess,
                emit,
              });
            } catch {
              emit({ type: "done", status: "failed", code: "PERSISTENCE_UNAVAILABLE" });
            } finally {
              if (!disconnected.signal.aborted) controller.close();
            }
          },
          cancel() {
            disconnected.abort();
          },
        });
        return new Response(stream, {
          headers: {
            ...headers,
            "Content-Type": "text/event-stream; charset=utf-8",
            "X-Accel-Buffering": "no",
          },
        });
      }
    }
    if (request.method === "POST" && path[0] === "approvals" && path.length === 2) {
      assertEditor(actor);
      const id = z.string().uuid().parse(path[1]);
      const input = z
        .object({ approve: z.boolean() })
        .strict()
        .parse(await body(request));
      const { error } = await db.rpc("decide_agent_approval", {
        p_id: id,
        p_approve: input.approve,
      });
      checkDatabase(error);
      return json({ recorded: true, externallyExecuted: false });
    }
    throw new ApiError(404, "ENDPOINT_NOT_FOUND");
  } catch (error) {
    if (error instanceof z.ZodError) return json({ error: "INVALID_INPUT" }, 400);
    if (error instanceof ApiError) return json({ error: error.code }, error.status);
    // Never reflect provider errors, upstream bodies, tokens or stack traces to clients/logs.
    return json({ error: "BACKEND_UNAVAILABLE" }, 503);
  }
}
