import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Panel, Pill } from "@/components/hq/ui";
import { Button } from "@/components/ui/button";

type Member = { user_id: string; email: string; role: string; created_at: string };
type Role = "viewer" | "editor";

export function TeamAccessPanel() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const members = useQuery({
    queryKey: ["team-members"],
    enabled: Boolean(user && isAdmin),
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.rpc("list_team_members");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  async function approve(id: string, role: Role) {
    setSaving(id);
    try {
      const { error } = await supabase.rpc("set_team_member_role", {
        target_user_id: id,
        desired_role: role,
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["team-members"] });
      toast.success(role === "viewer" ? "Acesso de visualização liberado" : "Acesso de edição liberado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o acesso.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Panel title="Acesso da equipe" action={<Pill>{isAdmin ? "Administrador" : "Restrito ao administrador"}</Pill>}>
      <p className="mb-4 text-sm text-muted-foreground">
        Cada integrante cria sua própria conta na tela de login. Novas contas ficam pendentes até sua aprovação.
        Visualizadores acompanham os dados; editores também podem registrar tarefas.
      </p>
      {!isAdmin ? (
        <p className="text-sm text-muted-foreground">Apenas administradores podem aprovar ou alterar permissões.</p>
      ) : members.isLoading ? (
        <p className="text-sm">Carregando integrantes…</p>
      ) : members.error ? (
        <p role="alert" className="text-sm text-destructive">Não foi possível carregar a equipe. Verifique as migrations do Supabase próprio.</p>
      ) : (
        <div className="space-y-3">
          {(members.data ?? []).map((member) => (
            <div key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-semibold">{member.email || member.user_id}</p>
                <p className="text-xs text-muted-foreground">{member.role === "pendente" ? "Aguardando aprovação" : member.role === "viewer" ? "Visualizador" : member.role === "editor" ? "Editor" : "Administrador"}</p>
              </div>
              {member.role !== "admin" && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={member.role === "viewer" ? "secondary" : "outline"}
                    disabled={saving === member.user_id} onClick={() => approve(member.user_id, "viewer")}>
                    Visualizador
                  </Button>
                  <Button size="sm" variant={member.role === "editor" ? "secondary" : "outline"}
                    disabled={saving === member.user_id} onClick={() => approve(member.user_id, "editor")}>
                    Editor
                  </Button>
                </div>
              )}
            </div>
          ))}
          {!members.data?.length && <p className="text-sm text-muted-foreground">Nenhum integrante cadastrado.</p>}
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["team-members"] })}>Atualizar lista</Button>
        </div>
      )}
    </Panel>
  );
}
