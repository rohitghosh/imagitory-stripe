// import React, { useEffect, useMemo, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/lib/queryClient";

// type CharacterRef = {
//   id: string;
//   name: string;
//   imageUrl: string; // original
//   toonUrl?: string; // existing toon if any
// };

// type ToonConfig = {
//   guidance_scale: number;
//   num_inference_steps: number;
// };

// interface AvatarTunerProps {
//   primary: CharacterRef;
//   sides: CharacterRef[];
//   maxTries?: number;
//   initialConfig?: ToonConfig;
//   style?: string; // animation style key
//   onFinalized: (toonMap: Record<string, string>, config: ToonConfig) => void;
//   disabled?: boolean;
// }

// export function AvatarTuner({
//   primary,
//   sides,
//   maxTries = 3,
//   initialConfig = { guidance_scale: 5, num_inference_steps: 40 },
//   style,
//   onFinalized,
//   disabled = false,
// }: AvatarTunerProps) {
//   const { toast } = useToast();

//   // Current toon URL history for primary (for undo)
//   const [history, setHistory] = useState<string[]>(
//     [primary.toonUrl || ""].filter(Boolean) as string[],
//   );
//   const [isGenerating, setIsGenerating] = useState<boolean>(!history.length);
//   const currentUrl = history.length ? history[history.length - 1] : "";

//   // Track tries used
//   const [triesUsed, setTriesUsed] = useState<number>(0);

//   // Config that moves towards real/cartoonish
//   const [config, setConfig] = useState<ToonConfig>(initialConfig);

//   useEffect(() => {
//     // Sync if primary changes
//     const initial = [primary.toonUrl || ""].filter(Boolean) as string[];
//     setHistory(initial);
//     setIsGenerating(initial.length === 0);
//     setTriesUsed(0);
//     setConfig(initialConfig);
//   }, [primary.id]);

//   useEffect(() => {
//     if (!history.length && primary.imageUrl && !disabled && isGenerating) {
//       (async () => {
//         try {
//           const body = {
//             characterId: primary.id,
//             imageUrl: primary.imageUrl,
//             guidance_scale: config.guidance_scale,
//             num_inference_steps: config.num_inference_steps,
//             style,
//           };
//           const resp = await apiRequest("POST", "/api/cartoonify", body);
//           const newUrl = resp.toonUrl as string;
//           if (newUrl) {
//             setHistory([newUrl]);
//           }
//         } catch (err) {
//           console.error("initial avatar generation failed", err);
//           toast({
//             title: "Avatar generation failed",
//             description: "Please try ‘More cartoonish’ or ‘More real-like’.",
//             variant: "destructive",
//           });
//         } finally {
//           setIsGenerating(false);
//         }
//       })();
//     }
//   }, [
//     history.length,
//     primary.id,
//     primary.imageUrl,
//     style,
//     disabled,
//     isGenerating,
//     config.guidance_scale,
//     config.num_inference_steps,
//   ]);

//   const triesLeft = Math.max(0, maxTries - triesUsed);
//   const canGenerate = triesLeft > 0 && !disabled && !isGenerating;
//   const canUndo = history.length > 1 && !disabled && !isGenerating;

//   async function regenerate(nextConfig: ToonConfig) {
//     if (!canGenerate) return;
//     try {
//       setIsGenerating(true);
//       const body = {
//         characterId: primary.id,
//         imageUrl: primary.imageUrl,
//         guidance_scale: nextConfig.guidance_scale,
//         num_inference_steps: nextConfig.num_inference_steps,
//         style,
//       };
//       const resp = await apiRequest("POST", "/api/cartoonify", body);
//       const newUrl = resp.toonUrl as string;
//       if (newUrl) {
//         setHistory((h) => [...h, newUrl]);
//         setTriesUsed((t) => t + 1);
//         setConfig(nextConfig);
//       }
//     } catch (err) {
//       console.error("avatar regenerate error", err);
//       toast({
//         title: "Avatar generation failed",
//         description: "Please try again in a moment",
//         variant: "destructive",
//       });
//     } finally {
//       setIsGenerating(false);
//     }
//   }

//   const makeMoreReal = () => {
//     const next: ToonConfig = {
//       guidance_scale: Math.min(10, config.guidance_scale + 2.5),
//       num_inference_steps: Math.min(50, config.num_inference_steps + 5),
//     };
//     regenerate(next);
//   };

//   const makeMoreCartoonish = () => {
//     const next: ToonConfig = {
//       guidance_scale: Math.max(0, config.guidance_scale - 2.5),
//       num_inference_steps: Math.max(20, config.num_inference_steps - 5),
//     };
//     regenerate(next);
//   };

//   const undo = () => {
//     if (!canUndo) return;
//     setHistory((h) => h.slice(0, -1));
//   };

