import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/agents/$")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/lib/agents/http.server")).handleAgents(request),
      POST: async ({ request }) => (await import("@/lib/agents/http.server")).handleAgents(request),
    },
  },
});
