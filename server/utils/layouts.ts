// layouts.ts (or inline in pdf3.ts, if you prefer):
import { jsPDF } from "jspdf";
import fs from "fs";
// or whichever path
import {
  clipImageToRoundedRectBuffer,
  clipImageToCircleBuffer,
} from "./imageUtils";
import { renderSideBySideImageAndHalfText } from "./pdfUtils";
import {
  getImageDataURL,
  splitImageForSpreadFlexible,
  fadeBottomBorderImage,
  mirrorImage,
  fadeSideBordersImage,
  fadeSideBordersWithStripes,
} from "./imageUtils";
import { pickContrastingTextColor } from "./textColorUtils";
import { Image } from "canvas";
import {
  removeBackgroundFromImage,
  expandImageToLeft,
  expandImageToRight,
  splitImageInHalf,
} from "./elementGeneration";

interface Page {
  id: number;
  imageUrl: string;
  content: string;
  isCover?: boolean;
  isBackCover?: boolean;
  imageVariants?: {
    wide?: Buffer;
    squares?: Buffer[];
  };
}

// Example signature for each layout function
export async function renderLayout2(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
  borderImage: string,
) {
  // Do the logic from your switch layoutIndex=0
  const { leftImage, rightImage } = await splitImageForSpreadFlexible(
    contentPage.imageUrl,
    2,
    pageWidth,
    pageHeight,
  );
  await renderSideBySideImageAndHalfText(
    doc,
    2,
    pageWidth,
    pageHeight,
    contentPage.content,
    leftImage,
    rightImage,
    contentPage.imageVariants,
    borderImage,
  );
}

