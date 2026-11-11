import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/integrations")({
  server: { handlers: { GET: async ({ request }) => (await import("@/lib/office-integrations.server")).handleOfficeIntegrations(request) } },
});
