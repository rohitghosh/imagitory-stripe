// import React, { useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ALL_THEMES, Theme } from "@/types/ThemeSubjects";

// interface ThemeSelectionProps {
//   onSubmit: (theme: string, isCustom: boolean) => void;
//   onBack: () => void;
//   initialTheme?: string; // NEW: allow parent to pass last selected theme
// }

// export function ThemeSelection({
//   onSubmit,
//   onBack,
//   initialTheme,
// }: ThemeSelectionProps) {
//   const [selectedTheme, setSelectedTheme] = useState<string>(
//     initialTheme || "",
//   );

//   const handleThemeSelect = (theme: Theme) => {
//     setSelectedTheme(theme.id);
//     onSubmit(theme.id, false); // Immediately advance on click
//   };

//   const handleCustomMode = () => {
//     onSubmit("Custom", true);
//   };

//   return (
//     <Card className="bg-transparent border-0 shadow-none">
//       <CardContent className="bg-transparent p-0">
//         <div className="space-y-6">
//           <div>
//             <h3 className="text-lg font-semibold mb-2">Choose a Theme</h3>
//             <p className="text-sm text-gray-600">
//               Select a theme for your story{" "}
//               <span className="font-bold">OR</span> choose{" "}
//               <span className="font-bold">"Write my own"</span> to create a
//               custom story.
//             </p>
//           </div>

//           {/* Write My Own Option - Smaller and Separated */}
//           <div className="flex flex-col items-center mb-4">
//             <div
//               className="cursor-pointer rounded-lg border-2 border-yellow-500 bg-yellow-50 p-2 text-center transition-colors shadow-md hover:border-yellow-600 hover:bg-yellow-100 w-full max-w-xs"
//               onClick={handleCustomMode}
//               style={{ marginBottom: "1.5rem" }}
//             >
//               <div className="aspect-square w-16 h-16 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
//                 <div className="text-yellow-500 text-xl">✏️</div>
//               </div>
//               <h4 className="font-bold text-base mb-1">Write my own</h4>
//               <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold">
//                 Custom Option
//               </span>
//             </div>
//             <div className="w-full flex items-center justify-center my-2">
//               <span className="text-gray-400 font-semibold text-xs tracking-widest">
//                 OR
//               </span>
//             </div>
//           </div>

//           {/* Theme Grid */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {ALL_THEMES.map((theme) => (
//               <div
//                 key={theme.id}
//                 className={`cursor-pointer rounded-lg border p-4 text-center transition-colors ${
//                   selectedTheme === theme.id
//                     ? "border-yellow-500 bg-yellow-50"
//                     : "border-gray-200 hover:border-gray-300"
//                 }`}
//                 onClick={() => handleThemeSelect(theme)}
//               >
//                 <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-gray-100">
//                   <img
//                     src={theme.image}
//                     alt={theme.name}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <h4 className="font-medium text-sm">{theme.name}</h4>
//                 {theme.description && (
//                   <p className="text-xs text-gray-500 mt-1">
//                     {theme.description}
//                   </p>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Navigation */}
//           <div className="flex justify-between">
//             <Button variant="outline" onClick={onBack}>
//               ← Back to Characters
//             </Button>
//             {/* Continue button removed */}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ALL_THEMES, Theme } from "@/types/ThemeSubjects";

interface ThemeSelectionProps {
  onSubmit: (theme: string, isCustom: boolean) => void;
  onBack: () => void;
  initialTheme?: string; // NEW: allow parent to pass last selected theme
}

export function ThemeSelection({
  onSubmit,
  onBack,
  initialTheme,
}: ThemeSelectionProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(
    initialTheme || "",
  );

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme.id);
    onSubmit(theme.id, false); // Immediately advance on click
  };

  const handleCustomMode = () => {
    onSubmit("Custom", true);
  };

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="bg-transparent p-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Choose a Theme</h3>
            <p className="text-sm text-gray-600">
              Select a theme for your story{" "}
              <span className="font-bold">OR</span> choose{" "}
              <span className="font-bold">"Write my own"</span> to create a
              custom story.
            </p>
          </div>

          {/* Write My Own Option - Smaller and Separated */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="cursor-pointer rounded-lg border-2 border-yellow-500 bg-yellow-50 p-3 md:p-2 text-center transition-colors shadow-md hover:border-yellow-600 hover:bg-yellow-100 w-full max-w-xs"
              onClick={handleCustomMode}
              style={{ marginBottom: "1.5rem" }}
            >
              <div className="aspect-square w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-yellow-500 text-lg md:text-xl">✏️</div>
              </div>
              <h4 className="font-bold text-sm md:text-base mb-1">
                Write my own
              </h4>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold">
                Custom Option
              </span>
            </div>
            <div className="w-full flex items-center justify-center my-2">
              <span className="text-gray-400 font-semibold text-xs tracking-widest">
                OR
              </span>
            </div>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_THEMES.map((theme) => (
              <div
                key={theme.id}
                className={`cursor-pointer rounded-lg border p-4 text-center transition-colors ${
                  selectedTheme === theme.id
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleThemeSelect(theme)}
              >
                <div className="aspect-square w-full mb-2 md:mb-3 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={theme.image}
                    alt={theme.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-medium text-xs md:text-sm">{theme.name}</h4>
                {theme.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {theme.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-center md:justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full md:w-auto"
            >
              ← Back to Characters
            </Button>
            {/* Continue button removed */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
