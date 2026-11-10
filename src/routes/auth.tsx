import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Permaneo HQ" },
      { name: "description", content: "Acesse a Central de Agentes do Permaneo." },
      { property: "og:title", content: "Entrar — Permaneo HQ" },
      { property: "og:description", content: "Acesse a Central de Agentes do Permaneo." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return toast.error("Não foi possível confirmar a conta.");
      const { data: memberRoles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
      if (roleError) return toast.error("Não foi possível verificar seu acesso.");
      if (!memberRoles?.length) { setPending(true); return; }
      navigate({ to: "/painel" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada. Confirme seu e-mail e aguarde a aprovação do administrador.");
      setMode("in");
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return toast.error(String(r.error.message ?? r.error));
    if (r.redirected) return;
    const { data } = await supabase.auth.getUser();
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user?.id ?? "");
    if (!roles?.length) { setPending(true); return; }
    navigate({ to: "/painel" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-end p-12 text-primary-foreground lg:flex">
        <h1 className="text-5xl font-extrabold">Permaneo HQ</h1>
        <p className="mt-3 max-w-md opacity-85">Central de Agentes para o Demo Day.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div><h2 className="text-3xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h2>
            <p className="text-sm text-muted-foreground">Acesso reservado à equipe autorizada do Permaneo.</p></div>
          {pending && <div role="status" className="rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900">Conta autenticada, mas ainda sem permissão. Peça ao administrador que libere seu acesso no painel da equipe.</div>}
          <button type="button" onClick={google}
            className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.070 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.760 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continuar com Google
          </button>
          <div className="text-center text-xs text-muted-foreground">ou com e-mail</div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" minLength={6} required /></div>
            <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
          </form>
          <button className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}