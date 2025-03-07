import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Predefined character data
const PREDEFINED_CHARACTERS = [
  {
    id: "adventure-alex",
    name: "Adventure Alex",
    age: 5,
    gender: "male",
    description: "Brave and curious explorer",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/swarmskill.firebasestorage.app/o/kids-photos%2F1737897318360-albedobase_xl_a_consistent_soft_3d_cartoon_boy_aged_3_years_wi_0_5e6df365-f4e4-4b65-8db7-a962e9015160.jpg?alt=media&token=4f7ab96d-dc05-493e-a57b-31c888dbabcc&ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "caring-chloe",
    name: "Caring Chloe ",
    age: 5,
    gender: "female",
    description: "Kind and courageous friend",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/swarmskill.firebasestorage.app/o/kids-photos%2Fprofile_Anaya_266b3909-923d-441b-ac5b-5b4ae8d06c79.jpeg?alt=media&token=096f3ae2-9a58-4b70-baec-fa3fb2e6fa74&ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "friendly-farhan",
    name: "Friendly Farhan",
    age: 7,
    gender: "male",
    description: "Smart and resourceful",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/swarmskill.firebasestorage.app/o/kids-photos%2Fprofile_Ravi_a5a58fed-7212-4168-b6ca-a89f72e2c743.jpeg?alt=media&token=6d1d2cc2-0861-4aa0-9756-1733d23bb558",
  },
  {
    id: "magical-mia",
    name: "Magical Mia",
    age: 8,
    gender: "female",
    description: "Creative and imaginative",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/swarmskill.firebasestorage.app/o/kids-photos%2Fprofile_Nia_9220a4f6-28e4-4674-ba71-2fb315c0ed3e.jpeg?alt=media&token=d0b97698-e650-4cba-9b2a-9dd12caa2a99&ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    id: "strong-sam",
    name: "Strong Sam",
    age: 6,
    gender: "male",
    description: "Determined and loyal",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/swarmskill.firebasestorage.app/o/kids-photos%2Fprofile_Arjun_32d9d9ac-99c7-4395-8b4f-a8bcb3a99cb8.jpeg?alt=media&token=12ac9ee7-c8aa-4d4d-96be-9181b2d84476&ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80",
  },
];

interface PredefinedCharactersProps {
  onSelectCharacter: (character: {
    id: string;
    name: string;
    type: "predefined";
    predefinedId: string;
    imageUrl: string[];
    age: number;
    gender: string;
  }) => void;
}

export function PredefinedCharacters({
  onSelectCharacter,
}: PredefinedCharactersProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null,
  );
  const [customName, setCustomName] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleSelectCharacter = (charId: string) => {
    setSelectedCharacter(charId);
    const character = PREDEFINED_CHARACTERS.find((c) => c.id === charId);
    if (character) {
      setCustomName(character.name);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
  };

  const handleNextClick = () => {
    if (selectedCharacter) {
      const character = PREDEFINED_CHARACTERS.find(
        (c) => c.id === selectedCharacter,
      );
      if (character) {
        onSelectCharacter({
          id: selectedCharacter,
          name: customName || character.name,
          type: "predefined",
          predefinedId: character.id,
          imageUrls: [character.imageUrl],
          age: character.age,
          gender: character.gender,
        });
      }
    }
  };

  const handlePrevCarousel = () => {
    setCarouselIndex(Math.max(0, carouselIndex - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex(
      Math.min(PREDEFINED_CHARACTERS.length - 3, carouselIndex + 1),
    );
  };

  return (
    <div className="mb-8">
      <div className="relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handlePrevCarousel}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 disabled:opacity-50"
            disabled={carouselIndex === 0}
          >
            <i className="fas fa-chevron-left text-gray-600"></i>
          </button>
        </div>

        <div className="carousel-container overflow-x-auto hide-scrollbar py-4">
          <div className="flex space-x-6 px-12">
            {PREDEFINED_CHARACTERS.slice(carouselIndex, carouselIndex + 4).map(
              (character) => (
                <Card
                  key={character.id}
                  className={cn(
                    "flex-shrink-0 w-48 overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2",
                    selectedCharacter === character.id
                      ? "border-primary"
                      : "border-transparent hover:border-primary",
                  )}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={character.imageUrl}
                      className="w-full h-full object-cover"
                      alt={character.name}
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-heading font-bold">{character.name}</h3>
                    <p className="text-sm text-text-secondary">
                      {character.description}
                    </p>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>

        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handleNextCarousel}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 disabled:opacity-50"
            disabled={carouselIndex >= PREDEFINED_CHARACTERS.length - 3}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>

      <div className="mt-8 max-w-md mx-auto">
        <div className="mb-6">
          <Label
            htmlFor="character-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Customize Character Name
          </Label>
          <Input
            type="text"
            id="character-name"
            className="minimal-input w-full"
            placeholder="Enter character name"
            value={customName}
            onChange={handleNameChange}
            disabled={!selectedCharacter}
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleNextClick}
            disabled={!selectedCharacter}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-md shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Story Selection
          </button>
        </div>
      </div>
    </div>
  );
}
