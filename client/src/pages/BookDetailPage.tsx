// import { useParams, useLocation } from "wouter";
// import { useQuery } from "@tanstack/react-query";
// import { useState, useMemo } from "react";
// import { Header } from "@/components/Header";
// import { Footer } from "@/components/Footer";
// import { BookPreview } from "@/components/preview/BookPreview";
// import { useBookEditor } from "@/hooks/useBookEditor";
// import { apiRequest } from "@/lib/queryClient";
// import { ShippingForm } from "@/components/preview/ShippingForm";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Spinner } from "@/components/ui/spinner";
// import { CustomerSupportButton } from "@/components/CustomerSupportButton";
// import { ChatDrawer } from "@/components/ChatDrawer";
// import { CustomerSupportChat } from "@/components/CustomerSupportChat";
// import { auth } from "@/lib/firebase"; // For getting userId
// import { useQueryClient } from "@tanstack/react-query";
// // Define an interface for the pages stored in the book (raw data)

// function transformBookPages(book: any) {
//   /* ────────── overall start ────────── */
//   console.log(
//     `transformBookPages start rawPages ${Array.isArray(book.pages) ? book.pages.length : 0}`,
//   );

//   /* ────────── middle pages ────────── */
//   const middlePages = (book.pages || []).map((p: any, index: number) => {
//     const currentIndex = p.current_scene_index || 0;
//     const imageUrls = Array.isArray(p.imageUrls)
//       ? p.imageUrls
//       : [p.imageUrl || p.scene_url || ""];
//     const responseIds = Array.isArray(p.scene_response_ids)
//       ? p.scene_response_ids
//       : [p.sceneResponseId || p.scene_response_id];

//     console.log(
//       `midPage idx ${index} imagesLen ${imageUrls.length} currIdx ${currentIndex} responsesLen ${responseIds.length}`,
//     );

//     return {
//       id: index + 2,
//       imageUrl: imageUrls[currentIndex] || imageUrls[0] || "",
//       imageUrls,
//       currentImageIndex: currentIndex,
//       content: Array.isArray(p.content)
//         ? p.content.join("\n")
//         : (p.content ?? ""),
//       sceneInputs: p.scene_inputs ?? p.content ?? "",
//       isCover: false,
//       sceneNumber: p.scene_number,
//       sceneResponseId: responseIds[currentIndex] || responseIds[0],
//       sceneResponseIds: responseIds,
//     };
//   });

//   const pages: any[] = [];

//   /* ────────── cover page ────────── */
//   if (book.cover) {
//     const currentCoverIndex = book.cover.current_final_cover_index || 0;
//     const finalCoverUrls = Array.isArray(book.cover.final_cover_urls)
//       ? book.cover.final_cover_urls
//       : [book.cover.final_cover_url];
//     const baseCoverResponseIds = Array.isArray(
//       book.cover.base_cover_response_ids,
//     )
//       ? book.cover.base_cover_response_ids
//       : [book.cover.base_cover_response_id];

//     console.log(
//       `cover imagesLen ${finalCoverUrls.length} currCoverIdx ${currentCoverIndex}`,
//     );

//     pages.push({
//       id: 1,
//       imageUrl: finalCoverUrls[currentCoverIndex] || finalCoverUrls[0] || "",
//       imageUrls: finalCoverUrls,
//       currentImageIndex: currentCoverIndex,
//       content: book.title,
//       coverInputs: book.cover,
//       isCover: true,
//       coverResponseId:
//         baseCoverResponseIds[currentCoverIndex] || baseCoverResponseIds[0],
//       coverResponseIds: baseCoverResponseIds,
//     });
//   } else {
//     console.log(`noCover present false`);
//   }

//   /* ────────── middle pages push ────────── */
//   pages.push(...middlePages);
//   console.log(`middlePages added count ${middlePages.length}`);

//   /* ────────── back cover ────────── */
//   if (book.backCoverUrl) {
//     pages.push({
//       id: pages.length + 1,
//       imageUrl: book.backCoverUrl,
//       content: "",
//       isBackCover: true,
//     });
//     console.log(`backCover added id ${pages.length}`);
//   } else {
//     console.log(`noBackCover present false`);
//   }

//   /* ────────── finish ────────── */
//   console.log(`transformBookPages end totalPages ${pages.length}`);
//   return pages;
// }

// export default function BookDetailPage() {
//   const params = useParams();
//   const { id } = params;
//   const { user } = useAuth();

//   // Fetch the book data by id

