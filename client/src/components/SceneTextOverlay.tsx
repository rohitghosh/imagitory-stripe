import React from "react";
import { Info } from "lucide-react";

interface SceneTextOverlayProps {
  text?: string;
  isCover?: boolean;
}

export const SceneTextOverlay: React.FC<SceneTextOverlayProps> = ({
  text,
  isCover = false,
}) => {
  console.log(`SceneTextOverlay - text: ${text}`);
  const hasText = typeof text === "string" && text.trim().length > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-12 pb-6 px-6">
        {hasText ? (
          <div className="max-w-4xl mx-auto">
            <p className="text-white text-lg md:text-xl leading-relaxed font-light text-center">
              {text}
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-white/60">
              <Info className="w-4 h-4" />
              <p className="text-sm italic">
                {isCover
                  ? "Book cover - no description needed"
                  : "This scene is visual only - no text description"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
