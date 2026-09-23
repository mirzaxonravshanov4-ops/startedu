/** Test davomiyligi: attestatsiya testlari 2 soat, qolganlari savoliga 1.5 daqiqa. */
export function examDurationMinutes(category: string | null | undefined, questionCount: number) {
  if (category === "attestatsiya") return 120;
  return Math.max(5, Math.round(questionCount * 1.5));
}