//   const [showShippingForm, setShowShippingForm] = useState(false);
//   const [orderCompleted, setOrderCompleted] = useState(false);
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();
//   // ADD new state for chat
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [chatKey, setChatKey] = useState(0); // For resetting chat if needed
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const queryClient = useQueryClient();

//   const {
//     data: book,
//     isLoading,
//     error,
//   } = useQuery({
//     queryKey: [`book-${id}`],
//     queryFn: async () => {
//       const res = await fetch("/api/books/" + id);
//       if (!res.ok) throw new Error("Book not found");
//       return res.json();
//     },
//   });

//   const initialPages = useMemo(
//     () => (book ? transformBookPages(book) : []),
//     [book],
//   );

//   const {
//     data: characterData,
//     isLoading: loadingCharacter,
//     error: characterError,
//   } = useQuery({
//     queryKey: ["character", book?.characterId],
//     queryFn: async () => {
//       console.log("Fetching character for id:", book?.characterId);
//       const res = await fetch(`/api/characters/${book.characterId}`, {
//         credentials: "include",
//       });
//       console.log("Character fetch response:", res);
//       if (!res.ok) {
//         throw new Error("Character not found");
//       }
//       return res.json();
//     },
//     enabled: !!book?.characterId, // only run if characterId exists
//   });

//   const {
//     data: storyData,
//     isLoading: loadingStory,
//     error: storyError,
//   } = useQuery({
//     queryKey: ["story", book?.storyId],
//     queryFn: async () => {
//       console.log("Fetching story for id:", book?.storyId);
//       const res = await fetch(`/api/stories/${book.storyId}`, {
//         credentials: "include",
//       });
//       console.log("Story fetch response:", res);
//       if (!res.ok) {
//         throw new Error("Story not found");
//       }
//       return res.json();
//     },
//     enabled: !!book?.storyId, // only run if storyId exists
//   });

//   const {
//     pages,
//     isDirty,
//     avatarUrl,
//     avatarLora,
//     avatarRegenerating,
//     avatarFinalized,
//     finalizeAvatar,
//     updatePage: handleUpdatePage,
//     regeneratePage: handleRegenerate,
//     togglePageVersion: handleTogglePageVersion,
//     regenerateAll: handleRegenerateAll,
//     regenerateAvatar,
//     saveBook: handleSaveBook,
//   } = useBookEditor({
//     bookId: id,
//     title: book?.title,
//     stylePreference: book?.stylePreference,
//     characterId: book?.characterId,
//     storyId: book?.storyId,
//     initialPages,
//     characterData,
//     initialAvatarLora: book?.avatarLora,
//     initialAvatarUrl: book?.avatarUrl,
//     avatarFinalizedInitial: book?.avatarFinalized ?? false,
//   });

//   const warnAndRegenAvatar = async (mode: "cartoon" | "hyper") => {
//     if (
//       window.confirm(
//         "Heads up: once you lock in this avatar, we’ll regenerate *all* story images to match it. " +
//           "This can take a minute. Continue?",
//       )
//     ) {
//       await regenerateAvatar(mode);
//     }
//   };

//   // Handler for downloading the PDF (mirroring handleDownloadPDF from CreateStoryPage)
//   const handleDownloadPDF = async () => {
//     if (!book) return;
//     try {
//       console.log("Generating PDF for book:", id);
//       setLocation(`/edit-pdf/${id}`);
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//     }
//   };

//   // Handler to trigger the shipping form (for placing an order)
//   const handlePrint = () => {
//     setShowShippingForm(true);
//   };

//   // Handler for shipping form submission
//   const handleShippingSubmit = async (formData: any) => {
//     try {
//       if (user) {
//         await apiRequest("POST", "/api/orders", {
//           ...formData,
//           bookId: id,
//           characterId: book.characterId,
//           storyId: book.storyId,
//           userId: user.uid,
//         });
//         setOrderCompleted(true);
//         setShowShippingForm(false);
//         toast({
//           title: "Order placed successfully!",
//           description: "Your book will be delivered soon.",
//         });
//       }
//     } catch (error) {
//       console.error("Order submission error:", error);
//       toast({
//         title: "Order failed",
//         description:
//           "There was a problem placing your order. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   // ADD handler for layout changes when drawer opens
//   const handleLayoutChange = (isOpen: boolean) => {
//     setIsDrawerOpen(isOpen);
//   };

