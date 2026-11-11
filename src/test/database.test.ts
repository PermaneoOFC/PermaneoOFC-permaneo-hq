// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// A disposable WASM PostgreSQL, not Supabase and never a remote database.
let db: PGlite;
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const reserveSql =
  "select (public.reserve_agent_run($1,'backend',$2,$3,null,'test/model',0.2,0.000001,0.000002,$4,5,$5)).*";
async function reserve(
  key = uid(100),
  prompt = "Revise esta API",
  daily = 1,
  perMinute = 3,
  user = uid(2),
) {
  return db.query<{ id: string; status: string }>(reserveSql, [
    user,
    prompt,
    key,
    daily,
    perMinute,
  ]);
}
async function asUser<T>(user: string, sql: string, values: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
    return tx.query<T>(sql, values);
  });
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text,created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`);
  await db.exec(readFileSync("database/migrations/001_independent_baseline.sql", "utf8"));
  await db.exec(readFileSync("database/migrations/002_agent_engine.sql", "utf8"));
}, 30000);
beforeEach(async () => {
  await db.exec("truncate auth.users cascade");
  for (let n = 1; n <= 7; n++)
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      uid(n),
      `test${n}@example.invalid`,
    ]);
  await db.query(
    "insert into public.user_roles(user_id,role) values($1,'admin'),($2,'editor'),($3,'viewer')",
    [uid(1), uid(2), uid(3)],
  );
});
afterAll(async () => {
  await db?.close();
});

describe("independent migrations and real PostgreSQL RLS", () => {
  it("never bootstraps the first public signup", async () => {
    await db.exec("truncate auth.users cascade");
    await db.query("insert into auth.users(id,email) values($1,'first@example.invalid')", [uid(1)]);
    expect((await db.query("select * from public.user_roles")).rows).toHaveLength(0);
  });
  it("seeds the 14 agents and blocks unapproved reads", async () => {
    expect((await asUser(uid(3), "select * from public.agents")).rows).toHaveLength(14);
    expect((await asUser(uid(4), "select * from public.agents")).rows).toHaveLength(0);
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return tx.query("select * from public.agent_runs");
      }),
    ).rejects.toThrow(/permission denied/);
  });
  it("requires admin approval, forbids browser admin promotion and caps the team at five", async () => {
    await expect(
      asUser(uid(2), "select public.set_team_member_role($1,'editor')", [uid(4)]),
    ).rejects.toThrow(/administradores/);
    await expect(
      asUser(uid(1), "select public.set_team_member_role($1,'admin')", [uid(4)]),
    ).rejects.toThrow(/atribuídos/);
    await asUser(uid(1), "select public.set_team_member_role($1,'editor')", [uid(4)]);
    await asUser(uid(1), "select public.set_team_member_role($1,'viewer')", [uid(5)]);
    await expect(
      asUser(uid(1), "select public.set_team_member_role($1,'viewer')", [uid(6)]),
    ).rejects.toThrow(/cinco/);
    await expect(
      asUser(uid(2), "insert into public.user_roles(user_id,role) values($1,'admin')", [uid(2)]),
    ).rejects.toThrow(/permission denied/);
  });
  it("prevents viewer requests and direct RPC budget bypass", async () => {
    await expect(
      asUser(
        uid(3),
        "insert into public.agent_requests(agent_id,title) select id,'test' from public.agents limit 1",
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(asUser(uid(1), reserveSql, [uid(2), "p", uid(101), 1, 3])).rejects.toThrow(
      /permission denied/,
    );
    await expect(reserve(uid(101), "p", 1, 3, uid(3))).rejects.toThrow(/EDITOR_REQUIRED/);
  });
  it("is idempotent, persists the prompt and rejects changed replay", async () => {
    const [a, b] = await Promise.all([reserve(), reserve()]);
    expect(a.rows[0]?.id).toBe(b.rows[0]?.id);
    expect((await db.query("select * from public.agent_runs")).rows).toHaveLength(1);
    expect((await db.query("select * from public.agent_messages")).rows).toHaveLength(1);
    await expect(reserve(uid(100), "changed")).rejects.toThrow(/IDEMPOTENCY_CONFLICT/);
  });
  it("enforces active-run, rate and nonrefundable budget limits", async () => {
    await reserve();
    await expect(reserve(uid(101))).rejects.toThrow(/RUN_ACTIVE/);
    await db.exec("update public.agent_runs set status='cancelled'");
    await expect(reserve(uid(101), "p", 0.3)).rejects.toThrow(/BUDGET_EXCEEDED/);
    await expect(reserve(uid(101), "p", 1, 1)).rejects.toThrow(/RATE_LIMIT/);
  });
  it("persists final response, artifact, usage and history atomically; cancellation wins", async () => {
    const r = (await reserve()).rows[0]!;
    await db.query("update public.agent_runs set status='running' where id=$1", [r.id]);
    await db.query(
      "select public.finish_agent_run($1,'completed','Resposta persistida',null,10,20,0.01)",
      [r.id],
    );
    expect(
      (await asUser<{ content: string }>(uid(3), "select content from public.agent_artifacts"))
        .rows[0]?.content,
    ).toBe("Resposta persistida");
    expect((await db.query("select * from public.agent_run_events")).rows).toHaveLength(3);
    const second = (await reserve(uid(101))).rows[0]!;
    await db.query("update public.agent_runs set status='cancelled' where id=$1", [second.id]);
    await db.query(
      "select public.finish_agent_run($1,'completed','Must not win',null,10,20,0.01)",
      [second.id],
    );
    expect(
      (
        await db.query<{ status: string }>("select status from public.agent_runs where id=$1", [
          second.id,
        ])
      ).rows[0]?.status,
    ).toBe("cancelled");
  });
  it("approval requires an authorized human and cannot be rewritten or execute externally", async () => {
    const r = (await reserve()).rows[0]!;
    await db.query("update public.agent_runs set status='running' where id=$1", [r.id]);
    const approval = await db.query<{ id: string }>(
      "insert into public.agent_approvals(run_id,user_id,agent_id,service,action,proposal) select id,user_id,agent_id,'github','propose PR','Review this patch' from public.agent_runs where id=$1 returning id",
      [r.id],
    );
    const id = approval.rows[0]!.id;
    await db.query("select public.finish_agent_run($1,'completed','Proposta',null,10,20,0.01)", [
      r.id,
    ]);
    await expect(
      asUser(uid(3), "select public.decide_agent_approval($1,true)", [id]),
    ).rejects.toThrow(/EDITOR_REQUIRED/);
    await expect(
      asUser(uid(1), "update public.agent_approvals set status='approved'"),
    ).rejects.toThrow(/permission denied/);
    await asUser(uid(2), "select public.decide_agent_approval($1,true)", [id]);
    await expect(
      asUser(uid(2), "select public.decide_agent_approval($1,false)", [id]),
    ).rejects.toThrow(/INVALID_STATUS|ALREADY_DECIDED/);
    expect(
      (await db.query<{ decided_by: string }>("select decided_by from public.agent_approvals"))
        .rows[0]?.decided_by,
    ).toBe(uid(2));
  });
  it("revoking membership immediately hides persisted history", async () => {
    await reserve();
    expect((await asUser(uid(3), "select * from public.agent_runs")).rows).toHaveLength(1);
    await db.query("delete from public.user_roles where user_id=$1", [uid(3)]);
    expect((await asUser(uid(3), "select * from public.agent_runs")).rows).toHaveLength(0);
  });
});
