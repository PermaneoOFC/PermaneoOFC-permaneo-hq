import "@tanstack/react-start/server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticate, assertEditor } from "./agents/permissions.server";
import { ApiError } from "./agents/contracts";
import { adminDatabase, checkDatabase } from "./agents/store.server";

const scope = "https://www.googleapis.com/auth/drive.file";
type StoredTokens = { access: string; refresh: string; expires: number };
function oauthConfig() {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  const redirect = process.env["GOOGLE_REDIRECT_URI"];
  const encryption = process.env["GOOGLE_TOKEN_ENCRYPTION_KEY"];
  if (!clientId || !clientSecret || !redirect || !encryption || !redirect.startsWith("https://"))
    throw new ApiError(503, "GOOGLE_OAUTH_NOT_CONFIGURED");
  return { clientId, clientSecret, redirect, encryption };
}
function tokenKey() {
  const raw = Buffer.from(oauthConfig().encryption, "base64");
  if (raw.length !== 32) throw new ApiError(503, "GOOGLE_ENCRYPTION_NOT_CONFIGURED");
  return raw;
}
function seal(tokens: StoredTokens) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
function open(sealed: string): StoredTokens {
  const data = Buffer.from(sealed, "base64");
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  const plain = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
  return JSON.parse(plain) as StoredTokens;
}
function json(data: object, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
function returnToIntegrations(request: Request, outcome: string) {
  const url = new URL("/integracoes", request.url);
  url.searchParams.set("google", outcome);
  return new Response(null, { status: 302, headers: { Location: url.toString(), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
async function tokenExchange(params: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(502, "GOOGLE_TOKEN_EXCHANGE_FAILED");
  return response.json() as Promise<{ access_token?: string; refresh_token?: string; expires_in?: number; scope?: string }>;
}
async function callback(request: Request) {
  const query = new URL(request.url).searchParams;
  const state = query.get("state"), code = query.get("code");
  if (!state || !/^[A-Za-z0-9_-]{30,100}$/.test(state) || !code || code.length > 4096)
    return returnToIntegrations(request, "denied");
  const db = adminDatabase();
  const { data: pending, error } = await db.from("google_oauth_states").delete()
    .eq("state", state).select("user_id,code_verifier,expires_at").maybeSingle();
  checkDatabase(error);
  if (!pending || new Date(pending.expires_at).getTime() <= Date.now())
    return returnToIntegrations(request, "expired");
  try {
    const cfg = oauthConfig();
    const result = await tokenExchange(new URLSearchParams({
      client_id: cfg.clientId, client_secret: cfg.clientSecret,
      code, code_verifier: pending.code_verifier,
      grant_type: "authorization_code", redirect_uri: cfg.redirect,
    }));
    if (!result.access_token || !result.scope?.split(" ").includes(scope))
      throw new ApiError(403, "GOOGLE_SCOPE_MISSING");
    let refresh = result.refresh_token;
    if (!refresh) {
      const old = await db.from("google_drive_connections").select("encrypted_tokens")
        .eq("user_id", pending.user_id).maybeSingle();
      if (old.data) refresh = open(old.data.encrypted_tokens).refresh;
    }
    if (!refresh) throw new ApiError(403, "GOOGLE_REFRESH_TOKEN_REQUIRED");
    const { error: saveError } = await db.from("google_drive_connections").upsert({
      user_id: pending.user_id,
      encrypted_tokens: seal({
        access: result.access_token, refresh,
        expires: Date.now() + (result.expires_in ?? 3600) * 1000,
      }),
      scopes: scope, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    checkDatabase(saveError);
    return returnToIntegrations(request, "connected");
  } catch {
    return returnToIntegrations(request, "failed");
  }
}
async function bearerForUser(userId: string, db: SupabaseClient) {
  const cfg = oauthConfig();
  const { data, error } = await db.from("google_drive_connections")
    .select("encrypted_tokens").eq("user_id", userId).maybeSingle();
  checkDatabase(error);
  if (!data) throw new ApiError(503, "GOOGLE_DRIVE_NOT_CONNECTED");
  const tokens = open(data.encrypted_tokens);
  if (tokens.expires > Date.now() + 60000) return tokens.access;
  const refreshed = await tokenExchange(new URLSearchParams({
    client_id: cfg.clientId, client_secret: cfg.clientSecret,
    refresh_token: tokens.refresh, grant_type: "refresh_token",
  }));
  if (!refreshed.access_token) throw new ApiError(502, "GOOGLE_TOKEN_REFRESH_FAILED");
  const latest: StoredTokens = {
    access: refreshed.access_token, refresh: tokens.refresh,
    expires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
  };
  const { error: updateError } = await db.from("google_drive_connections").update({
    encrypted_tokens: seal(latest), updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  checkDatabase(updateError);
  return latest.access;
}
export async function createApprovedGoogleDocument(
  userId: string, title: string, content: string, db: SupabaseClient,
) {
  const token = await bearerForUser(userId, db);
  const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
  // The drive.file scope only grants access to files created/opened through this app.
  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", {
    method: "POST", headers,
    body: JSON.stringify({ name: title, mimeType: "application/vnd.google-apps.document" }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new ApiError(502, "GOOGLE_DOCUMENT_CREATION_FAILED");
  const file = (await response.json()) as { id?: string; webViewLink?: string };
  if (!file.id || !/^[A-Za-z0-9_-]+$/.test(file.id)) throw new ApiError(502, "GOOGLE_DOCUMENT_ID_MISSING");
  const link = "https://docs.google.com/document/d/" + file.id + "/edit";
  const write = await fetch("https://docs.googleapis.com/v1/documents/" + file.id + ":batchUpdate", {
    method: "POST", headers,
    body: JSON.stringify({ requests: [{ insertText: { endOfSegmentLocation: {}, text: content } }] }),
    signal: AbortSignal.timeout(12000),
  });
  if (!write.ok) {
    // The new empty document may exist; never retry automatically to avoid duplicates.
    const { error } = await db.from("documents").insert({
      title, url: link, kind: "google_drive_created",
      notes: "Criado no Drive, mas o conteúdo falhou. Revisar manualmente.",
      created_by: userId,
    });
    checkDatabase(error);
    throw new ApiError(502, "GOOGLE_DOCUMENT_CONTENT_FAILED");
  }
  const { error } = await db.from("documents").insert({
    title, url: link, kind: "google_drive_created",
    notes: "Criado pelo Permaneo HQ após aprovação.", created_by: userId,
  });
  checkDatabase(error);
  return { link, id: file.id };
}
export async function handleGoogle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/google\/?/, "").split("/")[0];
    if (path === "callback" && request.method === "GET") return await callback(request);
    const { actor } = await authenticate(request);
    if (request.method === "POST" && request.headers.get("origin") &&
        request.headers.get("origin") !== url.origin) throw new ApiError(403, "ORIGIN_REJECTED");
    const db = adminDatabase();
    if (path === "status" && request.method === "GET") {
      let configured = true;
      try { oauthConfig(); tokenKey(); } catch { configured = false; }
      const { data, error } = await db.from("google_drive_connections")
        .select("user_id").eq("user_id", actor.id).maybeSingle();
      checkDatabase(error);
      return json({ configured, connected: Boolean(data) });
    }
    if (path === "connect" && request.method === "POST") {
      assertEditor(actor);
      const cfg = oauthConfig();
      tokenKey();
      const state = randomBytes(32).toString("base64url");
      const verifier = randomBytes(32).toString("base64url");
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      const { error } = await db.from("google_oauth_states").insert({
        state, user_id: actor.id, code_verifier: verifier,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
      checkDatabase(error);
      const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      auth.search = new URLSearchParams({
        client_id: cfg.clientId, redirect_uri: cfg.redirect, response_type: "code",
        access_type: "offline", prompt: "consent", scope, state,
        code_challenge: challenge, code_challenge_method: "S256",
      }).toString();
      return json({ url: auth.toString() });
    }
    if (path === "disconnect" && request.method === "POST") {
      const { error } = await db.from("google_drive_connections").delete().eq("user_id", actor.id);
      checkDatabase(error);
      return json({ disconnected: true });
    }
    throw new ApiError(404, "ENDPOINT_NOT_FOUND");
  } catch (cause) {
    if (cause instanceof ApiError) return json({ error: cause.code }, cause.status);
    return json({ error: "GOOGLE_DRIVE_UNAVAILABLE" }, 503);
  }
}
