import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Agent } from "@/lib/hq";

export function RequestDialog({ agent, trigger }: { agent: Agent; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") || "").trim();
    if (!title) return toast.error("Informe um título.");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("agent_requests").insert({
      agent_id: agent.id, title, details: String(f.get("details") || ""),
      priority: String(f.get("priority") || "media"), due_date: (f.get("due") as string) || null,
      requester_email: u.user?.email ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitação registrada na fila. Nenhuma IA foi executada.");
    qc.invalidateQueries({ queryKey: ["agent_requests"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button><Send /> Solicitar tarefa</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar tarefa · {agent.name}</DialogTitle>
          <DialogDescription>O pedido é salvo na fila do agente para triagem humana. Nada é executado automaticamente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="title">Título</Label><Input id="title" name="title" maxLength={160} required /></div>
          <div className="space-y-1.5"><Label htmlFor="details">Detalhes</Label><Textarea id="details" name="details" rows={4} maxLength={4000} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="priority">Prioridade</Label>
              <select id="priority" name="priority" defaultValue="media" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
              </select></div>
            <div className="space-y-1.5"><Label htmlFor="due">Prazo</Label><Input id="due" name="due" type="date" /></div>
          </div>
          <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar solicitação"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}