export async function renderLayout1(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
) {
  // const imageData = await getImageDataURL(contentPage.imageUrl);
  const expandedImageDataURL = await expandImageToLeft(contentPage.imageUrl);
  const { leftHalf, rightHalf } = await splitImageInHalf(expandedImageDataURL);
  // const leftHalfNoBGURL = await removeBackgroundFromImage(leftHalf);
  // const leftHalfNoBG = await getImageDataURL(leftHalfNoBGURL);

  doc.addPage();
  doc.addImage(leftHalf, "PNG", 0, 0, pageWidth, pageHeight);

  const leftImg = await loadBase64Image(leftHalf);

  const textColor = pickContrastingTextColor(leftImg, 50, 300, 300, 300);
  // Place text top-leftish, 2 lines
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  if (textColor === "white") {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  const textLines = doc.splitTextToSize(contentPage.content, pageWidth - 1);
  doc.text(textLines, 0.5, pageHeight / 2);
  doc.addPage();
  doc.addImage(rightHalf, "JPEG", 0, 0, pageWidth, pageHeight);
}

export async function renderLayout1_type2(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
) {
  // const imageData = await getImageDataURL(contentPage.imageUrl);
  const expandedImageDataURL = await expandImageToRight(contentPage.imageUrl);
  const { leftHalf, rightHalf } = await splitImageInHalf(expandedImageDataURL);
  // const leftHalfNoBGURL = await removeBackgroundFromImage(leftHalf);
  // const leftHalfNoBG = await getImageDataURL(leftHalfNoBGURL);

  doc.addPage();
  doc.addImage(leftHalf, "PNG", 0, 0, pageWidth, pageHeight);
  doc.addPage();
  doc.addImage(rightHalf, "JPEG", 0, 0, pageWidth, pageHeight);

  const rightImg = await loadBase64Image(rightHalf);

  const textColor = pickContrastingTextColor(rightImg, 50, 0, 300, 300);
  // Place text top-leftish, 2 lines
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  if (textColor === "white") {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  const textLines = doc.splitTextToSize(contentPage.content, pageWidth - 1);
  doc.text(textLines, 0.5, 0.5);
}

export async function renderLayout1_type3(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
) {
  // const imageData = await getImageDataURL(contentPage.imageUrl);
  const expandedImageDataURL = await expandImageToRight(contentPage.imageUrl);
  const { leftHalf, rightHalf } = await splitImageInHalf(expandedImageDataURL);
  // const leftHalfNoBGURL = await removeBackgroundFromImage(leftHalf);
  // const leftHalfNoBG = await getImageDataURL(leftHalfNoBGURL);

  doc.addPage();
  doc.addImage(leftHalf, "PNG", 0, 0, pageWidth, pageHeight);
  doc.addPage();
  doc.addImage(rightHalf, "JPEG", 0, 0, pageWidth, pageHeight);

  const rightImg = await loadBase64Image(rightHalf);

  const textColor = pickContrastingTextColor(rightImg, 50, 300, 300, 300);
  // Place text top-leftish, 2 lines
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  if (textColor === "white") {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  const textLines = doc.splitTextToSize(contentPage.content, pageWidth - 1);
  doc.text(textLines, 0.5, pageHeight / 2);
}

export async function renderLayout1_type4(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
) {
  // const imageData = await getImageDataURL(contentPage.imageUrl);
  const expandedImageDataURL = await expandImageToLeft(contentPage.imageUrl);
  const { leftHalf, rightHalf } = await splitImageInHalf(expandedImageDataURL);
  // const leftHalfNoBGURL = await removeBackgroundFromImage(leftHalf);
  // const leftHalfNoBG = await getImageDataURL(leftHalfNoBGURL);

  doc.addPage();
  doc.addImage(leftHalf, "PNG", 0, 0, pageWidth, pageHeight);

  const leftImg = await loadBase64Image(leftHalf);

  const textColor = pickContrastingTextColor(leftImg, 50, 0, 300, 300);
  // Place text top-leftish, 2 lines
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  if (textColor === "white") {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  const textLines = doc.splitTextToSize(contentPage.content, pageWidth - 1);
  doc.text(textLines, 0.5, 0.5);
  doc.addPage();
  doc.addImage(rightHalf, "JPEG", 0, 0, pageWidth, pageHeight);
}
// ... layout3
export async function renderLayout3(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
  borderImage: string,
) {
  const { leftImage, rightImage } = await splitImageForSpreadFlexible(
    contentPage.imageUrl,
    3,
    pageWidth,
    pageHeight,
  );
  await renderSideBySideImageAndHalfText(
    doc,
    3,
    pageWidth,
    pageHeight,
    contentPage.content,
    leftImage,
    rightImage,
    contentPage.imageVariants,
    borderImage,
  );
}

// Layout4 (the snippet from your code)
export async function renderLayout4(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
  borderImage: string,
) {
  const marginX = 0.5;
  const imageWidth = pageWidth - 2 * marginX;
  const availableHeight = pageHeight - 2 * 0.4;
  const imageHeight = availableHeight * 0.7;
  const imageY = 1.0 + 0.3;
  const imageData = await clipImageToRoundedRectBuffer(contentPage.imageUrl);
  const img64 = imageData.toString("base64");

  doc.addPage();
  const fadedBorderImage = await fadeBottomBorderImage(borderImage);
  doc.addImage(fadedBorderImage, "JPEG", 0, pageHeight - 0.6, pageWidth, 0.6);
  // const fadedSideImage = await fadeSideBordersWithStripes(
  //   `data:image/jpeg;base64,${img64}`,
  // );
  doc.addImage(
    `data:image/jpeg;base64,${img64}`,
    "JPEG",
    marginX,
    imageY,
    imageWidth,
    imageHeight,
  );
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  const lines = doc.splitTextToSize(contentPage.content, 4);
  const imageVariants = contentPage.imageVariants;
  const simpleMode = !imageVariants;

  if (simpleMode) {
    // Original approach: text is fully centered
    doc.text(lines.slice(0, 1), 0.5, 1.0);
    doc.text(lines.slice(1, 2), 1.5, imageY + imageHeight + 0.3);
  } else {
    doc.text(lines.slice(0, 1), 0.5, 0.5);
    const remainingText = lines.slice(1).join(" ");

    const currentY =
      imageY + imageHeight + 0.2 + 0.25 * lines.slice(0, 1).length + 0.1;
    const height = pageHeight - currentY - 0.3;
    const narrowMaxWidth = pageWidth - height - marginX - 0.2;
    const narrowLines = doc.splitTextToSize(remainingText, narrowMaxWidth);

    if (imageVariants?.wide) {
      doc.addImage(imageVariants.wide, "JPEG", 0.3, currentY, height, height);
      doc.text(
        narrowLines.slice(0, 3),
        0.3 + height + 0.1,
        currentY + height / 2,
        {
          maxWidth: narrowMaxWidth,
        },
      );
    }
  }
}

// Layout5
export async function renderLayout5(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
  borderImage: string,
) {
  const imageData = await clipImageToCircleBuffer(contentPage.imageUrl);
  const img64 = imageData.toString("base64");
  doc.addPage();

  const fadedBorderImage = await fadeBottomBorderImage(borderImage);
  const mirroredBorderImage = await mirrorImage(fadedBorderImage);
  doc.addImage(
    mirroredBorderImage,
    "JPEG",
    0,
    pageHeight - 0.6,
    pageWidth,
    0.6,
  );
  doc.addImage(
    `data:image/jpeg;base64,${img64}`,
    "JPEG",
    1.5,
    0.5,
    pageHeight / 2 + 1,
    pageHeight / 2 + 1,
  );
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  const lines = doc.splitTextToSize(contentPage.content, 5);
  doc.text(lines[0], 0.75, 1.0 + 0.3 + (pageHeight - 2 * 0.4) * 0.7 + 0.3);
}

export async function renderLayout6(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  contentPage: Page,
) {
  const { leftImage, rightImage } = await splitImageForSpreadFlexible(
    contentPage.imageUrl,
    6,
    pageWidth,
    pageHeight,
  );

  const rightImg = await loadBase64Image(rightImage);

  // 2) Page 1: draw the left half. Then place text top-left across 2 lines
  doc.addPage();
  doc.addImage(leftImage, "JPEG", 0, 0, pageWidth, pageHeight);

  // 3) Page 2: draw the right half
  doc.addPage();
  doc.addImage(rightImage, "JPEG", 0, 0, pageWidth, pageHeight);

  const textColor = pickContrastingTextColor(rightImg, 50, 100, 100, 100);
  // Place text top-leftish, 2 lines
  doc.setFont("nunito", "normal");
  doc.setFontSize(14);
  if (textColor === "white") {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(0, 0, 0);
  }

  const maxLines = 2;

  // Start with a large width and shrink until it fits in 2 lines
  let minWidth = 3; // start wide
  let textLines = doc.splitTextToSize(contentPage.content, minWidth);
  // console.log("Mazvalues", pageWidth - 1, maxLines);
  // console.log("Text lines", textLines.length);

  while (textLines.length > maxLines && minWidth < pageWidth - 1) {
    // console.log("Resizing width and lines", minWidth, textLines.length);
    minWidth += 0.1;
    textLines = doc.splitTextToSize(contentPage.content, minWidth);
  }

  // Final render
  doc.text(textLines.slice(0, 2), 0.5, 1.0);
}

// A small helper to load a base64 into a node-canvas Image
export async function loadBase64Image(base64Data: string): Promise<Image> {
  // If 'base64Data' starts with 'data:image/jpeg;base64,...'
  // we can do something like:
  const [, raw] = base64Data.split(",");
  const buffer = Buffer.from(raw, "base64");
  const img = new Image();
  img.src = buffer;
  return img;
}
