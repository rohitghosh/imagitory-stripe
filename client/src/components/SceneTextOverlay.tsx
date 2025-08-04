// import React from "react";
// import { Info } from "lucide-react";

// interface SceneTextOverlayProps {
//   text?: string;
//   isCover?: boolean;
// }

// export const SceneTextOverlay: React.FC<SceneTextOverlayProps> = ({
//   text,
//   isCover = false,
// }) => {
//   console.log(`SceneTextOverlay - text: ${text}`);
//   const hasText = typeof text === "string" && text.trim().length > 0;

//   return (
//     <div className="absolute bottom-0 left-0 right-0 z-10">
//       <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-12 pb-6 px-6">
//         {hasText ? (
//           <div className="max-w-4xl mx-auto">
//             <p className="text-white text-lg md:text-xl leading-relaxed font-light text-center">
//               {text}
//             </p>
//           </div>
//         ) : (
//           <div className="max-w-4xl mx-auto">
//             <div className="flex items-center justify-center space-x-2 text-white/60">
//               <Info className="w-4 h-4" />
//               <p className="text-sm italic">
//                 {isCover
//                   ? "Book cover - no description needed"
//                   : "This scene is visual only - no text description"}
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

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
      {/* Enhanced gradient background for better text visibility */}
      <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-16 pb-8 px-4 md:px-8">
        {hasText ? (
          <div className="max-w-full mx-auto">
            {/* Text container with enhanced styling and proper width constraints */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20 shadow-2xl mx-2 md:mx-4">
              <p
                className="text-white text-base md:text-lg lg:text-xl leading-relaxed font-medium text-center drop-shadow-lg break-words hyphens-auto"
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  maxWidth: "100%",
                  margin: "0 auto",
                }}
              >
                {/* Highlight important words */}
                {text.split(" ").map((word, index) => {
                  // Highlight words that might be important (capitalized, longer words)
                  const isImportant = word.length > 4 || /^[A-Z]/.test(word);
                  return (
                    <span
                      key={index}
                      className={`${
                        isImportant
                          ? "text-yellow-300 font-semibold"
                          : "text-white"
                      } ${index > 0 ? "ml-1" : ""}`}
                      style={{ display: "inline" }}
                    >
                      {word}
                    </span>
                  );
                })}
              </p>

              {/* Decorative elements */}
              <div className="flex justify-center mt-3 space-x-2">
                <div className="w-2 h-2 bg-yellow-300 rounded-full opacity-60"></div>
                <div className="w-1 h-1 bg-white rounded-full opacity-40"></div>
                <div className="w-2 h-2 bg-yellow-300 rounded-full opacity-60"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-full mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 mx-2 md:mx-4">
              <div className="flex items-center justify-center space-x-2 text-white/80">
                <Info className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                <p className="text-sm md:text-base italic font-medium text-center break-words">
                  {isCover
                    ? "Book cover - no description needed"
                    : "This scene is visual only - no text description"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
