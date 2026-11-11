import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { DEMO_MODE } from "@/lib/demo";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    let generation = 0;
    async function load(nextUser: User | null) {
      if (!active) return;
      const current = ++generation;
      setUser(nextUser); setCanEdit(false); setIsAdmin(false);
      if (!nextUser) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", nextUser.id);
      if (!active || current !== generation) return;
      const r = (roles ?? []).map((x) => x.role);
      setIsAdmin(r.includes("admin")); setCanEdit(r.includes("admin") || r.includes("editor"));
    }
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not await another Supabase call while its auth callback holds the session lock.
      queueMicrotask(() => { void load(session?.user ?? null); });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  return { user, canEdit, isAdmin };
}
