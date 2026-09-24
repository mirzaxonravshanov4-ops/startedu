import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FlaskConical, ImagePlus, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { makeScene } from "@/lib/lab.functions";
import { LAB_TOPICS } from "@/lib/lab-prompt";
import { ScenePlayer } from "@/components/lab/scene-player";
import { LatexText } from "@/components/latex-text";
import type { Scene } from "@/lib/scene";
import { AiQuotaBadge, AI_QUOTA_KEY } from "@/components/ai-quota-badge";

export const Route = createFileRoute("/_authenticated/$subject/lab")({
  head: () => ({
    meta: [
      { title: "Vizual laboratoriya — StartEdu" },
      {
        name: "description",
        content:
          "Matematik savolingizni yozing — StartEdu vizual laboratoriyasi javobni bosqichma-bosqich animatsion video ko'rinishida ko'rsatadi.",
      },
      { property: "og:title", content: "Vizual matematika laboratoriyasi" },
      {
        property: "og:description",
        content: "Savol bering — grafik, son o'qi, diagramma va animatsiya bilan bosqichma-bosqich vizual javob.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const run = useServerFn(makeScene);
  const qc = useQueryClient();
  const [topic, setTopic] = useState(LAB_TOPICS[0]!.title);
  const [question, setQuestion] = useState("");
  const [scene, setScene] = useState<Scene | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const gen = useMutation({
    mutationFn: async (payload: { q: string; img: string | null }) => {
      const res = await run({
        data: { question: payload.q, topic, ...(payload.img ? { image: payload.img } : {}) },
      });
      return res.scene as Scene;
    },
    onSuccess: (s) => setScene(s),
    onError: (e: Error) => toast.error(e.message || "Sahna tuzilmadi"),
    onSettled: () => qc.invalidateQueries({ queryKey: AI_QUOTA_KEY }),
  });

  async function pickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayli (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan kichik bo'lsin");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Rasm o'qilmadi"));
      r.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) {
      toast.error("Rasm o'qilmadi");
      return;
    }
    setImage(dataUrl);
    if (!question.trim()) setQuestion("Rasmdagi masalani vizual yech");
  }

  function submit(q?: string) {
    const text = (q ?? question).trim();
    if (text.length < 3 && !image) {
      toast.error("Savolni yozing yoki rasm yuklang");
      return;
    }
    const finalText = text.length >= 3 ? text : "Rasmdagi masalani vizual yech";
    if (q) setQuestion(q);
    gen.mutate({ q: finalText, img: q ? null : image });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary glow">
          <FlaskConical className="h-5 w-5 text-primary-foreground" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Vizual laboratoriya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Savolingizni yozing yoki masala rasmini yuklang — javob animatsion “video” kadrlarida: grafik, son o'qi,
            diagramma va bosqichma-bosqich izoh bilan chiziladi.
          </p>
          <div className="mt-3"><AiQuotaBadge /></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Mavzu</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              {LAB_TOPICS.map((t) => (
                <option key={t.key} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs uppercase tracking-widest text-muted-foreground">Savolingiz</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="Masalan: $y=2x-3$ grafigini chizib tushuntir"
              className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
            />

            <label className="mt-4 block text-xs uppercase tracking-widest text-muted-foreground">Rasm (ixtiyoriy)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => void pickImage(e.target.files?.[0])}
            />
            {image ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-border">
                <img src={image} alt="Yuklangan masala rasmi" className="max-h-44 w-full bg-secondary object-contain" />
                <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5">
                  <span className="text-[11px] text-muted-foreground">Rasm tayyor</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-secondary"
                  >
                    <X className="h-3 w-3" /> O'chirish
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:border-brand hover:text-foreground"
              >
                <ImagePlus className="h-4 w-4" /> Masala rasmini yuklash
              </button>
            )}

            <button
              onClick={() => submit()}
              disabled={gen.isPending}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-60"
            >
              {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Vizual javob yasash
            </button>
          </div>


          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Tayyor laboratoriyalar
            </div>
            <div className="mt-3 space-y-1.5">
              {LAB_TOPICS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTopic(t.title);
                    submit(t.sample);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <div className="font-medium text-foreground">{t.title}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs">
                    <LatexText>{t.sample}</LatexText>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {gen.isPending && (
            <div className="grid h-80 place-items-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Sahna tayyorlanmoqda…
              </div>
            </div>
          )}
          {!gen.isPending && scene && <ScenePlayer scene={scene} />}
          {!gen.isPending && !scene && (
            <div className="grid h-80 place-items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 text-center text-sm text-muted-foreground">
              Chapdan mavzuni tanlang yoki savol yozing — vizual yechim shu yerda animatsiya bo'lib ijro etiladi.
            </div>
          )}
          {scene?.summary && (
            <p className="mt-4 text-sm text-muted-foreground">
              <LatexText>{scene.summary}</LatexText>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
