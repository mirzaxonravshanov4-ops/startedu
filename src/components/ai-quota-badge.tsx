import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { getAiQuota } from "@/lib/ai-quota.functions";
import { CONTACT } from "@/lib/contact";

export const AI_QUOTA_KEY = ["ai-quota"] as const;

/** Shows how many AI uses remain today and how to get premium. */
export function AiQuotaBadge() {
  const fetchQuota = useServerFn(getAiQuota);
  const { data } = useQuery({ queryKey: AI_QUOTA_KEY, queryFn: () => fetchQuota() });
  if (!data) return null;
  const left = Math.max(data.limit - data.used, 0);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
      <Sparkles className="h-3.5 w-3.5 text-brand" />
      <span>
        Bugun AI: <span className="font-semibold text-foreground">{left}</span> / {data.limit} qoldi
      </span>
      {data.limit < 10 && (
        <a href={CONTACT.telegramHref} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
          Premium (10 ta/kun): {CONTACT.telegram}
        </a>
      )}
    </div>
  );
}
