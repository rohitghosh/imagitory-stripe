import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookPreview } from "@/components/preview/BookPreview";
import { generatePDF } from "@/utils/pdf";
import { apiRequest } from "@/lib/queryClient";
import { ShippingForm } from "@/components/preview/ShippingForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function BookDetailPage() {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();

  // Fetch the book data by id
  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`book-${id}`],
    queryFn: async () => {
      console.log(id, "book-detail-page");
      const res = await fetch("/api/books/" + id);
      console.log(res, "book-detail-page");
      if (!res.ok) throw new Error("Book not found");
      return res.json();
    },
  });

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const { toast } = useToast();

  // Handler for downloading the PDF (mirroring handleDownloadPDF from CreateStoryPage)
  const handleDownloadPDF = async () => {
    if (!book) return;
    try {
      // Call your PDF generation endpoint instead of directly calling generatePDF.
      // Ensure your endpoint (e.g. /api/generatePDF) uses your generatePDF utility and sends the PDF data.
      const response = await fetch("/api/PDF/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: book.title, pages: book.pages }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Read the response as a Blob.
      const blob = await response.blob();

      // Create a temporary URL for the Blob and trigger the download.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${book.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Download Error",
        description: "Failed to generate PDF.",
        variant: "destructive",
      });
    }
  };

  // Handler to trigger the shipping form (for placing an order)
  const handlePrint = () => {
    setShowShippingForm(true);
  };

  // Handler for shipping form submission
  const handleShippingSubmit = async (formData: any) => {
    try {
      if (user) {
        await apiRequest("POST", "/api/orders", {
          ...formData,
          bookId: id,
          characterId: book.characterId,
          storyId: book.storyId,
          userId: user.uid,
        });
        setOrderCompleted(true);
        setShowShippingForm(false);
        toast({
          title: "Order placed successfully!",
          description: "Your book will be delivered soon.",
        });
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast({
        title: "Order failed",
        description:
          "There was a problem placing your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Book not found</div>;

  // Prepare pages for BookPreview (assumes each page has imageUrl and content)
  const pages = book.pages.map((page: any, index: number) => ({
    id: index + 1,
    imageUrl: page.imageUrl || page,
    content: page.content || "",
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BookPreview
            bookTitle={book.title}
            pages={pages}
            onDownload={handleDownloadPDF}
            onPrint={handlePrint}
            onUpdatePage={() => {}}
            onRegenerate={() => {}}
            onResetAll={() => {}}
            onRegenerateAll={() => {}}
          />
          {showShippingForm && !orderCompleted && (
            <ShippingForm onSubmit={handleShippingSubmit} />
          )}
          {orderCompleted && (
            <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
              <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
              <span>
                Order successfully placed! Your book will be delivered soon.
              </span>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
