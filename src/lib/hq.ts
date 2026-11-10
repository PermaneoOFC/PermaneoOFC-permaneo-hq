import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentRequest = Database["public"]["Tables"]["agent_requests"]["Row"];
export type MirroredTask = Database["public"]["Tables"]["mirrored_tasks"]["Row"];

async function q<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const agentsQuery = queryOptions({
  queryKey: ["agents"],
  queryFn: () => q(supabase.from("agents").select("*").order("sort_order")),
});
export const requestsQuery = queryOptions({
  queryKey: ["agent_requests"],
  queryFn: () =>
    q(supabase.from("agent_requests").select("*").order("created_at", { ascending: false })),
});
export const tasksQuery = queryOptions({
  queryKey: ["mirrored_tasks"],
  queryFn: () => q(supabase.from("mirrored_tasks").select("*").order("list_name")),
});
export const syncLogsQuery = queryOptions({
  queryKey: ["sync_logs"],
  queryFn: () =>
    q(supabase.from("sync_logs").select("*").order("created_at", { ascending: false }).limit(20)),
});
export const auditQuery = queryOptions({
  queryKey: ["audit_log"],
  queryFn: () =>
    q(supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(30)),
});

export const ROOMS: Record<string, { label: string; hint: string }> = {
  coordenacao: { label: "Sala de Coordenação", hint: "PM e Scrum" },
  engenharia: { label: "Laboratório de Engenharia", hint: "Código e infraestrutura" },
  estudio: { label: "Estúdio Criativo", hint: "Design, marca e pitch" },
  biblioteca: { label: "Biblioteca de Evidências", hint: "Pesquisa, pedagogia e dossiê" },
  negocios: { label: "Sala de Negócios", hint: "Modelo e finanças" },
};

export const STATUS_LABEL: Record<Agent["status"], string> = {
  disponivel: "Disponível",
  aguardando_aprovacao: "Aguardando aprovação",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  nao_configurado: "Não configurado",
};

export const REQUEST_STATUS_LABEL: Record<AgentRequest["status"], string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  rejeitado: "Rejeitado",
};

export const TRELLO_BOARD_URL = "https://trello.com/b/IfYN7SWi/demo-day";
export const TRELLO_KNOWN_LISTS = [
  "Backlog Inicial",
  "Backlog Sprint 3",
  "Atuando",
  "Validando",
  "Feito",
  "CONCORRENTES E VALORES REAIS DO MERCADO",
];
export const TRELLO_REFERENCE_CARDS = [
  "Desenvolvimento Front-end",
  "Criação do Dossiê",
  "Orçamento do Projeto",
  "Apresentação",
];

export function initials(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}