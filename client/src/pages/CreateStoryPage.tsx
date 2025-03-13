import { useState, useEffect, useRef } from "react";
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
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { generatePDF } from "@/utils/pdf";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  { id: 1, name: "Choose Character" },
  { id: 2, name: "Select Story" },
  { id: 3, name: "Preview & Download" },
];

const DEBUG_LOGGING = true;

export default function CreateStoryPage() {
  // Global flow state
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [characterType, setCharacterType] = useState<"predefined" | "custom">(
    "predefined",
  );
  const [storyType, setStoryType] = useState<"predefined" | "custom">(
    "predefined",
  );
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  // Book preview state
  const [bookTitle, setBookTitle] = useState("");
  const [bookPages, setBookPages] = useState<any[]>([]);
  const [storyResult, setStoryResult] = useState<any | null>(null);

  // Shipping / order states
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);

  // Data for training / generation
  const [modelId, setModelId] = useState("");
  const [kidName, setKidName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [backCoverUrl, setBackCoverUrl] = useState("");
  const [baseStoryPrompt, setBaseStoryPrompt] = useState("");
  const [moral, setMoral] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);

  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [bookId, setBookId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Logging helper
  const log = (...args: any[]) => {
    if (DEBUG_LOGGING) {
      console.log("[CreateStoryPage]", ...args);
    }
  };

  const modelIdRef = useRef(modelId);
  useEffect(() => {
    modelIdRef.current = modelId;
    log("useEffect: modelId updated:", modelId);
  }, [modelId]);

  useEffect(() => {
    if (
      currentStep === 3 &&
      modelId &&
      baseStoryPrompt &&
      moral &&
      selecetedCharacter &&
      selectedStory &&
      !storyResult
    ) {
      // Model training is complete and all data is available.
      log("useEffect: Triggering story generation", {
        kidName,
        modelId,
        baseStoryPrompt,
        moral,
      });
      handleGenerateStoryWithData(
        kidName,
        modelId,
        baseStoryPrompt,
        moral,
        `${selectedCharacter.name} and ${selectedStory.title}`
      )
        .then(() => setGeneratingStory(false))
        .catch((err) => {
          setGeneratingStory(false);
          log("Error in story generation:", err);
        });
    }
  }, [currentStep, modelId, baseStoryPrompt, moral, storyResult]);

  // STEP 1: When a character is selected, start training asynchronously.
  const handleSelectCharacter = (character: any) => {
    log("Character selected:", character);
    setSelectedCharacter(character);
    setKidName(character.name);
    // Kick off training without awaiting.
    handleTrainModel(character);
    setCurrentStep(2);
  };

  const handleSelectStory = (story: any) => {
    log("Story selected:", story);
    setSelectedStory(story);
    // Use instructions if available; if not, fallback to description.
    const prompt = story.instructions || story.description || "";
    const moralValue =
      story.moral ||
      (story.elements && story.elements.length > 0
        ? story.elements.join(", ")
        : "");
    setBaseStoryPrompt(prompt);
    setMoral(moralValue);
    setGeneratingStory(true);
    setCurrentStep(3);
  };

  const handleGenerateStoryWithData = async (
    kidName: string,
    modelId: string,
    prompt: string,
    moralValue: string,
    currentBookTitle: string,
  ) => {
    log("handleGenerateStoryWithData triggered", {
      kidName,
      modelId,
      prompt,
      moralValue,
      currentBookTitle,
    });

    try {
      // Wait for model training to finish
      await waitForModelId();
    } catch (err) {
      toast({
        title: "Model Training Delay",
        description: "Your model is still training. Please wait and try again.",
        variant: "destructive",
      });
      log("Model training timeout:", err);
      return;
    }

    // Validate necessary data before proceeding
    if (!kidName || !modelId || !prompt || !moralValue || !currentBookTitle) {
      toast({
        title: "Incomplete Data",
        description: "Missing kid name, modelId, prompt, or moral.",
        variant: "destructive",
      });
      log("handleGenerateStoryWithData: Missing data", {
        kidName,
        modelId,
        prompt,
        moralValue,
        currentBookTitle,
      });
      return;
    }

    const payload = {
      kidName,
      modelId,
      baseStoryPrompt: prompt,
      moral: moralValue,
      title: currentBookTitle,
    };

    try {
      setLoading(true);

      // Generate the story
      const response = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      log("handleGenerateStoryWithData: Response received:", data);
      setStoryResult(data);
      setCoverUrl(data.coverUrl);
      setBackCoverUrl(data.backCoverUrl);

      // Immediately save the generated story as a book
      if (user) {
        const pagesCombined = data.pages.map((url: string, index: number) => ({
          imageUrl: url,
          content: data.sceneTexts[index] || "",
        }));

        const newBook = {
          title:
            selectedCharacter && selectedStory
              ? `${selectedCharacter.name} and ${selectedStory.title}`
              : "Your Story",
          pages: pagesCombined, // Use the combined array here
          coverUrl: data.coverUrl,
          backCoverUrl: data.backCoverUrl,
          createdAt: new Date().toISOString(),
          userId: String(user.uid), // Convert numeric user.id to string
          userName: user.displayName,
          characterId: String(selectedCharacter?.id), // Ensure it's a string
          storyId: String(selectedStory?.id), // Ensure it's a string
        };

        try {
          log("Sending newBook to /api/books:", newBook); // extra logging for debugging
          const savedBook = await apiRequest("POST", "/api/books", newBook);
          setBookId(savedBook.id);
          console.log(bookId);
          log("Book saved via API to Firestore successfully.");
          toast({
            title: "Book saved!",
            description: "Your story has been successfully saved.",
          });
        } catch (error) {
          log("Error saving book via API:", error);
          toast({
            title: "Save Error",
            description: "Failed to save your book.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      log("handleGenerateStoryWithData: Generation error:", err);
      toast({
        title: "Generation Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger model training using the provided character data.
  const handleTrainModel = async (character: any) => {
    console.log("handleTrainModel triggered", character);
    if (character.modelId) {
      setModelId(character.modelId);
      toast({
        title: "Model already trained",
        description: "Using the existing trained model for this character.",
      });
      return;
    } else {
      toast({
        title: "Model not there",
        description: "Training a new model for your character.",
      });
    }
    if (
      !character ||
      !character.imageUrls ||
      character.imageUrls.length === 0
    ) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of your character",
        variant: "destructive",
      });
      log("handleTrainModel: No images found");
      return;
    }
    log("handleTrainModel: Training model with character:", character);
    try {
      const captions = character.imageUrls.map(() => character.name);
      const payload = {
        imageUrls: character.imageUrls,
        captions,
        modelName: "kids_custom_model",
      };
      log("handleTrainModel: Training payload:", payload);
      const response = await fetch("/api/trainModel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      log("handleTrainModel: Training response received:", data);
      setModelId(data.modelId);
      await apiRequest("PUT", `/api/characters/${character.id}`, {
        modelId: data.modelId,
      });
      toast({
        title: "Model Training Complete",
        description: "Your custom model is ready to generate your story!",
      });
    } catch (err: any) {
      log("handleTrainModel: Training error:", err);
      toast({
        title: "Training Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Trigger story generation using the trained model and provided story inputs.
  const waitForModelId = async (timeout = 60000, interval = 2000) => {
    const startTime = Date.now();
    while (true) {
      if (modelIdRef.current && modelIdRef.current !== "") {
        return;
      }
      if (Date.now() - startTime > timeout) {
        throw new Error("Model training did not complete in time.");
      }
      log("Waiting for modelId... current value:", modelIdRef.current);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  };

  // Update preview when storyResult is updated.
  useEffect(() => {
    log("useEffect: storyResult changed:", storyResult);
    if (storyResult) {
      const title =
        selectedCharacter && selectedStory
          ? `${selectedCharacter.name} and ${selectedStory.title}`
          : "Your Story";
      setBookTitle(title);
      // Map the generated story pages (shift indices by 1 for cover)
      const generatedPages = storyResult.pages.map(
        (url: string, index: number) => ({
          id: index + 2, // starting from 2 because 1 is reserved for cover
          imageUrl: url,
          content: storyResult.sceneTexts[index] || "",
        }),
      );
      const pages = [
        {
          id: 1,
          imageUrl: storyResult.coverUrl, // cover image
          content: title, // show the title as text on the cover
          isCover: true, // flag to help rendering
        },
        ...generatedPages,
        {
          id: generatedPages.length + 2, // last page id
          imageUrl: storyResult.backCoverUrl, // back cover image
          content: "", // blank text for back cover
          isBackCover: true, // flag for rendering back cover
        },
      ];

      setBookPages(pages);
      log("useEffect: Updated bookTitle and bookPages:", { title, pages });
    }
  }, [storyResult]);

  // Utility handlers remain unchanged.
  const handleUpdatePage = (id: number, content: string) => {
    log("handleUpdatePage: Updating page", { id, content });
    setBookPages((pages) =>
      pages.map((page) => (page.id === id ? { ...page, content } : page)),
    );
    setIsDirty(true);
  };

  const handleRegenerate = async (pageId: number) => {
    // Find the page in the current bookPages state.
    const page = bookPages.find((p) => p.id === pageId);
    if (!page) {
      log("handleRegenerate: Page not found", pageId);
      return;
    }

    let payload = { modelId, prompt: "", isCover: false };

    if (page.isCover || page.isBackCover) {
      // Use the edited title from the first page content if available.
      const currentTitle = bookPages[0]?.content || bookTitle;
      payload.prompt = page.isCover
        ? `<kidStyle> A captivating cover photo for the title: ${currentTitle}`
        : `<kidStyle> A creative back cover image for the book`;
      payload.isCover = true;
      log(
        `handleRegenerate: Regenerating ${page.isCover ? "cover" : "back cover"} for page ${pageId} using prompt: ${payload.prompt}`,
      );
    } else {
      // For regular pages, use the current (edited) text as the prompt.
      payload.prompt = page.content;
      log(
        `handleRegenerate: Regenerating image for page ${pageId} using prompt: ${payload.prompt}`,
      );
    }

    try {
      const response = await fetch("/api/regenerateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("API error");
      }
      const data = await response.json();
      const newUrl = data.newUrl;
      log(`handleRegenerate: New image URL for page ${pageId}: ${newUrl}`);
      // Update the page with the new image URL
      setBookPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, imageUrl: newUrl } : p)),
      );
      setIsDirty(true);
    } catch (error) {
      log("handleRegenerate: Error regenerating image for page", pageId, error);
      toast({
        title: "Regeneration Error",
        description: `Failed to regenerate image for page ${pageId}.`,
        variant: "destructive",
      });
    }
  };

  const handleSaveBook = async () => {
    if (!bookId) {
      toast({
        title: "Save Error",
        description: "Book ID not available.",
        variant: "destructive",
      });
      return;
    }

    const pagesToSave = bookPages.filter((p) => !p.isCover && !p.isBackCover);

    try {
      setLoading(true);
      // Build the updated book data.
      // We use the current bookPages and bookTitle.
      const updatedBook = {
        title: bookTitle,
        pages: pagesToSave,
        coverUrl: bookPages[0]?.isCover ? bookPages[0].imageUrl : null,
        backCoverUrl: bookPages[bookPages.length - 1]?.isBackCover
          ? bookPages[bookPages.length - 1].imageUrl
          : null,
        characterId: String(selectedCharacter?.id),
        storyId: String(selectedStory?.id),
      };
      log("handleSaveBook: Updating book with data:", updatedBook);

      // Assuming you have a PUT API endpoint like `/api/books/:id`
      const savedBook = await apiRequest(
        "PUT",
        `/api/books/${bookId}`,
        updatedBook,
      );

      // Update the local bookPages and other state if necessary.
      setIsDirty(false);
      toast({
        title: "Save Successful",
        description: "Your book has been updated.",
      });
      log("handleSaveBook: Book saved successfully", savedBook);
    } catch (error) {
      log("handleSaveBook: Error saving book", error);
      toast({
        title: "Save Error",
        description: "Failed to update book.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleResetAll = () => {
  //   if (storyResult) {
  //     const title = storyResult.sceneTexts[0];
  //     setBookTitle(title);
  //     const pages = storyResult.pages.map((url: string, index: number) => ({
  //       id: index + 1,
  //       imageUrl: url,
  //       content: storyResult.sceneTexts[index] || "",
  //     }));
  //     setBookPages(pages);
  //     log("handleResetAll: Reset pages to initial storyResult");
  //   }
  // };

  const handleRegenerateAll = async () => {
    log("handleRegenerateAll: Regenerating all pages.");
    try {
      // Create an array of regeneration promises for each page.
      const regenerationPromises = bookPages.map((page) => {
        return handleRegenerate(page.id);
      });
      // Wait for all regeneration requests to finish.
      await Promise.all(regenerationPromises);
      toast({
        title: "Regeneration complete",
        description: "All pages have been regenerated.",
      });
      log("handleRegenerateAll: All pages regenerated successfully.");
    } catch (error) {
      log("handleRegenerateAll: Error regenerating pages", error);
      toast({
        title: "Regeneration Error",
        description: "Failed to regenerate one or more pages.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookTitle,
          pages: bookPages,
          coverUrl: coverUrl,
          backCoverUrl: backCoverUrl,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bookTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Download Error",
        description: "Failed to generate PDF.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    log("handlePrint: Print button clicked");
    setShowShippingForm(true);
  };

  const handleShippingSubmit = async (formData: any) => {
    log("handleShippingSubmit: Submitting shipping form", formData);
    try {
      if (user) {
        await apiRequest("POST", "/api/orders", {
          ...formData,
          bookId: bookId,
          characterId: selectedCharacter.id,
          storyId: selectedStory.id,
          userId: user.uid,
        });
        setOrderCompleted(true);
        setShowShippingForm(false);
        toast({
          title: "Order placed successfully!",
          description: "Your book will be delivered soon.",
        });
      }
    } catch (error) {
      log("handleShippingSubmit: Order submission error:", error);
      toast({
        title: "Order failed",
        description:
          "There was a problem placing your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToStep = (step: number) => {
    log("handleBackToStep: Navigating back to step", step);
    setCurrentStep(step);
  };

  const handleCreateNewStory = () => {
    log(
      "handleCreateNewStory: Resetting all story data for new story creation",
    );
    setCurrentStep(1);
    setSelectedCharacter(null);
    setSelectedStory(null);
    setBookTitle("");
    setBookPages([]);
    setStoryResult(null);
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
                <h2 className="text-3xl font-heading font-bold text-center mb-2">
                  Step 1: Choose Your Character
                </h2>
                <p className="text-center text-text-secondary">
                  Select a predefined character or create your own custom hero!
                </p>
              </div>
              <CharacterToggle
                type={characterType}
                onToggle={setCharacterType}
              />
              {characterType === "predefined" ? (
                <PredefinedCharacters
                  onSelectCharacter={handleSelectCharacter}
                />
              ) : (
                <CustomCharacter onSubmit={handleSelectCharacter} />
              )}
            </div>
          )}

          {/* Step 2: Choose Story */}
          {currentStep === 2 && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-heading font-bold text-center mb-2">
                  Step 2: Choose Your Story
                </h2>
                <p className="text-center text-text-secondary">
                  Select a predefined story or create your own custom adventure!
                </p>
              </div>
              <StoryToggle type={storyType} onToggle={setStoryType} />
              {storyType === "predefined" ? (
                <PredefinedStories
                  onSelectStory={handleSelectStory}
                  characterName={selectedCharacter?.name}
                />
              ) : (
                <CustomStory onSubmit={handleSelectStory} />
              )}
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
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
                <h2 className="text-3xl font-heading font-bold text-center mb-2">
                  Step 3: Preview Your Story
                </h2>
                <p className="text-center text-text-secondary">
                  Review your book, make edits, and prepare to download or print
                </p>
              </div>
              {/* Show a buffering message while story is generating */}
              {generatingStory && (
                <div className="flex justify-center mt-8">
                  <p className="text-lg text-center">
                    Creating the perfect story... making your character
                    life-like and magical...
                  </p>
                </div>
              )}
              {/* Once generation is complete, show the book preview */}
              {!generatingStory && storyResult && (
                <BookPreview
                  bookTitle={bookTitle}
                  pages={bookPages}
                  onUpdatePage={handleUpdatePage}
                  onRegenerate={handleRegenerate}
                  onRegenerateAll={handleRegenerateAll}
                  onDownload={handleDownloadPDF}
                  onPrint={handlePrint}
                  onSave={handleSaveBook}
                  isDirty={isDirty}
                />
              )}
              {showShippingForm && !orderCompleted && (
                <ShippingForm onSubmit={handleShippingSubmit} />
              )}
              {orderCompleted && (
                <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
                  <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
                  <span>
                    Order successfully placed! Your book will be delivered soon.
                  </span>
                </div>
              )}
              <div className="flex justify-center space-x-4 mt-8">
                {!orderCompleted && !showShippingForm && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
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
