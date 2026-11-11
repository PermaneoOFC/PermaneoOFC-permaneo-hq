import "@tanstack/react-start/server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./contracts";
import { checkDatabase } from "./store.server";
import { createApprovedGoogleDocument } from "@/lib/google-drive.server";

const board = "IfYN7SWi";
const comment = z.object({ cardId: z.string().regex(/^[a-f0-9]{24}$/), text: z.string().trim().min(3).max(800) }).strict();
const checklist = z.object({ cardId: z.string().regex(/^[a-f0-9]{24}$/), name: z.string().trim().min(3).max(90) }).strict();
const move = z.object({ cardId: z.string().regex(/^[a-f0-9]{24}$/), targetListId: z.string().regex(/^[a-f0-9]{24}$/) }).strict();
type Action = "add_comment" | "add_checklist" | "move_card";

export function isTrelloAction(action: string): action is Action {
  return ["add_comment", "add_checklist", "move_card"].includes(action);
}

async function trelloRequest(path: string, data: Record<string, string>, method: "POST" | "PUT" = "POST") {
  const key = process.env["TRELLO_API_KEY"];
  const token = process.env["TRELLO_TOKEN"];
  if (process.env["HQ_TRELLO_WRITES_ENABLED"] !== "true" || !key || !token)
    throw new ApiError(503, "TRELLO_WRITE_NOT_CONFIGURED");
  const form = new URLSearchParams({ key, token, ...data });
  const response = await fetch("https://api.trello.com/1/" + path, {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(502, "TRELLO_REQUEST_FAILED");
  return (await response.json()) as { id?: string; url?: string };
}

const realBoardId = "6af31f42347314fd0f6e04dd";
async function verifyTrelloResource(path: string) {
  const key = process.env["TRELLO_API_KEY"];
  const token = process.env["TRELLO_TOKEN"];
  if (!key || !token) throw new ApiError(503, "TRELLO_WRITE_NOT_CONFIGURED");
  const query = new URLSearchParams({ key, token });
  const response = await fetch("https://api.trello.com/1/" + path + "?fields=idBoard,closed&" + query, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(502, "TRELLO_RESOURCE_UNAVAILABLE");
  const resource = (await response.json()) as { idBoard?: string; closed?: boolean };
  if (resource.idBoard !== realBoardId || resource.closed)
    throw new ApiError(403, "RESOURCE_OUTSIDE_APPROVED_BOARD");
}

/** Called only after a signed-in editor has approved a structured agent proposal.
 *  At-most-once insertion before the outbound call prevents duplicate Trello writes.
 *  A failed call is not retried automatically.
 */
export async function applyApprovedAction(opts: {
  id: string; actorId: string; isAdmin: boolean; db: SupabaseClient; admin: SupabaseClient;
}) {
  const { id, actorId, isAdmin, db, admin } = opts;
  const { data, error } = await db.from("agent_approvals").select("*").eq("id", id).single();
  checkDatabase(error);
  if (!data) throw new ApiError(404, "APPROVAL_NOT_FOUND");
  if (!isAdmin && data.user_id !== actorId) throw new ApiError(403, "OWNER_REQUIRED");
  if (data.status !== "approved") throw new ApiError(409, "APPROVAL_REQUIRED");
  if (data.service === "github") {
    if (data.action !== "create_issue") throw new ApiError(400, "EXTERNAL_ACTION_NOT_SUPPORTED");
    if (process.env["HQ_GITHUB_WRITES_ENABLED"] !== "true" || !process.env["GITHUB_TOKEN"])
      throw new ApiError(503, "GITHUB_WRITE_NOT_CONFIGURED");
    let issue: { title: string; body: string };
    try {
      issue = z.object({
        title: z.string().trim().min(5).max(120),
        body: z.string().trim().min(10).max(1500),
      }).strict().parse(JSON.parse(data.proposal));
    } catch { throw new ApiError(400, "INVALID_EXTERNAL_PROPOSAL"); }
    // Validate repository access with the same token used to write.
    const base = "https://api.github.com/repos/PermaneoOFC/PermaneoOFC-permaneo-hq";
    const headers = {
      Authorization: "Bearer " + process.env["GITHUB_TOKEN"],
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const check = await fetch(base, { headers, signal: AbortSignal.timeout(8000) });
    if (!check.ok) throw new ApiError(503, "GITHUB_REPOSITORY_UNAVAILABLE");
    const repo = await check.json() as { full_name?: string };
    if (repo.full_name !== "PermaneoOFC/PermaneoOFC-permaneo-hq")
      throw new ApiError(403, "WRONG_GITHUB_REPOSITORY");
    const { data: claim, error: claimError } = await admin.from("external_action_executions")
      .insert({ approval_id: id, service: "github", action: "create_issue", status: "started" })
      .select("id").maybeSingle();
    if (claimError?.message.includes("duplicate key")) throw new ApiError(409, "ACTION_ALREADY_ATTEMPTED");
    checkDatabase(claimError);
    if (!claim) throw new ApiError(409, "ACTION_ALREADY_ATTEMPTED");
    try {
      const response = await fetch(base + "/issues", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(issue), signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new ApiError(502, "GITHUB_ISSUE_CREATION_FAILED");
      const result = await response.json() as { html_url?: string; number?: number };
      const { error: logError } = await admin.from("external_action_executions").update({
        status: "completed", result_url: result.html_url ?? null, finished_at: new Date().toISOString(),
      }).eq("id", claim.id);
      checkDatabase(logError);
      return { executed: true, service: "github", action: "create_issue", resultUrl: result.html_url };
    } catch (cause) {
      await admin.from("external_action_executions").update({
        status: "failed", error_code: cause instanceof ApiError ? cause.code : "GITHUB_REQUEST_FAILED",
        finished_at: new Date().toISOString(),
      }).eq("id", claim.id);
      throw cause;
    }
  }
  if (data.service === "google_drive") {
    if (data.action !== "create_doc") throw new ApiError(400, "EXTERNAL_ACTION_NOT_SUPPORTED");
    let proposal: { title: string; content: string };
    try {
      proposal = z.object({
        title: z.string().trim().min(5).max(120),
        content: z.string().trim().min(10).max(1200),
      }).strict().parse(JSON.parse(data.proposal));
    } catch { throw new ApiError(400, "INVALID_EXTERNAL_PROPOSAL"); }
    // Fail before claiming an irreversible action when the account or OAuth app is unconfigured.
    if (!process.env["GOOGLE_CLIENT_ID"] || !process.env["GOOGLE_CLIENT_SECRET"] ||
        !process.env["GOOGLE_REDIRECT_URI"] || !process.env["GOOGLE_TOKEN_ENCRYPTION_KEY"])
      throw new ApiError(503, "GOOGLE_OAUTH_NOT_CONFIGURED");
    const { data: connection, error: connectionError } = await admin.from("google_drive_connections")
      .select("user_id").eq("user_id", data.user_id).maybeSingle();
    checkDatabase(connectionError);
    if (!connection) throw new ApiError(503, "GOOGLE_DRIVE_NOT_CONNECTED");
    const { data: claim, error: claimError } = await admin.from("external_action_executions")
      .insert({ approval_id: id, service: data.service, action: data.action, status: "started" })
      .select("id").maybeSingle();
    if (claimError?.message.includes("duplicate key")) throw new ApiError(409, "ACTION_ALREADY_ATTEMPTED");
    checkDatabase(claimError);
    if (!claim) throw new ApiError(409, "ACTION_ALREADY_ATTEMPTED");
    try {
      const result = await createApprovedGoogleDocument(data.user_id, proposal.title, proposal.content, admin);
      const { error: saveError } = await admin.from("external_action_executions").update({
        status: "completed", result_url: result.link, finished_at: new Date().toISOString(),
      }).eq("id", claim.id);
      checkDatabase(saveError);
      return { executed: true, service: "google_drive", action: "create_doc", resultUrl: result.link };
    } catch (cause) {
      await admin.from("external_action_executions").update({
        status: "failed", finished_at: new Date().toISOString(),
        error_code: cause instanceof ApiError ? cause.code : "GOOGLE_DRIVE_REQUEST_FAILED",
      }).eq("id", claim.id);
      throw cause;
    }
  }
  if (data.service !== "trello" || !isTrelloAction(data.action))
    throw new ApiError(400, "EXTERNAL_ACTION_NOT_SUPPORTED");
  if (process.env["HQ_TRELLO_WRITES_ENABLED"] !== "true" ||
      !process.env["TRELLO_API_KEY"] || !process.env["TRELLO_TOKEN"])
    throw new ApiError(503, "TRELLO_WRITE_NOT_CONFIGURED");

  let payload: z.infer<typeof comment> | z.infer<typeof checklist> | z.infer<typeof move>;
  try {
    const value: unknown = JSON.parse(data.proposal);
    payload = data.action === "add_comment" ? comment.parse(value)
      : data.action === "add_checklist" ? checklist.parse(value) : move.parse(value);
  } catch { throw new ApiError(400, "INVALID_EXTERNAL_PROPOSAL"); }
  const { data: task, error: taskError } = await admin.from("mirrored_tasks")
    .select("external_id,board_id").eq("source", "trello")
    .eq("external_id", payload.cardId).eq("board_id", board).eq("closed", false).single();
  checkDatabase(taskError);
  if (!task) throw new ApiError(404, "CARD_NOT_IN_APPROVED_BOARD");
  if (data.action === "move_card") {
    const target = (payload as z.infer<typeof move>).targetListId;
    const { data: rows, error: listError } = await admin.from("mirrored_tasks")
      .select("list_id").eq("board_id", board).eq("list_id", target).limit(1);
    checkDatabase(listError);
    if (!rows?.length) throw new ApiError(400, "TARGET_LIST_NOT_IN_BOARD");
  }
  // Revalidate membership using the live provider before any action.
  await verifyTrelloResource("cards/" + payload.cardId);
  if (data.action === "move_card")
    await verifyTrelloResource("lists/" + (payload as z.infer<typeof move>).targetListId);
  const { data: claim, error: claimError } = await admin.from("external_action_executions")
    .insert({ approval_id: id, service: data.service, action: data.action, status: "started" })
    .select("id").maybeSingle();
  if (claimError?.message.includes("duplicate key")) throw new ApiError(409, "ACTION_ALREADY_ATTEMPTED");
  checkDatabase(claimError);
  if (!claim) throw new ApiError(409, "ACTION_ALREADY_ATTEMPTED");
  try {
    const external = data.action === "add_comment"
      ? await trelloRequest("cards/" + payload.cardId + "/actions/comments", { text: (payload as z.infer<typeof comment>).text })
      : data.action === "add_checklist"
        ? await trelloRequest("cards/" + payload.cardId + "/checklists", { name: (payload as z.infer<typeof checklist>).name })
        : await trelloRequest("cards/" + payload.cardId, { idList: (payload as z.infer<typeof move>).targetListId }, "PUT");
    const { error: saveError } = await admin.from("external_action_executions")
      .update({ status: "completed", finished_at: new Date().toISOString(),
        result_url: "https://trello.com/c/" + payload.cardId }).eq("id", claim.id);
    checkDatabase(saveError);
    return { executed: true, service: "trello", action: data.action, externalId: external.id ?? null };
  } catch (cause) {
    await admin.from("external_action_executions").update({
      status: "failed", error_code: cause instanceof ApiError ? cause.code : "EXTERNAL_PROVIDER_ERROR",
      finished_at: new Date().toISOString(),
    }).eq("id", claim.id);
    throw cause;
  }
}
