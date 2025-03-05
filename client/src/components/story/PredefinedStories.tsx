import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Predefined story data by age group
const PREDEFINED_STORIES = {
  '3-5': [
    {
      id: 'magical-forest',
      title: 'The Magical Forest',
      description: 'An adventure through an enchanted forest where animals talk and trees whisper secrets.',
      moral: 'Kindness and friendship',
      imageUrl: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    },
    {
      id: 'underwater-kingdom',
      title: 'Underwater Kingdom',
      description: 'Dive deep into the ocean to help merfolk save their coral reef from pollution.',
      moral: 'Environmental care',
      imageUrl: 'https://images.unsplash.com/photo-1551950627-023ad5589333?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    },
    {
      id: 'friendly-dragon',
      title: 'The Friendly Dragon',
      description: 'Meet a friendly dragon who just wants to make new friends in the village.',
      moral: 'Don\'t judge by appearances',
      imageUrl: 'https://images.unsplash.com/photo-1518164147695-46c988603571?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    }
  ],
  '6-8': [
    {
      id: 'space-explorer',
      title: 'Space Explorer',
      description: 'A journey through the stars where your child discovers new planets and makes alien friends.',
      moral: 'Courage and curiosity',
      imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    },
    {
      id: 'dragon-rescue',
      title: 'Dragon Rescue',
      description: 'Help a lost baby dragon find its family while learning valuable lessons.',
      moral: 'Compassion and responsibility',
      imageUrl: 'https://images.unsplash.com/photo-1518164147695-46c988603571?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    },
    {
      id: 'treasure-hunters',
      title: 'Treasure Hunters',
      description: 'Find a mysterious map and go on a treasure hunt with unexpected results.',
      moral: 'Teamwork and sharing',
      imageUrl: 'https://images.unsplash.com/photo-1630343710506-89f8b9f21d31?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    }
  ],
  '9-12': [
    {
      id: 'time-traveler',
      title: 'The Time Traveler',
      description: 'Travel through time to witness historical events and learn about different eras.',
      moral: 'Learning from history',
      imageUrl: 'https://images.unsplash.com/photo-1620428268482-cf1851a383b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    },
    {
      id: 'robot-friend',
      title: 'The Robot Friend',
      description: 'Build a robot friend who helps solve problems in unexpected ways.',
      moral: 'Innovation and creativity',
      imageUrl: 'https://images.unsplash.com/photo-1535378273068-9bb67d5b90d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    },
    {
      id: 'detective-case',
      title: 'The Detective Case',
      description: 'Solve a neighborhood mystery using clues and detective skills.',
      moral: 'Critical thinking and observation',
      imageUrl: 'https://images.unsplash.com/photo-1591267990532-e5bdb1b0ceb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80'
    }
  ]
};

type AgeGroup = '3-5' | '6-8' | '9-12';

interface Story {
  id: string;
  title: string;
  description: string;
  moral: string;
  imageUrl: string;
}

interface PredefinedStoriesProps {
  onSelectStory: (story: {
    id: string;
    title: string;
    type: 'predefined';
    predefinedId: string;
    imageUrl: string;
  }) => void;
}

export function PredefinedStories({ onSelectStory }: PredefinedStoriesProps) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>('3-5');
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const currentStories = PREDEFINED_STORIES[selectedAgeGroup];

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
      const story = currentStories.find(s => s.id === selectedStory);
      if (story) {
        onSelectStory({
          id: selectedStory,
          title: story.title,
          type: 'predefined',
          predefinedId: story.id,
          imageUrl: story.imageUrl
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
      <div className="flex justify-center mb-6 space-x-2">
        <button 
          className={cn(
            "py-1 px-4 rounded-full text-sm font-medium",
            selectedAgeGroup === '3-5' ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
          )}
          onClick={() => handleAgeFilterChange('3-5')}
        >
          Ages 3-5
        </button>
        <button 
          className={cn(
            "py-1 px-4 rounded-full text-sm font-medium",
            selectedAgeGroup === '6-8' ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
          )}
          onClick={() => handleAgeFilterChange('6-8')}
        >
          Ages 6-8
        </button>
        <button 
          className={cn(
            "py-1 px-4 rounded-full text-sm font-medium",
            selectedAgeGroup === '9-12' ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
          )}
          onClick={() => handleAgeFilterChange('9-12')}
        >
          Ages 9-12
        </button>
      </div>
      
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
            {currentStories.slice(carouselIndex, carouselIndex + 3).map((story) => (
              <Card 
                key={story.id}
                className={cn(
                  "flex-shrink-0 w-72 overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2",
                  selectedStory === story.id ? "border-primary" : "border-transparent hover:border-primary"
                )}
                onClick={() => handleSelectStory(story.id)}
              >
                <div className="w-full h-40 overflow-hidden">
                  <img 
                    src={story.imageUrl} 
                    className="w-full h-full object-cover" 
                    alt={story.title} 
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading font-bold text-lg">{story.title}</h3>
                  <p className="text-sm text-text-secondary mb-2">{story.description}</p>
                  <div className="flex items-center text-xs text-primary font-medium">
                    <i className="fas fa-star mr-1"></i>
                    <span>Moral: {story.moral}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
          <button 
            onClick={handleNextCarousel}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 disabled:opacity-50"
            disabled={carouselIndex >= currentStories.length - 2}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button 
          onClick={handleNextClick}
          disabled={!selectedStory}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Next: Preview Story
        </Button>
      </div>
    </div>
  );
}