//   // ADD handler for image updates from chat
//   const handleImageUpdate = () => {
//     // Trigger a refresh of book data
//     // This depends on how you're fetching book data
//     // You might need to refetch or update local state
//     setChatKey((prev) => prev + 1); // Simple way to force refresh
//   };

//   // NEW: Handler for navigating to specific image in carousel
//   const handleNavigateToImage = (index: number) => {
//     // Use the global navigation callback set up in BookPreview
//     if ((window as any).navigateToImage) {
//       (window as any).navigateToImage(index);
//     }
//   };

//   // NEW: Handler for proceeding to PDF
//   const handleProceedToPdf = () => {
//     handleDownloadPDF();
//   };

//   if (isLoading) return <div>Loading...</div>;
//   if (error) return <div>Book not found</div>;
//   const disableRegeneration = loadingCharacter || characterError;
//   const disableDownload = loadingStory || storyError;

//   console.log("pages:", pages);

//   console.log("loadingStory:", loadingStory, "storyError:", storyError);

//   return (
//     <div
//       className={`min-h-screen flex flex-col relative transition-all duration-300 ${
//         isDrawerOpen ? "md:mr-[400px]" : ""
//       }`}
//     >
//       <Header />
//       <main className="flex-grow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {avatarUrl && (
//             <div
//               className={`flex flex-col items-center mb-8 transition-all duration-300
//               ${avatarFinalized ? "lg:flex-row lg:gap-6 mb-4" : ""}`}
//             >
//               <div className="relative w-32 h-32">
//                 <img
//                   src={avatarUrl}
//                   alt="Story avatar"
//                   className={`rounded-full shadow-lg object-cover transition-all duration-300
//                   ${avatarFinalized ? "w-16 h-16" : "w-32 h-32"}`}
//                 />

//                 {avatarRegenerating && (
//                   <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-full">
//                     <i className="fas fa-spinner fa-spin text-gray-600 text-3xl" />
//                   </div>
//                 )}
//               </div>

//               {/* Action buttons below */}
//               {!avatarFinalized ? (
//                 <>
//                   <div className="mt-3 flex gap-2">
//                     <Button
//                       size="sm"
//                       onClick={() => warnAndRegenAvatar("cartoon")}
//                       disabled={avatarRegenerating}
//                     >
//                       More Cartoonish
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => warnAndRegenAvatar("hyper")}
//                       disabled={avatarRegenerating}
//                     >
//                       More Realistic
//                     </Button>
//                   </div>

//                   {/* Primary call-to-action */}
//                   <Button
//                     className="mt-4"
//                     disabled={avatarRegenerating}
//                     onClick={finalizeAvatar}
//                   >
//                     Looks good → Start editing pages
//                   </Button>
//                 </>
//               ) : (
//                 /* After finalize – just show small label */
//                 <span className="mt-2 text-sm text-gray-500">
//                   Avatar locked in ✓
//                 </span>
//               )}
//             </div>
//           )}

//           <BookPreview
//             bookTitle={pages.find((p) => p.isCover)?.content || book.title}
//             pages={pages}
//             onDownload={disableDownload ? () => {} : handleDownloadPDF}
//             onPrint={handlePrint}
//             onUpdatePage={handleUpdatePage}
//             onRegenerate={disableRegeneration ? () => {} : handleRegenerate}
//             onRegenerateAll={
//               disableRegeneration ? () => {} : handleRegenerateAll
//             }
//             onSave={handleSaveBook}
//             isDirty={isDirty}
//             avatarFinalized={avatarFinalized}
//             onNavigateToImage={handleNavigateToImage}
//           />

//           {showShippingForm && !orderCompleted && (
//             <ShippingForm onSubmit={handleShippingSubmit} />
//           )}

//           {orderCompleted && (
//             <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
//               <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
//               <span>
//                 Order successfully placed! Your book will be delivered soon.
//               </span>
//             </div>
//           )}
//         </div>
//       </main>
//       <Footer />

//       {/* Customer Support Button */}
//       {book && <CustomerSupportButton onClick={() => setIsChatOpen(true)} />}

//       {/* Chat Drawer with transformed pages and functions */}
//       {book && user && pages.length > 0 && (
//         <ChatDrawer
//           isOpen={isChatOpen}
//           onClose={() => setIsChatOpen(false)}
//           onLayoutChange={handleLayoutChange}
//         >
//           <CustomerSupportChat
//             key={chatKey}
//             bookId={id!}
//             bookData={{
//               ...book,
//               pages: pages, // Pass transformed pages instead of raw pages
//             }}
//             userId={user.uid}
//             onImageUpdate={handleImageUpdate}
//             togglePageVersion={handleTogglePageVersion}
//             regeneratePage={handleRegenerate}
//             updatePage={handleUpdatePage}
//             onNavigateToImage={handleNavigateToImage}
//             onProceedToPdf={handleProceedToPdf}
//           />
//         </ChatDrawer>
//       )}
//     </div>
//   );
// }

