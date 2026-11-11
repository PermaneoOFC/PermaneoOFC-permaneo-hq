// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleAgents } from "@/lib/agents/http.server";

vi.mock("@tanstack/react-start/server-only", () => ({}));
const user = "00000000-0000-4000-8000-000000000001";
let role: string | null, reserveError: string | null;
let fetchMock: ReturnType<typeof vi.fn>;
const request = (
  path = "runs?agent=backend",
  method = "GET",
  payload?: unknown,
  token = "test-session",
) =>
  new Request(`http://localhost/api/agents/${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
  });
beforeEach(() => {
  role = "editor";
  reserveError = null;
  vi.stubEnv("VITE_HQ_DEMO_MODE", "false");
  vi.stubEnv("HQ_BACKEND_ENABLED", "true");
  vi.stubEnv("SUPABASE_URL", "http://supabase.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-public");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-only");
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-gateway-only");
  vi.stubEnv("AI_GATEWAY_MODEL", "test/model");
  fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("/auth/v1/user"))
      return Response.json({ id: user, aud: "authenticated", email: "test@example.invalid" });
    if (url.includes("/user_roles")) return Response.json(role ? { role } : null);
    if (url.includes("/v1/models"))
      return Response.json({
        data: [
          {
            id: "test/model",
            type: "language",
            context_window: 128000,
            tags: ["tool-use"],
            pricing: { input: "0.0000001", output: "0.0000002" },
          },
        ],
      });
    if (url.includes("/rpc/reserve_agent_run"))
      return reserveError
        ? Response.json({ message: reserveError }, { status: 400 })
        : Response.json({ id: user, status: "queued" });
    if (url.includes("/agent_runs")) return Response.json(init?.method === "PATCH" ? [] : []);
    throw new Error(`Unexpected TEST request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("HTTP authentication and safe failures", () => {
  it("blocks every endpoint in demo before accessing any service", async () => {
    vi.stubEnv("VITE_HQ_DEMO_MODE", "true");
    for (const path of [
      "runs",
      `runs/${user}`,
      `runs/${user}/execute`,
      `runs/${user}/cancel`,
      `approvals/${user}`,
    ]) {
      expect((await handleAgents(request(path, "POST", {}))).status).toBe(403);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("returns 401 without a bearer token", async () => {
    expect((await handleAgents(request("runs", "POST", {}, ""))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects invalid tokens and unapproved accounts", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: "Invalid token" }, { status: 401 }));
    expect((await handleAgents(request())).status).toBe(401);
    role = null;
    expect((await handleAgents(request())).status).toBe(403);
  });
  it("allows viewer history but never execution", async () => {
    role = "viewer";
    expect((await handleAgents(request())).status).toBe(200);
    expect((await handleAgents(request("runs", "POST", {}))).status).toBe(403);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/v1/models"))).toBe(false);
  });
  it("validates input before contacting the gateway", async () => {
    expect((await handleAgents(request("runs", "POST", { prompt: "" }))).status).toBe(400);
    expect(
      (
        await handleAgents(
          request("runs", "POST", { agentSlug: "unknown", prompt: "p", idempotencyKey: user }),
        )
      ).status,
    ).toBe(400);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/v1/models"))).toBe(false);
  });
  it.each(["RATE_LIMIT", "BUDGET_EXCEEDED"])(
    "returns 429 for %s without starting an execution",
    async (code) => {
      reserveError = code;
      const response = await handleAgents(
        request("runs", "POST", { agentSlug: "backend", prompt: "p", idempotencyKey: user }),
      );
      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({ error: code });
    },
  );
  it("reserves a run and returns no credentials", async () => {
    const response = await handleAgents(
      request("runs", "POST", { agentSlug: "backend", prompt: "p", idempotencyKey: user }),
    );
    expect(response.status).toBe(201);
    const body = await response.text();
    expect(body).not.toMatch(/test-service-only|test-gateway-only/);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("rejects browser cross-origin mutations and oversized bodies", async () => {
    const crossOrigin = request("runs", "POST", {});
    crossOrigin.headers.set("origin", "https://attacker.invalid");
    expect((await handleAgents(crossOrigin)).status).toBe(403);
    expect(
      (await handleAgents(request("runs", "POST", { prompt: "x".repeat(21000) }))).status,
    ).toBe(413);
  });
});
