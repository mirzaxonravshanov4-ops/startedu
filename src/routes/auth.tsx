import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SUBJECT } from "@/lib/subject";
import { lovable } from "@/integrations/lovable";
import { Sigma, Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Kirish — StartEdu" },
      { name: "description", content: "StartEdu platformasiga kirish yoki ro'yxatdan o'tish." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      if (search.redirect) {
        throw redirect({ href: search.redirect });
      }
      throw redirect({ to: "/$subject/dashboard", params: { subject: DEFAULT_SUBJECT } });
    }
  },
  component: AuthPage,
});

const emailSchema = z
  .string()
  .trim()
  .email("Email noto'g'ri")
  .max(255);
const passwordSchema = z
  .string()
  .min(6, "Parol kamida 6 belgi bo'lishi kerak")
  .max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: "/$subject/dashboard", params: { subject: DEFAULT_SUBJECT } });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const emailV = emailSchema.parse(email);
      const passV = passwordSchema.parse(password);

      if (mode === "signup") {
        const first = z.string().trim().min(2, "Ism kamida 2 belgi").max(40).parse(firstName);
        const last = z.string().trim().min(2, "Familiya kamida 2 belgi").max(40).parse(lastName);
        const nameV = `${first} ${last}`;
        const { error } = await supabase.auth.signUp({
          email: emailV,
          password: passV,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: nameV },
          },
        });
        if (error) throw error;
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          await supabase.rpc("set_initial_role", { _role: "student" });
        }
        toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailV,
          password: passV,
        });
        if (error) throw error;
        toast.success("Xush kelibsiz!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google orqali kirishda xatolik");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/$subject/dashboard", params: { subject: DEFAULT_SUBJECT } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xatolik";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary glow">
            <Sigma className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            {mode === "signin" ? "Xush kelibsiz" : "Ro'yxatdan o'ting"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Hisobingizga kirish uchun ma'lumotlarni kiriting"
              : "Bepul akkaunt oching va boshlang"}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_20px_60px_-20px_oklch(0_0_0/0.5)]">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <GoogleIcon />
            Google orqali davom etish
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            yoki
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field icon={User} type="text" placeholder="Ism" value={firstName} onChange={setFirstName} />
                <Field icon={User} type="text" placeholder="Familiya" value={lastName} onChange={setLastName} />
              </>
            )}
            <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} />
            <Field icon={Lock} type="password" placeholder="Parol" value={password} onChange={setPassword} />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground glow transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "Akkauntingiz yo'qmi?" : "Akkauntingiz bormi?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-brand hover:underline"
            >
              {mode === "signin" ? "Ro'yxatdan o'ting" : "Kirish"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: typeof Mail;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-xl border border-border bg-background/50 px-10 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.42-1.68 4.16-5.5 4.16-3.3 0-6-2.73-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.48l2.63-2.53C16.86 3.48 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.93 0 9.5-4.87 9.5-8.4 0-.56-.06-1-.14-1.4H12z" />
    </svg>
  );
}
