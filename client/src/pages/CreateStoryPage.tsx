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

const STEPS = [
  { id: 1, name: "Choose Character" },
  { id: 2, name: "Select Story" },
  { id: 3, name: "Preview & Download" },
];

const DEBUG_LOGGING = true;

export default function CreateStoryPage() {
  // Global flow state
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
  const [baseStoryPrompt, setBaseStoryPrompt] = useState("");
  const [moral, setMoral] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);

  const { toast } = useToast();
  const [, navigate] = useLocation();

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
      !storyResult
    ) {
      // Model training is complete and all data is available.
      log("useEffect: Triggering story generation", {
        kidName,
        modelId,
        baseStoryPrompt,
        moral,
      });
      handleGenerateStoryWithData(kidName, modelId, baseStoryPrompt, moral)
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

  // STEP 2: When a story is selected, start story generation asynchronously
  // and move to Step 3 immediately.
  // const handleSelectStory = (story: any) => {
  //   log("Story selected:", story);
  //   setSelectedStory(story);
  //   // Use instructions if available; otherwise, fall back to description.
  //   const prompt = story.instructions || story.description || "";
  //   const moralValue = story.moral || "";
  //   // Set state for consistency if you need it later.
  //   setBaseStoryPrompt(prompt);
  //   setMoral(moralValue);
  //   // Mark generation as in progress.
  //   setGeneratingStory(true);
  //   // Call a helper that uses these values directly.
  //   handleGenerateStoryWithData(kidName, modelId, prompt, moralValue)
  //     .then(() => setGeneratingStory(false))
  //     .catch((err) => {
  //       setGeneratingStory(false);
  //       log("Error in generateStoryWithData:", err);
  //     });
  //   setCurrentStep(3);
  // };

  const handleSelectStory = (story: any) => {
    log("Story selected:", story);
    setSelectedStory(story);
    // Use instructions if available; if not, fallback to description.
    const prompt = story.instructions || story.description || "";
    const moralValue = story.moral || "";
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
  ) => {
    log("handleGenerateStoryWithData triggered", {
      kidName,
      modelId,
      prompt,
      moralValue,
    });
    try {
      // Optionally wait for modelId to be ready using your polling function.
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
    if (!kidName || !modelId || !prompt || !moralValue) {
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
      });
      return;
    }
    const payload = {
      kidName,
      modelId,
      baseStoryPrompt: prompt,
      moral: moralValue,
    };
    log("handleGenerateStoryWithData: Payload:", payload);
    try {
      setLoading(true);
      const response = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      log("handleGenerateStoryWithData: Response received:", data);
      setStoryResult(data);
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

  const handleGenerateStory = async () => {
    log("handleGenerateStory triggered");
    try {
      // Wait until modelId is available.
      await waitForModelId();
    } catch (err) {
      toast({
        title: "Model Training Delay",
        description: "Your model is still training. Please wait and try again.",
        variant: "destructive",
      });
      log("handleGenerateStory: Model training timeout", err);
      return;
    }

    if (!kidName || !modelId || !baseStoryPrompt || !moral) {
      toast({
        title: "Incomplete Data",
        description:
          "Ensure kid name, trained model, story prompt, and moral are provided.",
        variant: "destructive",
      });
      log("handleGenerateStory: Missing data after waiting", {
        kidName,
        modelId,
        baseStoryPrompt,
        moral,
      });
      return;
    }
    const payload = { kidName, modelId, baseStoryPrompt, moral };
    log("handleGenerateStory: Payload:", payload);
    try {
      setLoading(true);
      const response = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      log("handleGenerateStory: Response received:", data);
      setStoryResult(data);
    } catch (err: any) {
      log("handleGenerateStory: Generation error:", err);
      toast({
        title: "Generation Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update preview when storyResult is updated.
  useEffect(() => {
    log("useEffect: storyResult changed:", storyResult);
    if (storyResult) {
      const title =
        storyResult.sceneTexts && storyResult.sceneTexts[0]
          ? storyResult.sceneTexts[0]
          : "Your Story";
      setBookTitle(title);
      const pages = storyResult.pages.map((url: string, index: number) => ({
        id: index + 1,
        imageUrl: url,
        content: storyResult.sceneTexts[index] || "",
      }));
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
  };

  const handleRegenerate = (id: number) => {
    log("handleRegenerate: Regenerating image for page", id);
    toast({
      title: "Regenerating image",
      description: `Regenerating image for page ${id}...`,
    });
  };

  const handleResetAll = () => {
    if (storyResult) {
      const title = storyResult.sceneTexts[0];
      setBookTitle(title);
      const pages = storyResult.pages.map((url: string, index: number) => ({
        id: index + 1,
        imageUrl: url,
        content: storyResult.sceneTexts[index] || "",
      }));
      setBookPages(pages);
      log("handleResetAll: Reset pages to initial storyResult");
    }
  };

  const handleRegenerateAll = () => {
    log("handleRegenerateAll: Regenerating all pages");
    toast({
      title: "Regenerating all pages",
      description: "Regenerating all pages of your book...",
    });
  };

  const handleDownloadPDF = async () => {
    log("handleDownloadPDF: Downloading PDF with", { bookTitle, bookPages });
    try {
      await generatePDF(bookTitle, bookPages);
      await apiRequest("POST", "/api/books", {
        title: bookTitle,
        pages: bookPages,
        characterId: selectedCharacter.id,
        storyId: selectedStory.id,
      });
    } catch (error) {
      log("handleDownloadPDF: Error generating PDF:", error);
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

  const handlePrint = () => {
    log("handlePrint: Print button clicked");
    setShowShippingForm(true);
  };

  const handleShippingSubmit = async (formData: any) => {
    log("handleShippingSubmit: Submitting shipping form", formData);
    try {
      await apiRequest("POST", "/api/orders", {
        ...formData,
        bookTitle,
        characterId: selectedCharacter.id,
        storyId: selectedStory.id,
      });
      setOrderCompleted(true);
      setShowShippingForm(false);
      toast({
        title: "Order placed successfully!",
        description: "Your book will be delivered soon.",
      });
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
                <PredefinedStories onSelectStory={handleSelectStory} />
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
                  onResetAll={handleResetAll}
                  onRegenerateAll={handleRegenerateAll}
                  onDownload={handleDownloadPDF}
                  onPrint={handlePrint}
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
