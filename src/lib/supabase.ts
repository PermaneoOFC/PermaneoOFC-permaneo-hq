import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_MODE } from "@/lib/demo";

// Independent client. Generated Lovable integrations are retained as legacy files only.
let client: ReturnType<typeof createClient<Database>> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, property) {
    if (DEMO_MODE) throw new Error("A demonstração não acessa autenticação ou dados privados.");
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Configure o Supabase próprio para usar o modo autenticado.");
    client ??= createClient<Database>(url, key);
    return Reflect.get(client, property);
  },
});
