import { Award, BookOpen, FileText, GraduationCap, Video, type LucideIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type TopicCategory = Database["public"]["Enums"]["topic_category"];

export type Direction = {
  /** modules.direction value + url key */
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** topics.category / values that belong here */
  categories: TopicCategory[];
  /** video darslar yo'nalishi alohida manba ishlatadi */
  videos?: boolean;
};

export const DIRECTIONS: Direction[] = [
  {
    key: "oddiy",
    label: "Oddiy testlar",
    description: "Tezkor mashq testlari",
    icon: BookOpen,
    categories: ["boshqa"],
  },
  {
    key: "dtm",
    label: "DTM testlari",
    description: "DTM formatidagi imtihonlar",
    icon: FileText,
    categories: ["dtm"],
  },
  {
    key: "milliy-sertifikat",
    label: "Milliy sertifikat",
    description: "Milliy sertifikat imtihonlari",
    icon: Award,
    categories: ["milliy-sertifikat"],
  },
  {
    key: "attestatsiya",
    label: "Attestatsiya",
    description: "O'qituvchilar attestatsiyasi",
    icon: GraduationCap,
    categories: ["attestatsiya"],
  },
  {
    key: "video",
    label: "Video darslar",
    description: "Video darslar va materiallar",
    icon: Video,
    categories: [],
    videos: true,
  },
];

export function getDirection(key: string) {
  return DIRECTIONS.find((d) => d.key === key);
}
