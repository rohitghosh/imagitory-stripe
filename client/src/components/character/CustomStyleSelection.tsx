import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StyleSelectionProps {
  onStyleSelected: (style: "hyper-realistic" | "cartoonish") => void;
  selectedStyle: "hyper-realistic" | "cartoonish" | null;
  originalImages: string[];
  hyperRealisticImages: string[];
  cartoonishImages: string[];
}

export function StyleSelection({
  onStyleSelected,
  selectedStyle,
  originalImages,
  hyperRealisticImages,
  cartoonishImages,
}: StyleSelectionProps) {
  const getStyledImages = () => {
    if (selectedStyle === "hyper-realistic") return hyperRealisticImages;
    if (selectedStyle === "cartoonish") return cartoonishImages;
    return [];
  };

  const styledImages = getStyledImages();
  const styleLabel =
    selectedStyle === "hyper-realistic"
      ? "Hyper‑Realistic"
      : selectedStyle === "cartoonish"
      ? "Cartoonish"
      : "";

  return (
    <div className="mt-8 text-center">
      <h2 className="text-xl font-semibold mb-2">
        This is how your images will look in your chosen style
      </h2>

      <div className="flex justify-center space-x-4 mb-4 mt-6">
        <Button
          onClick={() => onStyleSelected("hyper-realistic")}
          className={cn(
            "px-4 py-2 rounded-md font-medium",
            selectedStyle === "hyper-realistic"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-800",
          )}
        >
          Hyper‑Realistic
        </Button>
        <Button
          onClick={() => onStyleSelected("cartoonish")}
          className={cn(
            "px-4 py-2 rounded-md font-medium",
            selectedStyle === "cartoonish"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-800",
          )}
        >
          Cartoonish
        </Button>
      </div>

      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-6 justify-center px-2 mt-6">
          {originalImages.map((originalUrl, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Original */}
              <img
                src={originalUrl}
                alt={`Original ${index + 1}`}
                className="w-36 h-36 object-cover rounded-md shadow border"
              />
              <p className="mt-2 text-sm text-gray-600 font-medium">Original</p>

              {/* Stylized */}
              <img
                src={styledImages[index] || "https://via.placeholder.com/150?text=..."}
                alt={`Styled ${index + 1}`}
                className="w-36 h-36 object-cover rounded-md shadow border mt-4"
              />
              <p className="mt-2 text-sm text-gray-600 font-medium">
                {styleLabel || "Select a style"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
