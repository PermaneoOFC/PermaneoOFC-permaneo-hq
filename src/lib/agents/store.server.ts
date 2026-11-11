import "@tanstack/react-start/server-only";
import { createClient } from "@supabase/supabase-js";
import { ApiError, type Run } from "./contracts";
import { requiredEnv } from "./permissions.server";

export function adminDatabase() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10000) }),
    },
  });
}
export function checkDatabase(error: { message: string } | null) {
  if (!error) return;
  const codes: Record<string, number> = {
    RATE_LIMIT: 429,
    BUDGET_EXCEEDED: 429,
    RUN_ACTIVE: 409,
    IDEMPOTENCY_CONFLICT: 409,
    EDITOR_REQUIRED: 403,
    OWNER_REQUIRED: 403,
    AGENT_NOT_FOUND: 404,
    REQUEST_NOT_FOUND: 404,
    INVALID_STATUS: 409,
    ALREADY_DECIDED: 409,
  };
  const code = Object.keys(codes).find((code) => error.message.includes(code));
  throw new ApiError(code ? codes[code]! : 503, code ?? "PERSISTENCE_UNAVAILABLE");
}
export function runStore(db = adminDatabase()) {
  return {
    async get(id: string): Promise<Run> {
      const { data, error } = await db.from("agent_runs").select("*").eq("id", id).single();
      checkDatabase(error);
      if (!data) throw new ApiError(404, "RUN_NOT_FOUND");
      return data as Run;
    },
    async claim(id: string, timeoutMs: number, actorId: string): Promise<Run> {
      const { data, error } = await db
        .from("agent_runs")
        .update({
          status: "running",
          started_by: actorId,
          started_at: new Date().toISOString(),
          deadline_at: new Date(Date.now() + timeoutMs).toISOString(),
        })
        .eq("id", id)
        .eq("status", "queued")
        .gt("deadline_at", new Date().toISOString())
        .select()
        .maybeSingle();
      checkDatabase(error);
      if (!data) throw new ApiError(409, "RUN_ALREADY_CLAIMED");
      return data as Run;
    },
    async snapshot(id: string, response: string) {
      const { error } = await db
        .from("agent_runs")
        .update({ response })
        .eq("id", id)
        .eq("status", "running");
      checkDatabase(error);
    },
    async finish(
      id: string,
      status: "completed" | "failed" | "cancelled",
      response: string,
      errorCode: string | null,
      usage: { input: number; output: number; estimate: number } | null,
    ) {
      const { data, error } = await db.rpc("finish_agent_run", {
        p_run: id,
        p_status: status,
        p_response: response,
        p_error: errorCode,
        p_input: usage?.input ?? null,
        p_output: usage?.output ?? null,
        p_estimate: usage?.estimate ?? null,
      });
      checkDatabase(error);
      return data as Run;
    },
    async cancel(id: string, actorId: string) {
      const { error } = await db
        .from("agent_runs")
        .update({
          status: "cancelled",
          cancelled_by: actorId,
          error_code: "USER_CANCELLED",
          finished_at: new Date().toISOString(),
        })
        .eq("id", id)
        .in("status", ["queued", "running", "awaiting_approval"]);
      checkDatabase(error);
    },
    async reap() {
      const { error } = await db
        .from("agent_runs")
        .update({
          status: "failed",
          error_code: "EXECUTION_EXPIRED",
          finished_at: new Date().toISOString(),
        })
        .in("status", ["queued", "running"])
        .lt("deadline_at", new Date().toISOString());
      checkDatabase(error);
    },
  };
}
export type RunStore = ReturnType<typeof runStore>;
