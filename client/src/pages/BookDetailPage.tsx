// import { useParams, useLocation } from "wouter";
// import { useQuery } from "@tanstack/react-query";
// import { useState, useMemo, useEffect } from "react";
// import { Header } from "@/components/Header";
// import { StickyHeader } from "@/components/StickyHeader";
// import { PreviewPane } from "@/components/PreviewPane";
// import { AssistantFAB } from "@/components/AssistantFAB";
// import { useBookEditor } from "@/hooks/useBookEditor";
// import { apiRequest } from "@/lib/queryClient";
// import { ShippingForm } from "@/components/preview/ShippingForm";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Spinner } from "@/components/ui/spinner";
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
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

//   const handleBack = () => {
//     setLocation("/");
//   };

//   const handleToggleAssistant = () => {
//     setIsChatOpen(!isChatOpen);
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
//     setCurrentImageIndex(index);
//   };

//   const handleProceedToPdf = () => {
//     handleDownloadPDF();
//   };

//   // Prepare images for preview
//   const carouselImages = pages.map((page, index) => ({
//     url: page.imageUrl || page.url || "",
//     sceneText: page.isCover ? book?.title : page.content,
//     pageId: page.id || `page-${index}`,
//     isCover: page.isCover || false,
//   }));

//   // Preload all carousel images before showing preview
//   const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
//   const [imagesReady, setImagesReady] = useState(false);

//   useEffect(() => {
//     const urls = new Set<string>();
//     carouselImages.forEach((img) => img.url && urls.add(img.url));
//     if (urls.size === 0) {
//       setImagesReady(true);
//       return;
//     }
//     setImagesReady(false);
//     setLoadedUrls(new Set());

//     let loadedCount = 0;
//     let cancelled = false;
//     const total = urls.size;

//     const markLoaded = (url: string) => {
//       setLoadedUrls((prev) => {
//         const next = new Set(prev);
//         if (!next.has(url)) {
//           next.add(url);
//           loadedCount += 1;
//           if (!cancelled && loadedCount >= total) setImagesReady(true);
//         }
//         return next;
//       });
//     };

//     urls.forEach((url) => {
//       const img = new Image();
//       img.onload = () => markLoaded(url);
//       img.onerror = () => markLoaded(url);
//       img.src = url;
//     });

//     return () => {
//       cancelled = true;
//     };
//   }, [pages.length, JSON.stringify(carouselImages.map((i) => i.url))]);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex flex-col bg-white">
//         <Header />
//         <div className="flex-grow flex items-center justify-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex flex-col bg-white">
//         <Header />
//         <div className="flex-grow flex items-center justify-center">
//           <div className="text-center">
//             <h1 className="text-2xl font-bold text-gray-900 mb-2">
//               Book not found
//             </h1>
//             <p className="text-gray-600">
//               The book you're looking for doesn't exist.
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const disableRegeneration = loadingCharacter || characterError;
//   const disableDownload = loadingStory || storyError;

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       {/* Always show main Header (StoryPal branding, Home, Profile etc) */}
//       <Header />

//       {/* Sticky Header for book navigation */}
//       <StickyHeader
//         bookTitle={
//           pages.find((p) => p.isCover)?.content || book?.title || "Book"
//         }
//         onBack={handleBack}
//         onEditPDF={handleDownloadPDF}
//         onToggleAssistant={handleToggleAssistant}
//         isAssistantOpen={isChatOpen}
//         isDirty={isDirty}
//       />

