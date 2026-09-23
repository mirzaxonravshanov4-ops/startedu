import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Loader2, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LatexText } from "@/components/latex-text";
import { extractFileText, parseQuestions } from "@/lib/import.functions";
import { parsePlainFormat, type ImportedQuestion } from "@/lib/import-prompt";

export const Route = createFileRoute("/_authenticated/admin/import")({
  head: () => ({
    meta: [{ title: "LaTeX / fayl import — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminImport,
});

const SAMPLE = String.raw`\begin{enumerate}
\item Tenglamani yeching: $3x+5=2x-4$
  \begin{choices}
  \correct $x=-9$
  $x=9$
  $x=-1$
  $x=1$
  \end{choices}
  \explanation{$3x-2x=-4-5\Rightarrow x=-9$.}

\item Hisoblang: $\sqrt{50}$
  \begin{choices}
  $5\sqrt{5}$
  \correct $5\sqrt{2}$
  $25\sqrt{2}$
  $\sqrt{5}$
  \end{choices}
\end{enumerate}`;

function AdminImport() {
  const qc = useQueryClient();
  const parseFn = useServerFn(parseQuestions);
  const extractFn = useServerFn(extractFileText);
  const fileRef = useRef<HTMLInputElement>(null);

  const [source, setSource] = useState(SAMPLE);
  const [count, setCount] = useState(20);
  const [topicId, setTopicId] = useState("");
  const [items, setItems] = useState<ImportedQuestion[]>([]);

  const { data: topics } = useQuery({
    queryKey: ["admin-topics-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topics").select("id, title").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const parse = useMutation({
    mutationFn: async () => {
      const res = await parseFn({ data: { source, count } });
      return res.questions as ImportedQuestion[];
    },
    onSuccess: (qs) => {
      setItems(qs);
      toast.success(`${qs.length} ta savol ajratildi`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192));
      const res = await extractFn({ data: { fileName: file.name, base64: btoa(bin) } });
      return res.text;
    },
    onSuccess: (text) => {
      setSource(text);
      toast.success("Fayl matni o'qildi — endi generatsiya qiling");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!topicId) throw new Error("Mavzuni tanlang");
      if (!items.length) throw new Error("Saqlash uchun savol yo'q");
      for (const [i, q] of items.entries()) {
        const { data: row, error } = await supabase
          .from("questions")
          .insert({
            topic_id: topicId,
            body: q.body,
            explanation: q.explanation || null,
            difficulty: q.difficulty,
            image_url: q.image_url ?? null,
            sort_order: i,
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
    },
    onSuccess: () => {
      toast.success(`${items.length} ta savol bazaga saqlandi`);
      setItems([]);
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LaTeX / Word / PDF import</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            LaTeX kodini yozing yoki fayl yuklang — sayt savollarni avtomatik generatsiya qiladi (Overleaf uslubida
            jonli ko'rinish bilan).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".tex,.txt,.docx,.pdf,.md"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-60"
          >
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Fayl yuklash
          </button>
          <button
            onClick={() => {
              const local = parsePlainFormat(source);
              if (!local.length) {
                toast.error("Oddiy format topilmadi — AI generatsiyadan foydalaning");
                return;
              }
              setItems(local);
              toast.success(`${local.length} ta savol (offline parser)`);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary"
          >
            <Sparkles className="h-4 w-4" /> Tez parser
          </button>
          <button
            onClick={() => parse.mutate()}
            disabled={parse.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {parse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Generatsiya
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Manba (LaTeX / matn)</span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Maks. savol
              <input
                type="number"
                min={1}
                max={60}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-right text-xs"
              />
            </label>
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            rows={22}
            className="mt-3 w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-brand"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Jonli ko'rinish</span>
          <div className="mt-3 max-h-[34rem] overflow-y-auto rounded-xl bg-secondary/30 p-4 text-sm leading-relaxed">
            <LatexText>{source}</LatexText>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold">
              Tayyor savollar: <span className="gradient-text">{items.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">Mavzuni tanlang…</option>
                {(topics ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Bazaga saqlash
              </button>
            </div>
          </div>

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
                            k === i ? { ...it, difficulty: e.target.value as ImportedQuestion["difficulty"] } : it,
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
                    <li
                      key={j}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                        o.is_correct ? "bg-brand/10 text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {o.is_correct && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand" />}
                      <LatexText>{o.body}</LatexText>
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
        </div>
      )}
    </div>
  );
}
