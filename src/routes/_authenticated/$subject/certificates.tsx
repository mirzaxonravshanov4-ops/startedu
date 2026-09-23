import { useSubject } from "@/lib/subject";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Download, Printer, Sparkles } from "lucide-react";
import { CertificateCard, type CertificateData } from "@/components/certificate-card";
import { CERTIFICATE_MIN_PERCENT, formatPercent, gradeFor } from "@/lib/grade";
import { downloadCertificate } from "@/lib/certificate-download";

export const Route = createFileRoute("/_authenticated/$subject/certificates")({
  head: () => ({
    meta: [
      { title: "Sertifikatlar — StartEdu" },
      { name: "description", content: "QR kodli rasmiy sertifikatlaringizni oling va yuklab oling." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CertificatesPage,
});

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `MPU-${part(4)}-${part(4)}`;
}

function CertificatesPage() {
  const subject = useSubject();
  const qc = useQueryClient();
  const [active, setActive] = useState<CertificateData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user!.id;
      const [{ data: profile }, { data: certs }, { data: attempts }] = await Promise.all([
        supabase.from("profiles").select("full_name, username").eq("id", uid).maybeSingle(),
        supabase.from("certificates").select("*").eq("user_id", uid).order("issued_at", { ascending: false }),
        supabase
          .from("test_attempts")
          .select("id, score, correct_count, total_questions, completed_at, topics(title)")
          .eq("user_id", uid)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(50),
      ]);
      return { uid, profile, certs: certs ?? [], attempts: attempts ?? [] };
    },
  });

  const issue = useMutation({
    mutationFn: async (attempt: any) => {
      const total = attempt.total_questions || 0;
      const percent = total ? Math.round((attempt.correct_count / total) * 10000) / 100 : 0;
      if (percent < CERTIFICATE_MIN_PERCENT)
        throw new Error(`Sertifikat uchun kamida ${CERTIFICATE_MIN_PERCENT}% natija kerak`);
      const title = attempt.topics?.title ?? "Matematika sinovi";
      const { data: row, error } = await supabase
        .from("certificates")
        .insert({
          user_id: data!.uid,
          code: makeCode(),
          title,
          subtitle: "StartEdu platformasida quyidagi sinovni muvaffaqiyatli yakunlagani uchun",
          full_name: data!.profile?.full_name || data!.profile?.username || "Foydalanuvchi",
          score: attempt.correct_count,
          total_questions: total,
          percent,
          attempt_id: attempt.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return row;
    },
    onSuccess: (row) => {
      toast.success("Sertifikat tayyor!");
      setActive(row as CertificateData);
      qc.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-brand">Yutuqlar</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Sertifikatlar</h1>
        <p className="mt-3 text-muted-foreground">
          69.23% va undan yuqori natijali sinovlar uchun daraja (C, C+, B, B+, A, A+) bilan
          belgilangan, QR kod orqali tekshiriladigan rasmiy sertifikat oling.
        </p>
      </header>

      {active && (
        <div className="mt-8">
          <CertificateCard cert={active} />
          <div className="mt-4 flex flex-wrap justify-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow"
            >
              <Printer className="h-4 w-4" /> Chop etish / PDF
            </button>
            <button
              onClick={() =>
                downloadCertificate(active.code).catch(() => toast.error("Yuklab olishda xatolik"))
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-secondary"
            >
              <Download className="h-4 w-4" /> PNG yuklab olish
            </button>
            <button
              onClick={() => setActive(null)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-secondary"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      <section className="mt-10 grid gap-6 lg:grid-cols-2 print:hidden">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Award className="h-4 w-4 text-brand" /> Mening sertifikatlarim
          </h2>
          <div className="mt-4 space-y-2">
            {isLoading && <div className="h-16 animate-pulse rounded-xl bg-secondary" />}
            {!isLoading && !data?.certs.length && (
              <p className="text-sm text-muted-foreground">Hozircha sertifikat yo'q.</p>
            )}
            {data?.certs.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c as CertificateData)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 p-3 text-left hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercent(c.percent)} • {gradeFor(c.percent)?.grade ?? "—"} • {new Date(c.issued_at).toLocaleDateString("uz-UZ")} • №{c.code}
                  </div>
                </div>
                <span className="text-xs text-brand">Ko'rish</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-brand" /> Sertifikat olish mumkin bo'lgan natijalar
          </h2>
          <div className="mt-4 space-y-2">
            {!data?.attempts.length && (
              <p className="text-sm text-muted-foreground">
                Avval test topshiring.{" "}
                <Link to="/$subject/topics" params={{ subject }} className="text-brand hover:underline">
                  Testlar
                </Link>
              </p>
            )}
            {data?.attempts.map((a: any) => {
              const percent = a.total_questions
                ? Math.round((a.correct_count / a.total_questions) * 10000) / 100
                : 0;
              const g = gradeFor(percent);
              const used = data.certs.some((c) => c.attempt_id === a.id);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{a.topics?.title ?? "Sinov"}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.correct_count}/{a.total_questions} • {formatPercent(percent)}
                      {g ? ` • ${g.grade}` : ""}
                    </div>
                  </div>
                  <button
                    disabled={percent < CERTIFICATE_MIN_PERCENT || used || issue.isPending}
                    onClick={() => issue.mutate(a)}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
                  >
                    {used
                      ? "Olingan"
                      : percent < CERTIFICATE_MIN_PERCENT
                        ? "69.23% kerak"
                        : "Sertifikat olish"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