//       {/* Split-pane layout for desktop, full-screen for mobile */}
//       <div className="flex-grow relative">
//         <div
//           className={`transition-all duration-300 ${
//             isDrawerOpen ? "md:mr-[420px]" : ""
//           }`}
//         >
//           {/* Avatar section - only show if not finalized */}
//           {avatarUrl && !avatarFinalized && (
//             <div className="w-full bg-gradient-to-r from-imaginory-yellow/20 to-imaginory-yellow/10 border-b border-gray-200 px-4 py-3">
//               <div className="flex items-center justify-center space-x-4 max-w-4xl mx-auto">
//                 <div className="relative">
//                   <img
//                     src={avatarUrl}
//                     alt="Story avatar"
//                     className="w-16 h-16 rounded-full shadow-md object-cover"
//                   />
//                   {avatarRegenerating && (
//                     <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-full">
//                       <Spinner className="w-6 h-6" />
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex flex-col space-y-2">
//                   <div className="flex space-x-2">
//                     <Button
//                       size="sm"
//                       onClick={() => warnAndRegenAvatar("cartoon")}
//                       disabled={avatarRegenerating}
//                       className="text-xs px-3 py-1 bg-white border border-imaginory-yellow text-imaginory-black hover:bg-imaginory-yellow/20"
//                       variant="outline"
//                     >
//                       More Cartoonish
//                     </Button>
//                     <Button
//                       size="sm"
//                       onClick={() => warnAndRegenAvatar("hyper")}
//                       disabled={avatarRegenerating}
//                       className="text-xs px-3 py-1 bg-white border border-imaginory-yellow text-imaginory-black hover:bg-imaginory-yellow/20"
//                       variant="outline"
//                     >
//                       More Realistic
//                     </Button>
//                   </div>
//                   <Button
//                     size="sm"
//                     disabled={avatarRegenerating}
//                     onClick={finalizeAvatar}
//                     className="text-xs bg-imaginory-yellow hover:bg-imaginory-yellow/90 text-imaginory-black"
//                   >
//                     Looks good → Continue
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Main Preview Pane or Preloader Gate */}
//           {!imagesReady ? (
//             <div className="relative w-full h-[calc(100vh-120px)] md:h-[calc(100vh-200px)] flex items-center justify-center">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
//             </div>
//           ) : (
//             <PreviewPane
//               images={carouselImages}
//               currentIndex={currentImageIndex}
//               onNavigate={setCurrentImageIndex}
//               onMaximize={() => {}}
//               isAssistantOpen={isDrawerOpen}
//             />
//           )}
//         </div>

//         {/* Chat Drawer */}
//         {book && user && pages.length > 0 && (
//           <ChatDrawer
//             isOpen={isChatOpen}
//             onClose={() => setIsChatOpen(false)}
//             onLayoutChange={handleLayoutChange}
//           >
//             <CustomerSupportChat
//               key={chatKey}
//               bookId={id!}
//               bookData={{
//                 ...book,
//                 pages: pages,
//               }}
//               userId={user.uid}
//               onImageUpdate={handleImageUpdate}
//               togglePageVersion={handleTogglePageVersion}
//               regeneratePage={handleRegenerate}
//               updatePage={handleUpdatePage}
//               onNavigateToImage={handleNavigateToImage}
//               onProceedToPdf={handleProceedToPdf}
//             />
//           </ChatDrawer>
//         )}

//         {/* Shipping Form Modal */}
//         {showShippingForm && !orderCompleted && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
//               <ShippingForm onSubmit={handleShippingSubmit} />
//             </div>
//           </div>
//         )}

//         {/* Order Completion */}
//         {orderCompleted && (
//           <div className="fixed bottom-4 left-4 right-4 z-40">
//             <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg shadow-lg max-w-md mx-auto">
//               <div className="flex items-center">
//                 <i className="fas fa-check-circle text-green-500 mr-3 text-xl"></i>
//                 <div>
//                   <p className="font-semibold">Order placed successfully!</p>
//                   <p className="text-sm">Your book will be delivered soon.</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import { Header } from "@/components/Header";
import { useBookEditor } from "@/hooks/useBookEditor";
import { apiRequest } from "@/lib/queryClient";
import { ShippingForm } from "@/components/preview/ShippingForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CustomerSupportChat } from "@/components/CustomerSupportChat";
import { useQueryClient } from "@tanstack/react-query";
import { ChatDrawer } from "@/components/ChatDrawer";

// ---------- helpers ----------
function deepGet(obj: any, path: string) {
  return path
    .split(".")
    .reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
}

function firstObjectAtPaths(root: any, paths: string[]) {
  for (const p of paths) {
    const candidate = deepGet(root, p);
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      return candidate;
    }
  }
  return undefined;
}

// Minimal helper to pick a usable image URL
function pickUrl(v: any): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  return (
    v.image_url ||
    v.imageUrl ||
    v.url ||
    v.previousImageUrl ||
    v.image?.url ||
    v.image?.src
  );
}

