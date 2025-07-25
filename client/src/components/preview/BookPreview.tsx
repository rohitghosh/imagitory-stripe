// // src/components/preview/BookPreview.tsx
// import React, { useState, useEffect } from "react";
// import useEmblaCarousel from "embla-carousel-react";
// import { Card } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { ImageCarousel } from "@/components/ImageCarousel";
// import { SceneTextOverlay } from "@/components/SceneTextOverlay";
// import { ImageMaximizeModal } from "@/components/ImageMaximizeModal";

// interface Page {
//   id: number;
//   imageUrl: string;
//   content: string;
//   prompt: string;
//   isCover: boolean;
//   isBackCover: boolean;
//   regenerating?: boolean;
//   input?: unknown;
// }

// interface BookPreviewProps {
//   bookTitle: string;
//   pages: Page[];
//   onUpdatePage: (id: number, content: string) => void;
//   onRegenerate: (id: number, mode: "vanilla" | "coverTitle") => void;
//   onRegenerateAll: () => void;
//   onDownload: () => void;
//   onPrint: () => void;
//   onSave: () => void;
//   isDirty: boolean;
//   avatarFinalized?: boolean;
// }

// export function BookPreview({
//   bookTitle,
//   pages,
//   onUpdatePage,
//   onRegenerate,
//   onRegenerateAll,
//   onDownload,
//   onPrint,
//   onEditPdf,
//   onSave,
//   isDirty,
//   avatarFinalized = true,
// }: BookPreviewProps) {
//   const { toast } = useToast();

//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [maximizedImage, setMaximizedImage] = useState<string | null>(null);
//   // filter out back cover
//   const previewPages = pages.filter((p) => !p.isBackCover);

//   // Embla carousel setup
//   const [emblaRef, emblaApi] = useEmblaCarousel({
//     loop: false,
//     align: "start",
//     containScroll: "trimSnaps",
//   });
//   const [selectedIndex, setSelectedIndex] = useState(0);
//   const [editingCoverId, setEditingCoverId] = useState<number | null>(null);
//   const [draftTitle, setDraftTitle] = useState("");

//   // update selectedIndex when carousel moves
//   useEffect(() => {
//     if (!emblaApi) return;
//     const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
//     emblaApi.on("select", onSelect);
//     return () => emblaApi.off("select", onSelect);
//   }, [emblaApi]);

//   const scrollTo = (index: number) => {
//     if (emblaApi) emblaApi.scrollTo(index);
//   };

//   const handleDownload = async () => {
//     try {
//       toast({
//         title: "Preparing your book",
//         description: "Rendering in progress…",
//       });
//       await onDownload();
//       toast({ title: "Book ready!", description: "Download complete." });
//     } catch {
//       toast({
//         title: "Rendering failed",
//         description: "Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   // Prepare images data for carousel
//   const carouselImages = pages.map((page, index) => ({
//     url: page.imageUrl || page.url || "",
//     sceneText: page.isCover ? bookTitle : page.content,
//     pageId: page.id || `page-${index}`,
//     isCover: page.isCover || false,
//   }));

//   // return (
//   //   <div className="max-w-6xl mx-auto">
//   //     {/* Title & Controls */}
//   //     <div className="flex flex-col md:flex-row justify-between items-center mb-6">
//   //       <div>
//   //         <h3 className="text-2xl font-heading font-bold">
//   //           {pages.find((p) => p.isCover)?.content || bookTitle}
//   //         </h3>
//   //         <p className="text-text-secondary">
//   //           {previewPages.length} pages • Created on{" "}
//   //           {new Date().toLocaleDateString("en-US", {
//   //             month: "long",
//   //             day: "numeric",
//   //             year: "numeric",
//   //           })}
//   //         </p>
//   //       </div>
//   //       <div className="flex items-center space-x-4 mt-4 md:mt-0 w-full md:w-auto">
//   //         <Button
//   //           variant="default"
//   //           size="lg"
//   //           className="flex-1 md:flex-none flex items-center justify-center"
//   //           onClick={onSave}
//   //           disabled={!isDirty}
//   //         >
//   //           <i className="fas fa-save mr-2"></i>
//   //           Save
//   //         </Button>
//   //         <button
//   //           className="flex items-center text-text-secondary hover:text-text-primary"
//   //           onClick={onRegenerateAll}
//   //         >
//   //           <i className="fas fa-magic mr-2"></i>
//   //           Regenerate All
//   //         </button>
//   //       </div>
//   //     </div>

