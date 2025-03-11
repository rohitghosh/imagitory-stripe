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

export async function generatePDF(
  title: string,
  pages: Page[],
): Promise<Buffer> {
  try {
    // Create a new jsPDF instance (A4 paper in millimeters)
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imageHeight = pageHeight * 0.6; // 60% of page height for the image
    const textY = imageHeight + 10; // text starts 10mm below the image

    // Optional: add a cover page with the title
    doc.setFontSize(22);
    doc.text(title, pageWidth / 2, pageHeight / 2, { align: "center" });

    // If you have content pages, start by adding a new page.
    if (pages.length > 0) {
      doc.addPage();
    }

    // Loop through each page in your book
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      // For subsequent pages, add a new page
      if (i > 0) {
        doc.addPage();
      }

      // Convert the remote image URL into a base64 data URL using Buffer.
      const imageData = await getImageDataURL(page.imageUrl);

      // Add the image at the top of the page (covering 60% of the page)
      doc.addImage(imageData, "JPEG", 0, 0, pageWidth, imageHeight);

      // Add the text below the image
      doc.setFontSize(12);
      const textLines = doc.splitTextToSize(page.content, pageWidth - 20); // 10mm margins on each side
      doc.text(textLines, 10, textY);
    }

    // Output the PDF as an ArrayBuffer, then convert to a Buffer.
    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