// import { useParams, useLocation } from "wouter";
// import { useQuery } from "@tanstack/react-query";
// import { useState, useMemo } from "react";
// import { Header } from "@/components/Header";
// import { Footer } from "@/components/Footer";
// import { BookPreview } from "@/components/preview/BookPreview";
// import { useBookEditor } from "@/hooks/useBookEditor";
// import { apiRequest } from "@/lib/queryClient";
// import { ShippingForm } from "@/components/preview/ShippingForm";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Spinner } from "@/components/ui/spinner";
// import { CustomerSupportButton } from "@/components/CustomerSupportButton";
// import { ChatDrawer } from "@/components/ChatDrawer";
// import { CustomerSupportChat } from "@/components/CustomerSupportChat";
// import { auth } from "@/lib/firebase";
// import { useQueryClient } from "@tanstack/react-query";

// function transformBookPages(book: any) {
//   console.log(
//     `transformBookPages start rawPages ${Array.isArray(book.pages) ? book.pages.length : 0}`,
//   );

//   const middlePages = (book.pages || []).map((p: any, index: number) => {
//     const currentIndex = p.current_scene_index || 0;
//     const imageUrls = Array.isArray(p.imageUrls)
//       ? p.imageUrls
//       : [p.imageUrl || p.scene_url || ""];
//     const responseIds = Array.isArray(p.scene_response_ids)
//       ? p.scene_response_ids
//       : [p.sceneResponseId || p.scene_response_id];

//     console.log(
//       `midPage idx ${index} imagesLen ${imageUrls.length} currIdx ${currentIndex} responsesLen ${responseIds.length}`,
//     );

//     return {
//       id: index + 2,
//       imageUrl: imageUrls[currentIndex] || imageUrls[0] || "",
//       imageUrls,
//       currentImageIndex: currentIndex,
//       content: Array.isArray(p.content)
//         ? p.content.join("\n")
//         : (p.content ?? ""),
//       sceneInputs: p.scene_inputs ?? p.content ?? "",
//       isCover: false,
//       sceneNumber: p.scene_number,
//       sceneResponseId: responseIds[currentIndex] || responseIds[0],
//       sceneResponseIds: responseIds,
//     };
//   });

//   const pages: any[] = [];

//   if (book.cover) {
//     const currentCoverIndex = book.cover.current_final_cover_index || 0;
//     const finalCoverUrls = Array.isArray(book.cover.final_cover_urls)
//       ? book.cover.final_cover_urls
//       : [book.cover.final_cover_url];
//     const baseCoverResponseIds = Array.isArray(
//       book.cover.base_cover_response_ids,
//     )
//       ? book.cover.base_cover_response_ids
//       : [book.cover.base_cover_response_id];

//     console.log(
//       `cover imagesLen ${finalCoverUrls.length} currCoverIdx ${currentCoverIndex}`,
//     );

//     pages.push({
//       id: 1,
//       imageUrl: finalCoverUrls[currentCoverIndex] || finalCoverUrls[0] || "",
//       imageUrls: finalCoverUrls,
//       currentImageIndex: currentCoverIndex,
//       content: book.title,
//       coverInputs: book.cover,
//       isCover: true,
//       coverResponseId:
//         baseCoverResponseIds[currentCoverIndex] || baseCoverResponseIds[0],
//       coverResponseIds: baseCoverResponseIds,
//     });
//   } else {
//     console.log(`noCover present false`);
//   }

//   pages.push(...middlePages);
//   console.log(`middlePages added count ${middlePages.length}`);

//   if (book.backCoverUrl) {
//     pages.push({
//       id: pages.length + 1,
//       imageUrl: book.backCoverUrl,
//       content: "",
//       isBackCover: true,
//     });
//     console.log(`backCover added id ${pages.length}`);
//   } else {
//     console.log(`noBackCover present false`);
//   }

//   console.log(`transformBookPages end totalPages ${pages.length}`);
//   return pages;
// }

// export default function BookDetailPage() {
//   const params = useParams();
//   const { id } = params;
//   const { user } = useAuth();

