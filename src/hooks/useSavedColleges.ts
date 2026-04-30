import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useSavedColleges() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("saved_colleges")
      .select("college_id")
      .eq("user_id", user.id);
    setSavedIds(new Set((data ?? []).map((r) => r.college_id as string)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (collegeId: string) => {
      if (!user) return { ok: false, reason: "auth" as const };
      if (savedIds.has(collegeId)) {
        await supabase.from("saved_colleges").delete().match({ user_id: user.id, college_id: collegeId });
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(collegeId);
          return next;
        });
        return { ok: true as const, action: "removed" as const };
      } else {
        await supabase.from("saved_colleges").insert({ user_id: user.id, college_id: collegeId });
        setSavedIds((prev) => new Set(prev).add(collegeId));
        return { ok: true as const, action: "saved" as const };
      }
    },
    [user, savedIds]
  );

  return { savedIds, toggle, loading, refresh, isAuthed: !!user };
}
