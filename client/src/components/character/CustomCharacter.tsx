import { useState, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { CustomCharacterForm } from "./CustomCharacterForm";
import { StyleSelection } from "./CustomStyleSelection";

interface CustomCharactersProps {
  onSubmit: (character: {
    id: string;
    name: string;
    age: number;
    gender: string;
    imageUrls: string[];
    type: string;
    modelId?: string;
  }) => void;
}
export function CustomCharacter({ onSubmit }: CustomCharactersProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Whether to show the form below the carousel
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [autoOpenUpload, setAutoOpenUpload] = useState(false);

  // Track the currently selected character
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [selectedStyle, setSelectedStyle] = useState<
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
    | null
  >(null);

  // Carousel navigation
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch existing custom characters for this user
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    apiRequest("GET", `/api/characters?type=custom&userId=${user.uid}`)
      .then((data) => {
        const sortedCharacters = data
          .filter((c) => !/^__(?:DRAFT|SIDE_DRAFT)__?$/.test(c.name))
          .sort(
            (a: CustomCharacter, b: CustomCharacter) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        setCharacters(Array.isArray(sortedCharacters) ? sortedCharacters : []);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load custom characters.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [user, toast]);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const cardTotalWidth = 192 + 24;
        const count = Math.floor(width / cardTotalWidth) || 1;
        console.log("count", count);
        setVisibleCount(count);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  // When the user successfully creates a new character via the form
  const handleFormSubmit = (newCharacter: any) => {
    // Add it to the local list
    setCharacters((prev) => [...prev, newCharacter]);
    // Select the newly created character
    setSelectedCharacterId(newCharacter.id);
    // Hide the form
    setShowForm(false);
  };

  // Cancel form creation
  const handleCancelForm = () => {
    setShowForm(false);
  };

  // User clicks an existing character in the carousel
  // src/components/character/CustomCharacter.tsx
  const handleSelectCharacter = (charId: string) => {
    // mark which card is “active”
    setSelectedCharacterId(charId);

    // look up the full object
    const char = characters.find((c) => c.id === charId)!;

    // what bits do we still need?
    const missing: string[] = [];
    if (!char.age) missing.push("age");
    if (!char.gender) missing.push("gender");
    if (!(char.imageUrls?.length > 0)) missing.push("photos");

    if (missing.length === 0) {
      // ✅ everything’s filled in: hide any form, notify success, go next
      setShowForm(false);
      toast({
        title: "All set!",
        description: "Character profile complete.",
        variant: "success",
      });
    } else {
      // ⚠️ still missing some things: open the inline form
      setShowForm(true);
      setEditing(char);
      toast({
        title: "Please complete:",
        description: missing.join(", "),
        variant: "destructive",
      });
    }
  };

  // "Add Character" card in the carousel
  const handleAddCharacterClick = () => {
    setEditing(null);
    setShowForm(true);
    setSelectedCharacterId(null);
    setAutoOpenUpload(false);
    // You could also reset selectedCharacterId if you want
    // setSelectedCharacterId(null);
  };

  // Continue to the next step (e.g. story selection)
  const handleNextClick = () => {
    if (!selectedCharacterId) {
      toast({
        title: "No character selected",
        description: "Please choose or create a character first.",
        variant: "destructive",
      });
      return;
    }
    // if (!selectedStyle) {
    //   toast({
    //     title: "Style not chosen",
    //     description:
    //       "Please select a style (hyper-realistic or cartoonish) for your book.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    const selectedCharacter = characters.find(
      (c) => c.id === selectedCharacterId,
    );
    if (selectedCharacter) {
      onSubmit({ ...selectedCharacter, stylePreference: selectedStyle });
    }
  };

  // Carousel arrows
  const handlePrevCarousel = () => {
    setCarouselIndex(Math.max(0, carouselIndex - 1));
  };
  const handleNextCarousel = () => {
    setCarouselIndex(Math.min(characters.length - 2, carouselIndex + 1));
  };

  if (loading) {
    return <div>Loading custom characters...</div>;
  }

  return (
    <div className="mb-8">
      {/* Carousel Container */}
      <div className="relative px-4 sm:px-8">
        {/* Left arrow */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handlePrevCarousel}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 disabled:opacity-50"
            disabled={carouselIndex === 0}
          >
            <i className="fas fa-chevron-left text-gray-600"></i>
          </button>
        </div>

        {/* Carousel with "Add Character" + existing characters */}
        <div
          ref={containerRef}
          className="carousel-container overflow-x-auto hide-scrollbar snap-x snap-mandatory py-4"
        >
          <div className="flex space-x-6 px-4 sm:px-12">
            {/* Add Character card */}
            <Card
              className="flex-shrink-0 w-48 overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 border-dashed border-gray-300"
              onClick={handleAddCharacterClick}
            >
              <CardContent className="h-48 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <i className="fas fa-plus mb-2 text-xl"></i>
                  <p>Add Character</p>
                </div>
              </CardContent>
            </Card>

            {/* Existing characters */}
            {characters
              .slice(carouselIndex, carouselIndex + visibleCount)
              .map((char) => {
                const isSelected = char.id === selectedCharacterId;
                return (
                  <Card
                    key={char.id}
                    className={cn(
                      "flex-shrink-0 w-48 overflow-hidden transition-all cursor-pointer relative",
                      isSelected
                        ? "border-2 border-primary"
                        : "border border-transparent hover:border-gray-200",
                    )}
                    onClick={() => handleSelectCharacter(char.id)}
                  >
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={
                          char.imageUrls && char.imageUrls.length
                            ? char.imageUrls[0]
                            : "https://via.placeholder.com/300"
                        }
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-lg">{char.name}</h4>
                    </CardContent>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-imaginory-yellow text-imaginory-black rounded-full p-1">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>
        </div>

        {/* Right arrow */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handleNextCarousel}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 disabled:opacity-50"
            disabled={carouselIndex >= characters.length - visibleCount}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>

      {/* If "Add Character" was clicked, show the form below the carousel */}
      {showForm && (
        <div className="mt-8">
          <CustomCharacterForm
            initialData={editing ?? undefined}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSubmit={(char) => {
              if (editing) {
                // update existing
                setCharacters((all) =>
                  all.map((c) => (c.id === char.id ? char : c)),
                );
              } else {
                // new character
                setCharacters((all) => [char, ...all]);
              }
              setShowForm(false);
              setEditing(null);
              setSelectedCharacterId(char.id);
              onSubmit(char);
            }}
            autoOpenUpload={autoOpenUpload}
          />
        </div>
      )}

      {/* Import and use the StyleSelection component */}
      {/* {selectedCharacterId && (
        <StyleSelection
          onStyleSelected={(style) => setSelectedStyle(style)}
          selectedStyle={selectedStyle}
          originalImageUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2Fdownload.jpeg?alt=media&token=8f224333-c0f2-4b84-b6f3-916abee86f1f"
          hyperPixarUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fpixar-hyper.jpg?alt=media&token=63932a83-59d8-478c-829c-edd8ff64fb73"
          hyperHanddrawnUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fhand-drawn-hyper.jpg?alt=media&token=5df21821-5d22-4f8d-9646-61b689779a46"
          hyperWatercolorUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fwater-color-hyper.jpg?alt=media&token=96070ec7-6562-402e-ae7d-660fe82198ed"
          hyperCrayonartUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fcrayon-hyper.jpg?alt=media&token=0746af63-c471-481d-81f2-e4ee0cfd683b"
          hyperClaymotionUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fclaymotion-hyper.jpg?alt=media&token=73f0ccb6-018f-4b2e-ba79-18c98538acd6"
          hyperPastelsketchUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fpastel-hyper.jpg?alt=media&token=37fe7bb6-4d76-484c-9703-e04306d825ab"
          cartoonPixarUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fpixar-cartoon.jpg?alt=media&token=5b6ff3ff-1bf4-4d2a-a984-f6b795cb60c1"
          cartoonHanddrawnUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fhand-drawn-cartoon.jpg?alt=media&token=d28599e5-686b-4e3e-8f78-5b9a928e3e34"
          cartoonWatercolorUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fwater-color-cartoon.jpg?alt=media&token=7c10cccf-27b8-4930-8855-2393df2785bc"
          cartoonCrayonartUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fcrayon-cartoon.jpg?alt=media&token=3742c42e-fbb4-462e-89ff-016278a9b416"
          cartoonClaymotionUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fclaymotion-cartoon.jpg?alt=media&token=fc80b979-bf10-493f-aa61-08684cae1da8"
          cartoonPastelsketchUrl="https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/website_photos%2FimagesGenerated%2Fpastel-cartoon.jpg?alt=media&token=433c5e25-4e89-4b55-b9b4-decb4eb232ee"
        />
      )}
 */}
      {/* "Continue" button at the bottom */}
      <div className="flex justify-center mt-8">
        <Button
          variant="default"
          className="imaginory-button"
          onClick={handleNextClick}
          disabled={showForm || !selectedCharacterId}
        >
          Continue to Story Selection
        </Button>
      </div>
    </div>
  );
}
