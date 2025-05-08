// pdf3.ts
import { jsPDF } from "jspdf";
import { registerCustomFonts } from "./fonts";
import {
  renderLayout1,
  renderLayout2,
  renderLayout3,
  renderLayout4,
  renderLayout5,
  renderLayout6,
  renderLayout1_type2,
  renderLayout1_type3,
  renderLayout1_type4,
} from "./layouts";
import { getImageDataURL } from "./imageUtils";
import { preparePageWithImages } from "./elementGeneration";
import { Image } from "canvas";

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

export async function generatePDF(
  title: string,
  pages: Page[],
  coverUrl: string,
  backCoverUrl: string,
  borderImages: string[],
): Promise<Buffer> {
  registerCustomFonts();
  const doc = new jsPDF({ unit: "in", format: [6, 6] });
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
  let i = 0;
  for (let i = 0; i < contentPages.length; i++) {
    const page = contentPages[i];
    const layoutIndex = i % 4;

    // if (!page.imageVariants) {
    //   await preparePageWithImages(page);
    // }
    // await renderLayout2(doc, pageWidth, pageHeight, page);

    switch (layoutIndex) {
      // case 0:
      //   if (!page.imageVariants) {
      //     await preparePageWithImages(page);
      //   }
      //   await renderLayout2(doc, pageWidth, pageHeight, page, borderImages[i]);
      //   break;

      // case 1:
      //   await renderLayout1(doc, pageWidth, pageHeight, page);
      //   break;

      // case 2:
      //   await renderLayout6(doc, pageWidth, pageHeight, page);
      //   break;

      // case 3:
      //   if (!page.imageVariants) {
      //     await preparePageWithImages(page);
      //   }
      //   await renderLayout3(doc, pageWidth, pageHeight, page, borderImages[i]);
      //   break;

      // case 4:
      //   // if (!page.imageVariants) {
      //   //   await preparePageWithImages(page);
      //   // }
      //   await renderLayout4(doc, pageWidth, pageHeight, page, borderImages[i]);
      //   break;

      // case 5:
      //   await renderLayout5(
      //     doc,
      //     pageWidth,
      //     pageHeight,
      //     page,
      //     borderImages[i - 1],
      //   );
      //   break;

      // case 6:
      //   await renderLayout6(doc, pageWidth, pageHeight, page);
      //   break;

      // case 7:
      //   if (!page.imageVariants) {
      //     await preparePageWithImages(page);
      //   }
      //   await renderLayout2(doc, pageWidth, pageHeight, page, borderImages[i]);
      //   break;

      // case 8:
      //   if (!page.imageVariants) {
      //     await preparePageWithImages(page);
      //   }
      //   await renderLayout3(doc, pageWidth, pageHeight, page, borderImages[i]);
      //   break;
      case 0:
        await renderLayout1(doc, pageWidth, pageHeight, page);
        break;

      case 1:
        await renderLayout1_type2(doc, pageWidth, pageHeight, page);
        break;

      case 2:
        await renderLayout1_type4(doc, pageWidth, pageHeight, page);
        break;

      case 3:
        await renderLayout1_type3(doc, pageWidth, pageHeight, page);
        break;
    }
  }

  if (doc.getNumberOfPages() % 2 === 0) {
    doc.addPage();
  }

  if (backCoverUrl) {
    const backImage = await getImageDataURL(backCoverUrl);
    console.log("adding back cover image");
    doc.addPage();
    doc.addImage(backImage, "JPEG", 0, 0, pageWidth, pageHeight);
    console.log("added back cover image");
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
  console.log("returning PDF");
  return Buffer.from(doc.output("arraybuffer"));
}
