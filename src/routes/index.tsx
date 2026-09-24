import { createFileRoute, Link } from "@tanstack/react-router";
import heroAsset from "@/assets/startedu-hero.jpg.asset.json";

const heroImg = heroAsset.url;
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StartEdu — Matematikani professional darajada o'rganing" },
      {
        name: "description",
        content:
          "Milliy sertifikat, DTM, attestatsiya va matematika testlari uchun O'zbekistondagi zamonaviy platforma. To'liq testlar, AI yordamchi va batafsil analitika.",
      },
      { property: "og:title", content: "StartEdu — Matematikani professional darajada o'rganing" },
      {
        property: "og:description",
        content:
          "Milliy sertifikat, DTM, attestatsiya va matematika testlari uchun O'zbekistondagi zamonaviy platforma. To'liq testlar, AI yordamchi va batafsil analitika.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const sections = [
  {
    icon: Award,
    title: "Milliy Sertifikat",
    desc: "30–50 ta to'liq to'liq test, avtomatik tekshirish va natija tahlili.",
    bullets: ["Nazariya + video", "Rasm va formulali savollar", "Taymer va statistika"],
  },
  {
    icon: GraduationCap,
    title: "DTM",
    desc: "Blok bo'yicha testlar, reyting va batafsil analitika.",
    bullets: ["Real DTM formati", "Reyting jadvali", "Xatolar tahlili"],
  },
  {
    icon: ShieldCheck,
    title: "Attestatsiya",
    desc: "O'qituvchilar attestatsiyasi uchun to'liq tayyorgarlik paketi.",
    bullets: ["Mavzulashtirilgan test", "To'liq test", "Yakuniy natija"],
  },
  {
    icon: BookOpen,
    title: "Oddiy testlar",
    desc: "Boshlang'ichdan murakkabgacha turli darajadagi matematika testlari.",
    bullets: ["Oson · O'rta · Qiyin", "Video + rasm", "Yakuniy test"],
  },
];

const features = [
  { icon: Brain, title: "AI matematik yordamchi", desc: "Yechimni bosqichma-bosqich tushuntiradi." },
  { icon: LineChart, title: "Chuqur analitika", desc: "Har bir mavzu bo'yicha kuchli va zaif tomonlar." },
  { icon: Timer, title: "Real imtihon rejimi", desc: "Taymer, aralashgan variantlar, avtomatik tekshirish." },
  { icon: Trophy, title: "Reyting va XP", desc: "Kunlik streak, badge va haftalik leaderboard." },
  { icon: Sparkles, title: "LaTeX formulalar", desc: "Chiroyli matematik yozuv va grafiklar." },
  { icon: Zap, title: "Tez va PWA", desc: "Telefondan ilova sifatida ochiladi, offline ishlaydi." },
];

const stats = [
  { v: "50+", l: "To'liq testlar" },
  { v: "1000+", l: "Test savollari" },
  { v: "50+", l: "Video darslar" },
  { v: "90%", l: "Talabalar mamnun" },
];

const testimonials = [
  {
    name: "Abdulloh N.",
    role: "Milliy sertifikat, 67,32 ball",
    quote:
      "To'liq testlar aynan real formatga o'xshaydi. Analitika kuchsiz mavzuni topib berdi va men uni to'g'ri yopdim.",
  },
  {
    name: "Sardor N.",
    role: "DTM, matematika 93 ball",
    quote:
      "AI yordamchi murakkab masalani bosqichma-bosqich tushuntiradi. Bu men uchun eng katta o'zgarish bo'ldi.",
  },
  {
    name: "Firdavs O'.",
    role: "Attestatsiya, o'qituvchi",
    quote:
      "Interfeys minimalistik va tez. Har kuni 20 minut bilan ham katta natijaga erishdim.",
  },
];

const faqs = [
  {
    q: "Platforma qanday fanlar bo'yicha ishlaydi?",
    a: "Hozircha platforma to'liq matematika fani va uning barcha bo'limlariga qaratilgan: algebra, geometriya, trigonometriya, stereometriya, sonlar nazariyasi, logarifm, hosila, integral, kombinatorika va ehtimollar.",
  },
  {
    q: "To'liq testlar real imtihonga o'xshaydimi?",
    a: "Ha. Har bir to'liq test real Milliy sertifikat / DTM / attestatsiya formatida — taymer, aralashgan variantlar va avtomatik tekshirish bilan.",
  },
  {
    q: "AI yordamchi qanday ishlaydi?",
    a: "Siz savol yoki masalani yuborasiz, AI yechimni bosqichma-bosqich tushuntiradi va o'xshash mashqlarni tavsiya qiladi.",
  },
  {
    q: "Telefonda ishlaydimi?",
    a: "Ha. Sayt to'liq responsive va PWA sifatida ishlaydi — bosh ekranga ilova qilib qo'shsa bo'ladi.",
  },
  {
    q: "Ro'yxatdan o'tish pullikmi?",
    a: "Ro'yxatdan o'tish bepul. Ba'zi premium to'liq testlar va kengaytirilgan analitika obuna orqali ochiladi.",
  },
];

