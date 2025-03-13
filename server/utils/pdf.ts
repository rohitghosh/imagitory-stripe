import { jsPDF } from "jspdf";

interface Page {
  id: number;
  imageUrl: string;
  content: string;
}

// Helper: fetch the image from a URL and convert it to a base64 data URL using Buffer
async function getImageDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  // Adjust the MIME type if needed (e.g. "image/png")
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Generates a PDF with:
 *  - A cover page: uses coverPhoto if provided, else the first page's image, with title text on top.
 *  - A blank second page.
 *  - Content pages with a thick black boundary and a yellow text area.
 */
export async function generatePDF(
  title: string,
  pages: Page[],
  coverUrl?: string,
  backCoverUrl?: string,
): Promise<Buffer> {
  try {
    // Create a new jsPDF instance (A4 paper in millimeters)
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Determine cover image: use coverPhoto if available, else fallback to first page's image.
    let coverImageUrl = coverUrl;
    let backCoverImageUrl = backCoverUrl;

    console.log(coverImageUrl, backCoverImageUrl);
    console.log(pages.length);
    console.log(pages);

    let contentStartIndex = 1;
    if (!coverImageUrl && pages.length > 0) {
      coverImageUrl = pages[0].imageUrl;
      backCoverImageUrl = pages[0].imageUrl;
      // If we are reusing the first page's image for the cover, start content from the next page.
      contentStartIndex = 1;
    }

    // --- Cover Page ---
    if (coverImageUrl) {
      const coverImageData = await getImageDataURL(coverImageUrl);
      // Use the cover image to fill the whole page.
      doc.addImage(coverImageData, "JPEG", 0, 0, pageWidth, pageHeight);
    }

    // We'll parse the title, looking for " and " so we can split it into two parts.
    //   const parseTitle = (originalTitle: string) => {
    //   // If you expect the word "and" in your title:
    //   const lowerTitle = originalTitle.toLowerCase();
    //   const idx = lowerTitle.indexOf(" and ");
    //   if (idx !== -1) {
    //     // Split into two parts around "and"
    //     const firstPart = originalTitle.slice(0, idx).trim();
    //     // everything after 'and'
    //     const secondPart = originalTitle.slice(idx + 4).trim();
    //     // e.g. "Ridhaan" and "His Shiny Ball"
    //     return { firstPart, secondPart };
    //   } else {
    //     // If no "and" is found, just return the entire title as the first part
    //     // and leave second part empty
    //     return { firstPart: originalTitle, secondPart: "" };
    //   }
    // }

    // const { firstPart, secondPart } = parseTitle(title);

    // // We'll place the first line big and centered,
    // // and the second line as “& secondPart” with the ampersand smaller.

    // //
    // // LINE 1: The "firstPart" in bigger font
    // //
    // doc.setFont("helvetica", "bold");
    // doc.setFontSize(50);
    // doc.setTextColor(255, 255, 255);
    // const line1Y = 40; // vertical position for first line
    // doc.text(firstPart, pageWidth / 2, line1Y, { align: "center" });

    // //
    // // LINE 2: smaller '&', then bigger secondPart
    // //   e.g. "& His Shiny Ball"
    // //
    // if (secondPart) {
    //   // Because we want a smaller ampersand and a bigger secondPart,
    //   // we need two text calls at different X positions.
    //   // We'll measure widths to center them together as a single line.

    //   const line2Y = 60; // vertical position for second line

    //   // 1) Measure the width of '&' in a smaller font
    //   doc.setFontSize(25);
    //   const ampWidth = doc.getTextWidth("&");

    //   // 2) Measure the width of the secondPart in bigger font
    //   doc.setFontSize(50);
    //   const secondWidth = doc.getTextWidth(" " + secondPart);

    //   // 3) The total width is the sum of both
    //   const totalWidth = ampWidth + secondWidth;

    //   // 4) We want them centered, so compute a startX
    //   const startX = (pageWidth - totalWidth) / 2;

    //   // Draw the smaller ampersand
    //   doc.setFontSize(25);
    //   doc.text("&", startX, line2Y);

    //   // Draw the bigger secondPart
    //   doc.setFontSize(50);
    //   doc.text(" " + secondPart, startX + ampWidth, line2Y);
    // } else {
    //   // If there's no "and" found, just place the entire title as one line or
    //   // do something else as fallback:
    //   // (We already drew the 'firstPart' above. If secondPart is empty,
    //   //  that means the entire title had no "and". So you may want to do nothing.)
    // }

    // --- Blank Second Page ---
    doc.addPage();
    // (Leave it completely blank.)

    // --- Content Pages with Border and Styled Text ---
    for (let i = contentStartIndex; i < pages.length - 1; i++) {
      const page = pages[i];
      doc.addPage();

      // Draw a thick black boundary with margin.
      const margin = 10; // outer margin
      doc.setLineWidth(2);
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

      // Define inner padding within the boundary.
      const padding = 4;
      const innerX = margin + padding;
      const innerY = margin + padding;
      const innerWidth = pageWidth - 2 * (margin + padding);
      // Allocate 60% of the inner height for the image.
      const imageAreaHeight = (pageHeight - 2 * (margin + padding)) * 0.75;

      // Fetch and add the image within the inner area.
      const imageData = await getImageDataURL(page.imageUrl);
      doc.addImage(
        imageData,
        "JPEG",
        innerX,
        innerY,
        innerWidth,
        imageAreaHeight,
      );

      // Prepare the text area below the image.
      const textAreaY = innerY + imageAreaHeight + 5; // 5mm gap after the image
      const textAreaHeight = pageHeight - (textAreaY + margin + padding);

      // Draw a filled rectangle with a light yellow background for the text.
      doc.setFillColor(255, 255, 153); // light yellow
      doc.rect(innerX, textAreaY, innerWidth, textAreaHeight, "F");

      // Set text style: sans-serif with a font size of 24.
      doc.setFont("helvetica", "normal");
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      // Wrap the text within the text area width.
      const textLines = doc.splitTextToSize(page.content, innerWidth - 4);
      // Place the text with a small left offset.
      doc.text(textLines, innerX + 2, textAreaY + 8);
    }
    // --- Cover Page ---
    if (backCoverImageUrl) {
      const backcoverImageData = await getImageDataURL(backCoverImageUrl);
      doc.addPage();
      // Use the cover image to fill the whole page.
      doc.addImage(
        backcoverImageData,
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight * 0.8,
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      const backCoverTitle_1 = "Want to create your own book?";
      // Position the title at the top center (20mm from top)
      doc.text(backCoverTitle_1, pageWidth / 2, pageHeight * 0.9, {
        align: "center",
      });
      const backCoverTitle_2 = "Write to us at help@storypals.com";
      // Position the title at the top center (20mm from top)
      doc.text(backCoverTitle_2, pageWidth / 2, pageHeight * 0.9 + 10, {
        align: "center",
      });
    }
    // Output the PDF as an ArrayBuffer, then convert to a Buffer.
    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
