import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Award, ShieldCheck, Sparkles } from "lucide-react";
import { formatPercent, gradeFor } from "@/lib/grade";

export type CertificateData = {
  code: string;
  title: string;
  subtitle?: string | null;
  full_name: string;
  score: number;
  total_questions: number;
  percent: number;
  issued_at: string;
};

export function CertificateCard({ cert }: { cert: CertificateData }) {
  const [qr, setQr] = useState<string>("");
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificate/${cert.code}`
      : `/certificate/${cert.code}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 240,
      color: { dark: "#0b1020", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [verifyUrl]);

  const g = gradeFor(cert.percent);

  return (
    <div
      id="certificate-print"
      className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[28px] border border-brand/40 bg-card p-[3px] shadow-[0_40px_100px_-40px_hsl(0_0%_0%/0.65)]"
    >
      {/* premium metallic frame */}
      <div className="pointer-events-none absolute inset-0 opacity-90 [background:conic-gradient(from_140deg,color-mix(in_oklab,var(--brand)_65%,transparent),transparent_35%,color-mix(in_oklab,var(--brand)_45%,transparent)_60%,transparent_85%)]" />

      <div className="relative overflow-hidden rounded-[25px] border border-border/70 bg-background/80 p-6 backdrop-blur-xl sm:p-11">
        {/* guilloche background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background:radial-gradient(60%_45%_at_12%_0%,color-mix(in_oklab,var(--brand)_20%,transparent),transparent),radial-gradient(55%_45%_at_100%_100%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, currentColor 0 1px, transparent 1px 9px)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-brand/25" />
        <div className="pointer-events-none absolute inset-[14px] rounded-[17px] border border-border/50" />

        {/* header */}
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground glow">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">StartEdu</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Rasmiy sertifikat
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div className="font-mono">№ {cert.code}</div>
            <div>{new Date(cert.issued_at).toLocaleDateString("uz-UZ")}</div>
          </div>
        </div>

        {/* name + title */}
        <div className="relative mt-9 text-center">
          <p className="text-[11px] uppercase tracking-[0.34em] text-brand">Sertifikat beriladi</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight gradient-text sm:text-[2.6rem]">
            {cert.full_name}
          </h2>
          <div className="mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            {cert.subtitle ??
              "StartEdu platformasida matematika bo'yicha sinovni muvaffaqiyatli yakunlagani uchun"}
          </p>
          <p className="mt-2 text-base font-medium">{cert.title}</p>
        </div>

        {/* grade seal */}
        <div className="relative mt-9 flex flex-col items-center gap-5 sm:flex-row sm:items-stretch sm:justify-center">
          <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full border border-brand/40 bg-card/80 shadow-[0_0_0_6px_color-mix(in_oklab,var(--brand)_10%,transparent)]">
            <div className="absolute inset-2 rounded-full border border-dashed border-brand/30" />
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                Daraja
              </div>
              <div className="text-3xl font-black leading-none tracking-tight text-brand">
                {g?.grade ?? "—"}
              </div>
            </div>
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            {[
              { k: "Natija", v: `${cert.score} / ${cert.total_questions}` },
              { k: "Foiz", v: formatPercent(cert.percent) },
              { k: "Daraja oralig'i", v: g?.range ?? "—" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-2xl border border-border bg-card/70 px-4 py-3 text-center"
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.k}
                </div>
                <div className="mt-1 text-sm font-semibold">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          {g?.label ?? "Daraja berilmagan"}
        </p>

        {/* footer */}
        <div className="relative mt-9 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="h-10 w-44 border-b border-border" />
            <div className="mt-2 text-xs text-muted-foreground">StartEdu — Akademik kengash</div>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-brand">
              <ShieldCheck className="h-3.5 w-3.5" /> {g?.tone ?? "Natija tasdiqlandi"}
            </div>
          </div>
          <div className="text-center">
            {qr ? (
              <img
                src={qr}
                alt="Sertifikatni tekshirish uchun QR kod"
                className="h-24 w-24 rounded-xl bg-white p-1"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-secondary" />
            )}
            <div className="mt-2 text-[10px] text-muted-foreground">QR orqali tekshiring</div>
          </div>
        </div>
      </div>
    </div>
  );
}