function Index() {
  return (
    <>
      <Hero />
      <Stats />
      <Sections />
      <Features />
      <Teachers />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}

function Hero() {
  return (
    <section
      id="boshlash"
      className="relative overflow-hidden"
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-24 lg:pb-32">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            O'zbekistondagi #1 matematika platformasi
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Matematikani{" "}
            <span className="gradient-text">professional darajada</span> o'rganing
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Milliy sertifikat, DTM va attestatsiyaga tayyorlanish uchun to'liq testlar,
            matematika testlari, AI yordamchi va aniq analitika — bir joyda.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#bolimlar"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground glow transition-transform hover:scale-[1.02]"
            >
              Boshlash
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#afzalliklar"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-6 py-3 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary"
            >
              Afzalliklar
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" /> Bepul ro'yxatdan o'tish</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" /> LaTeX formulalar</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" /> Offline PWA</span>
          </div>
        </div>

        <div className="relative float-idle">
          <div className="absolute -inset-6 rounded-[2rem] bg-primary opacity-30 blur-3xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border glass">
            <img
              src={heroImg}
              alt="Matematik grafiklar va formulalar vizualizatsiyasi"
              width={1600}
              height={1200}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="gradient-text">{s.v}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Sections() {
  return (
    <section id="bolimlar" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
          Asosiy bo'limlar
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Har bir maqsad uchun alohida yo'l
        </h2>
        <p className="mt-4 text-muted-foreground">
          To'rt yo'nalish — bitta platformada. Har bir yo'nalish nazariya, videolar, mavzuli
          testlar va real to'liq testlar bilan to'liq jihozlangan.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <div
            key={s.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand/50"
          >
            <div
              className="absolute inset-x-0 -top-24 h-40 opacity-0 blur-3xl transition-opacity group-hover:opacity-40"
              style={{ background: "var(--gradient-brand)" }}
              aria-hidden
            />
            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="afzalliklar" className="relative">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
              Platforma afzalliklari
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Sizga kerak bo'lgan hamma narsa
            </h2>
            <p className="mt-4 text-muted-foreground">
              Zamonaviy ta'lim uchun mo'ljallangan — tez, aniq va estetik.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/50"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl glass">
                  <f.icon className="h-5 w-5 text-brand" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Teachers() {
  const teachers = [
    { n: "Mirzaxon Ravshanov", r: "Milliy sertifikat mentori", i: "MR" },
    { n: "Sherozbek Choriyorov", r: "DTM matematika", i: "ShCh" },
    { n: "Abdujalil Isayev", r: "Olimpiada trener", i: "AI" },
    { n: "Bexruz Bekmirzayev", r: "Geometriya va stereometriya", i: "BB" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> O'qituvchilar
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Tajribali mentorlar jamoasi
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Yuzlab talabani yuqori ballarga tayyorlagan o'qituvchilar bilan birga o'sing.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {teachers.map((t) => (
          <div
            key={t.n}
            className="group rounded-2xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-brand/50"
          >
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground glow">
              {t.i}
            </div>
            <h3 className="mt-4 text-base font-semibold">{t.n}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.r}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            O'quvchilar fikrlari
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ular natijaga erishdi
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <blockquote className="text-sm leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
          Ko'p so'raladigan savollar
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">FAQ</h2>
      </div>

      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full px-5 py-5 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-medium sm:text-base">{f.q}</span>
                <ChevronDown
                  className={`mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {isOpen && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-3xl border border-border p-10 text-center sm:p-16"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Bugun <span className="gradient-text">boshlang</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Bepul ro'yxatdan o'ting va birinchi to'liq testingizni bugun oling.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground glow transition-transform hover:scale-[1.02]"
          >
            Bepul boshlash <ArrowRight className="h-4 w-4" />
          </Link>

        </div>
      </div>
    </section>
  );
}
