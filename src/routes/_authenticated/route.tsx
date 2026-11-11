import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/hq/AppShell";
import { DEMO_MODE } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (DEMO_MODE) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (error || !roles?.length) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});
