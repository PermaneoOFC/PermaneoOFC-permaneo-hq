import { supabase } from "@/lib/supabase";
import { DEMO_MODE } from "@/lib/demo";

export async function agentFetch(path: string, init?: RequestInit) {
  if (DEMO_MODE) throw new Error("Demonstração: execuções e dados privados estão desativados.");
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Entre com sua conta individual.");
  const response = await fetch(`/api/agents/${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => ({ error: "BACKEND_UNAVAILABLE" }))) as {
      error?: string;
    };
    throw new Error(result.error ?? "BACKEND_UNAVAILABLE");
  }
  return response;
}
export async function agentJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await agentFetch(
    path,
    body === undefined ? undefined : { method: "POST", body: JSON.stringify(body) },
  );
  return response.json() as Promise<T>;
}