//   const [showShippingForm, setShowShippingForm] = useState(false);
//   const [orderCompleted, setOrderCompleted] = useState(false);
//   const { toast } = useToast();
//   const [, setLocation] = useLocation();
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [chatKey, setChatKey] = useState(0);
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const queryClient = useQueryClient();

//   const {
//     data: book,
//     isLoading,
//     error,
//   } = useQuery({
//     queryKey: [`book-${id}`],
//     queryFn: async () => {
//       const res = await fetch("/api/books/" + id);
//       if (!res.ok) throw new Error("Book not found");
//       return res.json();
//     },
//   });

//   const initialPages = useMemo(
//     () => (book ? transformBookPages(book) : []),
//     [book],
//   );

//   const {
//     data: characterData,
//     isLoading: loadingCharacter,
//     error: characterError,
//   } = useQuery({
//     queryKey: ["character", book?.characterId],
//     queryFn: async () => {
//       console.log("Fetching character for id:", book?.characterId);
//       const res = await fetch(`/api/characters/${book.characterId}`, {
//         credentials: "include",
//       });
//       console.log("Character fetch response:", res);
//       if (!res.ok) {
//         throw new Error("Character not found");
//       }
//       return res.json();
//     },
//     enabled: !!book?.characterId,
//   });

//   const {
//     data: storyData,
//     isLoading: loadingStory,
//     error: storyError,
//   } = useQuery({
//     queryKey: ["story", book?.storyId],
//     queryFn: async () => {
//       console.log("Fetching story for id:", book?.storyId);
//       const res = await fetch(`/api/stories/${book.storyId}`, {
//         credentials: "include",
//       });
//       console.log("Story fetch response:", res);
//       if (!res.ok) {
//         throw new Error("Story not found");
//       }
//       return res.json();
//     },
//     enabled: !!book?.storyId,
//   });

//   const {
//     pages,
//     isDirty,
//     avatarUrl,
//     avatarLora,
//     avatarRegenerating,
//     avatarFinalized,
//     finalizeAvatar,
//     updatePage: handleUpdatePage,
//     regeneratePage: handleRegenerate,
//     togglePageVersion: handleTogglePageVersion,
//     regenerateAll: handleRegenerateAll,
//     regenerateAvatar,
//     saveBook: handleSaveBook,
//   } = useBookEditor({
//     bookId: id,
//     title: book?.title,
//     stylePreference: book?.stylePreference,
//     characterId: book?.characterId,
//     storyId: book?.storyId,
//     initialPages,
//     characterData,
//     initialAvatarLora: book?.avatarLora,
//     initialAvatarUrl: book?.avatarUrl,
//     avatarFinalizedInitial: book?.avatarFinalized ?? false,
//   });

//   const warnAndRegenAvatar = async (mode: "cartoon" | "hyper") => {
//     if (
//       window.confirm(
//         "Heads up: once you lock in this avatar, we'll regenerate *all* story images to match it. " +
//           "This can take a minute. Continue?",
//       )
//     ) {
//       await regenerateAvatar(mode);
//     }
//   };

//   const handleDownloadPDF = async () => {
//     if (!book) return;
//     try {
//       console.log("Generating PDF for book:", id);
//       setLocation(`/edit-pdf/${id}`);
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//     }
//   };

//   const handlePrint = () => {
//     setShowShippingForm(true);
//   };

//   const handleShippingSubmit = async (formData: any) => {
//     try {
//       if (user) {
//         await apiRequest("POST", "/api/orders", {
//           ...formData,
//           bookId: id,
//           characterId: book.characterId,
//           storyId: book.storyId,
//           userId: user.uid,
//         });
//         setOrderCompleted(true);
//         setShowShippingForm(false);
//         toast({
//           title: "Order placed successfully!",
//           description: "Your book will be delivered soon.",
//         });
//       }
//     } catch (error) {
//       console.error("Order submission error:", error);
//       toast({
//         title: "Order failed",
//         description:
//           "There was a problem placing your order. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleLayoutChange = (isOpen: boolean) => {
//     setIsDrawerOpen(isOpen);
//   };

//   const handleImageUpdate = () => {
//     setChatKey((prev) => prev + 1);
//   };

//   const handleNavigateToImage = (index: number) => {
//     if ((window as any).navigateToImage) {
//       (window as any).navigateToImage(index);
//     }
//   };

//   const handleProceedToPdf = () => {
//     handleDownloadPDF();
//   };

