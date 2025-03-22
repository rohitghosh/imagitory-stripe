// pdf.ts
import { jsPDF } from "jspdf";
import { registerCustomFonts } from "./fonts";

interface Page {
  id: number;
  imageUrl: string;
  content: string;
  isCover?: boolean;
  isBackCover?: boolean;
}

async function getImageDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function renderPageSideBySideText(
  doc: jsPDF,
  page: Page,
  pageWidth: number,
  pageHeight: number,
) {
  const margin = 0.75;
  const usableWidth = pageWidth - 2 * margin;
  doc.setFont("nunito", "normal");
  doc.setFontSize(16); // Larger font size for full-page text
  const lines = wrapText(doc, page.content, usableWidth);
  doc.text(lines, margin, margin);
}

function renderPageSideBySideImage(
  doc: jsPDF,
  imageData: string,
  pageWidth: number,
  pageHeight: number,
) {
  doc.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight);
}

function renderPageStacked(
  doc: jsPDF,
  page: Page,
  imageData: string,
  pageWidth: number,
  pageHeight: number,
) {
  const margin = 0.25;
  const usableWidth = pageWidth - 2 * margin;
  const imageHeight = pageHeight * 0.7;
  const remainingHeight = pageHeight - (margin + imageHeight + margin);

  doc.addImage(imageData, "JPEG", margin, margin, usableWidth, imageHeight);
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);

  const wrappedText = wrapText(doc, page.content, usableWidth);
  const textHeight = wrappedText.length * 0.25; // estimate line height at 0.25in
  const textY =
    margin + imageHeight + (remainingHeight - textHeight) / 2 + margin; // center in remaining space

  doc.text(wrappedText, margin, textY);
}

export async function generatePDF(
  title: string,
  pages: Page[],
  coverUrl?: string,
  backCoverUrl?: string,
  layout: "side-by-side" | "stacked" = "side-by-side",
): Promise<Buffer> {
  registerCustomFonts();

  const doc = new jsPDF({ unit: "in", format: [6, 9] });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (coverUrl) {
    const coverImage = await getImageDataURL(coverUrl);
    doc.addImage(coverImage, "JPEG", 0, 0, pageWidth, pageHeight);
  } else {
    doc.setFont("fredoka", "bold");
    doc.setFontSize(28);
    doc.text(title, pageWidth / 2, 1.5, { align: "center" });
  }

  if (layout === "stacked") {
    doc.addPage(); // optional blank only for stacked layout
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.isCover || page.isBackCover) continue;

    if (layout === "side-by-side") {
      // Text page first
      doc.addPage();
      renderPageSideBySideText(doc, page, pageWidth, pageHeight);

      // Image page next
      const imageData = await getImageDataURL(page.imageUrl);
      doc.addPage();
      renderPageSideBySideImage(doc, imageData, pageWidth, pageHeight);
    } else {
      doc.addPage();
      const imageData = await getImageDataURL(page.imageUrl);
      renderPageStacked(doc, page, imageData, pageWidth, pageHeight);
    }
  }

  if (backCoverUrl) {
    const backImage = await getImageDataURL(backCoverUrl);
    doc.addPage();
    doc.addImage(backImage, "JPEG", 0, 0, pageWidth, pageHeight);

    // Draw white rounded rectangle at the bottom 20%
    const boxHeight = pageHeight * 0.2;
    const boxY = pageHeight - boxHeight;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      0.25,
      boxY + 0.1,
      pageWidth - 0.5,
      boxHeight - 0.2,
      0.25,
      0.25,
      "F",
    );

    // Add text over the white box
    doc.setFont("fredoka", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Want to create your own book?", pageWidth / 2, pageHeight - 1.2, {
      align: "center",
    });
    doc.text(
      "Write to us at help@storypals.com",
      pageWidth / 2,
      pageHeight - 0.8,
      { align: "center" },
    );
    doc.setFontSize(10);
    doc.text(
      "Created with love by Team StoryPals",
      pageWidth / 2,
      pageHeight - 0.4,
      { align: "center" },
    );
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