/**
 * Extract character names & image URLs from a specific path (or first match from a list of paths).
 * - `source`: the object to read from (e.g., your `book`)
 * - `pathOrPaths`: a dot-path string like "pages.0.scene_inputs.characterImageMap"
 *                  or an array of such paths checked in order.
 *
 * Returns: Array<{ name, imageUrl }>
 * Logs: group summary + console.table of the extracted rows.
 */
export function extractCharacterImages(
  source: any,
  pathOrPaths: string | string[],
): Array<{ name: string; imageUrl: string }> {
  const t0 =
    (typeof performance !== "undefined" && performance.now?.()) || Date.now();

  const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
  let map: any;
  let usedPath: string | undefined;

  for (const p of paths) {
    const v = deepGet(source, p);
    if (v && typeof v === "object") {
      map = v;
      usedPath = p;
      break;
    }
  }

  if (!map) {
    console.warn(
      "[extractCharacterImages] No map found at provided path(s):",
      paths,
    );
    return [];
  }

  const result: Array<{ name: string; imageUrl: string }> = [];

  const pushIf = (nameMaybe: any, value: any) => {
    const name =
      (typeof nameMaybe === "string" && nameMaybe) ||
      value?.name ||
      value?.Name ||
      value?.Character_Name ||
      "";
    const imageUrl = pickUrl(value);
    if (name && imageUrl) result.push({ name: String(name).trim(), imageUrl });
  };

  if (Array.isArray(map)) {
    // e.g. [{ name, image_url }, { Character_Name, imageUrl }, ...]
    map.forEach((v) => pushIf(undefined, v));
  } else {
    // e.g. { Fuzzy: { image_url: ... }, Macaulay: { image_url: ... } }
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === "string") {
        // { "Macaulay": "https://..." }
        pushIf(k, v);
      } else {
        pushIf(
          (v as any)?.name ||
            (v as any)?.Name ||
            (v as any)?.Character_Name ||
            k,
          v,
        );
      }
    }
  }

  // Dedup by lowercase name; prefer longer URL (often signed URLs are longer)
  const dedup = new Map<string, { name: string; imageUrl: string }>();
  for (const row of result) {
    const key = row.name.toLowerCase();
    const prev = dedup.get(key);
    if (!prev || (row.imageUrl?.length ?? 0) > (prev.imageUrl?.length ?? 0)) {
      dedup.set(key, row);
    }
  }
  const out = [...dedup.values()];

  const t1 =
    (typeof performance !== "undefined" && performance.now?.()) || Date.now();
  console.groupCollapsed(
    `[extractCharacterImages] ${out.length} character(s) from "${usedPath}" in ${(t1 - t0).toFixed(1)}ms`,
  );
  console.table(out);
  console.debug("Keys at path:", Object.keys(map));
  console.groupEnd();

  return out;
}