//   if (isLoading) return <div>Loading...</div>;
//   if (error) return <div>Book not found</div>;
//   const disableRegeneration = loadingCharacter || characterError;
//   const disableDownload = loadingStory || storyError;

//   console.log("pages:", pages);
//   console.log("loadingStory:", loadingStory, "storyError:", storyError);

//   return (
//     <div className="min-h-screen flex flex-col relative bg-white">
//       <Header />

//       {/* Mobile-optimized main content */}
//       <main
//         className={`flex-grow relative transition-all duration-300 ${
//           isDrawerOpen ? "md:mr-[420px]" : ""
//         }`}
//       >
//         {/* Avatar section - mobile optimized */}
//         {avatarUrl && (
//           <div className="w-full bg-white border-b border-gray-200 px-4 py-3">
//             <div className="flex items-center justify-center space-x-3">
//               <div className="relative">
//                 <img
//                   src={avatarUrl}
//                   alt="Story avatar"
//                   className={`rounded-full shadow-md object-cover transition-all duration-300 ${
//                     avatarFinalized ? "w-12 h-12" : "w-16 h-16"
//                   }`}
//                 />
//                 {avatarRegenerating && (
//                   <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-full">
//                     <Spinner className="w-6 h-6" />
//                   </div>
//                 )}
//               </div>

//               {!avatarFinalized ? (
//                 <div className="flex flex-col space-y-2">
//                   <div className="flex space-x-2">
//                     <Button
//                       size="sm"
//                       onClick={() => warnAndRegenAvatar("cartoon")}
//                       disabled={avatarRegenerating}
//                       className="text-xs px-2 py-1"
//                     >
//                       More Cartoonish
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => warnAndRegenAvatar("hyper")}
//                       disabled={avatarRegenerating}
//                       className="text-xs px-2 py-1"
//                     >
//                       More Realistic
//                     </Button>
//                   </div>
//                   <Button
//                     size="sm"
//                     disabled={avatarRegenerating}
//                     onClick={finalizeAvatar}
//                     className="text-xs"
//                   >
//                     Looks good → Start editing
//                   </Button>
//                 </div>
//               ) : (
//                 <span className="text-sm text-gray-500">Avatar locked ✓</span>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Book preview - full screen mobile experience */}
//         <div className="relative w-full h-[calc(100vh-120px)] md:h-[calc(100vh-200px)]">
//           <BookPreview
//             bookTitle={pages.find((p) => p.isCover)?.content || book.title}
//             pages={pages}
//             onDownload={disableDownload ? () => {} : handleDownloadPDF}
//             onPrint={handlePrint}
//             onUpdatePage={handleUpdatePage}
//             onRegenerate={disableRegeneration ? () => {} : handleRegenerate}
//             onRegenerateAll={
//               disableRegeneration ? () => {} : handleRegenerateAll
//             }
//             onSave={handleSaveBook}
//             isDirty={isDirty}
//             avatarFinalized={avatarFinalized}
//             onNavigateToImage={handleNavigateToImage}
//           />
//         </div>

//         {/* Mobile action buttons - Fixed top for Edit PDF (primary action) */}
//         <div className="fixed top-20 left-4 right-4 z-30 md:hidden">
//           <div className="flex space-x-2">
//             <Button
//               onClick={handleDownloadPDF}
//               className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold"
//               size="sm"
//             >
//               Edit PDF
//             </Button>
//             {isDirty && (
//               <Button
//                 onClick={handleSaveBook}
//                 className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
//                 size="sm"
//               >
//                 Save
//               </Button>
//             )}
//           </div>
//         </div>

//         {/* Desktop action buttons */}
//         <div className="hidden md:block absolute top-4 left-4 z-20 space-y-2">
//           <Button
//             onClick={handleDownloadPDF}
//             className="bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold"
//             size="sm"
//           >
//             Edit PDF
//           </Button>
//           {isDirty && (
//             <Button
//               onClick={handleSaveBook}
//               className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
//               size="sm"
//             >
//               Save Changes
//             </Button>
//           )}
//         </div>

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
//       </main>

//       <Footer />

//       {/* Mobile-optimized Customer Support Button - Red color */}
//       {book && (
//         <div className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
//           <CustomerSupportButton onClick={() => setIsChatOpen(true)} />
//         </div>
//       )}

