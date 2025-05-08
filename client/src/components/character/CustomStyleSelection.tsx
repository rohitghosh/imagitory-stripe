// import React from "react";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";

// export interface StyleSelectionProps {
//   onStyleSelected: (style: "hyper-realistic" | "cartoonish") => void;
//   selectedStyle: "hyper-realistic" | "cartoonish" | null;
//   originalImages: string[];
//   hyperRealisticImages: string[];
//   cartoonishImages: string[];
// }

// export function StyleSelection({
//   onStyleSelected,
//   selectedStyle,
//   originalImages,
//   hyperRealisticImages,
//   cartoonishImages,
// }: StyleSelectionProps) {
//   const getStyledImages = () => {
//     if (selectedStyle === "hyper-realistic") return hyperRealisticImages;
//     if (selectedStyle === "cartoonish") return cartoonishImages;
//     return [];
//   };

//   const styledImages = getStyledImages();
//   const styleLabel =
//     selectedStyle === "hyper-realistic"
//       ? "Hyper‑Realistic"
//       : selectedStyle === "cartoonish"
//       ? "Cartoonish"
//       : "";

//   return (
//     <div className="mt-8 text-center">
//       <h2 className="text-xl font-semibold mb-2">
//         This is how your images will look in your chosen style
//       </h2>

//       <div className="flex justify-center space-x-4 mb-4 mt-6">
//         <Button
//           onClick={() => onStyleSelected("hyper-realistic")}
//           className={cn(
//             "px-4 py-2 rounded-md font-medium",
//             selectedStyle === "hyper-realistic"
//               ? "bg-red-600 text-white"
//               : "bg-gray-200 text-gray-800",
//           )}
//         >
//           Hyper‑Realistic
//         </Button>
//         <Button
//           onClick={() => onStyleSelected("cartoonish")}
//           className={cn(
//             "px-4 py-2 rounded-md font-medium",
//             selectedStyle === "cartoonish"
//               ? "bg-red-600 text-white"
//               : "bg-gray-200 text-gray-800",
//           )}
//         >
//           Cartoonish
//         </Button>
//       </div>

//       <div className="overflow-x-auto hide-scrollbar">
//         <div className="flex gap-6 justify-center px-2 mt-6">
//           {originalImages.map((originalUrl, index) => (
//             <div key={index} className="flex flex-col items-center">
//               {/* Original */}
//               <img
//                 src={originalUrl}
//                 alt={`Original ${index + 1}`}
//                 className="w-36 h-36 object-cover rounded-md shadow border"
//               />
//               <p className="mt-2 text-sm text-gray-600 font-medium">Original</p>

//               {/* Stylized */}
//               <img
//                 src={styledImages[index] || "https://via.placeholder.com/150?text=..."}
//                 alt={`Styled ${index + 1}`}
//                 className="w-36 h-36 object-cover rounded-md shadow border mt-4"
//               />
//               <p className="mt-2 text-sm text-gray-600 font-medium">
//                 {styleLabel || "Select a style"}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// For clarity, define the shape of your “props”
// so it's easy to pass in or replace with new combos.
interface StyleSelectionProps {
  // The single “original” image to show in each row
  originalImageUrl: string;

  hyperPixarUrl: string;
  hyperHanddrawnUrl: string;
  hyperWatercolorUrl: string;
  hyperCrayonartUrl: string;
  hyperClaymotionUrl: string;
  hyperPastelsketchUrl: string;
  cartoonPixarUrl: string;
  cartoonHanddrawnUrl: string;
  cartoonWatercolorUrl: string;
  cartoonCrayonartUrl: string;
  cartoonClaymotionUrl: string;
  cartoonPastelsketchUrl: string;

  // Which style is currently selected (one of the keys below, or null)
  selectedStyle:
    | "hyper-pixar"
    | "hyper-handdrawn"
    | "hyper-watercolor"
    | "hyper-crayonart"
    | "hyper-claymotion"
    | "hyper-pastelsketch"
    | "cartoon-pixar"
    | "cartoon-handdrawn"
    | "cartoon-watercolor"
    | "cartoon-crayonart"
    | "cartoon-claymotion"
    | "cartoon-pastelsketch"
    | null;

  // When user picks a style, we call this
  onStyleSelected: (
    styleKey:
      | "hyper-pixar"
      | "hyper-handdrawn"
      | "hyper-watercolor"
      | "hyper-crayonart"
      | "hyper-claymotion"
      | "hyper-pastelsketch"
      | "cartoon-pixar"
      | "cartoon-handdrawn"
      | "cartoon-watercolor"
      | "cartoon-crayonart"
      | "cartoon-claymotion"
      | "cartoon-pastelsketch",
  ) => void;
}

