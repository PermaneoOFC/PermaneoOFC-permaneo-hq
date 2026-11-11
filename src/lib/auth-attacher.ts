import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { DEMO_MODE } from "./demo";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (DEMO_MODE) throw new Error("Demonstração somente leitura.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
