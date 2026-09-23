import {
  Award,
  Bot,
  BarChart3,
  BadgeCheck,
  BookOpen,
  FileText,
  FlaskConical,
  Globe2,
  GraduationCap,
  HelpCircle,
  Info,
  LayoutDashboard,
  ShieldCheck,
  Sigma,
  Sparkles,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/hooks/use-auth";
import { subjectHasSat } from "@/lib/subject";
import type { SubjectKey } from "@/lib/subjects";

/** Fan ichidagi sahifalar (URL: /<fan>/<sahifa>). */
export type SubjectPath =
  | "/$subject/dashboard"
  | "/$subject/topics"
  | "/$subject/milliy-sertifikat"
  | "/$subject/dtm"
  | "/$subject/attestatsiya"
  | "/$subject/sat"
  | "/$subject/olimpiada"
  | "/$subject/results"
  | "/$subject/certificates"
  | "/$subject/leaderboard"
  | "/$subject/classes"
  | "/$subject/global"
  | "/$subject/lab"
  | "/$subject/ai-ustoz"
  | "/$subject/ai-twin"
  | "/$subject/videos";

/** Fanga bog'liq bo'lmagan sahifalar. */
export type PlainPath =
  | "/about"
  | "/faq"
  | "/profile"
  | "/admin"
  | "/admin/users"
  | "/admin/import"
  | "/admin/results"
  | "/admin/audit"
  | "/admin/settings";

export type NavItem =
  | { scoped: true; to: SubjectPath; label: string; icon: LucideIcon; exact?: boolean; roles?: AppRole[] }
  | { scoped: false; to: PlainPath; label: string; icon: LucideIcon; exact?: boolean; roles?: AppRole[] };

export type NavGroup = {
  title: string;
  adminOnly?: boolean;
  roles?: AppRole[];
  items: NavItem[];
};

/** Tanlangan fan uchun navigatsiya. */
export function navGroupsFor(subject: SubjectKey): NavGroup[] {
  const tests: NavItem[] = [
    { scoped: true, to: "/$subject/topics", label: "Mavzulashtirilgan", icon: BookOpen },
    { scoped: true, to: "/$subject/milliy-sertifikat", label: "Milliy sertifikat", icon: Award },
    { scoped: true, to: "/$subject/dtm", label: "DTM testlar", icon: FileText },
    { scoped: true, to: "/$subject/attestatsiya", label: "Attestatsiya", icon: GraduationCap },
    ...(subjectHasSat(subject)
      ? [{ scoped: true, to: "/$subject/sat", label: "SAT math", icon: Sigma } as NavItem]
      : []),
    { scoped: true, to: "/$subject/olimpiada", label: "Olimpiada", icon: Trophy },
  ];

  return [
    {
      title: "Asosiy",
      items: [
        { scoped: true, to: "/$subject/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      ],
    },
    { title: "Testlar", items: tests },
    {
      title: "Shaxsiy",
      items: [
        { scoped: true, to: "/$subject/results", label: "Natijalarim", icon: BarChart3 },
        { scoped: true, to: "/$subject/certificates", label: "Sertifikatlarim", icon: BadgeCheck },
        { scoped: true, to: "/$subject/leaderboard", label: "Reyting", icon: Trophy },
        { scoped: true, to: "/$subject/classes", label: "Sinf", icon: Users },
        { scoped: true, to: "/$subject/global", label: "Global", icon: Globe2 },
      ],
    },
    {
      title: "Vositalar",
      items: [
        { scoped: true, to: "/$subject/lab", label: "Visual Lab", icon: FlaskConical },
        { scoped: true, to: "/$subject/ai-ustoz", label: "AI ustoz", icon: Bot },
        { scoped: true, to: "/$subject/ai-twin", label: "AI Twin", icon: Sparkles },
        { scoped: true, to: "/$subject/videos", label: "Video darslar", icon: Video },
      ],
    },
    {
      title: "Ma'lumot",
      items: [
        { scoped: false, to: "/about", label: "Biz haqimizda", icon: Info },
        { scoped: false, to: "/faq", label: "FAQ & Aloqa", icon: HelpCircle },
      ],
    },
    {
      title: "Boshqaruv",
      adminOnly: true,
      roles: ["admin"],
      items: [
        { scoped: false, to: "/admin", label: "Admin panel", icon: ShieldCheck, exact: true },
        { scoped: false, to: "/admin/users", label: "Foydalanuvchilar", icon: Users },
      ],
    },
  ];
}

/** Filter navigation by the current user's roles. Admin sees everything. */
export function visibleNavGroups(roles: AppRole[], subject: SubjectKey): NavGroup[] {
  const isAdmin = roles.includes("admin");
  const allowed = (need?: AppRole[]) => !need || isAdmin || need.some((r) => roles.includes(r));

  return navGroupsFor(subject)
    .filter((g) => (g.adminOnly ? isAdmin : allowed(g.roles)))
    .map((g) => ({ ...g, items: g.items.filter((i) => allowed(i.roles)) }))
    .filter((g) => g.items.length > 0);
}
