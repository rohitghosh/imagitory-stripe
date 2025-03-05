import { apiRequest } from "@/lib/queryClient";

interface Page {
  id: number;
  imageUrl: string;
  content: string;
}

export async function generatePDF(title: string, pages: Page[]): Promise<void> {
  try {
    // Call the backend API to generate the PDF
    const response = await apiRequest('POST', '/api/pdf/generate', {
      title,
      pages
    });
    
    // Get the PDF blob from the response
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.pdf`;
    
    // Append the link to the body
    document.body.appendChild(link);
    
    // Click the link to download the file
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
