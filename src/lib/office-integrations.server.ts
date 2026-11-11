import "@tanstack/react-start/server-only";
import { authenticate } from "./agents/permissions.server";
import { adminDatabase, checkDatabase } from "./agents/store.server";
import { ApiError } from "./agents/contracts";

export const repoName = "PermaneoOFC/PermaneoOFC-permaneo-hq";
const teamId = "team_tXvPv0h45WoJFlXJcPy1yWZ4";
const projectId = "prj_bjeTMvY2fq8uVHCEsO5SdCXZ5thJ";
type Check = { service: string; ready: boolean; access: string; detail: string };
function githubHeaders() {
  const token = process.env["GITHUB_TOKEN"];
  return { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(token ? { Authorization: "Bearer " + token } : {}) };
}
async function readJson(url: string, headers: Record<string,string>, timeout = 8000): Promise<Record<string,unknown> | null> {
  try {
    const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(timeout) });
    if (!response.ok) return null;
    return await response.json() as Record<string,unknown>;
  } catch { return null; }
}
export async function githubOverview() {
  const data = await readJson("https://api.github.com/repos/" + repoName, githubHeaders());
  if (!data || typeof data.full_name !== "string") return { accessible: false, repository: repoName };
  const sha = await readJson(
    "https://api.github.com/repos/" + repoName + "/commits/backend%2Fativacao-supabase",
    githubHeaders(),
  );
  return {
    accessible: true,
    repository: String(data.full_name),
    visibility: data.private === true ? "private" : "public",
    defaultBranch: String(data.default_branch ?? "unknown"),
    previewSha: typeof sha?.sha === "string" ? sha.sha.slice(0, 12) : null,
    htmlUrl: "https://github.com/" + repoName,
    source: "github_api",
  };
}
export async function vercelOverview() {
  const token = process.env["VERCEL_API_TOKEN"];
  if (!token) return { accessible: false, project: "permaneo-hq", detail: "VERCEL_API_TOKEN ausente" };
  const url = "https://api.vercel.com/v9/projects/" + projectId + "?teamId=" + teamId;
  const data = await readJson(url, { Authorization: "Bearer " + token });
  if (!data || typeof data.id !== "string" || data.id !== projectId)
    return { accessible: false, project: "permaneo-hq", detail: "Token sem acesso ao projeto" };
  const deployment = await readJson(
    "https://api.vercel.com/v6/deployments?projectId=" + projectId + "&teamId=" + teamId + "&limit=1",
    { Authorization: "Bearer " + token },
  );
  const entry = Array.isArray(deployment?.deployments) ? deployment.deployments[0] as Record<string,unknown> | undefined : undefined;
  return { accessible: true, project: String(data.name), latestState: entry?.state ?? null, latestUrl: typeof entry?.url === "string" ? "https://" + entry.url : null, source: "vercel_api" };
}
export async function statuses(userId: string) {
  const db = adminDatabase();
  const [github, vercel, google] = await Promise.all([
    githubOverview(), vercelOverview(),
    db.from("google_drive_connections").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  checkDatabase(google.error);
  const googleConfigured = Boolean(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"] && process.env["GOOGLE_REDIRECT_URI"] && process.env["GOOGLE_TOKEN_ENCRYPTION_KEY"]);
  const trelloConfigured = process.env["HQ_TRELLO_ENABLED"] === "true" && Boolean(process.env["TRELLO_API_KEY"] && process.env["TRELLO_TOKEN"]);
  const linkedInReady = false; // App access to LinkedIn is NOT transferred from ChatGPT, and no OAuth credentials are configured.
  const list: Check[] = [
    {service:"trello", ready:trelloConfigured, access:trelloConfigured ? "board_sync" : "mirror_only", detail:trelloConfigured ? "Sincronização autorizada; alterações exigem aprovação" : "TRELLO_API_KEY, TRELLO_TOKEN e HQ_TRELLO_ENABLED"},
    {service:"google_drive", ready:Boolean(google.data && googleConfigured), access:google.data && googleConfigured ? "drive_file" : "links_only", detail:google.data && googleConfigured ? "Conectado para arquivos do aplicativo" : googleConfigured ? "Autorize a conta Google no painel" : "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_TOKEN_ENCRYPTION_KEY"},
    {service:"github", ready:github.accessible, access:github.accessible ? "repository_read" : "link_only", detail:github.accessible ? "Leitura de repositório verificada" : "Configure GITHUB_TOKEN com acesso de leitura ao repositório"},
    {service:"linkedin", ready:linkedInReady, access:"drafts_only", detail:"Publicação direta exige aplicativo LinkedIn aprovado, OAuth e escopos da página"},
    {service:"vercel", ready:vercel.accessible, access:vercel.accessible ? "project_read" : "link_only", detail:vercel.accessible ? "Leitura do projeto verificada" : "VERCEL_API_TOKEN com permissão de leitura para o projeto"},
  ];
  return { connections: list, github, vercel, driveConnected: Boolean(google.data && googleConfigured) };
}
export async function handleOfficeIntegrations(request: Request): Promise<Response> {
  try {
    const { actor } = await authenticate(request);
    if (request.method !== "GET") throw new ApiError(405, "METHOD_NOT_ALLOWED");
    const result = await statuses(actor.id);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (e) {
    return Response.json({ error: e instanceof ApiError ? e.code : "INTEGRATIONS_UNAVAILABLE" }, { status: e instanceof ApiError ? e.status : 503, headers: { "Cache-Control": "no-store" } });
  }
}
