import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { SceneTextOverlay } from "@/components/SceneTextOverlay";
import { ImageMaximizeModal } from "@/components/ImageMaximizeModal";
import { PageTurnAnimation } from "@/components/PageTurnAnimation";

interface PreviewPaneProps {
  images: Array<{
    url: string;
    sceneText?: string;
    pageId: string;
    isCover?: boolean;
  }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onMaximize?: (imageUrl: string) => void;
  isAssistantOpen?: boolean;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  images,
  currentIndex,
  onNavigate,
  onMaximize,
  isAssistantOpen = false,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [isLoading, setIsLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [previousIndex, setPreviousIndex] = useState(currentIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right" | null
  >(null);
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null);

  // Handle navigation with animation
  const navigateWithAnimation = useCallback(
    (newIndex: number, direction: "left" | "right") => {
      if (newIndex === currentIndex) return;

      setPreviousIndex(currentIndex);
      setAnimationDirection(direction);
      setIsAnimating(true);

      setTimeout(() => {
        onNavigate(newIndex);
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 200);
    },
    [currentIndex, onNavigate],
  );

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
        navigateWithAnimation(currentIndex - 1, "right");
      } else if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        navigateWithAnimation(currentIndex + 1, "left");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, navigateWithAnimation]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);

    if (touchStart) {
      const distance = touchStart - e.targetTouches[0].clientX;
      if (Math.abs(distance) > 20) {
        setSwipeDirection(distance > 0 ? "left" : "right");
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      navigateWithAnimation(currentIndex + 1, "left");
    }
    if (isRightSwipe && currentIndex > 0) {
      navigateWithAnimation(currentIndex - 1, "right");
    }

    setTimeout(() => setSwipeDirection(null), 300);
  };

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      navigateWithAnimation(currentIndex - 1, "right");
    }
  }, [currentIndex, navigateWithAnimation]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      navigateWithAnimation(currentIndex + 1, "left");
    }
  }, [currentIndex, images.length, navigateWithAnimation]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className={`relative w-full transition-all duration-300 ${
        isAssistantOpen ? "md:mr-0" : ""
      }`}
      style={{ height: "calc(100vh - 56px)" }} // Account for sticky header
    >
      {/* Page Turn Animation */}
      <PageTurnAnimation
        currentIndex={currentIndex}
        previousIndex={previousIndex}
        direction={animationDirection}
        isAnimating={isAnimating}
      />

      {/* Swipe direction indicator */}
      {swipeDirection && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none ${
            swipeDirection === "left" ? "bg-blue-500/10" : "bg-green-500/10"
          }`}
        >
          <div
            className={`text-4xl font-bold ${
              swipeDirection === "left" ? "text-blue-600" : "text-green-600"
            }`}
          >
            {swipeDirection === "left" ? "→" : "←"}
          </div>
        </div>
      )}

      {/* Main Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        )}

        {/* Image with full coverage */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={currentImage.url}
            alt={`Scene ${currentIndex + 1}`}
            className={`w-full h-full object-contain transition-all duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            onLoad={() =>
              setLoadedImages((prev) => new Set(prev).add(currentIndex))
            }
          />

          {/* Maximize Button - positioned on the image */}
          {onMaximize && !isLoading && (
            <button
              onClick={() => {
                setMaximizedImage(currentImage.url);
                onMaximize && onMaximize(currentImage.url);
              }}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 z-20 backdrop-blur-sm"
              aria-label="Maximize image"
            >
              <Maximize2 className="w-4 h-4 text-gray-700" />
            </button>
          )}
        </div>

        {/* Navigation Arrows - Desktop */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 hidden md:block z-20 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 hidden md:block z-20 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Navigation Arrows - Mobile */}
        <div className="md:hidden">
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md z-20 backdrop-blur-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {currentIndex < images.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md z-20 backdrop-blur-sm"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* Scene Text Overlay */}
      <SceneTextOverlay
        text={currentImage?.sceneText}
        isCover={currentImage?.isCover}
      />

      {/* Page Counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium z-10">
        {currentIndex === 0
          ? "Book Cover"
          : `${currentIndex} / ${images.length - 1}`}
      </div>

      {/* Maximize Modal */}
      {maximizedImage && (
        <ImageMaximizeModal
          imageUrl={maximizedImage}
          isOpen={!!maximizedImage}
          onClose={() => setMaximizedImage(null)}
        />
      )}
    </div>
  );
};
