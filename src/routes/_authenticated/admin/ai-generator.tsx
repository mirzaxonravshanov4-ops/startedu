import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Bot, CheckCircle2, FileUp, Loader2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LatexText } from "@/components/latex-text";
import { generateContent } from "@/lib/aigen.functions";
import { extractFileText } from "@/lib/import.functions";
import type { ImportedQuestion } from "@/lib/import-prompt";
import type { GeneratedWritten } from "@/lib/aigen-prompt";

export const Route = createFileRoute("/_authenticated/admin/ai-generator")({
  head: () => ({
    meta: [{ title: "AI savol yaratuvchi — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AiGenerator,
});

const PRESETS = [
  "Kvadrat tenglamalar bo'yicha Milliy sertifikat darajasidagi qiyin savollar tuz",
  "Progressiyalar mavzusida amaliy (matnli) masalalar tuz",
  "Trigonometrik ayniyatlarga oid o'rta darajadagi savollar tuz",
  "Ehtimollar nazariyasi bo'yicha DTM formatidagi savollar tuz",
  "Attestatsiya uchun kasbiy standart bo'yicha savollar tuz (o'qituvchi kompetensiyalari)",
  "Attestatsiya uchun pedagogik mahorat bo'yicha savollar tuz (metodika, didaktika, psixologiya)",
];

const SECTIONS = [
  { value: "", label: "Bo'lim: belgilanmagan" },
  { value: "matematika", label: "Matematika" },
  { value: "kasbiy", label: "Kasbiy standart" },
  { value: "pedagogika", label: "Pedagogik mahorat" },
] as const;

function AiGenerator() {
  const qc = useQueryClient();
  const genFn = useServerFn(generateContent);

  const [instruction, setInstruction] = useState(PRESETS[0]!);
  const [kind, setKind] = useState<"test" | "written">("test");
  const [language, setLanguage] = useState<"uz" | "en">("uz");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [count, setCount] = useState(10);
  const [topicId, setTopicId] = useState("");
  const [section, setSection] = useState("");
  const [items, setItems] = useState<ImportedQuestion[]>([]);
  const [tasks, setTasks] = useState<GeneratedWritten[]>([]);
  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState("");
  const extractFn = useServerFn(extractFileText);
  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 8 * 1024 * 1024) throw new Error("Fayl hajmi 8MB dan kichik bo'lsin");
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      const res = await extractFn({ data: { fileName: file.name, base64: btoa(bin) } });
      return { text: res.text, name: file.name };
    },
    onSuccess: ({ text, name }) => {
      setSourceText(text);
      setFileName(name);
      toast.success(`Fayl o'qildi: ${text.length} belgi`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: topics } = useQuery({
    queryKey: ["admin-topics-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, title, category")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const topicTitle = (topics ?? []).find((t) => t.id === topicId)?.title;

  const generate = useMutation({
    mutationFn: async (append: boolean) => {
      const avoid = kind === "test" ? items.map((i) => i.body) : tasks.map((t) => t.body);
      const res = await genFn({
        data: {
          instruction,
          kind,
          language,
          difficulty,
          count,
          topicTitle,
          section: (section || undefined) as "matematika" | "kasbiy" | "pedagogika" | undefined,
          avoid: append ? avoid.slice(-30) : [],
          ...(sourceText ? { sourceText } : {}),
        },
      });
      return { res, append };
    },
    onSuccess: ({ res, append }) => {
      if (res.kind === "test") {
        const list = res.questions as ImportedQuestion[];
        setItems((prev) => (append ? [...prev, ...list] : list));
        setTasks([]);
        toast.success(`${list.length} ta savol yaratildi`);
      } else {
        const list = res.tasks as GeneratedWritten[];
        setTasks((prev) => (append ? [...prev, ...list] : list));
        setItems([]);
        toast.success(`${list.length} ta yozma ish yaratildi`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!topicId) throw new Error("Avval mavzuni tanlang");
      if (kind === "test") {
        if (!items.length) throw new Error("Tasdiqlash uchun savol yo'q");
        const { count: existing } = await supabase
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", topicId);
        let order = existing ?? 0;
        for (const q of items) {
          const { data: row, error } = await supabase
            .from("questions")
            .insert({
              topic_id: topicId,
              body: q.body,
              explanation: q.explanation || null,
              difficulty: q.difficulty,
              section: section || null,
              sort_order: order++,
            })
            .select("id")
            .single();
          if (error) throw error;
          const { error: oErr } = await supabase.from("question_options").insert(
            q.options.map((o, j) => ({
              question_id: row.id,
              body: o.body,
              is_correct: o.is_correct,
              sort_order: j,
            })),
          );
          if (oErr) throw oErr;
        }
        return items.length;
      }
      if (!tasks.length) throw new Error("Tasdiqlash uchun topshiriq yo'q");
      const { count: existing } = await supabase
        .from("written_tasks")
        .select("id", { count: "exact", head: true })
        .eq("topic_id", topicId);
      let order = existing ?? 0;
      const { error } = await supabase.from("written_tasks").insert(
        tasks.map((t) => ({
          topic_id: topicId,
          body: t.body,
          mode: t.mode,
          expected_answer: t.expected_answer || null,
          solution: t.solution || null,
          difficulty: t.difficulty,
          max_score: t.max_score,
          sort_order: order++,
          is_published: true,
        })),
      );
      if (error) throw error;
      return tasks.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} ta element platformaga qo'shildi`);
      setItems([]);
      setTasks([]);
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      qc.invalidateQueries({ queryKey: ["admin-written"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = kind === "test" ? items.length : tasks.length;

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Bot className="h-6 w-6 text-brand" /> AI savol yaratuvchi
        </h1>
        <p className="text-sm text-muted-foreground">
          Buyruq yozing — AI savollar yoki yozma ishlar tayyorlaydi. Ko'zdan kechiring, tahrirlang va
          tasdiqlang: shundan keyingina platformaga qo'shiladi.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Buyruq</label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={4}
          placeholder="Masalan: Logarifmik tenglamalar bo'yicha 10 ta qiyin savol tuz, javoblar aralash bo'lsin"
          className="mt-2 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setInstruction(p)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
            >
              {p.slice(0, 42)}…
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Tur
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as "test" | "written");
                setItems([]);
                setTasks([]);
              }}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="test">Test savoli</option>
              <option value="written">Yozma ish</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Til
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="uz">O'zbek</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Daraja
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="mixed">Aralash</option>
              <option value="easy">Oson</option>
              <option value="medium">O'rta</option>
              <option value="hard">Qiyin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Soni
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Bo'lim
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Mavzu
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Tanlang…</option>
              {(topics ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary">
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Fayl yuklash (.docx, .pdf, .tex, .txt)
              <input
                type="file"
                accept=".docx,.pdf,.tex,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload.mutate(f);
                  e.target.value = "";
                }}
              />
            </label>
            {fileName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                {fileName}
                <button aria-label="Faylni olib tashlash" onClick={() => { setFileName(""); setSourceText(""); }}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Fayl yuklansa, AI undagi savollarni o'qib, tanlangan mavzu uchun tayyorlaydi. Keyin "Tasdiqlash" bilan mavzuga qo'shasiz.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => generate.mutate(false)}
            disabled={generate.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Yaratish
          </button>
          {total > 0 && (
            <button
              onClick={() => generate.mutate(true)}
              disabled={generate.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Yana qo'shish
            </button>
          )}
        </div>
      </div>

      {total > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold">
              Ko'rib chiqish: <span className="gradient-text">{total}</span> ta{" "}
              {kind === "test" ? "savol" : "yozma ish"}
            </div>
            <button
              onClick={() => approve.mutate()}
              disabled={approve.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Tasdiqlash va platformaga qo'shish
            </button>
          </div>

          {kind === "test" ? (
            <ul className="mt-4 space-y-3">
              {items.map((q, i) => (
                <li key={i} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-sm">
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      <LatexText>{q.body}</LatexText>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={q.difficulty}
                        onChange={(e) =>
                          setItems((v) =>
                            v.map((it, k) =>
                              k === i
                                ? { ...it, difficulty: e.target.value as ImportedQuestion["difficulty"] }
                                : it,
                            ),
                          )
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="easy">oson</option>
                        <option value="medium">o'rta</option>
                        <option value="hard">qiyin</option>
                      </select>
                      <button
                        onClick={() => setItems((v) => v.filter((_, k) => k !== i))}
                        className="rounded-lg border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {q.options.map((o, j) => (
                      <li key={j}>
                        <button
                          onClick={() =>
                            setItems((v) =>
                              v.map((it, k) =>
                                k === i
                                  ? {
                                      ...it,
                                      options: it.options.map((oo, jj) => ({
                                        ...oo,
                                        is_correct: jj === j,
                                      })),
                                    }
                                  : it,
                              ),
                            )
                          }
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs ${
                            o.is_correct ? "bg-brand/10 text-foreground" : "text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {o.is_correct && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand" />}
                          <LatexText>{o.body}</LatexText>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <LatexText>{q.explanation}</LatexText>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-4 space-y-3">
              {tasks.map((t, i) => (
                <li key={i} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-sm">
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      <LatexText>{t.body}</LatexText>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] uppercase text-muted-foreground">
                        {t.mode === "short" ? "qisqa javob" : "to'liq yechim"} · {t.max_score} ball
                      </span>
                      <button
                        onClick={() => setTasks((v) => v.filter((_, k) => k !== i))}
                        className="rounded-lg border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {t.expected_answer && (
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">Javob: </span>
                      <LatexText>{t.expected_answer}</LatexText>
                    </div>
                  )}
                  {t.solution && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <LatexText>{t.solution}</LatexText>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
