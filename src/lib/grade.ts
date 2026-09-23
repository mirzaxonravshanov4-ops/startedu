/**
 * StartEdu sertifikat darajalari (foiz oralig'i bo'yicha).
 * C   : 69.23 – 76.91
 * C+  : 76.92 – 84.61
 * B   : 84.62 – 90.77
 * B+  : 90.78 – 98.46
 * A   : 98.47 – 99.99
 * A+  : 100
 */
export const CERTIFICATE_MIN_PERCENT = 69.23;

export type GradeInfo = {
  /** Daraja belgisi: C, C+, B, B+, A, A+ */
  grade: string;
  /** Uzbek nomlanishi */
  label: string;
  /** Qisqa izoh */
  tone: string;
  /** Oraliq matni, masalan "84.62–90.77%" */
  range: string;
};

export const GRADE_SCALE: Array<{ grade: string; min: number; max: number; label: string; tone: string }> = [
  { grade: "A+", min: 100, max: 100, label: "A+ — Mutlaq mukammal", tone: "Barcha savollar to'g'ri" },
  { grade: "A", min: 98.47, max: 99.99, label: "A — Oliy daraja", tone: "Mukammal natija" },
  { grade: "B+", min: 90.78, max: 98.46, label: "B+ — Juda yuqori daraja", tone: "A'lo natija" },
  { grade: "B", min: 84.62, max: 90.77, label: "B — Yuqori daraja", tone: "Yaxshi natija" },
  { grade: "C+", min: 76.92, max: 84.61, label: "C+ — O'rtadan yuqori daraja", tone: "Qoniqarli natija" },
  { grade: "C", min: 69.23, max: 76.91, label: "C — O'rta daraja", tone: "Boshlang'ich daraja" },
];

/** Foizga mos darajani qaytaradi. 69.23% dan past bo'lsa null. */
export function gradeFor(percent: number): GradeInfo | null {
  const p = Number(percent);
  if (!Number.isFinite(p) || p < CERTIFICATE_MIN_PERCENT) return null;
  const found = GRADE_SCALE.find((g) => p >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return {
    grade: found.grade,
    label: found.label,
    tone: found.tone,
    range: found.min === found.max ? `${found.min}%` : `${found.min}–${found.max}%`,
  };
}

export function formatPercent(percent: number): string {
  const p = Number(percent) || 0;
  return Number.isInteger(p) ? `${p}%` : `${p.toFixed(2)}%`;
}
