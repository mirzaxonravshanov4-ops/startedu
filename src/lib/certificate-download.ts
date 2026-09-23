import { toPng } from "html-to-image";

/** Sertifikat kartasini PNG rasm sifatida yuklab olish. */
export async function downloadCertificate(code: string) {
  const node = document.getElementById("certificate-print");
  if (!node) throw new Error("Sertifikat topilmadi");

  const dataUrl = await toPng(node, {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
  });

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `StartEdu-sertifikat-${code}.png`;
  a.click();
}
