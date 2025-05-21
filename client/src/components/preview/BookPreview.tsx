import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generatePDF } from "@/utils/pdf";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Page {
  id: number;
  imageUrl: string;
  content: string;
  prompt: string;
  isCover: boolean;
  isBackCover: boolean;
  regenerating?: boolean;
}

interface BookPreviewProps {
  bookTitle: string;

  pages: Page[];
  onUpdatePage: (id: number, content: string) => void;
  onRegenerate: (
    id: number,
    mode: "cartoon" | "hyper" | "consistent" | "vanilla",
  ) => void;
  onRegenerateAll: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onSave: () => void;
  isDirty: boolean;
  avatarFinalized: boolean;
}

export function BookPreview({
  bookTitle,
  pages,
  onUpdatePage,
  onRegenerate,
  onRegenerateAll,
  onDownload,
  onPrint,
  onSave,
  isDirty,
  avatarFinalized,
}: BookPreviewProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const { toast } = useToast();

  const handlePrevCarousel = () => {
    setCarouselIndex(Math.max(0, carouselIndex - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex(Math.min(pages.length - 4, carouselIndex + 1));
  };

  const handleContentChange = (id: number, content: string) => {
    onUpdatePage(id, content);
  };

  const handleDownload = async () => {
    try {
      toast({
        title: "Preparing your book",
        description: "Your book is being prepared for rendering...",
      });

      await onDownload();

      toast({
        title: "Book ready!",
        description: "Your book has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Rendering failed",
        description:
          "There was a problem generating your book. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Book Title and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-heading font-bold">{bookTitle}</h3>
          <p className="text-text-secondary">
            {pages.length} pages • Created on{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {/* <button
            className="flex items-center text-text-secondary hover:text-text-primary"
            onClick={onResetAll}
          >
            <i className="fas fa-undo mr-2"></i>
            <span>Reset All</span>
          </button> */}

          <Button
            variant="default" // Ensures same look as Download button (red fill, etc.)
            size="lg"
            className="w-full md:w-auto flex items-center justify-center"
            onClick={onSave}
            disabled={!isDirty} // Button becomes clickable only if isDirty is true
          >
            <i className="fas fa-save mr-2"></i>
            <span>Save</span>
          </Button>

          <button
            className="flex items-center text-text-secondary hover:text-text-primary"
            onClick={onRegenerateAll}
          >
            <i className="fas fa-magic mr-2"></i>
            <span>Regenerate All</span>
          </button>
        </div>
      </div>

      {/* Book Preview */}
      <div
        className={`relative ${!avatarFinalized ? "pointer-events-none" : ""}`}
      >
        {!avatarFinalized && (
          <div className="absolute inset-0 z-20 backdrop-blur-sm bg-white/60 flex flex-col items-center justify-center text-center p-6 rounded-lg">
            <i className="fas fa-lock text-2xl text-gray-600 mb-2" />
            <p className="text-gray-700">
              Finalize your avatar first to unlock page edits.
            </p>
          </div>
        )}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handlePrevCarousel}
            className="bg-white rounded-full p-3 shadow-md hover:bg-gray-50 disabled:opacity-50"
            disabled={carouselIndex === 0}
          >
            <i className="fas fa-chevron-left text-gray-600"></i>
          </button>
        </div>

        <div className="carousel-container overflow-x-auto hide-scrollbar py-4">
          <div className="flex space-x-6 px-12">
            {pages
              .filter((page) => !page.isBackCover)
              .slice(carouselIndex, carouselIndex + 5)
              .map((page) => (
                <Card
                  key={page.id}
                  className={`book-preview-page flex-shrink-0 
                ${page.isCover ? "w-80" : "w-64"} 
                overflow-hidden hover:shadow-lg transition-all`}
                >
                  <div className="relative">
                    {page.regenerating ? (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin text-gray-500 text-xl" />
                      </div>
                    ) : (
                      <img
                        src={page.imageUrl}
                        className="w-full h-40 object-cover"
                        alt={`Page ${page.id}`}
                      />
                    )}
                    <div className="absolute top-2 left-2 bg-white/80 rounded-full py-1 px-3 text-xs font-medium">
                      {page.isCover
                        ? bookTitle
                        : page.isBackCover
                          ? ""
                          : `Page ${page.id}`}
                    </div>
                    {/* ⋯ overlay group – hide for cover / back */}
                    {!page.regenerating && (
                      <div className="mt-4 px-4 flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={!avatarFinalized}
                          onClick={() => onRegenerate(page.id, "vanilla")}
                          className="w-full py-1.5 px-4 rounded-md text-sm font-medium normal-case"
                        >
                          Different Visuals
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!avatarFinalized}
                          onClick={() => onRegenerate(page.id, "consistent")}
                          className="w-full py-1.5 px-4 rounded-md text-sm font-medium normal-case"
                        >
                          More Consistent
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Textarea
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-md p-2 focus:ring-primary focus:border-primary"
                      value={page.content}
                      onChange={(e) =>
                        handleContentChange(page.id, e.target.value)
                      }
                    />
                  </div>
                </Card>
              ))}
          </div>
        </div>

        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handleNextCarousel}
            className="bg-white rounded-full p-3 shadow-md hover:bg-gray-50 disabled:opacity-50"
            disabled={carouselIndex >= pages.length - 4}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>

      {/* Page Indicators */}
      <div className="flex justify-center mt-6 space-x-1">
        {pages.map((page, i) => (
          <button
            key={page.id}
            className={`h-2 w-2 rounded-full ${i === activePage ? "bg-primary opacity-100" : "bg-gray-300 opacity-60"}`}
            onClick={() => {
              setActivePage(i);
              if (i < carouselIndex) {
                setCarouselIndex(Math.max(0, i - 1));
              } else if (i >= carouselIndex + 4) {
                setCarouselIndex(Math.min(pages.length - 4, i - 3));
              }
            }}
          />
        ))}
      </div>

      {/* Download and Print Options */}
      <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-12">
        <Button
          variant="default"
          size="lg"
          className="w-full md:w-auto flex items-center justify-center"
          onClick={handleDownload}
        >
          <i className="fas fa-edit mr-2"></i>
          <span>Edit PDF</span>
        </Button>

        {/* <Button
          variant="outline"
          size="lg"
          className="w-full md:w-auto flex items-center justify-center border-2 border-primary text-primary"
          onClick={onPrint}
        >
          <i className="fas fa-print mr-2"></i>
          <span>Print & Ship</span>
        </Button> */}
      </div>
    </div>
  );
}
