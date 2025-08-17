// import React, { useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";

// interface StorySettingsProps {
//   onSubmit: (rhyming: boolean) => void;
//   onBack: () => void;
// }

// export function StorySettings({ onSubmit, onBack }: StorySettingsProps) {
//   const [rhyming, setRhyming] = useState<boolean>(false);

//   const handleNext = () => {
//     onSubmit(rhyming);
//   };

//   return (
//     <Card className="bg-transparent border-0 shadow-none">
//       <CardContent className="bg-transparent p-0">
//         <div className="space-y-6">
//           <div>
//             <h3 className="text-lg font-semibold mb-2">Story Settings</h3>
//             <p className="text-sm text-gray-600">
//               Configure your story preferences before generation.
//             </p>
//           </div>

//           {/* Rhyming Option */}
//           <div className="bg-gray-50 rounded-lg p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <Label
//                   htmlFor="rhyming-toggle"
//                   className="text-base font-medium"
//                 >
//                   Do you want to enable rhyming for the story?
//                 </Label>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Rhyming stories have a musical, rhythmic flow that children
//                   often enjoy.
//                 </p>
//               </div>
//               <Switch
//                 id="rhyming-toggle"
//                 checked={rhyming}
//                 onCheckedChange={setRhyming}
//               />
//             </div>
//           </div>

//           {/* Navigation */}
//           <div className="flex justify-between">
//             <Button variant="outline" onClick={onBack}>
//               ← Back to Subject
//             </Button>

//             <Button
//               onClick={handleNext}
//               className="bg-yellow-500 hover:bg-yellow-600"
//             >
//               Generate Story
//             </Button>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface StorySettingsProps {
  onSubmit: (rhyming: boolean) => void;
  onBack: () => void;
}

export function StorySettings({ onSubmit, onBack }: StorySettingsProps) {
  const [rhyming, setRhyming] = useState<boolean>(false);

  const handleNext = () => {
    onSubmit(rhyming);
  };

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="bg-transparent p-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Story Settings</h3>
            <p className="text-sm text-gray-600">
              Configure your story preferences before generation.
            </p>
          </div>

          {/* Rhyming Option */}
          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <Label
                  htmlFor="rhyming-toggle"
                  className="text-sm md:text-base font-medium"
                >
                  Do you want to enable rhyming for the story?
                </Label>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Rhyming stories have a musical, rhythmic flow that children
                  often enjoy.
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <Switch
                  id="rhyming-toggle"
                  checked={rhyming}
                  onCheckedChange={setRhyming}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col md:flex-row gap-3 md:justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full md:w-auto"
            >
              ← Back to Subject
            </Button>

            <Button
              onClick={handleNext}
              className="bg-yellow-500 hover:bg-yellow-600 w-full md:w-auto"
            >
              Generate Story
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
