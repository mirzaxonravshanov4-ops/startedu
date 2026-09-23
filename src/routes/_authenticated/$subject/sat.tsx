import { createFileRoute } from "@tanstack/react-router";
import { DirectionPage } from "@/components/direction-page";
import { PremiumGate } from "@/components/premium-gate";

export const Route = createFileRoute("/_authenticated/$subject/sat")({
  head: () => ({
    meta: [
      { title: "SAT math — StartEdu" },
      { name: "description", content: "SAT matematika bo'limi uchun testlar va to'liq testlar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PremiumGate title="SAT math">
    <DirectionPage
      category="sat"
      eyebrow="Yo'nalish"
      title="SAT math"
      description="SAT formatidagi matematika bo'limi: Heart of Algebra, Problem Solving, Passport to Advanced Math va Additional Topics."
    />
    </PremiumGate>
  ),
});
