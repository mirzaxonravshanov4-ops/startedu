import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ & Aloqa — StartEdu" },
      {
        name: "description",
        content:
          "StartEdu platformasi bo'yicha ko'p beriladigan savollar, javoblar va bog'lanish uchun ma'lumotlar.",
      },
      { property: "og:title", content: "FAQ & Aloqa — StartEdu" },
      {
        property: "og:description",
        content: "StartEdu bo'yicha savol-javoblar va bog'lanish ma'lumotlari.",
      },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  {
    q: "StartEdu qanday platforma?",
    a: "StartEdu — matematika bo'yicha onlayn tayyorgarlik platformasi. Milliy sertifikat, DTM, attestatsiya, SAT math va olimpiada yo'nalishlarida testlar, to'liq testlar, video darslar, AI tutor va vizual laboratoriya mavjud.",
  },
  {
    q: "Ro'yxatdan o'tish pullikmi?",
    a: "Yo'q. Ism, familiya, email va parol bilan bepul ro'yxatdan o'tasiz. Ba'zi kengaytirilgan imkoniyatlar premium foydalanuvchilar uchun ochiladi.",
  },
  {
    q: "Test natijalarimni qayerdan ko'raman?",
    a: "\"Natijalarim\" bo'limida har bir urinish, ball, sarflangan vaqt va xato qilingan savollar tahlili saqlanadi.",
  },
  {
    q: "Sertifikat qanday olinadi?",
    a: "To'liq test yoki milliy sertifikat testini belgilangan minimal ballda yakunlaganingizda sertifikat avtomatik yaratiladi va \"Sertifikatlarim\" bo'limida QR-kod bilan tekshirish uchun chiqadi.",
  },
  {
    q: "Global bo'lim nima?",
    a: "Premium foydalanuvchilar va adminlar o'z testini yaratadi, tizim unga 6 xonali kod beradi. Boshqa foydalanuvchilar shu kodni kiritib testni ishlaydi.",
  },
  {
    q: "Test paytida nima uchun tizim bloklanadi?",
    a: "Halollikni ta'minlash uchun test boshlanganda nazorat rejimi yoqiladi: sahifa to'liq ekranga o'tadi, menyular yashiriladi va boshqa oynaga o'tish qayd etiladi.",
  },
  {
    q: "Visual Lab qanday ishlaydi?",
    a: "Savolingizni matn yoki rasm ko'rinishida yuborasiz, tizim yechimni bosqichma-bosqich animatsiyali video ko'rinishida ovoz bilan tushuntiradi.",
  },
  {
    q: "Sinf bo'limida jonli dars bormi?",
    a: "Ha. O'qituvchi sinf ichida jonli dars ochadi va dars sayt ichida, chatda media hamda dumaloq video xabarlar bilan o'tadi.",
  },
];

function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-brand">Yordam</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">FAQ &amp; Aloqa</h1>
        <p className="mt-3 text-muted-foreground">
          Ko'p beriladigan savollar va bizga bog'lanish yo'llari.
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/40"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-medium text-foreground">
              {f.q}
              <span className="mt-0.5 text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Mail, label: "Email", value: "mirzaxonravshanov@gmail.com", href: "mailto:mirzaxonravshanov@gmail.com" },
          { icon: MessageCircle, label: "Telegram", value: "@m1x080_v", href: "https://t.me/m1x080_v" },
          { icon: Phone, label: "Telefon", value: "+998 94 488 09 13", href: "tel:+998944880913" },
          { icon: MapPin, label: "Manzil", value: "Samarqand, O'zbekiston" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <c.icon className="h-5 w-5 text-brand" />
            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              {c.label}
            </p>
            {c.href ? (
              <a href={c.href} className="mt-1 block text-sm font-medium hover:text-brand">
                {c.value}
              </a>
            ) : (
              <p className="mt-1 text-sm font-medium">{c.value}</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
