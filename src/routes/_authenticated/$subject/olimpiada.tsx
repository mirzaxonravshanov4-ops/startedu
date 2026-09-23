import { createFileRoute } from "@tanstack/react-router";
import { DirectionPage } from "@/components/direction-page";
import { PremiumGate } from "@/components/premium-gate";

export const Route = createFileRoute("/_authenticated/$subject/olimpiada")({
  head: () => ({
    meta: [
      { title: "Olimpiada — StartEdu" },
      { name: "description", content: "Olimpiada darajasidagi murakkab matematika masalalari." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PremiumGate title="Olimpiada">
    <DirectionPage
      category="olimpiada"
      eyebrow="Yo'nalish"
      title="Olimpiada"
      description="Respublika va xalqaro olimpiadalarga tayyorgarlik: murakkab, nostandart masalalar to'plami."
    />
    </PremiumGate>
  ),
});
