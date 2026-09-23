import { useParams } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";

export const DEFAULT_SUBJECT: SubjectKey = "matematika";

export function isSubjectKey(v: unknown): v is SubjectKey {
  return typeof v === "string" && SUBJECTS.some((s) => s.key === v);
}

/** Subject taken from the current URL (`/matematika/...`), falling back to matematika. */
export function useSubject(): SubjectKey {
  const params = useParams({ strict: false }) as { subject?: string };
  return isSubjectKey(params.subject) ? params.subject : DEFAULT_SUBJECT;
}

/** Subject saved on the user profile — used right after login/onboarding. */
export async function resolveSubject(): Promise<SubjectKey> {
  const { data } = await supabase.rpc("get_my_profile");
  const s = (data as { subject?: string } | null)?.subject;
  return isSubjectKey(s) ? s : DEFAULT_SUBJECT;
}

/** Sections available per subject. SAT math is matematika-only. */
export function subjectHasSat(subject: SubjectKey) {
  return subject === "matematika";
}
