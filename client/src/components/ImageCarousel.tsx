// import React, { useState, useEffect, useCallback } from "react";
// import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

// interface ImageCarouselProps {
//   images: Array<{
//     url: string;
//     sceneText?: string;
//     pageId: string;
//   }>;
//   currentIndex: number;
//   onNavigate: (index: number) => void;
//   onMaximize?: (imageUrl: string) => void;
// }

// export const ImageCarousel: React.FC<ImageCarouselProps> = ({
//   images,
//   currentIndex,
//   onNavigate,
//   onMaximize,
// }) => {
//   const [touchStart, setTouchStart] = useState<number | null>(null);
//   const [touchEnd, setTouchEnd] = useState<number | null>(null);

//   // Keyboard navigation
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "ArrowLeft" && currentIndex > 0) {
//         onNavigate(currentIndex - 1);
//       } else if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
//         onNavigate(currentIndex + 1);
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [currentIndex, images.length, onNavigate]);

//   // Touch handlers for mobile swipe
//   const handleTouchStart = (e: React.TouchEvent) => {
//     setTouchEnd(null);
//     setTouchStart(e.targetTouches[0].clientX);
//   };

//   const handleTouchMove = (e: React.TouchEvent) => {
//     setTouchEnd(e.targetTouches[0].clientX);
//   };

//   const handleTouchEnd = () => {
//     if (!touchStart || !touchEnd) return;

//     const distance = touchStart - touchEnd;
//     const isLeftSwipe = distance > 50;
//     const isRightSwipe = distance < -50;

//     if (isLeftSwipe && currentIndex < images.length - 1) {
//       onNavigate(currentIndex + 1);
//     }
//     if (isRightSwipe && currentIndex > 0) {
//       onNavigate(currentIndex - 1);
//     }
//   };

//   const handlePrevious = useCallback(() => {
//     if (currentIndex > 0) {
//       onNavigate(currentIndex - 1);
//     }
//   }, [currentIndex, onNavigate]);

//   const handleNext = useCallback(() => {
//     if (currentIndex < images.length - 1) {
//       onNavigate(currentIndex + 1);
//     }
//   }, [currentIndex, images.length, onNavigate]);

//   if (!images.length) return null;

//   const currentImage = images[currentIndex];

//   return (
//     <div className="relative w-full h-screen bg-gray-100 flex items-center justify-center">
//       {/* Main Image Container */}
//       <div
//         className="relative w-full h-full flex items-center justify-center"
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//         onTouchEnd={handleTouchEnd}
//       >
//         <img
//           src={currentImage.url}
//           alt={`Scene ${currentIndex + 1}`}
//           className="max-w-full max-h-full object-contain"
//           style={{ maxHeight: "80vh" }}
//         />

//         {/* Maximize Button */}
//         {onMaximize && (
//           <button
//             onClick={() => onMaximize(currentImage.url)}
//             className="absolute top-4 right-4 p-2 bg-white/80 rounded-lg shadow-md hover:bg-white transition-colors"
//             aria-label="Maximize image"
//           >
//             <Maximize2 className="w-5 h-5" />
//           </button>
//         )}

//         {/* Navigation Arrows - Desktop */}
//         {currentIndex > 0 && (
//           <button
//             onClick={handlePrevious}
//             className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 hidden md:block"
//             aria-label="Previous image"
//           >
//             <ChevronLeft className="w-6 h-6" />
//           </button>
//         )}

//         {currentIndex < images.length - 1 && (
//           <button
//             onClick={handleNext}
//             className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 hidden md:block"
//             aria-label="Next image"
//           >
//             <ChevronRight className="w-6 h-6" />
//           </button>
//         )}

//         {/* Navigation Arrows - Mobile (always visible) */}
//         <div className="md:hidden">
//           {currentIndex > 0 && (
//             <button
//               onClick={handlePrevious}
//               className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/60 rounded-full"
//               aria-label="Previous image"
//             >
//               <ChevronLeft className="w-5 h-5" />
//             </button>
//           )}

//           {currentIndex < images.length - 1 && (
//             <button
//               onClick={handleNext}
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/60 rounded-full"
//               aria-label="Next image"
//             >
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Image Counter */}
//       <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-white text-sm">
//         {currentIndex + 1} / {images.length}
//       </div>
//     </div>
//   );
// };
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ImageCarouselProps {
  images: Array<{
    url: string;
    sceneText?: string;
    pageId: string;
  }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onMaximize?: (imageUrl: string) => void;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  currentIndex,
  onNavigate,
  onMaximize,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [isLoading, setIsLoading] = useState(true);

  // Preload adjacent images
  useEffect(() => {
    const preloadIndices = [
      currentIndex - 1,
      currentIndex,
      currentIndex + 1,
    ].filter((i) => i >= 0 && i < images.length);

    preloadIndices.forEach((index) => {
      if (!loadedImages.has(index) && images[index]?.url) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(index));
        };
        img.src = images[index].url;
      }
    });
  }, [currentIndex, images, loadedImages]);

  // Handle loading state for current image
  useEffect(() => {
    setIsLoading(!loadedImages.has(currentIndex));
  }, [currentIndex, loadedImages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, onNavigate]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, images.length, onNavigate]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="relative w-full h-screen bg-gray-100 flex items-center justify-center">
      {/* Main Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Image */}
        <img
          src={currentImage.url}
          alt={`Scene ${currentIndex + 1}`}
          className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          style={{ maxHeight: "80vh" }}
          onLoad={() =>
            setLoadedImages((prev) => new Set(prev).add(currentIndex))
          }
        />

        {/* Maximize Button */}
        {onMaximize && !isLoading && (
          <button
            onClick={() => onMaximize(currentImage.url)}
            className="absolute top-4 right-4 p-2 bg-white/80 rounded-lg shadow-md hover:bg-white transition-colors z-20"
            aria-label="Maximize image"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}

        {/* Navigation Arrows - Desktop */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 hidden md:block z-20"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 hidden md:block z-20"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Navigation Arrows - Mobile (always visible) */}
        <div className="md:hidden">
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/60 rounded-full z-20"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {currentIndex < images.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/60 rounded-full z-20"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Image Counter */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-white text-sm z-10">
        {currentIndex === 0
          ? "Book Cover"
          : `${currentIndex} / ${images.length - 1 }`}
      </div>
    </div>
  );
};
