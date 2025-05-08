// pdf.ts
import { jsPDF } from "jspdf";
import { registerCustomFonts } from "./customFonts/fonts";
import { callAddFontChewy } from "./customFonts/Chewy";
import { callAddFontBaloo2 } from "./customFonts/Baloo-2";
import { getImageDataURL } from "./imageUtils";

interface Page {
  id: number;
  imageUrl: string;
  content: string;
  isCover?: boolean;
  isBackCover?: boolean;
  // WYSIWYG editing fields (stored in full resolution):
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  leftHalfUrl?: string;
  rightHalfUrl?: string;
  leftTextColor?: string;
  rightTextColor?: string;
  leftText?: string | string[];
  rightText?: string | string[];
}

function parseColor(inputColor: string): [number, number, number] {
  // 1) Handle basic named colors
  const lower = inputColor.toLowerCase();
  if (lower === "black") {
    return [0, 0, 0];
  } else if (lower === "white") {
    return [255, 255, 255];
  }

  // 2) If the color starts with "#", parse it as a hex code
  if (lower.startsWith("#")) {
    // e.g. "#FF0000" => red
    const hex = lower.slice(1);
    // If it's a 3-digit hex like "#F00", expand to 6-digit first
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("") // #f00 => #ff0000
        : hex;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    return [r, g, b];
  }

  console.warn(
    `parseColor: Unknown color "${inputColor}", defaulting to black`,
  );
  return [0, 0, 0];
}

export function setFontForPage(doc, fontFamily, fontStyle = "normal") {
  const fontMapping = {
    Nunito: "nunito",
    "Baloo 2": "Baloo",
    Chewy: "Chewy",
  };

  const alias = fontMapping[fontFamily] || fontMapping["Baloo 2"];
  console.log(alias);

  // Set the font on the jsPDF document using the alias and font style.
  doc.setFont(alias, fontStyle);
}

export async function generatePDF(
  title: string,
  pages: Page[],
  coverUrl?: string,
  backCoverUrl?: string,
) {
  registerCustomFonts();
  jsPDF.API.events.push(["addFonts", callAddFontChewy]);
  jsPDF.API.events.push(["addFonts", callAddFontBaloo2]);

  const doc = new jsPDF({ unit: "pt", format: [600, 600] });
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

  const contentPages = pages.filter((p) => !p.isCover && !p.isBackCover);
  // or 6" x 6" if you want

  // For each "page" in pages:
  for (const p of contentPages) {
    doc.addPage();
    if (p.leftHalfUrl) {
      const leftImgData = await getImageDataURL(p.leftHalfUrl);
      doc.addImage(leftImgData, "PNG", 0, 0, pageWidth, pageHeight);
    }
    if (p.leftText) {
      doc.setFontSize(p.fontSize || 16);
      const [r, g, b] = parseColor(p.leftTextColor || "#000000");
      doc.setTextColor(r, g, b);

      const xPos = (p.leftX ?? 0) + 10;
      const yPos = (p.leftY ?? 0) + 10;
      const wrapWidth = p.width || 400;
      const textStr = Array.isArray(p.leftText)
        ? p.leftText.join("\n")
        : p.leftText;
      const lines = doc.splitTextToSize(textStr, wrapWidth);
      setFontForPage(doc, p.leftFontFamily);
      doc.text(lines, xPos, yPos);
    }

    doc.addPage();
    if (p.rightHalfUrl) {
      const rightImgData = await getImageDataURL(p.rightHalfUrl);
      doc.addImage(rightImgData, "PNG", 0, 0, pageWidth, pageHeight);
    }
    if (p.rightText) {
      doc.setFontSize(p.fontSize || 16);
      const [r, g, b] = parseColor(p.rightTextColor || "#000000");
      doc.setTextColor(r, g, b);

      const xPos = (p.rightX ?? 0) + 10;
      const yPos = (p.rightY ?? 0) + 10;
      const wrapWidth = p.width || 400;
      const textStr = Array.isArray(p.rightText)
        ? p.rightText.join("\n")
        : p.rightText;
      const lines = doc.splitTextToSize(textStr, wrapWidth);
      setFontForPage(doc, p.rightFontFamily);
      doc.text(lines, xPos, yPos);
    }
  }

  if (backCoverUrl) {
    const backImage = await getImageDataURL(backCoverUrl);
    console.log("adding back cover image");
    doc.addPage();
    doc.addImage(backImage, "JPEG", 0, 0, pageHeight, pageHeight);
    console.log("added back cover image");
    const boxHeight = pageHeight * 0.2;
    const boxY = pageHeight - boxHeight;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(25, boxY + 10, pageWidth - 50, boxHeight - 20, 25, 25, "F");
    doc.setFont("fredoka", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Want to create your own book?", pageWidth / 2, pageHeight - 120, {
      align: "center",
    });
    doc.text(
      "Write to us at help@storypals.com",
      pageWidth / 2,
      pageHeight - 80,
      { align: "center" },
    );
    doc.setFontSize(10);
    doc.text(
      "Created with love by Team StoryPals",
      pageWidth / 2,
      pageHeight - 40,
      { align: "center" },
    );
  }

  console.log("returning PDF");

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
