import "@tanstack/react-start/server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./contracts";
import { checkDatabase } from "./store.server";

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
