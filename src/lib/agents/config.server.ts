import "@tanstack/react-start/server-only";
import { ApiError } from "./contracts";
import { requiredEnv } from "./permissions.server";

function limit(name: string, fallback: number, max: number) {
  const n = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(n) || n <= 0 || n > max) throw new ApiError(503, "INVALID_LIMITS");
  return n;
}
export function limits() {
  const integer = (name: string, fallback: number, max: number) => {
    const value = limit(name, fallback, max);
    if (!Number.isInteger(value)) throw new ApiError(503, "INVALID_LIMITS");
    return value;
  };
  return {
    steps: integer("HQ_MAX_STEPS", 3, 5),
    outputTokens: integer("HQ_MAX_OUTPUT_TOKENS", 1000, 2000),
    timeoutMs: integer("HQ_RUN_TIMEOUT_MS", 60000, 120000),
    perMinute: integer("HQ_REQUESTS_PER_MINUTE", 3, 10),
    perRunUsd: limit("HQ_RUN_BUDGET_USD", 0.25, 2),
    dailyUsd: limit("HQ_USER_DAILY_BUDGET_USD", 1, 10),
    teamDailyUsd: limit("HQ_TEAM_DAILY_BUDGET_USD", 5, 50),
    inputBytes: 24000,
    // Includes tool schemas, provider framing and system instructions above the byte cap.
    inputTokenCeiling: 32000,
    toolCalls: 8,
  };
}
export type Limits = ReturnType<typeof limits>;

export async function modelConfiguration(config = limits()) {
  const model = requiredEnv("AI_GATEWAY_MODEL");
  if (!process.env["AI_GATEWAY_API_KEY"] && !process.env["VERCEL_OIDC_TOKEN"])
    throw new ApiError(503, "GATEWAY_NOT_CONFIGURED");
  const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(503, "MODEL_CATALOG_UNAVAILABLE");
  const catalog = (await response.json()) as {
    data?: Array<{
      id: string;
      type: string;
      context_window: number;
      tags?: string[];
      pricing?: { input: string; output: string };
    }>;
  };
  const entry = catalog.data?.find((item) => item.id === model);
  const inputPrice = Number(entry?.pricing?.input),
    outputPrice = Number(entry?.pricing?.output);
  if (
    !entry ||
    entry.type !== "language" ||
    !entry.tags?.includes("tool-use") ||
    entry.context_window < config.inputTokenCeiling + config.outputTokens ||
    !Number.isFinite(inputPrice) ||
    !Number.isFinite(outputPrice) ||
    inputPrice < 0 ||
    outputPrice < 0
  ) {
    throw new ApiError(503, "MODEL_NOT_SUPPORTED");
  }
  // Conservative reservation, retained even if a request fails or is cancelled.
  const reserve = Math.max(
    0.000001,
    2 * config.steps * (config.inputTokenCeiling * inputPrice + config.outputTokens * outputPrice),
  );
  if (reserve > config.perRunUsd) throw new ApiError(429, "MODEL_EXCEEDS_RUN_BUDGET");
  return { model, inputPrice, outputPrice, reserve };
}
