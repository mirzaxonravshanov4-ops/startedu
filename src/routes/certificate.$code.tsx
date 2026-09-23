import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CertificateCard, type CertificateData } from "@/components/certificate-card";
import { Download, Printer, ShieldCheck } from "lucide-react";
import { downloadCertificate } from "@/lib/certificate-download";

export const Route = createFileRoute("/certificate/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Sertifikat ${params.code} — StartEdu` },
      { name: "description", content: "StartEdu sertifikatini QR kod orqali tekshirish sahifasi." },
      { property: "og:title", content: "StartEdu sertifikati" },
      { property: "og:description", content: "Sertifikat haqiqiyligini tekshiring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
  errorComponent: () => <Fallback text="Sertifikatni yuklashda xatolik." />,
  notFoundComponent: () => <Fallback text="Sertifikat topilmadi." />,
});

function Fallback({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-muted-foreground">{text}</p>
      <Link to="/" className="mt-4 inline-block text-sm text-brand hover:underline">
        Bosh sahifa
      </Link>
    </div>
  );
}

function VerifyPage() {
  const { code } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["certificate", code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("verify_certificate", { _code: code });
      if (error) throw error;
      return (data ?? [])[0] ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-80 animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }
  if (!data) return <Fallback text="Bunday kodli sertifikat topilmadi." />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-center gap-2 text-sm text-brand print:hidden">
        <ShieldCheck className="h-4 w-4" /> Sertifikat haqiqiy va StartEdu tomonidan berilgan
      </div>
      <CertificateCard cert={data as unknown as CertificateData} />
      <div className="mt-6 flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow"
        >
          <Printer className="h-4 w-4" /> Chop etish / PDF
        </button>
        <button
          onClick={() => downloadCertificate(code)}
          className="ml-2 inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-secondary"
        >
          <Download className="h-4 w-4" /> PNG yuklab olish
        </button>
      </div>
    </div>
  );
}
