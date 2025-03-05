import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Predefined character data
const PREDEFINED_CHARACTERS = [
  {
    id: 'adventure-alex',
    name: 'Adventure Alex',
    description: 'Brave and curious explorer',
    imageUrl: 'https://images.unsplash.com/photo-1566004100631-35d015d6a99c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80'
  },
  {
    id: 'brave-ben',
    name: 'Brave Ben',
    description: 'Kind and courageous friend',
    imageUrl: 'https://images.unsplash.com/photo-1595586497959-07a6efd2d959?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80'
  },
  {
    id: 'clever-chloe',
    name: 'Clever Chloe',
    description: 'Smart and resourceful',
    imageUrl: 'https://images.unsplash.com/photo-1588537862704-9611b98cb60d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80'
  },
  {
    id: 'magical-mia',
    name: 'Magical Mia',
    description: 'Creative and imaginative',
    imageUrl: 'https://images.unsplash.com/photo-1595460579452-7d8bbf816098?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80'
  },
  {
    id: 'strong-sam',
    name: 'Strong Sam',
    description: 'Determined and loyal',
    imageUrl: 'https://images.unsplash.com/photo-1591871937573-74dbba515c4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80'
  }
];

interface PredefinedCharactersProps {
  onSelectCharacter: (character: {
    id: string;
    name: string;
    type: 'predefined';
    predefinedId: string;
    imageUrl: string;
  }) => void;
}

export function PredefinedCharacters({ onSelectCharacter }: PredefinedCharactersProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleSelectCharacter = (charId: string) => {
    setSelectedCharacter(charId);
    const character = PREDEFINED_CHARACTERS.find(c => c.id === charId);
    if (character) {
      setCustomName(character.name);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
  };

  const handleNextClick = () => {
    if (selectedCharacter) {
      const character = PREDEFINED_CHARACTERS.find(c => c.id === selectedCharacter);
      if (character) {
        onSelectCharacter({
          id: selectedCharacter,
          name: customName || character.name,
          type: 'predefined',
          predefinedId: character.id,
          imageUrl: character.imageUrl
        });
      }
    }
  };

  const handlePrevCarousel = () => {
    setCarouselIndex(Math.max(0, carouselIndex - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex(Math.min(PREDEFINED_CHARACTERS.length - 3, carouselIndex + 1));
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
            {PREDEFINED_CHARACTERS.slice(carouselIndex, carouselIndex + 4).map((character) => (
              <Card 
                key={character.id}
                className={cn(
                  "flex-shrink-0 w-48 overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2",
                  selectedCharacter === character.id ? "border-primary" : "border-transparent hover:border-primary"
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
                  <p className="text-sm text-text-secondary">{character.description}</p>
                </CardContent>
              </Card>
            ))}
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
          <Label htmlFor="character-name" className="block text-sm font-medium text-gray-700 mb-1">
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
