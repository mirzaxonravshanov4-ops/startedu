// -------- Badges (derived, no DB) --------
export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: "sparkles" | "flame" | "trophy" | "medal" | "target" | "crown" | "book";
  earned: boolean;
};

export function computeBadges(input: {
  xp: number;
  level: number;
  streak: number;
  attempts: number;
  perfectScores: number;
}): Badge[] {
  const { xp, level, streak, attempts, perfectScores } = input;
  return [
    { id: "first-step", title: "Birinchi qadam", description: "Birinchi testni yakunlang", icon: "sparkles", earned: attempts >= 1 },
    { id: "xp-100", title: "100 XP", description: "100 XP to'plang", icon: "target", earned: xp >= 100 },
    { id: "xp-500", title: "500 XP", description: "500 XP to'plang", icon: "trophy", earned: xp >= 500 },
    { id: "xp-1000", title: "1000 XP", description: "1000 XP klubiga qo'shiling", icon: "crown", earned: xp >= 1000 },
    { id: "streak-3", title: "3 kunlik streak", description: "3 kun ketma-ket faol", icon: "flame", earned: streak >= 3 },
    { id: "streak-7", title: "7 kunlik streak", description: "Bir hafta ketma-ket faol", icon: "flame", earned: streak >= 7 },
    { id: "level-5", title: "5-daraja", description: "5-darajaga chiqing", icon: "medal", earned: level >= 5 },
    { id: "perfect", title: "Mukammal", description: "Kamida bir marta 100 ball oling", icon: "crown", earned: perfectScores >= 1 },
    { id: "scholar", title: "Bilimdon", description: "10 ta test yakunlang", icon: "book", earned: attempts >= 10 },
  ];
}
