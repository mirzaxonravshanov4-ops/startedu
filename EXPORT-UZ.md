# StartEdu — to‘liq loyiha kodi

Bu eksport statik HTML nusxasi emas: loyihaning joriy frontend va server manba kodi, uslublari, sahifalari, AI funksiyalari, baza tuzilmasi, mavjud migratsiyalari va sozlash fayllarini o‘z ichiga oladi.

## Ishga tushirish

1. ZIPni alohida papkaga oching.
2. Bun o‘rnating va shu papkada `bun install --frozen-lockfile` buyrug‘ini bajaring.
3. ZIPdagi `.env.example` asosida lokal `.env` yarating. Kerakli ulanish sozlamalarini o‘zingizning xizmatlaringizga moslang; bo‘sh qiymatlar haqiqiy kalit emas.
4. `bun run dev` bilan lokal ishga tushiring.
5. Tarqatish uchun `bun run build` ishlatiladi. Server qismi Cloudflare Worker muhitiga mo‘ljallangan; oddiy statik hosting yetarli emas.

## Tashqi xizmatlar

- Baza, kirish va fayl saqlash xizmatlari Lovable Cloud bilan ishlaydi. ZIP manba kodini beradi, lekin xizmatlarning o‘zini yoki jonli bazadagi yozuvlarni ko‘chirmaydi.
- AI kodida `GEMINI_API_KEY` server muhiti o‘zgaruvchisi ishlatiladi. Kalit arxivga qo‘shilmagan; AI ishlashi kalit va xizmat kvotasiga bog‘liq.
- Kirish provayderlari, qaytish manzillari va saqlash ruxsatlari yangi xizmatda alohida sozlanadi.
- Lovable Cloud boshqaradigan server kalitlari arxiv orqali berilmaydi va foydalanuvchi uchun olinmaydi. Mustaqil xizmatga ko‘chirishda o‘sha xizmatning o‘z sozlamalari kerak bo‘ladi.

## Baza tuzilmasi

`drizzle/schema.ts`, `drizzle/migrations/` va `supabase/migrations/` dagi mavjud fayllar kiritilgan. Dastlabki migratsiya ikki papkada takrorlangan: ikkalasini ham qayta qo‘llamang. Amaldagi Lovable Cloud bazasiga qo‘llangan migratsiyalarni qayta ishlatmang. Yangi bazaga ko‘chirishda migratsiya tarixini tekshirib, har bir o‘zgarishni bir marta qo‘llang. Jonli foydalanuvchilar, savollar, natijalar va yuklangan fayllar eksport qilinmagan.

## Rasm va tekshiruv

Eksportdagi bosh sahifa rasmi lokal `public/assets/` papkasiga kiritiladi; eksport nusxasidagi rasm ko‘rsatkichigina lokal manzilga moslanadi. Ishlayotgan sayt o‘zgarmaydi.

Arxivdagi manba fayllari, istisnolar, maxfiy kalitlar va ZIP yaxlitligi tekshiriladi. Yangi hostingda o‘rnatish, kirish va AI ishlashi ushbu topshirishda sinovdan o‘tkazilmaydi; arxiv mavjud kodni beradi, barcha funksiyalar xatosiz ishlashiga yangi kafolat emas.

## Kiritilmagan fayllar

Maxfiy `.env`, seanslar, kalitlar, repository tarixi, ishchi muhit metadata fayllari, `node_modules`, yaratilgan build natijalari va oldingi eksportlar kiritilmagan. Bog‘liqliklar `package.json` va `bun.lock` asosida o‘rnatiladi.