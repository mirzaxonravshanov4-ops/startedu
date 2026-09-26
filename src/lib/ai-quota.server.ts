import type { SupabaseClient } from "@supabase/supabase-js";
import { CONTACT } from "@/lib/contact";

/**
 * Consumes one AI use from the user's daily quota (5 regular, 20 premium),
 * runs the task and refunds the use if the task fails.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withAiQuota<T>(supabase: SupabaseClient<any>, task: () => Promise<T>): Promise<T> {
  const { error } = await supabase.rpc("consume_ai_quota");
  if (error) {
    if (error.message.includes("AI_QUOTA_EXCEEDED")) {
      throw new Error(
        `Bugungi AI limitingiz tugadi (oddiy — 5 ta, premium — 20 ta). Premium olish uchun Telegram: ${CONTACT.telegram}`,
      );
    }
    throw new Error(error.message);
  }
  try {
    return await task();
  } catch (e) {
    await supabase.rpc("refund_ai_quota");
    throw e;
  }
}