//   const finalize = async () => {
//     try {
//       // Batch toonify side characters with same config if they don't already have toonUrl
//       const pendingSides = sides.filter((s) => !s.toonUrl);
//       setIsGenerating(true);
//       let sideMap: Record<string, string> = {};
//       if (pendingSides.length > 0) {
//         const resp = await apiRequest(
//           "POST",
//           "/api/cartoonify-configurable-batch",
//           {
//             items: pendingSides.map((s) => ({
//               characterId: s.id,
//               imageUrl: s.imageUrl,
//             })),
//             guidance_scale: config.guidance_scale,
//             num_inference_steps: config.num_inference_steps,
//             style,
//           },
//         );
//         sideMap = resp.results || {};
//       }

//       const toonMap: Record<string, string> = {
//         [primary.id]: currentUrl,
//         ...Object.fromEntries(
//           sides.map((s) => [s.id, s.toonUrl || sideMap[s.id] || s.imageUrl]),
//         ),
//       };

//       onFinalized(toonMap, config);
//       toast({ title: "Avatar finalized" });
//     } catch (err) {
//       console.error("finalize error", err);
//       toast({
//         title: "Finalize failed",
//         description: "Please try again",
//         variant: "destructive",
//       });
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   return (
//     <Card className="bg-transparent border-0 shadow-none">
//       <CardContent className="p-0">
//         <div className="flex flex-col sm:flex-row gap-4 items-start">
//           <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-md border bg-gray-100 flex items-center justify-center overflow-hidden">
//             {currentUrl && !isGenerating ? (
//               <img
//                 src={currentUrl}
//                 alt="Avatar preview"
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <div className="text-xs text-gray-500 flex items-center gap-2">
//                 <i className="fas fa-circle-notch fa-spin" /> Generating…
//               </div>
//             )}
//           </div>
//           <div className="flex-1 space-y-2">
//             <p className="text-sm text-gray-700">
//               Tweak your hero’s avatar while the story is being planned.
//             </p>
//             <div className="flex gap-2 flex-wrap">
//               <Button
//                 size="sm"
//                 onClick={makeMoreCartoonish}
//                 disabled={!canGenerate}
//               >
//                 More cartoonish
//               </Button>
//               <Button size="sm" onClick={makeMoreReal} disabled={!canGenerate}>
//                 More real-like
//               </Button>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={undo}
//                 disabled={!canUndo}
//               >
//                 Undo
//               </Button>
//               <Button
//                 size="sm"
//                 onClick={finalize}
//                 disabled={disabled || isGenerating || !currentUrl}
//               >
//                 Use this avatar
//               </Button>
//             </div>
//             <p className="text-xs text-gray-500">
//               Tries left: {triesLeft} / {maxTries}
//             </p>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type CharacterRef = {
  id: string;
  name: string;
  imageUrl: string; // original
  toonUrl?: string; // existing toon if any
};

type ToonConfig = {
  guidance_scale: number;
  num_inference_steps: number;
};

interface AvatarTunerProps {
  primary: CharacterRef;
  sides: CharacterRef[];
  maxTries?: number;
  initialConfig?: ToonConfig;
  style?: string; // animation style key
  onFinalized: (toonMap: Record<string, string>, config: ToonConfig) => void;
  disabled?: boolean;
}

