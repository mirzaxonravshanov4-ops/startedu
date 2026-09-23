import { createFileRoute } from "@tanstack/react-router";
import { DirectionPage } from "@/components/direction-page";

export const Route = createFileRoute("/_authenticated/$subject/dtm")({
  head: () => ({
    meta: [
      { title: "DTM testlari — StartEdu" },
      { name: "description", content: "DTM formatidagi matematika testlari va imtihonlari." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DirectionPage
      category="dtm"
      eyebrow="Yo'nalish"
      title="DTM testlari"
      description="DTM formatidagi to'liq imtihonlar va mavzular bo'yicha tayyorgarlik testlari."
    />
  ),
});
