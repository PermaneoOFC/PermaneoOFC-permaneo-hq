import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/google/$")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/lib/google-drive.server")).handleGoogle(request),
      POST: async ({ request }) => (await import("@/lib/google-drive.server")).handleGoogle(request),
    },
  },
});
