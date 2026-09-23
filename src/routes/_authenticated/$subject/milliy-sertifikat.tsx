import { createFileRoute } from "@tanstack/react-router";
import { DirectionPage } from "@/components/direction-page";

export const Route = createFileRoute("/_authenticated/$subject/milliy-sertifikat")({
  head: () => ({
    meta: [
      { title: "Milliy sertifikat — StartEdu" },
      { name: "description", content: "Milliy sertifikat imtihoniga tayyorgarlik testlari." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DirectionPage
      category="milliy-sertifikat"
      eyebrow="Yo'nalish"
      title="Milliy sertifikat"
      description="Milliy sertifikat formatidagi imtihonlar va mavzulashtirilgan tayyorgarlik."
    />
  ),
});
