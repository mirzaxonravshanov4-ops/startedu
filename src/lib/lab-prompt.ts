import type { Scene } from "@/lib/scene";

/** Topics available in the visual laboratory. */
export const LAB_TOPICS: { key: string; title: string; sample: string }[] = [
  { key: "natural", title: "Natural sonlar va amallar", sample: "$1+2+\\dots+100$ yig'indisini vizual isbotla" },
  { key: "bolinish", title: "Bo'linish belgilari, tub sonlar", sample: "$1..60$ oralig'idagi tub sonlarni ko'rsat" },
  { key: "ekub", title: "EKUB va EKUK", sample: "$84$ va $120$ ning EKUB va EKUK ini toping" },
  { key: "boluvchi", title: "Bo'luvchilar soni va yig'indisi", sample: "$360$ ning bo'luvchilari soni nechta?" },
  { key: "qoldiq", title: "Qoldiqli bo'lish, oxirgi raqam", sample: "$7^{2026}$ ning oxirgi raqami nechchi?" },
  { key: "kasr", title: "Oddiy kasrlar", sample: "$\\frac{2}{3}+\\frac{3}{4}$ ni vizual tushuntir" },
  { key: "onli", title: "O'nli va davriy kasrlar", sample: "$0,(36)$ ni oddiy kasrga aylantir" },
  { key: "foiz", title: "Foiz, nisbat, proporsiya", sample: "Narx 20% oshdi, keyin 20% tushdi — nima bo'ldi?" },
  { key: "daraja", title: "Daraja va xossalari", sample: "$2^{10}$ ning o'sishini grafikda ko'rsat" },
  { key: "kophad", title: "Birhad va ko'phadlar", sample: "$(2x+3)(x-5)$ ni yoyib ko'rsat" },
  { key: "qisqa", title: "Qisqa ko'paytirish formulalari", sample: "$(a+b)^2$ ni maydon orqali isbotla" },
  { key: "ajratish", title: "Ko'paytuvchilarga ajratish", sample: "$x^2-5x+6$ ni ko'paytuvchilarga ajrat" },
  { key: "algkasr", title: "Algebraik kasrlar", sample: "$\\frac{x^2-9}{x+3}$ ni qisqartir" },
  { key: "tenglama", title: "Chiziqli tenglamalar", sample: "$3x+5=2x-4$ tenglamani vizual yech" },
  { key: "sistema", title: "Tenglamalar sistemasi", sample: "$x+y=7,\\ 2x-y=2$ sistemani grafik yech" },
  { key: "masala", title: "Masala tuzishga doir", sample: "Ikki son yig'indisi 50, ayirmasi 12 — sonlarni top" },
  { key: "tengsizlik", title: "Chiziqli tengsizliklar", sample: "$-2x+5>1$ tengsizlikni son o'qida ko'rsat" },
  { key: "funksiya", title: "Chiziqli funksiya", sample: "$y=2x-3$ grafigini bosqichma-bosqich chiz" },
  { key: "ildiz", title: "Arifmetik kvadrat ildiz", sample: "$\\sqrt{50}$ ni soddalashtir va grafikda ko'rsat" },
  { key: "ildizli", title: "Ildizli ifodalar", sample: "$\\frac{1}{\\sqrt{5}+2}$ maxrajini irrasionallikdan xoli qil" },
];

export const LAB_SYSTEM_PROMPT = `Siz — StartEdu platformasining VIZUAL MATEMATIKA LABORATORIYASI motorisiz.
Foydalanuvchi savolini bosqichma-bosqich ANIMATSIYALI sahna (video kadrlari) ko'rinishida tushuntirasiz.
Faqat o'zbek tilida yozing. Formulalar LaTeX: $...$.

FAQAT quyidagi JSON sxemasini qaytaring (boshqa matn yo'q):
{
  "title": "string",
  "summary": "string",
  "answer": "string (LaTeX bilan yakuniy javob)",
  "steps": [
    {
      "title": "qisqa sarlavha",
      "narration": "2-4 gap tushuntirish (LaTeX bo'lishi mumkin)",
      "latex": "$asosiy formula$",
      "duration": 6,
      "view": { "xmin": -10, "xmax": 10, "ymin": -10, "ymax": 10 },
      "shapes": [ ... ]
    }
  ]
}

shapes elementlari (kind bo'yicha):
- {"kind":"grid"}
- {"kind":"axes","xlabel":"x","ylabel":"y"}
- {"kind":"func","expr":"2*x-3","label":"y=2x-3","color":"#525252","from":-8,"to":8,"dashed":false}
- {"kind":"point","x":2,"y":1,"label":"A(2;1)"}
- {"kind":"segment","x1":0,"y1":0,"x2":3,"y2":4,"label":"5","dashed":true}
- {"kind":"arrow","x1":0,"y1":0,"x2":3,"y2":0,"label":"+3"}
- {"kind":"polygon","points":[[0,0],[4,0],[4,3]],"label":"S=6","fill":true}
- {"kind":"circle","cx":0,"cy":0,"r":3,"label":"R=3"}
- {"kind":"label","x":-9,"y":8,"text":"x = 2"}
- {"kind":"numberline","min":-5,"max":5,"step":1,"marks":[{"x":2,"label":"2","open":true}],"interval":{"from":2,"to":5,"openFrom":true}}
- {"kind":"bars","items":[{"label":"2^1","value":2},{"label":"2^2","value":4}]}
- {"kind":"pie","items":[{"label":"60%","value":60},{"label":"40%","value":40}]}
- {"kind":"fractionbar","parts":8,"filled":3,"label":"3/8"}

QAT'IY QOIDALAR:
- "expr" faqat oddiy matematik ifoda: x, + - * / ^ %, qavslar va sqrt/abs/sin/cos/tan/ln/log/exp funksiyalari. LaTeX EMAS.
- Har bir qadamda kamida 1 shape bo'lsin. Grafik kerak bo'lsa avval {"kind":"grid"} va {"kind":"axes"} qo'ying.
- 4 dan 7 gacha qadam bo'lsin; oxirgi qadamda javob vizual ta'kidlansin.
- Koordinatalar "view" oralig'ida bo'lsin. Barcha sonlar — son (string emas).`;

/** Extracts a Scene object from a model reply that may contain code fences. */
export function extractJson(raw: string): Scene | null {
  const text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Scene;
  } catch {
    return null;
  }
}
