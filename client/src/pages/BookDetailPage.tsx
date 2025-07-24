import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookPreview } from "@/components/preview/BookPreview";
import { useBookEditor } from "@/hooks/useBookEditor";
import { apiRequest } from "@/lib/queryClient";
import { ShippingForm } from "@/components/preview/ShippingForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CustomerSupportButton } from "@/components/CustomerSupportButton";
import { ChatDrawer } from "@/components/ChatDrawer";
import { CustomerSupportChat } from "@/components/CustomerSupportChat";
import { auth } from "@/lib/firebase"; // For getting userId
// Define an interface for the pages stored in the book (raw data)

function transformBookPages(book: any) {
  const middlePages = book.pages.map((p: any, index: number) => ({
    id: index + 2, // start from 2 to leave slot #1 for the cover
    imageUrl: p.scene_url || "", // fallback if missing
    content: Array.isArray(p.scene_text)
      ? p.scene_text.join("\n")
      : (p.scene_text ?? ""),
    sceneInputs: p.scene_inputs ?? p.content ?? "",
    isCover: false,
    sceneResponseId: p.scene_response_id,
  }));

  const pages = [];

  // Cover page
  if (book.cover.final_cover_url) {
    pages.push({
      id: 1,
      imageUrl: book.cover.final_cover_url,
      content: book.title,
      coverInputs: book.cover, // e.g. display the book title
      isCover: true,
      coverResponseId: book.cover.base_cover_response_id,
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

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  // ADD new state for chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0); // For resetting chat if needed
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const initialPages = useMemo(
    () => (book ? transformBookPages(book) : []),
    [book],
  );

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

  const {
    data: storyData,
    isLoading: loadingStory,
    error: storyError,
  } = useQuery({
    queryKey: ["story", book?.storyId],
    queryFn: async () => {
      console.log("Fetching story for id:", book?.storyId);
      const res = await fetch(`/api/stories/${book.storyId}`, {
        credentials: "include",
      });
      console.log("Story fetch response:", res);
      if (!res.ok) {
        throw new Error("Story not found");
      }
      return res.json();
    },
    enabled: !!book?.storyId, // only run if storyId exists
  });

  const {
    pages,
    isDirty,
    avatarUrl,
    avatarLora,
    avatarRegenerating,
    avatarFinalized,
    finalizeAvatar,
    updatePage: handleUpdatePage,
    regeneratePage: handleRegenerate,
    regenerateAll: handleRegenerateAll,
    regenerateAvatar,
    saveBook: handleSaveBook,
  } = useBookEditor({
    bookId: id,
    title: book?.title,
    stylePreference: book?.stylePreference,
    characterId: book?.characterId,
    storyId: book?.storyId,
    initialPages,
    characterData,
    initialAvatarLora: book?.avatarLora,
    initialAvatarUrl: book?.avatarUrl,
    avatarFinalizedInitial: book?.avatarFinalized ?? false,
  });

  const warnAndRegenAvatar = async (mode: "cartoon" | "hyper") => {
    if (
      window.confirm(
        "Heads up: once you lock in this avatar, we’ll regenerate *all* story images to match it. " +
          "This can take a minute. Continue?",
      )
    ) {
      await regenerateAvatar(mode);
    }
  };

  // Handler for downloading the PDF (mirroring handleDownloadPDF from CreateStoryPage)
  const handleDownloadPDF = async () => {
    if (!book) return;
    try {
      console.log("Generating PDF for book:", id);
      setLocation(`/edit-pdf/${id}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
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

  // ADD handler for layout changes when drawer opens
  const handleLayoutChange = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
  };

  // ADD handler for image updates from chat
  const handleImageUpdate = () => {
    // Trigger a refresh of book data
    // This depends on how you're fetching book data
    // You might need to refetch or update local state
    setChatKey((prev) => prev + 1); // Simple way to force refresh
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Book not found</div>;
  const disableRegeneration = loadingCharacter || characterError;
  const disableDownload = loadingStory || storyError;

  console.log(
    "loadingCharacter:",
    loadingCharacter,
    "characterError:",
    characterError,
    "avatarUrl:",
    avatarUrl,
  );

  console.log("loadingStory:", loadingStory, "storyError:", storyError);

  // return (
  //   <div className="min-h-screen flex flex-col">
  //     <Header />
  //     <main className="flex-grow">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  //         {avatarUrl && (
  //           <div
  //             className={`flex flex-col items-center mb-8 transition-all duration-300
  //             ${avatarFinalized ? "lg:flex-row lg:gap-6 mb-4" : ""}`}
  //           >
  //             <div className="relative w-32 h-32">
  //               <img
  //                 src={avatarUrl}
  //                 alt="Story avatar"
  //                 className={`rounded-full shadow-lg object-cover transition-all duration-300
  //                 ${avatarFinalized ? "w-16 h-16" : "w-32 h-32"}`}
  //               />

  //               {avatarRegenerating && (
  //                 <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-full">
  //                   <i className="fas fa-spinner fa-spin text-gray-600 text-3xl" />
  //                 </div>
  //               )}
  //             </div>

  //             {/* 4) Action buttons below */}
  //             {!avatarFinalized ? (
  //               <>
  //                 <div className="mt-3 flex gap-2">
  //                   <Button
  //                     size="sm"
  //                     onClick={() => warnAndRegenAvatar("cartoon")}
  //                     disabled={avatarRegenerating}
  //                   >
  //                     More Cartoonish
  //                   </Button>
  //                   <Button
  //                     size="sm"
  //                     variant="outline"
  //                     onClick={() => warnAndRegenAvatar("hyper")}
  //                     disabled={avatarRegenerating}
  //                   >
  //                     More Realistic
  //                   </Button>
  //                 </div>

  //                 {/* Primary call-to-action */}
  //                 <Button
  //                   className="mt-4"
  //                   disabled={avatarRegenerating}
  //                   onClick={finalizeAvatar}
  //                 >
  //                   Looks good → Start editing pages
  //                 </Button>
  //               </>
  //             ) : (
  //               /* After finalize – just show small label */
  //               <span className="mt-2 text-sm text-gray-500">
  //                 Avatar locked in ✓
  //               </span>
  //             )}

  //             {/* 5) LORA scale label */}
  //           </div>
  //         )}

  //         <BookPreview
  //           bookTitle={pages.find((p) => p.isCover)?.content || book.title}
  //           pages={pages}
  //           onDownload={disableDownload ? () => {} : handleDownloadPDF}
  //           onPrint={handlePrint}
  //           onUpdatePage={handleUpdatePage}
  //           onRegenerate={disableRegeneration ? () => {} : handleRegenerate}
  //           onRegenerateAll={
  //             disableRegeneration ? () => {} : handleRegenerateAll
  //           }
  //           onSave={handleSaveBook}
  //           isDirty={isDirty}
  //           avatarFinalized={avatarFinalized}
  //         />
  //         {showShippingForm && !orderCompleted && (
  //           <ShippingForm onSubmit={handleShippingSubmit} />
  //         )}
  //         {orderCompleted && (
  //           <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
  //             <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
  //             <span>
  //               Order successfully placed! Your book will be delivered soon.
  //             </span>
  //           </div>
  //         )}
  //       </div>
  //     </main>
  //     <Footer />
  //   </div>
  // );
  return (
    <div
      className={`min-h-screen flex flex-col relative transition-all duration-300 ${
        isDrawerOpen ? "md:mr-[400px]" : ""
      }`}
    >
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BookPreview
            bookTitle={pages.find((p) => p.isCover)?.content || book.title}
            pages={pages}
            onDownload={disableDownload ? () => {} : handleDownloadPDF}
            onPrint={handlePrint}
            onUpdatePage={handleUpdatePage}
            onRegenerate={disableRegeneration ? () => {} : handleRegenerate}
            onRegenerateAll={
              disableRegeneration ? () => {} : handleRegenerateAll
            }
            onSave={handleSaveBook}
            isDirty={isDirty}
            avatarFinalized={avatarFinalized}
          />
        </div>
      </main>
      <Footer />

      {/* ADD: Customer Support Button - Only show when book exists */}
      {book && <CustomerSupportButton onClick={() => setIsChatOpen(true)} />}

      {/* ADD: Chat Drawer */}
      {book && user && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onLayoutChange={handleLayoutChange}
        >
          <CustomerSupportChat
            key={chatKey}
            bookId={id!}
            bookData={book}
            userId={user.uid}
            onImageUpdate={handleImageUpdate}
          />
        </ChatDrawer>
      )}
    </div>
  );
}
