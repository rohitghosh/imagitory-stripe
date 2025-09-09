import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AnimationStyle {
  id: string;
  label: string;
  description: string;
  sampleImageUrl: string;
}

interface AnimationStyleSelectionProps {
  selectedStyle: string;
  onStyleChange: (styleId: string) => void;
  characterIds: string[]; // Main character + side characters
  onCartoonifyComplete?: (results: Record<string, string>) => void; // characterId -> toonUrl
  disabled?: boolean;
}

export function AnimationStyleSelection({
  selectedStyle,
  onStyleChange,
  characterIds,
  onCartoonifyComplete,
  disabled = false,
}: AnimationStyleSelectionProps) {
  const [styles, setStyles] = useState<AnimationStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartoonifying, setCartoonifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCharacter, setCurrentCharacter] = useState<string>("");
  const { toast } = useToast();

  // Load animation styles
  useEffect(() => {
    const loadStyles = async () => {
      try {
        const response = await apiRequest("GET", "/api/animation-styles");
        setStyles(response);
      } catch (error) {
        console.error("Failed to load animation styles:", error);
        // Fallback to hardcoded styles
        setStyles([
          {
            id: "pixar",
            label: "Pixar",
            description:
              "Cinematic 3D look with soft lighting and friendly proportions",
            sampleImageUrl:
              "https://v3.fal.media/files/penguin/D9g2chjiCZrFkDps_y9Zd.png",
          },
          {
            id: "storybook-watercolor",
            label: "Storybook Watercolor",
            description: "Soft edges with gentle washes and cozy palette",
            sampleImageUrl:
              "https://v3.fal.media/files/penguin/D9g2chjiCZrFkDps_y9Zd.png",
          },
          {
            id: "flat-vector",
            label: "Flat Vector",
            description: "Clean geometric shapes with minimal gradients",
            sampleImageUrl:
              "https://v3.fal.media/files/penguin/D9g2chjiCZrFkDps_y9Zd.png",
          },
          {
            id: "ghibli",
            label: "Ghibli",
            description:
              "Painterly backgrounds with natural light and gentle expressions",
            sampleImageUrl:
              "https://v3.fal.media/files/penguin/D9g2chjiCZrFkDps_y9Zd.png",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadStyles();
  }, []);

  const handleStyleSelect = async (styleId: string) => {
    if (disabled || cartoonifying) return;

    onStyleChange(styleId);

    // If we have characters to cartoonify, do it now
    if (characterIds.length > 0) {
      setCartoonifying(true);
      setProgress(0);
      setCurrentCharacter("");

      try {
        const response = await apiRequest("POST", "/api/cartoonify-batch", {
          characterIds,
          animationStyle: styleId,
        });

        // Simulate progress updates
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 10;
          setProgress(currentProgress);

          if (currentProgress >= 90) {
            clearInterval(interval);
          }
        }, 200);

        // Wait for actual completion
        const results = response.results || {};

        clearInterval(interval);
        setProgress(100);

        onCartoonifyComplete?.(results);

        toast({
          title: "Style Applied",
          description: `Characters updated to ${styles.find((s) => s.id === styleId)?.label} style`,
        });
      } catch (error) {
        console.error("Failed to cartoonify characters:", error);
        toast({
          title: "Error",
          description: "Failed to apply animation style to characters",
          variant: "destructive",
        });
      } finally {
        setCartoonifying(false);
        setProgress(0);
        setCurrentCharacter("");
      }
    }
  };

  if (loading) {
    return (
      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="bg-transparent p-0">
          <div className="text-center py-4">Loading animation styles...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="bg-transparent p-0">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Choose Animation Style
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select the visual style for your story. This will be applied to
              all character images and story illustrations.
            </p>
          </div>

          {cartoonifying && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  Applying animation style to characters...
                </span>
                <span className="text-sm text-blue-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentCharacter && (
                <p className="text-xs text-blue-600 mt-1">
                  Processing {currentCharacter}...
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {styles.map((style) => (
              <div
                key={style.id}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedStyle === style.id
                    ? "border-yellow-500 bg-yellow-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                } ${disabled || cartoonifying ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleStyleSelect(style.id)}
              >
                <div className="aspect-square mb-3 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={style.sampleImageUrl}
                    alt={style.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.currentTarget.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDOTQuNDc3MiA3MCA5MCA3NC40NzcyIDkwIDgwVjEyMEM5MCA5Ny45MDg2IDk3LjkwODYgOTAgMTIwIDkwSDEyMEMxMjUuNTIzIDkwIDEzMCA4NS41MjI4IDEzMCA4MEM5MCA0MCA5MCA3MFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+";
                    }}
                  />
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {style.label}
                  </h4>
                  <p className="text-xs text-gray-600">{style.description}</p>
                </div>
                {selectedStyle === style.id && (
                  <div className="mt-2 flex justify-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-2 h-2 text-white"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