//       {/* Chat Drawer */}
//       {book && user && pages.length > 0 && (
//         <ChatDrawer
//           isOpen={isChatOpen}
//           onClose={() => setIsChatOpen(false)}
//           onLayoutChange={handleLayoutChange}
//         >
//           <CustomerSupportChat
//             key={chatKey}
//             bookId={id!}
//             bookData={{
//               ...book,
//               pages: pages,
//             }}
//             userId={user.uid}
//             onImageUpdate={handleImageUpdate}
//             togglePageVersion={handleTogglePageVersion}
//             regeneratePage={handleRegenerate}
//             updatePage={handleUpdatePage}
//             onNavigateToImage={handleNavigateToImage}
//             onProceedToPdf={handleProceedToPdf}
//           />
//         </ChatDrawer>
//       )}
//     </div>
//   );
// }

import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { StickyHeader } from "@/components/StickyHeader";
import { PreviewPane } from "@/components/PreviewPane";
import { AssistantFAB } from "@/components/AssistantFAB";
import { useBookEditor } from "@/hooks/useBookEditor";
import { apiRequest } from "@/lib/queryClient";
import { ShippingForm } from "@/components/preview/ShippingForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChatDrawer } from "@/components/ChatDrawer";
import { CustomerSupportChat } from "@/components/CustomerSupportChat";
import { auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

function transformBookPages(book: any) {
  console.log(
    `transformBookPages start rawPages ${Array.isArray(book.pages) ? book.pages.length : 0}`,
  );

  const middlePages = (book.pages || []).map((p: any, index: number) => {
    const currentIndex = p.current_scene_index || 0;
    const imageUrls = Array.isArray(p.imageUrls)
      ? p.imageUrls
      : [p.imageUrl || p.scene_url || ""];
    const responseIds = Array.isArray(p.scene_response_ids)
      ? p.scene_response_ids
      : [p.sceneResponseId || p.scene_response_id];

    console.log(
      `midPage idx ${index} imagesLen ${imageUrls.length} currIdx ${currentIndex} responsesLen ${responseIds.length}`,
    );

    return {
      id: index + 2,
      imageUrl: imageUrls[currentIndex] || imageUrls[0] || "",
      imageUrls,
      currentImageIndex: currentIndex,
      content: Array.isArray(p.content)
        ? p.content.join("\n")
        : (p.content ?? ""),
      sceneInputs: p.scene_inputs ?? p.content ?? "",
      isCover: false,
      sceneNumber: p.scene_number,
      sceneResponseId: responseIds[currentIndex] || responseIds[0],
      sceneResponseIds: responseIds,
    };
  });

  const pages: any[] = [];

  if (book.cover) {
    const currentCoverIndex = book.cover.current_final_cover_index || 0;
    const finalCoverUrls = Array.isArray(book.cover.final_cover_urls)
      ? book.cover.final_cover_urls
      : [book.cover.final_cover_url];
    const baseCoverResponseIds = Array.isArray(
      book.cover.base_cover_response_ids,
    )
      ? book.cover.base_cover_response_ids
      : [book.cover.base_cover_response_id];

    console.log(
      `cover imagesLen ${finalCoverUrls.length} currCoverIdx ${currentCoverIndex}`,
    );

    pages.push({
      id: 1,
      imageUrl: finalCoverUrls[currentCoverIndex] || finalCoverUrls[0] || "",
      imageUrls: finalCoverUrls,
      currentImageIndex: currentCoverIndex,
      content: book.title,
      coverInputs: book.cover,
      isCover: true,
      coverResponseId:
        baseCoverResponseIds[currentCoverIndex] || baseCoverResponseIds[0],
      coverResponseIds: baseCoverResponseIds,
    });
  } else {
    console.log(`noCover present false`);
  }

  pages.push(...middlePages);
  console.log(`middlePages added count ${middlePages.length}`);

  if (book.backCoverUrl) {
    pages.push({
      id: pages.length + 1,
      imageUrl: book.backCoverUrl,
      content: "",
      isBackCover: true,
    });
    console.log(`backCover added id ${pages.length}`);
  } else {
    console.log(`noBackCover present false`);
  }

  console.log(`transformBookPages end totalPages ${pages.length}`);
  return pages;
}

export default function BookDetailPage() {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const queryClient = useQueryClient();

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
    enabled: !!book?.characterId,
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
    enabled: !!book?.storyId,
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
    togglePageVersion: handleTogglePageVersion,
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
        "Heads up: once you lock in this avatar, we'll regenerate *all* story images to match it. " +
          "This can take a minute. Continue?",
      )
    ) {
      await regenerateAvatar(mode);
    }
  };

  const handleDownloadPDF = async () => {
    if (!book) return;
    try {
      console.log("Generating PDF for book:", id);
      setLocation(`/edit-pdf/${id}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleBack = () => {
    setLocation("/");
  };

  const handleToggleAssistant = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handlePrint = () => {
    setShowShippingForm(true);
  };

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

  const handleLayoutChange = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
  };

  const handleImageUpdate = () => {
    setChatKey((prev) => prev + 1);
  };

  const handleNavigateToImage = (index: number) => {
    if ((window as any).navigateToImage) {
      (window as any).navigateToImage(index);
    }
    setCurrentImageIndex(index);
  };

  const handleProceedToPdf = () => {
    handleDownloadPDF();
  };

  // Prepare images for preview
  const carouselImages = pages.map((page, index) => ({
    url: page.imageUrl || page.url || "",
    sceneText: page.isCover ? book?.title : page.content,
    pageId: page.id || `page-${index}`,
    isCover: page.isCover || false,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Book not found
            </h1>
            <p className="text-gray-600">
              The book you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const disableRegeneration = loadingCharacter || characterError;
  const disableDownload = loadingStory || storyError;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Always show main Header (StoryPal branding, Home, Profile etc) */}
      <Header />

      {/* Sticky Header for book navigation */}
      <StickyHeader
        bookTitle={
          pages.find((p) => p.isCover)?.content || book?.title || "Book"
        }
        onBack={handleBack}
        onEditPDF={handleDownloadPDF}
        onToggleAssistant={handleToggleAssistant}
        isAssistantOpen={isChatOpen}
        isDirty={isDirty}
      />

      {/* Split-pane layout for desktop, full-screen for mobile */}
      <div className="flex-grow relative">
        <div
          className={`transition-all duration-300 ${
            isDrawerOpen ? "md:mr-[420px]" : ""
          }`}
        >
          {/* Avatar section - only show if not finalized */}
          {avatarUrl && !avatarFinalized && (
            <div className="w-full bg-gradient-to-r from-imaginory-yellow/20 to-imaginory-yellow/10 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-center space-x-4 max-w-4xl mx-auto">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Story avatar"
                    className="w-16 h-16 rounded-full shadow-md object-cover"
                  />
                  {avatarRegenerating && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-full">
                      <Spinner className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => warnAndRegenAvatar("cartoon")}
                      disabled={avatarRegenerating}
                      className="text-xs px-3 py-1 bg-white border border-imaginory-yellow text-imaginory-black hover:bg-imaginory-yellow/20"
                      variant="outline"
                    >
                      More Cartoonish
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => warnAndRegenAvatar("hyper")}
                      disabled={avatarRegenerating}
                      className="text-xs px-3 py-1 bg-white border border-imaginory-yellow text-imaginory-black hover:bg-imaginory-yellow/20"
                      variant="outline"
                    >
                      More Realistic
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    disabled={avatarRegenerating}
                    onClick={finalizeAvatar}
                    className="text-xs bg-imaginory-yellow hover:bg-imaginory-yellow/90 text-imaginory-black"
                  >
                    Looks good → Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Preview Pane */}
          <PreviewPane
            images={carouselImages}
            currentIndex={currentImageIndex}
            onNavigate={setCurrentImageIndex}
            onMaximize={() => {}} // Handled internally
            isAssistantOpen={isDrawerOpen}
          />
        </div>

        {/* Chat Drawer */}
        {book && user && pages.length > 0 && (
          <ChatDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onLayoutChange={handleLayoutChange}
          >
            <CustomerSupportChat
              key={chatKey}
              bookId={id!}
              bookData={{
                ...book,
                pages: pages,
              }}
              userId={user.uid}
              onImageUpdate={handleImageUpdate}
              togglePageVersion={handleTogglePageVersion}
              regeneratePage={handleRegenerate}
              updatePage={handleUpdatePage}
              onNavigateToImage={handleNavigateToImage}
              onProceedToPdf={handleProceedToPdf}
            />
          </ChatDrawer>
        )}

        {/* Shipping Form Modal */}
        {showShippingForm && !orderCompleted && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <ShippingForm onSubmit={handleShippingSubmit} />
            </div>
          </div>
        )}

        {/* Order Completion */}
        {orderCompleted && (
          <div className="fixed bottom-4 left-4 right-4 z-40">
            <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg shadow-lg max-w-md mx-auto">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-3 text-xl"></i>
                <div>
                  <p className="font-semibold">Order placed successfully!</p>
                  <p className="text-sm">Your book will be delivered soon.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