//   //     {/* Swipeable Carousel */}
//   //     <div className="relative">
//   //       <button
//   //         onClick={() => emblaApi && emblaApi.scrollPrev()}
//   //         disabled={!emblaApi || selectedIndex === 0}
//   //         className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-50 disabled:opacity-50"
//   //       >
//   //         <i className="fas fa-chevron-left text-gray-600"></i>
//   //       </button>

//   //       <div ref={emblaRef} className="overflow-hidden">
//   //         <div className="flex space-x-6 px-4 sm:px-12 snap-x snap-mandatory">
//   //           {previewPages.map((page, idx) => (
//   //             <Card
//   //               key={page.id}
//   //               className={`book-preview-page flex-shrink-0 snap-start ${
//   //                 page.isCover ? "w-80" : "w-64"
//   //               } overflow-hidden hover:shadow-lg transition-all`}
//   //             >
//   //               <div className="relative">
//   //                 {page.regenerating ? (
//   //                   <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
//   //                     <i className="fas fa-spinner fa-spin text-gray-500 text-xl" />
//   //                   </div>
//   //                 ) : (
//   //                   <img
//   //                     src={page.imageUrl}
//   //                     alt={`Page ${page.id}`}
//   //                     className="w-full h-40 object-cover"
//   //                   />
//   //                 )}

//   //                 <div className="absolute top-2 left-2 bg-white/80 rounded-full py-1 px-3 text-xs font-medium">
//   //                   {page.isCover ? bookTitle : `Page ${page.id}`}
//   //                 </div>

//   //                 {!page.regenerating && (
//   //                   <div className="mt-4 px-4 flex flex-col space-y-2">
//   //                     <Button
//   //                       size="sm"
//   //                       variant="default"
//   //                       onClick={() => onRegenerate(page.id, "vanilla")}
//   //                       className="w-full py-1.5 px-4 rounded-md text-sm font-medium normal-case"
//   //                     >
//   //                       Different Visuals
//   //                     </Button>
//   //                   </div>
//   //                 )}
//   //               </div>

//   //               <div className="p-4">
//   //                 {/* --- COVER PAGE: button → inline editor --- */}
//   //                 {page.isCover ? (
//   //                   // If regenerating, show nothing in this slot
//   //                   page.regenerating ? null : editingCoverId === page.id ? (
//   //                     <>
//   //                       <Textarea
//   //                         rows={2}
//   //                         className="w-full text-sm border border-gray-200 rounded-md p-2 focus:ring-primary focus:border-primary"
//   //                         value={draftTitle}
//   //                         onChange={(e) => setDraftTitle(e.target.value)}
//   //                       />
//   //                       <div className="flex justify-end mt-2 space-x-2">
//   //                         <Button
//   //                           size="sm"
//   //                           variant="secondary"
//   //                           onClick={() => setEditingCoverId(null)}
//   //                         >
//   //                           Cancel
//   //                         </Button>
//   //                         <Button
//   //                           size="sm"
//   //                           onClick={() => {
//   //                             const newTitle =
//   //                               draftTitle.trim() || page.content;
//   //                             onUpdatePage(page.id, newTitle); // update local state
//   //                             onRegenerate(page.id, "coverTitle", newTitle); // call API with new title
//   //                             setEditingCoverId(null);
//   //                           }}
//   //                         >
//   //                           Save & Regenerate
//   //                         </Button>
//   //                       </div>
//   //                     </>
//   //                   ) : (
//   //                     <Button
//   //                       variant="outline"
//   //                       size="sm"
//   //                       className="w-full"
//   //                       onClick={() => {
//   //                         setDraftTitle(page.content);
//   //                         setEditingCoverId(page.id);
//   //                       }}
//   //                     >
//   //                       Change title
//   //                     </Button>
//   //                   )
//   //                 ) : (
//   //                   /* --- NORMAL PAGE: keep existing textarea --- */
//   //                   <Textarea
//   //                     rows={3}
//   //                     className="w-full text-sm border border-gray-200 rounded-md p-2 focus:ring-primary focus:border-primary"
//   //                     value={page.content}
//   //                     onChange={(e) => onUpdatePage(page.id, e.target.value)}
//   //                   />
//   //                 )}
//   //               </div>
//   //             </Card>
//   //           ))}
//   //         </div>
//   //       </div>

//   //       <button
//   //         onClick={() => emblaApi && emblaApi.scrollNext()}
//   //         disabled={!emblaApi || selectedIndex === previewPages.length - 1}
//   //         className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-50 disabled:opacity-50"
//   //       >
//   //         <i className="fas fa-chevron-right text-gray-600"></i>
//   //       </button>
//   //     </div>

