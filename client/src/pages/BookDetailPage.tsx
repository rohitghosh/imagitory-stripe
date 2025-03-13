import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookPreview } from "@/components/preview/BookPreview";
import { generatePDF } from "@/utils/pdf";
import { apiRequest } from "@/lib/queryClient";
import { ShippingForm } from "@/components/preview/ShippingForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Define an interface for the pages stored in the book (raw data)

function transformBookPages(book: any) {
  // If your backend returns coverUrl/backCoverUrl, do something like this:
  const middlePages = book.pages.map((p: any, index: number) => ({
    id: index + 2, // start from 2 to leave slot #1 for the cover
    imageUrl: p.imageUrl || "", // fallback if missing
    content: p.content || "",
  }));

  const pages = [];

  // Cover page
  if (book.coverUrl) {
    pages.push({
      id: 1,
      imageUrl: book.coverUrl,
      content: book.title, // e.g. display the book title
      isCover: true,
    });
  }

  // Middle pages
  pages.push(...middlePages);

  // Back cover page
  if (book.backCoverUrl) {
    pages.push({
      id: pages.length + 1,
      imageUrl: book.backCoverUrl,
      content: "",
      isBackCover: true,
    });
  }

  return pages;
}

export default function BookDetailPage() {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();

  // Fetch the book data by id
  const [pages, setPages] = useState<any[]>([]);
  const [bookTitle, setBookTitle] = useState("");
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`book-${id}`],
    queryFn: async () => {
      const res = await fetch("/api/books/" + id);
      if (!res.ok) throw new Error("Book not found");
      return res.json();
    },
  });

  const {
    data: characterData,
    isLoading: loadingCharacter,
    error: characterError,
  } = useQuery({
    queryKey: ["character", book?.characterId],
    queryFn: async () => {
      console.log("Fetching character for id:", book?.characterId);
      const res = await fetch(`/api/characters/${book.characterId}`, {
        credentials: "include",
      });
      console.log("Character fetch response:", res);
      if (!res.ok) {
        throw new Error("Character not found");
      }
      return res.json();
    },
    enabled: !!book?.characterId, // only run if characterId exists
  });

  // (4) Once the book is fetched, transform its pages and set local state
  useEffect(() => {
    if (book) {
      console.log(book);
      console.log(characterData);
      const transformedPages = transformBookPages(book);
      setPages(transformedPages);
      setBookTitle(book.title);
    }
  }, [book]);

  const handleUpdatePage = async (pageId: number, content: string) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === pageId ? { ...page, content } : page,
      ),
    );
    setIsDirty(true); // if using a flag for unsaved changes
  };

  async function handleRegenerate(pageId: number) {
    const page = pages.find((p) => p.id === pageId);
    console.log(page);
    if (!page) return;

    const effectiveModelId = characterData?.modelId || "defaultModelId";

    let payload = { modelId: effectiveModelId, prompt: "", isCover: false };

    if (page.isCover || page.isBackCover) {
      const currentTitle = pages[0]?.content || bookTitle;
      payload.prompt = page.isCover
        ? `<kidStyle> A captivating cover photo for the showing the title: ${currentTitle} It should clearly display the text ${currentTitle} on top of the photo in a bold and colourful font. It should also include a photo of the character ${characterData.name}`
        : `<kidStyle> A creative back cover image for the book`;
      payload.isCover = true; // reuse flag to indicate special pages
    } else {
      payload.prompt = page.content;
    }

    try {
      const response = await fetch("/api/regenerateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const newUrl = data.newUrl;
      // Update the page image
      setPages((prevPages) =>
        prevPages.map((p) =>
          p.id === pageId ? { ...p, imageUrl: newUrl } : p,
        ),
      );
      setIsDirty(true);
    } catch (error) {
      console.error("Regeneration error:", error);
      toast({
        title: "Regeneration Error",
        description: `Failed to regenerate image for page ${pageId}.`,
        variant: "destructive",
      });
    }
  }
  async function handleRegenerateAll() {
    try {
      await Promise.all(pages.map((page) => handleRegenerate(page.id)));
      toast({
        title: "Regeneration complete",
        description: "All pages have been regenerated.",
      });
    } catch (error) {
      toast({
        title: "Regeneration Error",
        description: "Failed to regenerate one or more pages.",
        variant: "destructive",
      });
    }
  }

  async function handleSaveBook() {
    const effectiveBookId = id;
    if (!effectiveBookId) {
      toast({
        title: "Save Error",
        description: "Book ID not available.",
        variant: "destructive",
      });
      return;
    }

    const pagesToSave = pages.filter((p) => !p.isCover && !p.isBackCover);

    try {
      setLoading(true);
      const updatedBook = {
        title: bookTitle,
        pages: pagesToSave, // full pages array including cover and back cover
        coverUrl: pages.find((p) => p.isCover)?.imageUrl || null,
        backCoverUrl: pages.find((p) => p.isBackCover)?.imageUrl || null,
        characterId: book.characterId,
        storyId: book.storyId,
      };
      const savedBook = await apiRequest(
        "PUT",
        `/api/books/${effectiveBookId}`,
        updatedBook,
      );
      setIsDirty(false);
      toast({
        title: "Save Successful",
        description: "Your book has been updated.",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Error",
        description: "Failed to update book.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Handler for downloading the PDF (mirroring handleDownloadPDF from CreateStoryPage)
  const handleDownloadPDF = async () => {
    if (!book) return;
    try {
      // Call your PDF generation endpoint instead of directly calling generatePDF.
      // Ensure your endpoint (e.g. /api/generatePDF) uses your generatePDF utility and sends the PDF data.
      const response = await fetch("/api/PDF/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.title,
          pages: pages,
          coverUrl: pages.find((p) => p.isCover)?.imageUrl || null,
          backCoverUrl: pages.find((p) => p.isBackCover)?.imageUrl || null,
        }),
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
  const disableRegeneration = loadingCharacter || characterError;

  // Prepare pages for BookPreview (assumes each page has imageUrl and content)
  // const pages = book.pages.map((page: any, index: number) => ({
  //   id: index + 1,
  //   imageUrl: page.imageUrl || page,
  //   content: page.content || "",
  // }));

  console.log(
    "loadingCharacter:",
    loadingCharacter,
    "characterError:",
    characterError,
  );

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
            onUpdatePage={handleUpdatePage}
            onRegenerate={disableRegeneration ? () => {} : handleRegenerate}
            onRegenerateAll={
              disableRegeneration ? () => {} : handleRegenerateAll
            }
            onSave={handleSaveBook}
            isDirty={isDirty}
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
