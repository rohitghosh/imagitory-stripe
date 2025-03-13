import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type AgeGroup = "3-5" | "6-8" | "9-12";

interface Story {
  id: string;
  title: string;
  instructions: string;
  moral: string;
  imageUrl: string;
  description: string;
  ageGroup: AgeGroup;
  characterName: string;
}

interface PredefinedStoriesData {
  "3-5": Story[];
  "6-8": Story[];
  "9-12": Story[];
}

interface PredefinedStoriesProps {
  onSelectStory: (story: {
    id: string;
    title: string;
    type: "predefined";
    predefinedId: string;
    moral: string;
    instructions: string;
    elements: [];
  }) => void;
  characterName: string;
}

export function PredefinedStories({
  onSelectStory,
  characterName,
}: PredefinedStoriesProps) {
  const [predefinedStories, setPredefinedStories] =
    useState<PredefinedStoriesData>({
      "3-5": [],
      "6-8": [],
      "9-12": [],
    });
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>("3-5");
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStories() {
      try {
        // Fetch the predefined stories grouped by age
        const response = await fetch("/api/stories?type=predefined");
        const data: PredefinedStoriesData = await response.json();
        console.log("[fetchStories] API response data:", data);
        setPredefinedStories(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load predefined stories.",
          variant: "destructive",
        });
      }
    }
    fetchStories();
  }, [toast]);

  const currentStories = predefinedStories[selectedAgeGroup];

  const handleSelectStory = (storyId: string) => {
    setSelectedStory(storyId);
  };

  const handleAgeFilterChange = (ageGroup: AgeGroup) => {
    setSelectedAgeGroup(ageGroup);
    setSelectedStory(null);
    setCarouselIndex(0);
  };

  const handleNextClick = () => {
    if (selectedStory) {
      const story = currentStories.find((s) => s.id === selectedStory);
      if (story) {
        onSelectStory({
          id: selectedStory,
          title: story.title,
          type: "predefined",
          predefinedId: story.id,
          moral: story.moral,
          instructions: story.instructions,
          elements: [],
        });
      }
    }
  };

  const handlePrevCarousel = () => {
    setCarouselIndex(Math.max(0, carouselIndex - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex(Math.min(currentStories.length - 2, carouselIndex + 1));
  };

  return (
    <div className="mb-8">
      {/* Age Categories */}
      <div className="flex justify-center mb-8 space-x-2">
        <button
          className={cn(
            "py-2 px-5 rounded-md text-sm font-medium transition-colors",
            selectedAgeGroup === "3-5"
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100",
          )}
          onClick={() => handleAgeFilterChange("3-5")}
        >
          Ages 3-5
        </button>
        <button
          className={cn(
            "py-2 px-5 rounded-md text-sm font-medium transition-colors",
            selectedAgeGroup === "6-8"
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100",
          )}
          onClick={() => handleAgeFilterChange("6-8")}
        >
          Ages 6-8
        </button>
        <button
          className={cn(
            "py-2 px-5 rounded-md text-sm font-medium transition-colors",
            selectedAgeGroup === "9-12"
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100",
          )}
          onClick={() => handleAgeFilterChange("9-12")}
        >
          Ages 9-12
        </button>
      </div>

      <div className="relative px-8 max-w-4xl mx-auto">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handlePrevCarousel}
            className="bg-white rounded-md p-2 shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-all border border-gray-100"
            disabled={carouselIndex === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="carousel-container overflow-x-auto hide-scrollbar py-6">
          <div className="flex space-x-8 px-12">
            {currentStories
              .slice(carouselIndex, carouselIndex + 3)
              .map((story) => (
                <Card
                  key={story.id}
                  className={cn(
                    "flex-shrink-0 w-80 overflow-hidden transition-all cursor-pointer rounded-lg",
                    selectedStory === story.id
                      ? "ring-2 ring-primary shadow-md"
                      : "border border-gray-100 hover:border-gray-200 hover:shadow-md",
                  )}
                  onClick={() => handleSelectStory(story.id)}
                >
                  <div className="w-full h-44 overflow-hidden">
                    <img
                      src={story.imageUrl}
                      className="w-full h-full object-cover"
                      alt={story.title}
                    />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-xl mb-2">
                      {characterName
                        ? `${characterName} and ${story.title}`
                        : story.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {story.description}
                    </p>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {story.instructions}
                    </p>
                    <div className="flex items-center text-xs text-primary font-medium">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-md">
                        {story.moral}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handleNextCarousel}
            className="bg-white rounded-md p-2 shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-all border border-gray-100"
            disabled={carouselIndex >= currentStories.length - 2}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-10">
        <Button
          onClick={handleNextClick}
          disabled={!selectedStory}
          className={cn(
            "bg-primary hover:bg-primary/90 text-white font-medium py-3 px-8 rounded-md text-base shadow-sm hover:shadow transition-all",
            !selectedStory && "opacity-50 cursor-not-allowed",
          )}
        >
          Continue to Preview
        </Button>
      </div>
    </div>
  );
}
