import "@tanstack/react-start/server-only";
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "./contracts";

export function assertRealMode(env = process.env) {
  if (
    import.meta.env["VITE_HQ_DEMO_MODE"] === "true" ||
    env["VITE_HQ_DEMO_MODE"] === "true" ||
    env["HQ_BACKEND_ENABLED"] !== "true"
  ) {
    throw new ApiError(403, "REAL_BACKEND_DISABLED");
  }
}
export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new ApiError(503, "BACKEND_NOT_CONFIGURED");
  return value;
}
export type Actor = { id: string; role: "admin" | "editor" | "viewer" };
export function assertEditor(actor: Actor) {
  if (actor.role === "viewer") throw new ApiError(403, "EDITOR_REQUIRED");
}
export function assertOwner(actor: Actor, owner: string) {
  assertEditor(actor);
  if (actor.id !== owner && actor.role !== "admin") throw new ApiError(403, "OWNER_REQUIRED");
}
export async function authenticate(request: Request) {
  assertRealMode();
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new ApiError(401, "AUTH_REQUIRED");
  const token = authorization.slice(7);
  const db = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_PUBLISHABLE_KEY"), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "INVALID_SESSION");
  const membership = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();
  const role: unknown = membership.data?.role;
  if (membership.error || !["admin", "editor", "viewer"].includes(String(role)))
    throw new ApiError(403, "MEMBERSHIP_REQUIRED");
  return { actor: { id: data.user.id, role } as Actor, db };
}