// Just to keep our code DRY, let's define the structure of each “row”
interface StyleComboRow {
  rowLabel: string; // e.g. "Hyper Realistic"
  combos: {
    key:
      | "hyper-pixar"
      | "hyper-handdrawn"
      | "hyper-watercolor"
      | "hyper-crayonart"
      | "hyper-claymotion"
      | "hyper-pastelsketch"
      | "cartoon-pixar"
      | "cartoon-handdrawn"
      | "cartoon-watercolor"
      | "cartoon-crayonart"
      | "cartoon-claymotion"
      | "cartoon-pastelsketch";
    label: string;
    imageUrl: string; // the stylized preview
  }[];
}

export function StyleSelection({
  originalImageUrl,
  hyperPixarUrl,
  hyperHanddrawnUrl,
  hyperWatercolorUrl,
  hyperCrayonartUrl,
  hyperClaymotionUrl,
  hyperPastelsketchUrl,
  cartoonPixarUrl,
  cartoonHanddrawnUrl,
  cartoonWatercolorUrl,
  cartoonCrayonartUrl,
  cartoonClaymotionUrl,
  cartoonPastelsketchUrl,
  selectedStyle,
  onStyleSelected,
}: StyleSelectionProps) {
  // Build out two rows in an array:
  const styleRows: StyleComboRow[] = [
    {
      rowLabel: "Hyper Realistic",
      combos: [
        { key: "hyper-pixar", label: "Pixar", imageUrl: hyperPixarUrl },
        {
          key: "hyper-handdrawn",
          label: "Hand Drawn",
          imageUrl: hyperHanddrawnUrl,
        },
        {
          key: "hyper-watercolor",
          label: "Watercolor",
          imageUrl: hyperWatercolorUrl,
        },
        {
          key: "hyper-crayonart",
          label: "Crayon Art",
          imageUrl: hyperCrayonartUrl,
        },
        {
          key: "hyper-claymotion",
          label: "Claymotion",
          imageUrl: hyperClaymotionUrl,
        },
        {
          key: "hyper-pastelsketch",
          label: "Pastel Sketch",
          imageUrl: hyperPastelsketchUrl,
        },
      ],
    },
    {
      rowLabel: "Cartoonish",
      combos: [
        { key: "cartoon-pixar", label: "Pixar", imageUrl: cartoonPixarUrl },
        {
          key: "cartoon-handdrawn",
          label: "Hand Drawn",
          imageUrl: cartoonHanddrawnUrl,
        },
        {
          key: "cartoon-watercolor",
          label: "Watercolor",
          imageUrl: cartoonWatercolorUrl,
        },
        {
          key: "cartoon-crayonart",
          label: "Crayon Art",
          imageUrl: cartoonCrayonartUrl,
        },
        {
          key: "cartoon-claymotion",
          label: "Claymotion",
          imageUrl: cartoonClaymotionUrl,
        },
        {
          key: "cartoon-pastelsketch",
          label: "Pastel Sketch",
          imageUrl: cartoonPastelsketchUrl,
        },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Choose Your Style Combination
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left">
            <th className="p-3 border-b"></th> {/* empty corner cell */}
            <th className="p-3 border-b">Original</th>
            <th colSpan={2} className="p-3 border-b text-center">
              Variations (Click to Select)
            </th>
          </tr>
        </thead>
        <tbody>
          {styleRows.map((row) => (
            <tr key={row.rowLabel}>
              {/* Row label cell */}
              <td className="p-3 border-b align-top font-semibold w-32">
                {row.rowLabel}
              </td>

              {/* Original image cell */}
              <td className="p-3 border-b align-top">
                <img
                  src={originalImageUrl}
                  alt="Original"
                  className="w-32 h-32 object-cover rounded-md shadow"
                />
              </td>

              {/* style for this row */}
              {row.combos.map((combo) => {
                // Check if it's currently selected
                const isSelected = selectedStyle === combo.key;

                return (
                  <td key={combo.key} className="">
                    <div
                      onClick={() => onStyleSelected(combo.key)}
                      className={cn(
                        "cursor-pointer inline-block relative rounded-md overflow-hidden shadow border border-transparent",
                        // if selected, highlight the border or background
                        isSelected
                          ? "border-green-500 ring-2 ring-green-300"
                          : "hover:border-gray-300",
                      )}
                    >
                      <img
                        src={combo.imageUrl}
                        alt={`${row.rowLabel} - ${combo.label}`}
                        className="w-24 h-24 object-cover  rounded-md shadow border"
                      />
                      {/* You could overlay the label or a checkmark if selected */}
                      {isSelected && (
                        <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Selected
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-center text-sm font-medium">
                      {combo.label}
                    </p>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 
        Some “Continue” or “Save” button below, disabled if none selected
      */}
      {/* <div className="mt-6 text-center">
        <Button
          onClick={() => {
            if (selectedStyle) {
              alert("Selected style is: " + selectedStyle);
              // or navigate to next step
            }
          }}
          disabled={!selectedStyle}
        >
          Continue
        </Button>
      </div> */}
    </div>
  );
}
