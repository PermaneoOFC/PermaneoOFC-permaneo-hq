// @vitest-environment node
import { describe, expect, it, vi, afterEach } from "vitest";
import { simulateReadableStream, tool } from "ai";
import { z } from "zod";
import { MockLanguageModelV3 } from "ai/test";
import { agentCatalog, type AgentSlug } from "@/lib/agents/catalog";
import { instructionsFor } from "@/lib/agents/instructions";
import { createRunInput, type Run } from "@/lib/agents/contracts";
import { executeRun } from "@/lib/agents/runner.server";
import { assertEditor, assertOwner, assertRealMode } from "@/lib/agents/permissions.server";
import { limits } from "@/lib/agents/config.server";
import type { RunStore } from "@/lib/agents/store.server";

vi.mock("@tanstack/react-start/server-only", () => ({}));
afterEach(() => vi.unstubAllEnvs());
const usage = {
  inputTokens: { total: 5, noCache: 5, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 7, text: 7, reasoning: undefined },
};
function fixture(slug = "backend") {
  let run: Run = {
    id: crypto.randomUUID(),
    user_id: crypto.randomUUID(),
    agent_id: crypto.randomUUID(),
    agent_slug: slug,
    prompt: "Analise o projeto",
    status: "running",
    model: "test/model",
    created_at: new Date().toISOString(),
    deadline_at: new Date(Date.now() + 60000).toISOString(),
    response: "",
    error_code: null,
    reserved_usd: 0.2,
    input_price: 0.000001,
    output_price: 0.000002,
  };
  const store: RunStore = {
    get: vi.fn(async () => ({ ...run })),
    claim: vi.fn(async () => ({ ...run })),
    snapshot: vi.fn(async (_id, response) => {
      run.response = response;
    }),
    finish: vi.fn(async (_id, status, response, errorCode) => {
      if (run.status === "running") run = { ...run, status, response, error_code: errorCode };
      return run;
    }),
    cancel: vi.fn(async () => {
      run.status = "cancelled";
    }),
    reap: vi.fn(async () => {}),
  };
  const model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        initialDelayInMs: 0,
        chunkDelayInMs: 0,
        chunks: [
          { type: "text-start", id: "1" },
          { type: "text-delta", id: "1", delta: `Resposta de teste: ${slug}` },
          { type: "text-end", id: "1" },
          { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
        ],
      }),
    }),
  });
  return {
    run,
    store,
    model,
    tools: {},
    limits: limits(),
    signal: new AbortController().signal,
    checkAccess: vi.fn(async () => {}),
    emit: vi.fn(),
  };
}
describe("shared real SDK runner with test-only model injection", () => {
  it.each(Object.keys(agentCatalog) as AgentSlug[])(
    "executes %s through the SDK with its own instructions",
    async (slug) => {
      const f = fixture(slug);
      await executeRun(f);
      expect((await f.store.get(f.run.id)).status).toBe("completed");
      expect(f.model.doStreamCalls).toHaveLength(1);
      expect(JSON.stringify(f.model.doStreamCalls[0]?.prompt)).toContain(agentCatalog[slug].focus);
      expect(f.store.finish).toHaveBeenCalledWith(
        f.run.id,
        "completed",
        expect.stringContaining(slug),
        null,
        expect.objectContaining({ input: 5, output: 7 }),
      );
    },
  );
  it("reports provider failure without exposing its message or inventing output", async () => {
    const f = fixture();
    f.model = new MockLanguageModelV3({
      doStream: async () => {
        throw new Error("secret-provider-token");
      },
    });
    await executeRun(f);
    expect((await f.store.get(f.run.id)).status).toBe("failed");
    expect(JSON.stringify(f.emit.mock.calls)).not.toContain("secret-provider-token");
    expect((await f.store.get(f.run.id)).response).toBe("");
  });
  it("does not invoke a model after cancellation or revoked access", async () => {
    const f = fixture();
    await f.store.cancel(f.run.id, f.run.user_id);
    await executeRun(f);
    expect(f.model.doStreamCalls).toHaveLength(0);
    expect((await f.store.get(f.run.id)).status).toBe("cancelled");
    const denied = fixture();
    denied.checkAccess.mockRejectedValue(new Error("denied"));
    await executeRun(denied);
    expect(denied.model.doStreamCalls).toHaveLength(0);
  });
  it("rejects expired runs and oversized context before model calls", async () => {
    const f = fixture();
    f.run.deadline_at = new Date(0).toISOString();
    await executeRun(f);
    expect(f.model.doStreamCalls).toHaveLength(0);
    const oversized = fixture();
    oversized.run.prompt = "a".repeat(30000);
    await executeRun(oversized);
    expect(oversized.model.doStreamCalls).toHaveLength(0);
  });
  it("validates input and prevents forged roles/system/model fields", () => {
    expect(
      createRunInput.safeParse({
        agentSlug: "backend",
        prompt: " ",
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(false);
    expect(
      createRunInput.safeParse({
        agentSlug: "backend",
        prompt: "p",
        idempotencyKey: crypto.randomUUID(),
        role: "admin",
        model: "other/model",
      }).success,
    ).toBe(false);
    expect(() => assertEditor({ id: "1", role: "viewer" })).toThrow("EDITOR_REQUIRED");
    expect(() => assertOwner({ id: "1", role: "editor" }, "2")).toThrow("OWNER_REQUIRED");
  });
  it("bounds repeated tool loops and applies output token limits to every call", async () => {
    const f = fixture();
    const execute = vi.fn(async () => "bounded result");
    f.model = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 0,
          chunks: [
            { type: "tool-call", toolCallId: crypto.randomUUID(), toolName: "read", input: "{}" },
            { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, usage },
          ],
        }),
      }),
    });
    await executeRun({ ...f, tools: { read: tool({ inputSchema: z.object({}), execute }) } });
    expect(f.model.doStreamCalls).toHaveLength(f.limits.steps);
    expect(execute.mock.calls.length).toBeLessThanOrEqual(f.limits.steps);
    expect(
      f.model.doStreamCalls.every((call) => call.maxOutputTokens === f.limits.outputTokens),
    ).toBe(true);
    expect(f.model.doStreamCalls.at(-1)?.toolChoice).toEqual({ type: "none" });
  });
  it("aborts a stalled provider on timeout without retrying", async () => {
    const f = fixture();
    f.model = new MockLanguageModelV3({
      doStream: async ({ abortSignal }) => ({
        stream: new ReadableStream({
          start(controller) {
            const abort = () => controller.error(new Error("aborted test provider"));
            if (abortSignal?.aborted) abort();
            else abortSignal?.addEventListener("abort", abort, { once: true });
          },
        }),
      }),
    });
    await executeRun({ ...f, limits: { ...f.limits, timeoutMs: 40 } });
    expect(f.model.doStreamCalls).toHaveLength(1);
    expect((await f.store.get(f.run.id)).status).toBe("failed");
    expect((await f.store.get(f.run.id)).error_code).toBe("RUN_TIMEOUT_OR_ACCESS_REVOKED");
  });
  it("fails closed in demo and without explicit backend enablement", () => {
    vi.stubEnv("VITE_HQ_DEMO_MODE", "true");
    expect(() => assertRealMode({ HQ_BACKEND_ENABLED: "true" })).toThrow("REAL_BACKEND_DISABLED");
    vi.stubEnv("VITE_HQ_DEMO_MODE", "false");
    expect(() => assertRealMode({})).toThrow("REAL_BACKEND_DISABLED");
    expect(() => assertRealMode({ HQ_BACKEND_ENABLED: "true" })).not.toThrow();
  });
  it("has distinct profiles and bounded tool allowlists with no external writers", () => {
    expect(
      new Set(Object.keys(agentCatalog).map((slug) => instructionsFor(slug as AgentSlug))).size,
    ).toBe(14);
    for (const profile of Object.values(agentCatalog))
      expect(
        profile.tools.every((t) =>
          ["project_context", "task_board", "financial_scenario", "propose_action"].includes(t),
        ),
      ).toBe(true);
  });
});