export function AvatarTuner({
  primary,
  sides,
  maxTries = 3,
  initialConfig = { guidance_scale: 5, num_inference_steps: 40 },
  style,
  onFinalized,
  disabled = false,
}: AvatarTunerProps) {
  const { toast } = useToast();

  // Current toon URL history for primary (for undo)
  const [history, setHistory] = useState<string[]>(
    [primary.toonUrl || ""].filter(Boolean) as string[],
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(!history.length);
  const currentUrl = history.length ? history[history.length - 1] : "";

  // Track tries used
  const [triesUsed, setTriesUsed] = useState<number>(0);

  // Config that moves towards real/cartoonish
  const [config, setConfig] = useState<ToonConfig>(initialConfig);

  // 🔍 NEW: Modal state for full-size preview
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  useEffect(() => {
    // Sync if primary changes
    const initial = [primary.toonUrl || ""].filter(Boolean) as string[];
    setHistory(initial);
    setIsGenerating(initial.length === 0);
    setTriesUsed(0);
    setConfig(initialConfig);
  }, [primary.id]);

  useEffect(() => {
    if (!history.length && primary.imageUrl && !disabled && isGenerating) {
      (async () => {
        try {
          const body = {
            characterId: primary.id,
            imageUrl: primary.imageUrl,
            guidance_scale: config.guidance_scale,
            num_inference_steps: config.num_inference_steps,
            style,
          };
          const resp = await apiRequest("POST", "/api/cartoonify", body);
          const newUrl = resp.toonUrl as string;
          if (newUrl) {
            setHistory([newUrl]);
          }
        } catch (err) {
          console.error("initial avatar generation failed", err);
          toast({
            title: "Avatar generation failed",
            description: "Please try ‘More cartoonish’ or ‘More real-like’.",
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
        }
      })();
    }
  }, [
    history.length,
    primary.id,
    primary.imageUrl,
    style,
    disabled,
    isGenerating,
    config.guidance_scale,
    config.num_inference_steps,
    toast,
  ]);

  const triesLeft = Math.max(0, maxTries - triesUsed);
  const canGenerate = triesLeft > 0 && !disabled && !isGenerating;
  const canUndo = history.length > 1 && !disabled && !isGenerating;

  async function regenerate(nextConfig: ToonConfig) {
    if (!canGenerate) return;
    try {
      setIsGenerating(true);
      const body = {
        characterId: primary.id,
        imageUrl: primary.imageUrl,
        guidance_scale: nextConfig.guidance_scale,
        num_inference_steps: nextConfig.num_inference_steps,
        style,
      };
      const resp = await apiRequest("POST", "/api/cartoonify", body);
      const newUrl = resp.toonUrl as string;
      if (newUrl) {
        setHistory((h) => [...h, newUrl]);
        setTriesUsed((t) => t + 1);
        setConfig(nextConfig);
      }
    } catch (err) {
      console.error("avatar regenerate error", err);
      toast({
        title: "Avatar generation failed",
        description: "Please try again in a moment",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const makeMoreReal = () => {
    const next: ToonConfig = {
      guidance_scale: Math.min(10, config.guidance_scale + 2.5),
      num_inference_steps: Math.min(50, config.num_inference_steps + 5),
    };
    regenerate(next);
  };

  const makeMoreCartoonish = () => {
    const next: ToonConfig = {
      guidance_scale: Math.max(0, config.guidance_scale - 2.5),
      num_inference_steps: Math.max(20, config.num_inference_steps - 5),
    };
    regenerate(next);
  };

  const undo = () => {
    if (!canUndo) return;
    setHistory((h) => h.slice(0, -1));
  };

  const finalize = async () => {
    try {
      // Batch toonify side characters with same config if they don't already have toonUrl
      const pendingSides = sides.filter((s) => !s.toonUrl);
      setIsGenerating(true);
      let sideMap: Record<string, string> = {};
      if (pendingSides.length > 0) {
        const resp = await apiRequest(
          "POST",
          "/api/cartoonify-configurable-batch",
          {
            items: pendingSides.map((s) => ({
              characterId: s.id,
              imageUrl: s.imageUrl,
            })),
            guidance_scale: config.guidance_scale,
            num_inference_steps: config.num_inference_steps,
            style,
          },
        );
        sideMap = resp.results || {};
      }

      const toonMap: Record<string, string> = {
        [primary.id]: currentUrl,
        ...Object.fromEntries(
          sides.map((s) => [s.id, s.toonUrl || sideMap[s.id] || s.imageUrl]),
        ),
      };

      onFinalized(toonMap, config);
      toast({ title: "Avatar finalized" });
    } catch (err) {
      console.error("finalize error", err);
      toast({
        title: "Finalize failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Avatar Preview + overlay icons */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-md border bg-gray-100 flex items-center justify-center overflow-hidden">
            {currentUrl && !isGenerating ? (
              <>
                <img
                  src={currentUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />

                {/* 🔍 NEW: Top-right icon cluster (maximize + undo) */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {/* Maximize button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal();
                    }}
                    className="bg-black/60 text-white rounded-full p-1 hover:bg-black/70 transition"
                    aria-label="View full-size avatar"
                    title="View full size"
                  >
                    <i className="fas fa-expand text-xs" />
                  </button>

                  {/* Undo button moved here */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      undo();
                    }}
                    disabled={!canUndo}
                    className={`rounded-full p-1 transition ${
                      canUndo
                        ? "bg-white text-gray-700 hover:bg-gray-100"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    aria-label="Undo last change"
                    title="Undo"
                  >
                    <i className="fas fa-undo text-xs" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <i className="fas fa-circle-notch fa-spin" /> Generating…
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-700">
              Tweak your hero’s avatar while the story is being planned.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={makeMoreCartoonish} disabled={!canGenerate}>
                More cartoonish
              </Button>
              <Button size="sm" onClick={makeMoreReal} disabled={!canGenerate}>
                More real-like
              </Button>
              {/* ⬇️ Undo button removed from here */}
              <Button
                size="sm"
                onClick={finalize}
                disabled={disabled || isGenerating || !currentUrl}
              >
                Use this avatar
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Tries left: {triesLeft} / {maxTries}
            </p>
          </div>
        </div>
      </CardContent>

      {/* 🔍 NEW: Image Modal (responsive) */}
      {modalOpen && currentUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={closeModal}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-4 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
              aria-label="Close modal"
              title="Close"
            >
              <i className="fas fa-times text-gray-600" />
            </button>
            <div className="bg-white rounded-lg p-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-3 text-center">
                {primary.name || "Avatar"}
              </h3>
              <img
                src={currentUrl}
                alt="Full-size avatar"
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
