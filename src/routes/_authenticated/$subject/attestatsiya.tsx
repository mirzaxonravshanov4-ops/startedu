import { createFileRoute } from "@tanstack/react-router";
import { DirectionPage } from "@/components/direction-page";
import { PremiumGate } from "@/components/premium-gate";
import { Award, Clock, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$subject/attestatsiya")({
  head: () => ({
    meta: [
      { title: "Attestatsiya — StartEdu" },
      { name: "description", content: "O'qituvchilar attestatsiyasi uchun matematika testlari." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PremiumGate title="Attestatsiya">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Attestatsiya imtihoni tuzilmasi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ListChecks className="h-4 w-4" /> Savollar
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Matematika — 35 ta</li>
                <li>Kasbiy standart — 5 ta</li>
                <li>Pedagogik mahorat — 10 ta</li>
              </ul>
              <div className="mt-2 text-xs text-muted-foreground">Jami: 50 ta savol</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-4 w-4" /> Baholash
              </div>
              <p className="mt-2 text-sm">Har bir savol — 2 ball</p>
              <p className="text-sm">Maksimal ball — 100</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" /> Vaqt
              </div>
              <p className="mt-2 text-sm">2 soat (120 daqiqa)</p>
            </div>
          </div>
        </section>
      </div>
      <DirectionPage
        category="attestatsiya"
        eyebrow="Yo'nalish"
        title="Attestatsiya"
        description="Attestatsiya imtihoniga tayyorgarlik: 50 savollik to'liq variantlar va mavzular."
      />
    </PremiumGate>
  ),
});
