import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentConsole } from "./AgentConsole";
import type { Run } from "@/lib/agents/contracts";

const state = vi.hoisted(() => ({
  demo: false,
  canEdit: true,
  userId: "test-user",
  run: null as Run | null,
  json: vi.fn(),
  fetch: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("@/lib/demo", () => ({
  get DEMO_MODE() {
    return state.demo;
  },
}));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => {
    state.auth();
    return { user: { id: state.userId }, canEdit: state.canEdit, isAdmin: false };
  },
}));
vi.mock("@/lib/agents/client", () => ({
  agentJson: (...args: unknown[]) => state.json(...args),
  agentFetch: (...args: unknown[]) => state.fetch(...args),
}));

function mount() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <AgentConsole slug="backend" />
    </QueryClientProvider>,
  );
  return { ...rendered, queryClient };
}
beforeEach(() => {
  vi.clearAllMocks();
  state.demo = false;
  state.canEdit = true;
  state.run = null;
  state.json.mockImplementation(async (path: string, payload?: { prompt?: string }) => {
    if (path.startsWith("runs?")) return { runs: state.run ? [state.run] : [] };
    if (path === "runs") {
      state.run = {
        id: "test-run",
        user_id: state.userId,
        agent_id: "test-agent",
        agent_slug: "backend",
        status: "queued",
        prompt: payload?.prompt ?? "Test task",
        response: "",
        model: "test/model",
        created_at: new Date().toISOString(),
        deadline_at: new Date(Date.now() + 60000).toISOString(),
        error_code: null,
        reserved_usd: 0.1,
        input_price: 0,
        output_price: 0,
      };
      return { run: state.run };
    }
    if (path.endsWith("/cancel") && state.run) {
      state.run.status = "cancelled";
      return { run: state.run };
    }
    return { run: state.run, messages: [], approvals: [] };
  });
  state.fetch.mockImplementation(async () => {
    state.run = { ...state.run!, status: "completed", response: "Resposta de teste persistida." };
    return new Response(
      `data: ${JSON.stringify({ type: "delta", text: state.run.response })}\n\ndata: ${JSON.stringify({ type: "done", status: "completed" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream" } },
    );
  });
});
afterEach(cleanup);

describe("agent profile console", () => {
  it("mounts no auth, data query or execution controls in demo", () => {
    state.demo = true;
    const { container } = mount();
    expect(container).toBeEmptyDOMElement();
    expect(state.auth).not.toHaveBeenCalled();
    expect(state.json).not.toHaveBeenCalled();
  });
  it("submits a real API-shaped request, renders test streaming and restores persisted history", async () => {
    const first = mount();
    fireEvent.change(screen.getByLabelText("Sua solicitação"), {
      target: { value: "Revisar contrato de API" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Executar agente" }));
    await waitFor(() =>
      expect(screen.getByRole("log")).toHaveTextContent("Resposta de teste persistida."),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Executar agente" })).toBeInTheDocument(),
    );
    expect(state.json).toHaveBeenCalledWith(
      "runs",
      expect.objectContaining({
        agentSlug: "backend",
        prompt: "Revisar contrato de API",
        idempotencyKey: expect.any(String),
      }),
    );
    expect(state.fetch).toHaveBeenCalledTimes(1);
    first.unmount();
    first.queryClient.clear();
    mount();
    await waitFor(() =>
      expect(screen.getByRole("log")).toHaveTextContent("Resposta de teste persistida."),
    );
    expect(state.fetch).toHaveBeenCalledTimes(1);
  });
  it("does not offer execution to viewers", () => {
    state.canEdit = false;
    mount();
    expect(screen.getByRole("button", { name: "Executar agente" })).toBeDisabled();
    expect(screen.getByLabelText("Sua solicitação")).toBeDisabled();
    expect(state.fetch).not.toHaveBeenCalled();
  });
  it("shows configuration failures without a fabricated answer", async () => {
    state.json.mockRejectedValue(new Error("BACKEND_NOT_CONFIGURED"));
    mount();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("BACKEND_NOT_CONFIGURED"),
    );
    expect(screen.getByRole("log")).toHaveTextContent("Aguardando uma execução real.");
    expect(state.fetch).not.toHaveBeenCalled();
  });
});
