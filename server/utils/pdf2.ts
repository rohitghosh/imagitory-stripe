// pdf2.ts
import { jsPDF } from "jspdf";
import { registerCustomFonts } from "./fonts";

interface Page {
  id: number;
  imageUrl: string;
  content: string;
  isCover?: boolean;
  isBackCover?: boolean;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function renderFullImageWithCenteredText(
  doc: jsPDF,
  imageBase64: string,
  text: string,
  pageWidth: number,
  pageHeight: number,
) {
  // Full background image
  doc.addImage(imageBase64, "JPEG", 0, 0, pageWidth, pageHeight);

  // Text block in the center
  const margin = 0.75;
  const maxWidth = pageWidth - 2 * margin;
  const lines = doc.splitTextToSize(text, maxWidth);

  doc.setTextColor(0, 0, 0);
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  doc.text(lines, pageWidth / 2, pageHeight / 2, {
    align: "center",
    baseline: "middle",
  });
}

function renderImageOnlyPage(
  doc: jsPDF,
  imageBase64: string,
  pageWidth: number,
  pageHeight: number,
) {
  doc.addImage(imageBase64, "JPEG", 0, 0, pageWidth, pageHeight);
}

export async function generatePDF(
  title: string,
  pages: Page[],
  coverUrl?: string,
  backCoverUrl?: string,
  layout: "stacked" | "side-by-side" = "stacked",
  backgroundImageBase64?: string,
  pageBackgrounds?: string[],
): Promise<Buffer> {
  registerCustomFonts();
  const doc = new jsPDF({ unit: "in", format: [6, 6] });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Cover Page ---
  if (coverUrl) {
    const coverImage = await fetch(coverUrl).then((res) => res.arrayBuffer());
    const base64 = Buffer.from(coverImage).toString("base64");
    doc.addImage(
      `data:image/jpeg;base64,${base64}`,
      "JPEG",
      0,
      0,
      pageWidth,
      pageHeight,
    );
  }

  for (let i = 0; i < pages.length - 1; i += 1) {
    const imagePage = pages[i];
    const textPage = pages[i];

    // Skip if cover/backCover pages
    if (
      imagePage?.isCover ||
      imagePage?.isBackCover ||
      textPage?.isCover ||
      textPage?.isBackCover
    )
      continue;

    // Image Page
    doc.addPage();
    const imageData = await fetch(imagePage.imageUrl)
      .then((res) => res.arrayBuffer())
      .then(
        (buf) =>
          `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`,
      );
    renderImageOnlyPage(doc, imageData, pageWidth, pageHeight);

    // Text Page
    doc.addPage();
    const bgData = pageBackgrounds?.[Math.floor(i)] || imageData; // fallback if no bg
    renderFullImageWithCenteredText(
      doc,
      bgData,
      textPage.content,
      pageWidth,
      pageHeight,
    );
  }

  // --- Back Cover Page ---
  if (backCoverUrl) {
    const backImage = await fetch(backCoverUrl).then((res) =>
      res.arrayBuffer(),
    );
    const base64 = Buffer.from(backImage).toString("base64");
    doc.addPage();
    doc.addImage(
      `data:image/jpeg;base64,${base64}`,
      "JPEG",
      0,
      0,
      pageWidth,
      pageHeight,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Want to create your own book?", pageWidth / 2, pageHeight - 1, {
      align: "center",
    });
    doc.text(
      "Write to us at help@storypals.com",
      pageWidth / 2,
      pageHeight - 0.5,
      { align: "center" },
    );
    doc.setFontSize(10);
    doc.text(
      "Created with love by Team StoryPals",
      pageWidth / 2,
      pageHeight - 0.2,
      { align: "center" },
    );
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
