import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns today's AI usage for the current user. */
export const getAiQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("ai_quota_status");
    if (error) throw new Error(error.message);
    return data as { used: number; limit: number };
  });
