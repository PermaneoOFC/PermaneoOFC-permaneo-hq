import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Board id from the official URL https://trello.com/b/IfYN7SWi/demo-day
const DEFAULT_BOARD = "IfYN7SWi";

function creds() {
  const key = process.env["TRELLO_API_KEY"];
  const token = process.env["TRELLO_TOKEN"];
  const board = process.env["TRELLO_BOARD_ID"] || DEFAULT_BOARD;
  return { key, token, board, configured: Boolean(key && token) };
}

export const getTrelloStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const c = creds();
    return { configured: c.configured, board: c.board };
  });

interface TrelloList { id: string; name: string; closed: boolean }
interface TrelloCard {
  id: string; name: string; desc: string; idList: string; url: string; due: string | null;
  closed: boolean; labels: { name: string; color: string }[];
}

/** Read-only sync: pulls lists and cards from Trello and mirrors them. Never writes to Trello. */
export const syncTrello = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: canEdit } = await context.supabase.rpc("can_edit", { _user_id: context.userId });
    if (!canEdit) throw new Error("Sem permissão para sincronizar.");
    const c = creds();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const log = async (status: string, message: string, items = 0) =>
      supabaseAdmin.from("sync_logs").insert({
        integration: "trello", status, message, items_count: items, triggered_by: context.userId,
      });
    if (!c.configured) {
      await log("erro", "Credenciais do Trello não configuradas.");
      return { ok: false as const, error: "Trello não conectado: configure TRELLO_API_KEY e TRELLO_TOKEN." };
    }
    const auth = `key=${encodeURIComponent(c.key!)}&token=${encodeURIComponent(c.token!)}`;
    const base = `https://api.trello.com/1/boards/${c.board}`;
    const [lr, cr] = await Promise.all([
      fetch(`${base}/lists?filter=open&${auth}`),
      fetch(`${base}/cards?filter=open&fields=name,desc,idList,url,due,closed,labels&${auth}`),
    ]);
    if (!lr.ok || !cr.ok) {
      const body = !lr.ok ? await lr.text() : await cr.text();
      const status = !lr.ok ? lr.status : cr.status;
      await log("erro", `Trello respondeu ${status}: ${body.slice(0, 200)}`);
      return { ok: false as const, error: `Trello respondeu ${status}: ${body.slice(0, 200)}` };
    }
    const lists = (await lr.json()) as TrelloList[];
    const cards = (await cr.json()) as TrelloCard[];
    const listName = new Map(lists.map((l) => [l.id, l.name]));
    const now = new Date().toISOString();
    const rows = cards.map((card) => ({
      source: "trello", external_id: card.id, board_id: c.board, list_id: card.idList,
      list_name: listName.get(card.idList) ?? null, name: card.name, description: card.desc,
      url: card.url, due: card.due, closed: card.closed, labels: card.labels, last_synced_at: now,
    }));
    if (rows.length) {
      const { error } = await supabaseAdmin.from("mirrored_tasks").upsert(rows, { onConflict: "source,external_id" });
      if (error) {
        await log("erro", error.message);
        return { ok: false as const, error: error.message };
      }
    }
    await log("sucesso", `${lists.length} listas, ${cards.length} cards lidos.`, cards.length);
    return { ok: true as const, lists: lists.length, cards: cards.length };
  });