import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        const r = (roles ?? []).map((x) => x.role);
        setIsAdmin(r.includes("admin"));
        setCanEdit(r.includes("admin") || r.includes("editor"));
      }
    });
  }, []);
  return { user, canEdit, isAdmin };
}