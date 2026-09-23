import { Atom, BookOpen, FlaskConical, Landmark, Leaf, type LucideIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type SubjectKey = Database["public"]["Enums"]["subject_key"];

export type Subject = { key: SubjectKey; label: string; icon: LucideIcon };

export const SUBJECTS: Subject[] = [
  { key: "matematika", label: "Matematika", icon: BookOpen },
  { key: "fizika", label: "Fizika", icon: Atom },
  { key: "kimyo", label: "Kimyo", icon: FlaskConical },
  { key: "biologiya", label: "Biologiya", icon: Leaf },
  { key: "tarix", label: "Tarix", icon: Landmark },
];

export function subjectLabel(key?: string | null) {
  return SUBJECTS.find((s) => s.key === key)?.label ?? "Matematika";
}

export const LANGUAGES = [
  { key: "uz", label: "O'zbekcha" },
  { key: "ru", label: "Русский" },
  { key: "en", label: "English" },
] as const;

export function languageLabel(key?: string | null) {
  return LANGUAGES.find((l) => l.key === key)?.label ?? "O'zbekcha";
}

export const REFERRAL_SOURCES = [
  "Telegram",
  "Instagram",
  "YouTube",
  "Do'stim tavsiya qildi",
  "O'qituvchim aytdi",
  "Google qidiruvi",
  "Boshqa",
] as const;