//   //     {/* Page Dots */}
//   //     <div className="flex justify-center mt-6 space-x-1">
//   //       {previewPages.map((_, idx) => (
//   //         <button
//   //           key={idx}
//   //           onClick={() => scrollTo(idx)}
//   //           className={`h-2 w-2 rounded-full ${
//   //             idx === selectedIndex
//   //               ? "bg-primary opacity-100"
//   //               : "bg-gray-300 opacity-60"
//   //           }`}
//   //         />
//   //       ))}
//   //     </div>

//   //     {/* Download/Edit Controls */}
//   //     <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-12">
//   //       <Button
//   //         variant="default"
//   //         size="lg"
//   //         className="w-full md:w-auto flex items-center justify-center"
//   //         onClick={handleDownload}
//   //       >
//   //         <i className="fas fa-edit mr-2"></i>
//   //         Edit PDF
//   //       </Button>
//   //       {/* Uncomment if you want Print & Ship */}
//   //       {/*
//   //       <Button
//   //         variant="outline"
//   //         size="lg"
//   //         className="w-full md:w-auto flex items-center justify-center border-2 border-primary text-primary"
//   //         onClick={onPrint}
//   //       >
//   //         <i className="fas fa-print mr-2"></i>
//   //         Print & Ship
//   //       </Button>
//   //       */}
//   //     </div>
//   //   </div>
//   // );
//   return (
//     <div className="relative h-screen w-full overflow-hidden">
//       {/* Image Carousel */}
//       <ImageCarousel
//         images={carouselImages}
//         currentIndex={currentImageIndex}
//         onNavigate={setCurrentImageIndex}
//         onMaximize={setMaximizedImage}
//       />

//       {/* Scene Text Overlay */}
//       <SceneTextOverlay
//         text={carouselImages[currentImageIndex]?.sceneText}
//         isCover={carouselImages[currentImageIndex]?.isCover}
//       />

//       {/* Maximize Modal */}
//       {maximizedImage && (
//         <ImageMaximizeModal
//           imageUrl={maximizedImage}
//           isOpen={!!maximizedImage}
//           onClose={() => setMaximizedImage(null)}
//         />
//       )}

//       {/* Edit PDF Button - Keep existing */}
//       <div className="absolute top-4 left-4 z-20">
//         <button
//           onClick={onEditPdf}
//           className="px-4 py-2 bg-white/90 hover:bg-white text-black rounded-lg shadow-md transition-colors"
//         >
//           Edit PDF
//         </button>
//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
// import { ImageCarousel } from "@../components/ImageCarousel";
// import { SceneTextOverlay } from "./SceneTextOverlay";
// import { ImageMaximizeModal } from "./ImageMaximizeModal";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SceneTextOverlay } from "@/components/SceneTextOverlay";
import { ImageMaximizeModal } from "@/components/ImageMaximizeModal";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface BookPreviewProps {
  bookTitle: string;
  pages: any[];
  onDownload: () => void;
  onPrint: () => void;
  onUpdatePage: (pageId: number, updates: any) => void;
  onRegenerate: (
    page: any,
    mode: string,
    titleOverride?: string,
    revisedPrompt?: string,
  ) => Promise<void>;
  onRegenerateAll: () => void;
  onSave: () => void;
  isDirty: boolean;
  avatarFinalized: boolean;
}

export function BookPreview({
  bookTitle,
  pages,
  onDownload,
  onPrint,
  onUpdatePage,
  onRegenerate,
  onRegenerateAll,
  onSave,
  isDirty,
  avatarFinalized,
}: BookPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null);

  // Prepare images data for carousel
  const carouselImages = pages.map((page, index) => ({
    url: page.imageUrl || page.url || "",
    sceneText: page.isCover ? bookTitle : page.content,
    pageId: page.id || `page-${index}`,
    isCover: page.isCover || false,
  }));

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Image Carousel */}
      <ImageCarousel
        images={carouselImages}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
        onMaximize={setMaximizedImage}
      />

      {/* Scene Text Overlay */}
      <SceneTextOverlay
        text={carouselImages[currentImageIndex]?.sceneText}
        isCover={carouselImages[currentImageIndex]?.isCover}
      />

      {/* Maximize Modal */}
      {maximizedImage && (
        <ImageMaximizeModal
          imageUrl={maximizedImage}
          isOpen={!!maximizedImage}
          onClose={() => setMaximizedImage(null)}
        />
      )}

      {/* Edit PDF Button - Top left */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          onClick={onDownload}
          className="flex items-center gap-2 bg-white/90 hover:bg-white text-black shadow-md"
          variant="outline"
        >
          <FileText className="w-4 h-4" />
          Edit PDF
        </Button>
      </div>

      {/* Save Button - Show only if dirty */}
      {isDirty && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
