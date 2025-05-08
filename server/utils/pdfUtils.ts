// pdfUtils.ts
import { jsPDF } from "jspdf";
import { createCanvas, loadImage } from "canvas";
import axios from "axios";
import { pickContrastingTextColor } from "./textColorUtils";
import { loadBase64Image } from "./layouts";
import { mirrorImage } from "./imageUtils";

export async function fetchImage(url: string) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(res.data);
  return await loadImage(buffer);
}
function splitByPunctuation(text) {
  // Split at punctuation followed by a space, but keep punctuation with the segment.
  return text.split(/(?<=[,;.])\s+/);
}

// Uneven splitting function
function unevenSplit(text, maxWidth, doc) {
  const words = text.split(" ");
  let lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line + word + " ";
    const testWidth = doc.getTextWidth(testLine);

    // Random factor between 0.8-1.2 ensures organic line breaks
    const randomFactor = 0.8 + Math.random() * 0.4;
    const adjustedMaxWidth = maxWidth * randomFactor;

    if (testWidth > adjustedMaxWidth && line.length > 0) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  });

  if (line.length > 0) lines.push(line.trim());
  console.log(lines);
  return lines;
}

function splitTextUnevenly(text, maxWidth, doc) {
  // Step 1: Split by punctuation.
  const segments = splitByPunctuation(text);
  let lines = [];

  // Step 2: For each segment, split unevenly if needed.
  segments.forEach((segment) => {
    // Remove extra whitespace.
    segment = segment.trim();
    if (doc.getTextWidth(segment) <= maxWidth) {
      // If the whole segment fits, add it as is.
      lines.push(segment);
    } else {
      // Otherwise, break it further.
      const subLines = unevenSplit(segment, maxWidth, doc);
      lines = lines.concat(subLines);
    }
  });

  return lines;
}

export async function renderSideBySideImageAndHalfText(
  doc: jsPDF,
  layoutType: 2 | 3,
  pageWidth: number,
  pageHeight: number,
  text: string,
  leftImage: string,
  rightImage: string,
  imageVariants?: {
    wide?: Buffer;
    squares?: Buffer[];
  },
  borderImage?: string,
) {
  const lineHeight = 0.26;
  const maxTextWidth = pageWidth / 2 - 1.0;
  const textLines = splitTextUnevenly(text, maxTextWidth, doc);

  const totalTextHeight = textLines.length * lineHeight;
  const yCentered = (pageHeight - totalTextHeight) / 2;
  const simpleMode = !imageVariants;

  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  if (borderImage) {
    const image = await loadBase64Image(borderImage);
    let textColor: string;
    if (layoutType === 2) {
      textColor = pickContrastingTextColor(image, 50, 50, 250, 500);
    } else {
      textColor = pickContrastingTextColor(image, 50, 50, 250, 500);
    }
    if (textColor === "white") {
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(0, 0, 0);
    }
  } else {
    doc.setTextColor(0, 0, 0);
  }
  // const simpleMode = true;

  if (layoutType === 2) {
    doc.addPage();
    if (borderImage) {
      doc.addImage(borderImage, "JPEG", 0, 0, pageWidth, pageHeight);
    }
    doc.addImage(
      leftImage,
      "JPEG",
      pageWidth / 2,
      0,
      pageWidth / 2,
      pageHeight,
    );
    if (simpleMode) {
      // Original approach: text is fully centered
      doc.text(textLines, 0.5, yCentered, { lineHeightFactor: 1.5 });
    } else {
      let currentY = 0.3 * pageHeight; // start a bit down from the top
      doc.text(textLines.slice(0, 10), 0.5, currentY, {
        lineHeightFactor: 1.5,
      });
      currentY += textLines.length * lineHeight;

      // Insert the wide image if present
      if (imageVariants?.wide) {
        const wideData = imageVariants.wide;
        const size = pageHeight - currentY - 0.5;
        console.log(size, currentY);

        // Let's place it ~ 2" wide x 1.5" tall
        doc.addImage(
          wideData,
          "JPEG",
          0.5 + pageWidth / 6,
          currentY + 0.3,
          size,
          size,
        );
      }
    }
    doc.addPage();
    doc.addImage(rightImage, "JPEG", 0, 0, pageWidth, pageHeight);
  } else {
    doc.addPage();
    doc.addImage(leftImage, "JPEG", 0, 0, pageWidth, pageHeight);
    doc.addPage();
    if (borderImage) {
      const mirroredBorderImage = await mirrorImage(borderImage);
      doc.addImage(mirroredBorderImage, "JPEG", 0, 0, pageWidth, pageHeight);
    }
    doc.addImage(rightImage, "JPEG", 0, 0, pageWidth / 2, pageHeight);
    if (simpleMode) {
      doc.text(textLines, pageWidth / 2 + 0.25, yCentered);
    } else {
      let currentY = 0.3 * pageHeight; // start a bit down from the top
      doc.text(textLines.slice(0, 10), pageWidth / 2 + 0.5, currentY, {
        lineHeightFactor: 1.5,
      });
      currentY += textLines.length * lineHeight;

      // Insert the wide image if present
      if (imageVariants?.wide) {
        const wideData = imageVariants.wide;
        const size = pageHeight - currentY - 0.5;
        console.log(size, currentY);

        // Let's place it ~ 2" wide x 1.5" tall
        doc.addImage(
          wideData,
          "JPEG",
          pageWidth / 2 + pageWidth / 8,
          currentY + 0.3,
          size,
          size,
        );
      }
    }
  }
}
