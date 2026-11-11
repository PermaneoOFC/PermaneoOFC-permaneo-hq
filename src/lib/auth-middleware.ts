import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { authenticate } = await import("./agents/permissions.server");
    const { actor, db } = await authenticate(getRequest());
    return next({ context: { supabase: db, userId: actor.id } });
  },
);
