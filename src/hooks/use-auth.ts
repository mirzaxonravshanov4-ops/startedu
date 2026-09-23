import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "student" | "premium";

/** Current session user + roles. Shared across header, sidebar and pages. */
export function useAuth() {
  const query = useQuery({
    queryKey: ["auth-me"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const user = sessionRes.session?.user ?? null;
      if (!user) return { user: null, roles: [] as AppRole[], profile: null };
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.rpc("get_my_profile"),
      ]);
      return {
        user,
        roles: (roles ?? []).map((r) => r.role as AppRole),
        profile,
      };
    },
  });

  const roles = query.data?.roles ?? [];
  return {
    ...query,
    user: query.data?.user ?? null,
    profile: query.data?.profile ?? null,
    roles,
    isAdmin: roles.includes("admin"),
    isTeacher: roles.includes("teacher") || roles.includes("admin"),
    isPremium: roles.includes("premium") || roles.includes("admin"),
  };
}
