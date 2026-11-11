import "@tanstack/react-start/server-only";
import { ToolLoopAgent, stepCountIs, type LanguageModel, type ToolSet } from "ai";
import { isAgentSlug } from "./catalog";
import { instructionsFor } from "./instructions";
import { ApiError, type Run } from "./contracts";
import type { RunStore } from "./store.server";
import type { Limits } from "./config.server";

// Production supplies the Gateway model string. Only tests inject a fake LanguageModel.
export async function executeRun(options: {
  run: Run;
  store: RunStore;
  model: LanguageModel;
  tools: ToolSet;
  limits: Limits;
  signal: AbortSignal;
  checkAccess: () => Promise<void>;
  emit: (event: { type: string; text?: string; status?: string; code?: string }) => void;
}) {
  const { run, store, limits, emit } = options;
  if (!isAgentSlug(run.agent_slug)) throw new ApiError(400, "UNKNOWN_AGENT");
  const controller = new AbortController();
  const signal = AbortSignal.any([
    controller.signal,
    options.signal,
    AbortSignal.timeout(limits.timeoutMs),
  ]);
  let text = "",
    lastSave = 0,
    checking = false;
  let usage: { input: number; output: number; estimate: number } | null = null;
  async function guard() {
    signal.throwIfAborted();
    await options.checkAccess();
    const current = await store.get(run.id);
    if (current.status !== "running") throw new ApiError(409, "RUN_STOPPED");
    if (Date.now() >= Date.parse(current.deadline_at)) throw new ApiError(408, "RUN_TIMEOUT");
  }
  // Cross-instance cancellation is persisted, not an in-memory AbortController registry.
  const watcher = setInterval(() => {
    if (checking) return;
    checking = true;
    void guard()
      .catch((error) => controller.abort(error))
      .finally(() => {
        checking = false;
      });
  }, 1000);
  try {
    await guard();
    const instructions = instructionsFor(run.agent_slug);
    const agent = new ToolLoopAgent({
      model: options.model,
      instructions,
      tools: options.tools,
      maxOutputTokens: limits.outputTokens,
      // GPT-5 nano can spend the whole token budget on internal reasoning.
      // Keep reasoning minimal so short agent tasks return visible text.
      ...(run.model.startsWith("openai/gpt-5")
        ? { providerOptions: { openai: { reasoningEffort: "minimal" } } }
        : {}),
      maxRetries: 0,
      stopWhen: stepCountIs(limits.steps),
      prepareStep: async ({ messages, stepNumber }) => {
        await guard();
        if (
          stepNumber >= limits.steps ||
          Buffer.byteLength(JSON.stringify(messages) + instructions, "utf8") > limits.inputBytes
        )
          throw new ApiError(429, "CONTEXT_LIMIT");
        return stepNumber === limits.steps - 1 ? { toolChoice: "none" as const } : {};
      },
    });
    const result = await agent.stream({ prompt: run.prompt, abortSignal: signal });
    for await (const part of result.fullStream) {
      if (part.type === "error") throw part.error;
      if (part.type === "text-delta") {
        signal.throwIfAborted();
        text += part.text;
        if (text.length > 32000) throw new ApiError(429, "OUTPUT_LIMIT");
        emit({ type: "delta", text: part.text });
        if (Date.now() - lastSave > 700) {
          await store.snapshot(run.id, text);
          lastSave = Date.now();
        }
      }
    }
    await guard();
    const tokens = await result.totalUsage;
    if (!text.trim()) throw new ApiError(502, "EMPTY_MODEL_RESPONSE");
    if (tokens.inputTokens != null && tokens.outputTokens != null) {
      usage = {
        input: tokens.inputTokens,
        output: tokens.outputTokens,
        estimate: tokens.inputTokens * run.input_price + tokens.outputTokens * run.output_price,
      };
    }
    const final = await store.finish(run.id, "completed", text, null, usage);
    emit({ type: "done", status: final.status });
  } catch (error) {
    const cancelled = options.signal.aborted || (await store.get(run.id)).status === "cancelled";
    const code = cancelled
      ? "USER_CANCELLED"
      : signal.aborted
        ? "RUN_TIMEOUT_OR_ACCESS_REVOKED"
        : error instanceof ApiError
          ? error.code
          : "MODEL_EXECUTION_FAILED";
    const final = await store.finish(run.id, cancelled ? "cancelled" : "failed", text, code, usage);
    emit({ type: "done", status: final.status, code });
  } finally {
    clearInterval(watcher);
    controller.abort();
  }
}