function transformBookPages(book: any) {
  const middlePages = (book.pages || []).map((p: any, index: number) => {
    const currentIndex = p.current_scene_index || 0;
    const imageUrls = Array.isArray(p.imageUrls)
      ? p.imageUrls
      : [p.imageUrl || p.scene_url || ""];
    const responseIds = Array.isArray(p.scene_response_ids)
      ? p.scene_response_ids
      : [p.sceneResponseId || p.scene_response_id];
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
  }

  pages.push(...middlePages);

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

// Renders story text; highlights quoted text in brand yellow. Uses pre-wrap to avoid letter-per-line bugs.
function OverlayText({
  content,
  className = "text-gray-800",
}: {
  content: string;
  className?: string;
}) {
  const parts = content.split(/(\"[^\"]*\")/g); // keep quoted segments
  return (
    <p className={`${className} whitespace-pre-wrap leading-relaxed`}>
      {parts.map((p, i) => {
        if (p.startsWith('"') && p.endsWith('"')) {
          return (
            <>
              <span key={`qo-${i}`}>"</span>
              <span
                key={`q-${i}`}
                className="text-imaginory-yellow font-semibold"
              >
                {p.slice(1, -1)}
              </span>
              <span key={`qc-${i}`}>"</span>
            </>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [chatKey, setChatKey] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(true);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const LEFT_PANE_PX = 180; // Slightly wider for vertical thumbnails
  const navTokenRef = useRef(0);
  const queryClient = useQueryClient();
  const viewerRef = useRef<HTMLDivElement>(null);
  const MOBILE_CHAT_PEEK_PX = 80; // ~peek height
  const MOBILE_CHAT_SNAPS = [0.25, 0.6, 0.92]; // 25%, 60%, 92% of screen

  // --- DATA ---
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

  const characterChips = useMemo(
    () =>
      extractCharacterImages(book, [
        "pages.0.scene_inputs.characterImageMap", // snake_case (your sample)
        "pages.0.sceneInputs.characterImageMap", // camelCase fallback
        "metadata.characterImageMap", // fallback
        "charactersMap", // fallback
      ]),
    [book],
  );

  const initialPages = useMemo(
    () => (book ? transformBookPages(book) : []),
    [book],
  );

  const { data: characterData } = useQuery({
    queryKey: ["character", book?.characterId],
    queryFn: async () => {
      const res = await fetch(`/api/characters/${book.characterId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Character not found");
      return res.json();
    },
    enabled: !!book?.characterId,
  });

  const { data: storyData } = useQuery({
    queryKey: ["story", book?.storyId],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${book.storyId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Story not found");
      return res.json();
    },
    enabled: !!book?.storyId,
  });

  const {
    pages,
    avatarUrl,
    avatarRegenerating,
    avatarFinalized,
    finalizeAvatar,
    updatePage: handleUpdatePage,
    regeneratePage: handleRegenerate,
    togglePageVersion: handleTogglePageVersion,
    regenerateAvatar,
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

  const handleDownloadPDF = () => {
    if (book) setLocation(`/edit-pdf/${id}`);
  };
  const handleImageUpdate = () => setChatKey((prev) => prev + 1);
  const handleNavigateToImage = (index: number) => navigateTo(index);

  // Prepare images for preview
  const carouselImages = pages.map((page, index) => ({
    url: page.imageUrl || page.url || "",
    sceneText: page.isCover ? book?.title : page.content,
    pageId: page.id || `page-${index}`,
    isCover: page.isCover || false,
  }));

  const hasCover = carouselImages.length > 0 && !!carouselImages[0].isCover;

  // Preload and decode
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    const urls = new Set<string>();
    carouselImages.forEach((img) => img.url && urls.add(img.url));
    if (urls.size === 0) {
      setImagesReady(true);
      return;
    }
    setImagesReady(false);
    setLoadedUrls(new Set());

    let loadedCount = 0;
    let cancelled = false;
    const total = urls.size;

    const markLoaded = (url: string) => {
      setLoadedUrls((prev) => {
        const next = new Set(prev);
        if (!next.has(url)) {
          next.add(url);
          loadedCount += 1;
          if (!cancelled && loadedCount >= total) setImagesReady(true);
        }
        return next;
      });
    };

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      let completed = false;
      const complete = () => {
        if (completed) return;
        completed = true;
        markLoaded(url);
      };
      img.onload = complete;
      img.onerror = complete;
      // @ts-ignore
      if (typeof (img as any).decode === "function")
        (img as any).decode().then(complete).catch(complete);
    });

    return () => {
      cancelled = true;
    };
  }, [pages.length, JSON.stringify(carouselImages.map((i) => i.url))]);

  // Keyboard navigation (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateTo(Math.min(pages.length - 1, currentImageIndex + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateTo(Math.max(0, currentImageIndex - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateTo(
          currentImageIndex > 0 ? currentImageIndex - 1 : pages.length - 1,
        );
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateTo(
          currentImageIndex < pages.length - 1 ? currentImageIndex + 1 : 0,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentImageIndex, pages.length]);

  // Ensure the viewer sits in the viewport at load (paranoid safety)
  useLayoutEffect(() => {
    viewerRef.current?.scrollIntoView({ block: "start", inline: "nearest" });
  }, []);

  // Zero-latency navigation
  async function navigateTo(index: number) {
    const target = carouselImages[index];
    if (!target?.url) return;

    if (loadedUrls.has(target.url)) {
      setCurrentImageIndex(index);
      setPendingIndex(null);
      return;
    }

    setPendingIndex(index);
    setIsImageLoading(true);
    const myToken = ++navTokenRef.current;

    const img = new Image();
    img.src = target.url;

    const finalize = () => {
      setLoadedUrls((prev) => {
        const next = new Set(prev);
        next.add(target.url);
        return next;
      });
      if (navTokenRef.current === myToken) {
        setCurrentImageIndex(index); // swap image + text together
        setIsImageLoading(false);
        setPendingIndex(null);
      }
    };

    img.onload = finalize;
    img.onerror = finalize;
    // @ts-ignore
    if (typeof (img as any).decode === "function") {
      try {
        await (img as any).decode();
      } catch {}
    }
  }

  if (isLoading) {
    return (
      <div className="h-dvh flex flex-col bg-yellow-50 overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imaginory-yellow"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh flex flex-col bg-yellow-50 overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
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

  const currentPage = pages[currentImageIndex];
  const progress =
    pages.length > 0 ? ((currentImageIndex + 1) / pages.length) * 100 : 0;

  return (
    <div className="h-dvh flex flex-col bg-yellow-50 overflow-hidden">
      <Header />

      {/* Desktop Layout (vertical thumbnails in left pane) */}
      <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Top bar */}
          <div className="px-6 py-4 border-b border-yellow-100 bg-yellow-50 shrink-0">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Title */}
              <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {book?.title || "Book"}
              </h1>

              {/* Right: chips + button (same text size) */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Chips scroll horizontally if there are many */}
                {characterChips.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-[min(60vw,40rem)]">
                    {characterChips.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 shrink-0"
                        title={c.name}
                      >
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="w-6 h-6 rounded-full object-cover border border-gray-200"
                        />
                        <span className="text-base font-medium text-gray-800">
                          {c.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleDownloadPDF}
                  className="text-base bg-imaginory-yellow hover:bg-imaginory-yellow/90 text-imaginory-black font-medium px-4 py-2 shadow-sm"
                >
                  Preview PDF
                </Button>
              </div>
            </div>

            {/* Progress bar (unchanged) */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-imaginory-yellow h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="flex-1 p-6 min-h-0 overflow-hidden">
            <div
              className="h-full border-2 border-yellow-100 rounded-lg bg-yellow-50 shadow-sm overflow-hidden grid gap-4 min-h-0"
              style={{ gridTemplateColumns: `${LEFT_PANE_PX}px 1fr` }}
            >
              {/* Left: compact vertical thumbnail list with scrolling */}
              <div className="border-r border-yellow-100 bg-yellow-50 min-h-0">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="p-1 space-y-1">
                    {carouselImages.map((image, index) => {
                      const label = image.isCover ? "Cover" : String(hasCover ? index : index + 1);
                      return (
                        <button
                          key={index}
                          onClick={() => navigateTo(index)}
                          className={`w-full h-24 rounded-md overflow-hidden ring-1 transition-all bg-gray-100 hover:shadow-sm relative ${
                            index === currentImageIndex ? "ring-imaginory-yellow shadow-md" : "ring-transparent hover:ring-gray-300"
                          }`}
                          aria-label={`Page ${label}`}
                        >
                          <img src={image.url} alt={`Page ${label}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded min-w-[16px] text-center">
                            {label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right viewer */}
              <div className="flex flex-col min-h-0 overflow-hidden">
                {/* Image area */}
                <div
                  ref={viewerRef}
                  className="relative flex-1 bg-yellow-50 min-h-0"
                >
                  {imagesReady ? (
                    <>
                      {!isImageLoading && (
                        <img
                          key={currentImageIndex} // force re-render when index changes
                          src={currentPage?.imageUrl}
                          alt={`Page ${currentImageIndex + 1}`}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      )}
                      {isImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imaginory-yellow"></div>
                        </div>
                      )}
                      {pages.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              navigateTo(
                                currentImageIndex > 0
                                  ? currentImageIndex - 1
                                  : pages.length - 1,
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              navigateTo(
                                currentImageIndex < pages.length - 1
                                  ? currentImageIndex + 1
                                  : 0,
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setIsZoomOpen(true)}
                        className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md hover:bg-black/70"
                        aria-label="Expand"
                        title="Expand"
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" y1="3" x2="14" y2="10"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imaginory-yellow"></div>
                    </div>
                  )}
                </div>

                {/* Glass text below image */}
                {currentPage?.content && (
                  <div className="px-6 py-4 bg-white border-t border-gray-100">
                    <div className="rounded-xl bg-black/55 backdrop-blur-sm shadow-2xl ring-1 ring-white/10 max-h-40 overflow-auto">
                      <div className="px-5 py-4">
                        <OverlayText
                          content={currentPage.content}
                          className="text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Chat */}
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto min-h-0">
          {book && user && pages.length > 0 && (
            <CustomerSupportChat
              key={chatKey}
              bookId={id!}
              bookData={{ ...book, pages: pages }}
              userId={user.uid}
              onImageUpdate={handleImageUpdate}
              togglePageVersion={handleTogglePageVersion}
              regeneratePage={handleRegenerate}
              updatePage={handleUpdatePage}
              onNavigateToImage={handleNavigateToImage}
              onProceedToPdf={() => setLocation(`/edit-pdf/${id}`)}
            />
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 truncate flex-1 mr-4">
              {book?.title || "Book"}
            </h1>
            <Button
              onClick={handleDownloadPDF}
              size="sm"
              className="bg-imaginory-yellow hover:bg-imaginory-yellow/90 text-imaginory-black font-medium px-4 py-2 shadow-sm"
            >
              Preview
            </Button>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-imaginory-yellow h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div
            className="relative bg-gray-100 h-[52vh] min-h-[260px]"
            onTouchStart={(e) => {
              const t = e.touches[0];
              (e.currentTarget as any)._sx = t.clientX;
            }}
            onTouchEnd={(e) => {
              const t = e.changedTouches[0];
              const startX = (e.currentTarget as any)._sx ?? t.clientX;
              const diffX = startX - t.clientX;
              if (Math.abs(diffX) > 50) {
                if (diffX > 0 && currentImageIndex < pages.length - 1) navigateTo(currentImageIndex + 1);
                else if (diffX < 0 && currentImageIndex > 0) navigateTo(currentImageIndex - 1);
              }
            }}
          >
            {!imagesReady ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imaginory-yellow"></div>
              </div>
            ) : (
              <>
                {/* Hide old image while loading, show solid spinner instead */}
                {!isImageLoading ? (
                  <img
                    key={currentImageIndex}
                    src={currentPage?.imageUrl}
                    alt={`Page ${currentImageIndex + 1}`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-imaginory-yellow"></div>
                  </div>
                )}

                {/* Expand icon (double-headed arrow) */}
                <button
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-md hover:bg-black/70"
                  aria-label="Expand"
                  title="Expand"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </button>

                {/* Glass text */}
                {currentPage?.content && (
                  <div className="absolute inset-x-0 bottom-0">
                    <div className="mx-auto max-w-5xl px-3 pb-4 pt-3">
                      <div className="rounded-lg bg-black/55 backdrop-blur-sm shadow-2xl ring-1 ring-white/10">
                        <div className="px-4 py-3">
                          <OverlayText content={currentPage.content} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-4 py-3 bg-white border-t border-gray-100 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2">
              {carouselImages.map((image, index) => {
                const label = image.isCover ? "Cover" : String(hasCover ? index : index + 1);
                return (
                  <button
                    key={index}
                    onClick={() => navigateTo(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? "border-imaginory-yellow shadow-md" : "border-gray-300"
                    }`}
                    aria-label={`Page ${label}`}
                    title={label}
                  >
                    <img src={image.url} alt={`Page ${label}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {book && user && pages.length > 0 && (
          <ChatDrawer
            isOpen={isMobileChatOpen}
            onClose={() => setIsMobileChatOpen(false)}
            // If your ChatDrawer supports these props, pass them:
            peekPx={MOBILE_CHAT_PEEK_PX}
            snapPoints={MOBILE_CHAT_SNAPS}
            initialSnap={0} // snapPoints[0] == 25%
            // (Optional) keep the drawer above content but below the zoom modal (z-[100])
            zIndex={80}
            startMobileMinimized={true}
          >
            <CustomerSupportChat
              key={`mobile-${chatKey}`}
              bookId={id!}
              bookData={{ ...book, pages }}
              userId={user.uid}
              onImageUpdate={handleImageUpdate}
              togglePageVersion={handleTogglePageVersion}
              regeneratePage={handleRegenerate}
              updatePage={handleUpdatePage}
              onNavigateToImage={handleNavigateToImage}
              onProceedToPdf={() => setLocation(`/edit-pdf/${id}`)}
            />
          </ChatDrawer>
        )}
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            aria-label="Close"
            onClick={() => setIsZoomOpen(false)}
          >
            ×
          </button>
          <img
            src={currentPage?.imageUrl}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
