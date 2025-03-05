import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StepIndicator } from "@/components/StepIndicator";
import { CharacterToggle } from "@/components/character/CharacterToggle";
import { PredefinedCharacters } from "@/components/character/PredefinedCharacters";
import { CustomCharacter } from "@/components/character/CustomCharacter";
import { StoryToggle } from "@/components/story/StoryToggle";
import { PredefinedStories } from "@/components/story/PredefinedStories";
import { CustomStory } from "@/components/story/CustomStory";
import { BookPreview } from "@/components/preview/BookPreview";
import { ShippingForm } from "@/components/preview/ShippingForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { generatePDF } from "@/utils/pdf";

const STEPS = [
  { id: 1, name: "Choose Character" },
  { id: 2, name: "Select Story" },
  { id: 3, name: "Preview & Download" }
];

// Mock pages for preview
const mockPages = [
  { id: 1, imageUrl: "https://images.unsplash.com/photo-1566140967404-b8b3932483f5?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "Adventure Alex in The Magical Forest" },
  { id: 2, imageUrl: "https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "Once upon a time, there was a brave adventurer named Alex who loved exploring." },
  { id: 3, imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "One day, Alex discovered a hidden path that led to a magical forest filled with wonders." },
  { id: 4, imageUrl: "https://images.unsplash.com/photo-1596328546171-77e37b5e8b3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "In the forest, Alex met a talking fox who needed help finding a special treasure." },
  { id: 5, imageUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "\"I'll help you,\" said Alex, showing kindness to the new friend." },
  { id: 6, imageUrl: "https://images.unsplash.com/photo-1516233758813-a38d024919c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "They searched through the dense trees and across bubbling streams." },
  { id: 7, imageUrl: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "Finally, they found the treasure - a magical seed that could grow a tree of friendship." },
  { id: 8, imageUrl: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "They planted the seed together and watched in amazement as it grew instantly." },
  { id: 9, imageUrl: "https://images.unsplash.com/photo-1483721310020-03333e577078?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "The forest animals gathered around to celebrate their new friendship." },
  { id: 10, imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80", content: "Alex learned that kindness and friendship are the greatest treasures of all." }
];

export default function CreateStoryPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [characterType, setCharacterType] = useState<'predefined' | 'custom'>('predefined');
  const [storyType, setStoryType] = useState<'predefined' | 'custom'>('predefined');
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookPages, setBookPages] = useState<typeof mockPages>([]);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Initialize book pages when story is selected
  useEffect(() => {
    if (selectedCharacter && selectedStory) {
      const title = `${selectedCharacter.name} in ${selectedStory.title}`;
      setBookTitle(title);
      
      // In a real app, we would generate the story here based on the character and story
      // For now, we'll use the mock pages
      setBookPages(mockPages.map(page => ({
        ...page,
        content: page.id === 1 ? title : page.content
      })));
    }
  }, [selectedCharacter, selectedStory]);

  const handleCharacterToggle = (type: 'predefined' | 'custom') => {
    setCharacterType(type);
  };

  const handleStoryToggle = (type: 'predefined' | 'custom') => {
    setStoryType(type);
  };

  const handleSelectCharacter = (character: any) => {
    setSelectedCharacter(character);
    setCurrentStep(2);
  };

  const handleSelectStory = (story: any) => {
    setSelectedStory(story);
    setCurrentStep(3);
  };

  const handleUpdatePage = (id: number, content: string) => {
    setBookPages(pages => 
      pages.map(page => page.id === id ? { ...page, content } : page)
    );
  };

  const handleRegenerate = (id: number) => {
    // In a real app, we would call an API to regenerate the image
    toast({
      title: "Regenerating image",
      description: `Regenerating image for page ${id}...`,
    });
  };

  const handleResetAll = () => {
    setBookPages(mockPages.map(page => ({
      ...page,
      content: page.id === 1 ? bookTitle : page.content
    })));
  };

  const handleRegenerateAll = () => {
    toast({
      title: "Regenerating all pages",
      description: "Regenerating all pages of your book...",
    });
  };

  const handleDownloadPDF = async () => {
    try {
      // Call the PDF generation function
      await generatePDF(bookTitle, bookPages);
      
      // Save book to database
      await apiRequest('POST', '/api/books', {
        title: bookTitle,
        pages: bookPages,
        characterId: selectedCharacter.id,
        storyId: selectedStory.id
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handlePrint = () => {
    setShowShippingForm(true);
  };

  const handleShippingSubmit = async (formData: any) => {
    try {
      await apiRequest('POST', '/api/orders', {
        ...formData,
        bookTitle,
        characterId: selectedCharacter.id,
        storyId: selectedStory.id
      });
      
      setOrderCompleted(true);
      setShowShippingForm(false);
      
      toast({
        title: "Order placed successfully!",
        description: "Your book will be delivered soon.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Order failed",
        description: "There was a problem placing your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleCreateNewStory = () => {
    setCurrentStep(1);
    setSelectedCharacter(null);
    setSelectedStory(null);
    setBookTitle("");
    setBookPages([]);
    setShowShippingForm(false);
    setOrderCompleted(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator currentStep={currentStep} steps={STEPS} />
          
          {/* Step 1: Choose Character */}
          {currentStep === 1 && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-heading font-bold text-center mb-2">Step 1: Choose Your Character</h2>
                <p className="text-center text-text-secondary">Select a predefined character or create your own custom hero!</p>
              </div>
              
              <CharacterToggle type={characterType} onToggle={handleCharacterToggle} />
              
              {characterType === 'predefined' ? (
                <PredefinedCharacters onSelectCharacter={handleSelectCharacter} />
              ) : (
                <CustomCharacter onSubmit={handleSelectCharacter} />
              )}
            </div>
          )}
          
          {/* Step 2: Choose Story */}
          {currentStep === 2 && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-heading font-bold text-center mb-2">Step 2: Choose Your Story</h2>
                <p className="text-center text-text-secondary">Select a predefined story or create your own custom adventure!</p>
              </div>
              
              <StoryToggle type={storyType} onToggle={handleStoryToggle} />
              
              {storyType === 'predefined' ? (
                <PredefinedStories onSelectStory={handleSelectStory} />
              ) : (
                <CustomStory onSubmit={handleSelectStory} />
              )}
              
              <div className="flex justify-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handleBackToStep(1)}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-text-primary font-bold py-3 px-6 rounded-full text-lg shadow-sm hover:shadow-md transition-all"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-heading font-bold text-center mb-2">Step 3: Preview Your Story</h2>
                <p className="text-center text-text-secondary">Review your book, make edits, and prepare to download or print</p>
              </div>
              
              <BookPreview
                bookTitle={bookTitle}
                pages={bookPages}
                onUpdatePage={handleUpdatePage}
                onRegenerate={handleRegenerate}
                onResetAll={handleResetAll}
                onRegenerateAll={handleRegenerateAll}
                onDownload={handleDownloadPDF}
                onPrint={handlePrint}
              />
              
              {showShippingForm && !orderCompleted && (
                <ShippingForm onSubmit={handleShippingSubmit} />
              )}
              
              {orderCompleted && (
                <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
                  <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
                  <span>Order successfully placed! Your book will be delivered soon.</span>
                </div>
              )}
              
              <div className="flex justify-center space-x-4 mt-8">
                {!orderCompleted && !showShippingForm && (
                  <Button
                    variant="outline"
                    onClick={() => handleBackToStep(2)}
                    className="border border-gray-300 bg-white hover:bg-gray-50 text-text-primary font-bold py-3 px-6 rounded-full text-lg shadow-sm hover:shadow-md transition-all"
                  >
                    Back
                  </Button>
                )}
                
                {orderCompleted && (
                  <Button
                    onClick={handleCreateNewStory}
                    className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Create New Story
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
