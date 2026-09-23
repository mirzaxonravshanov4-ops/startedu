import { createFileRoute } from "@tanstack/react-router";
import { Compass, Mail, MapPin, Phone, Target, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Biz haqimizda — StartEdu" },
      {
        name: "description",
        content:
          "StartEdu — o'zbek o'quvchilariga matematikani professional darajada o'rgatuvchi zamonaviy ta'lim platformasi. Missiya, vizyon va jamoa.",
      },
      { property: "og:title", content: "Biz haqimizda — StartEdu" },
      {
        property: "og:description",
        content:
          "StartEdu jamoasi, missiya va vizyoni haqida. Bizning maqsadimiz — har bir o'quvchiga sifatli matematika ta'limini yetkazish.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="relative">
      <section
        className="relative overflow-hidden border-b border-border/30"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-3 lg:px-8 lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            Biz haqimizda
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Har bir o'quvchi uchun{" "}
            <span className="gradient-text">professional matematika</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            StartEdu — O'zbekistondagi o'quvchilar uchun mo'ljallangan zamonaviy ta'lim
            platformasi. Biz matematikani oddiy, tushunarli va estetik qilib taqdim etamiz.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-3 lg:px-8">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: "Maqsad",
              text: "Har bir talabani Milliy sertifikat, DTM va attestatsiyaga to'liq tayyorlash.",
            },
            {
              icon: Compass,
              title: "Missiya",
              text: "Sifatli matematika ta'limini har bir maktab va uyga yetkazish.",
            },
            {
              icon: Users,
              title: "Vizyon",
              text: "O'zbekistondagi #1 matematika platformasi bo'lish va mintaqaga chiqish.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/30 bg-surface/40">
        <div className="mx-auto grid max-w-3xl gap-10 px-4 py-20 sm:px-3 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bizning jamoa
            </h2>
            <p className="mt-4 text-muted-foreground">
              Muhandislar, dizaynerlar va o'qituvchilardan iborat kichik lekin kuchli jamoa.
              Biz mahsulotni har hafta yaxshilaymiz va foydalanuvchi fikriga quloq solamiz.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "5+", l: "Jamoa a'zosi" },
              { n: "3", l: "Yil tajriba" },
              { n: "50+", l: "To'liq testlar" },
              { n: "1000+", l: "Faol foydalanuvchilar" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-card p-3">
                <div className="text-3xl font-bold gradient-text">{s.n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-3 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Aloqa</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Savol, taklif yoki hamkorlik uchun biz bilan bog'laning.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { icon: Mail, l: "Email", v: "hello@start.edu" },
            { icon: Phone, l: "Telefon", v: "+998 (94) 488-09-13" },
            { icon: MapPin, l: "Manzil", v: "Samarqand, O'zbekiston" },
          ].map((c) => (
            <div key={c.l} className="rounded-2xl border border-border bg-card p-3 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl glass">
                <c.icon className="h-5 w-5 text-brand" />
              </span>
              <div className="mt-4 text-xs text-muted-foreground">{c.l}</div>
              <div className="mt-1 text-sm font-medium">{c.v}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
