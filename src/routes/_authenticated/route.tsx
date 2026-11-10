import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/hq/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (error || !roles?.length) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});