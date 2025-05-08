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
  // User Authentication
  const { user } = useAuth();

  // Navigation & UI States
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  // Character & Story States
  const [characterType, setCharacterType] = useState<"predefined" | "custom">(
    "predefined",
  );
  const [storyType, setStoryType] = useState<"predefined" | "custom">(
    "predefined",
  );
  const [activeCharacter, setActiveCharacter] = useState<any | null>(null);
  const [activeStory, setActiveStory] = useState<any | null>(null);

  // Story Metadata
  const [bookTitle, setBookTitle] = useState("");
  const [storyPages, setStoryPages] = useState<any[]>([]);
  const [storyData, setStoryData] = useState<any | null>(null);

  // Book Parameters
  const [bookStyle, setBookStyle] = useState<
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
  const [storyPrompt, setStoryPrompt] = useState("");
  const [storyMoral, setStoryMoral] = useState("");
  const [storyRhyming, setStoryRhyming] = useState(false);
  const [storyTheme, setStoryTheme] = useState<string>("none");

  // Training & Generation States
  const [modelId, setModelId] = useState("");
  const modelIdRef = useRef(modelId);
  const [kidName, setKidName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);

  // Book Management
  const [bookId, setBookId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Cover & Back Cover URLs
  const [coverUrl, setCoverUrl] = useState("");
  const [backCoverUrl, setBackCoverUrl] = useState("");

  // Shipping / Orders
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  // Logging helper
  const log = (...args: any[]) => {
    if (DEBUG_LOGGING) {
      console.log("[CreateStoryPage]", ...args);
    }
  };

  useEffect(() => {
    modelIdRef.current = modelId;
    log("useEffect: modelId updated:", modelId);
  }, [modelId]);

  useEffect(() => {
    if (
      currentStep === 3 &&
      modelId &&
      storyPrompt &&
      storyMoral &&
      activeCharacter &&
      activeStory &&
      !storyData
    ) {
      // Model training is complete and all data is available.
      log("useEffect: Triggering story generation", {
        kidName,
        modelId,
        storyPrompt,
        storyMoral,
      });

      const storyTitle =
        storyType === "predefined"
          ? `${activeCharacter.name} and ${activeStory.title}`
          : `${activeStory.title}`;
      log("useEffect: storyTitle:", storyTitle);
      handleGenerateStoryWithData(
        kidName,
        modelId,
        storyPrompt,
        storyMoral,
        storyTitle,
        storyRhyming,
        storyTheme,
      )
        .then(() => setGeneratingStory(false))
        .catch((err) => {
          setGeneratingStory(false);
          log("Error in story generation:", err);
        });
    }
  }, [currentStep, modelId, storyPrompt, storyMoral, storyData]);

  // Update preview when storyResult is updated.
  useEffect(() => {
    log("useEffect: storyData changed:", storyData);
    if (storyData) {
      const title =
        storyType === "predefined"
          ? `${activeCharacter.name} and ${activeStory.title}`
          : `${activeStory.title}`;
      setBookTitle(title);
      const generatedPages = storyData.pages.map((url, index) => {
        const scene = storyData.sceneTexts[index] || "";
        return {
          id: index + 2,
          imageUrl: url,
          content: scene,
        };
      });
      const pages = [
        {
          id: 1,
          imageUrl: storyData.coverUrl,
          content: title,
          isCover: true,
        },
        ...generatedPages,
        {
          id: generatedPages.length + 2,
          imageUrl: storyData.backCoverUrl,
          content: "",
          isBackCover: true,
        },
      ];
      setStoryPages(pages);
      log("useEffect: Updated bookTitle and storyPages:", { title, pages });
    }
  }, [storyData]);

  // STEP 1: When a character is selected, start training asynchronously.
  const handleSelectCharacter = (character: any) => {
    log("Character selected:", character);
    setActiveCharacter(character);
    setKidName(character.name);
    setBookStyle(
      character.type === "custom" ? character.stylePreference : "predefined",
    );
    // Kick off training without awaiting.
    handleTrainModel(character);
    setCurrentStep(2);
  };

  const handleSelectStory = (story: any) => {
    log("Story selected:", story);
    setActiveStory(story);
    // Use instructions if available; if not, fallback to description.
    const prompt = story.instructions || story.description || "";
    const moralValue = story.moral || "";
    console.log(story.rhyming, story.theme, story.moral);
    setStoryRhyming(story.rhyming);
    setStoryTheme(story.theme || "none");
    setStoryPrompt(prompt);
    setStoryMoral(moralValue);
    setGeneratingStory(true);
    setCurrentStep(3);
  };

  const handleGenerateStoryWithData = async (
    kidName: string,
    modelId: string,
    prompt: string,
    moralValue: string,
    currentBookTitle: string,
    storyRhyming: boolean,
    storyTheme: string,
  ) => {
    log("handleGenerateStoryWithData triggered", {
      kidName,
      modelId,
      prompt,
      moralValue,
      currentBookTitle,
      storyRhyming,
      storyTheme,
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
      stylePreference:
        activeCharacter.type === "custom" ? bookStyle : "predefined",
      age: activeCharacter.age,
      gender: activeCharacter.gender,
      storyRhyming: storyRhyming || false,
      storyTheme: storyTheme || "none",
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
      setStoryData(data);
      setCoverUrl(data.coverUrl);
      setBackCoverUrl(data.backCoverUrl);

      const formattedPages = data.pages.map((url: string, index: number) => {
        const scene = data.sceneTexts[index] || "";

        return {
          id: index + 2,
          imageUrl: url,
          content: storyRhyming ? scene.split("\n") : scene,
        };
      });

      setStoryPages([
        {
          id: 1,
          imageUrl: data.coverUrl,
          content: currentBookTitle,
          isCover: true,
        },
        ...formattedPages,
        {
          id: formattedPages.length + 2,
          imageUrl: data.backCoverUrl,
          content: "",
          isBackCover: true,
        },
      ]);

      // Immediately save the generated story as a book
      if (user) {
        const newBook = {
          title: currentBookTitle,
          pages: formattedPages,
          coverUrl: data.coverUrl,
          backCoverUrl: data.backCoverUrl,
          createdAt: new Date().toISOString(),
          userId: String(user.uid),
          userName: user.displayName,
          characterId: String(activeCharacter?.id),
          storyId: String(activeStory?.id),
          stylePreference:
            activeCharacter.type === "custom" ? bookStyle : "predefined",
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
        kidName: character.name,
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

  // Utility handlers remain unchanged.
  const handleUpdatePage = (id: number, content: string) => {
    log("handleUpdatePage: Updating page", { id, content });
    setStoryPages((pages) =>
      pages.map((page) => (page.id === id ? { ...page, content } : page)),
    );
    setIsDirty(true);
  };

  const handleRegenerate = async (pageId) => {
    const page = storyPages.find((p) => p.id === pageId);
    if (!page) {
      log("handleRegenerate: Page not found", pageId);
      return;
    }

    setStoryPages((prevPages) =>
      prevPages.map((p) =>
        p.id === pageId ? { ...p, regenerating: true } : p,
      ),
    );

    const payload = {
      modelId,
      prompt: "",
      isCover: page.isCover || page.isBackCover,
      kidName: activeCharacter.name,
      age: activeCharacter.age,
      gender: activeCharacter.gender,
      stylePreference: bookStyle,
    };

    if (page.isCover || page.isBackCover) {
      const currentTitle = storyPages[0]?.content || bookTitle;
      payload.prompt = page.isCover
        ? `A captivating front cover photo which is apt for title: ${title} featuring <${kidName}kidName> as hero. It should clearly display the text "${title}" on top of the photo in a bold and colourful font`
        : `A generic minimal portrait back cover photo for the story of ${currentTitle}`;
    } else {
      payload.prompt = page.content;
    }

    try {
      const response = await fetch("/api/regenerateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const newUrl = data.newUrl;
      setStoryPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, imageUrl: newUrl, regenerating: false } : p,
        ),
      );
      setIsDirty(true);
    } catch (error) {
      setStoryPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, regenerating: false } : p)),
      );
      toast({
        title: "Regeneration Error",
        description: `Failed to regenerate image for page ${pageId}.`,
        variant: "destructive",
      });
    }
  };

  const handleRegenerateAll = async () => {
    try {
      await Promise.all(storyPages.map((page) => handleRegenerate(page.id)));
      toast({
        title: "Regeneration complete",
        description: "All pages regenerated.",
      });
    } catch (error) {
      toast({
        title: "Regeneration Error",
        description: "Failed to regenerate one or more pages.",
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
    const pagesToSave = storyPages.filter((p) => !p.isCover && !p.isBackCover);
    try {
      setLoading(true);
      const updatedBook = {
        title: bookTitle,
        pages: pagesToSave,
        coverUrl: storyPages[0]?.isCover ? storyPages[0].imageUrl : null,
        backCoverUrl: storyPages[storyPages.length - 1]?.isBackCover
          ? storyPages[storyPages.length - 1].imageUrl
          : null,
        characterId: String(activeCharacter?.id),
        storyId: String(activeStory?.id),
        stylePreference:
          activeCharacter.type === "custom" ? bookStyle : "predefined",
      };
      await apiRequest("PUT", `/api/books/${bookId}`, updatedBook);
      setIsDirty(false);
      toast({
        title: "Save Successful",
        description: "Your book has been updated.",
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to update book.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      console.log("Generating PDF for book:", bookId);
      setLocation(`/edit-pdf/${bookId}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handlePrint = () => {
    log("handlePrint: Print button clicked");
    setShowShippingForm(true);
  };

  const handleShippingSubmit = async (formData) => {
    try {
      if (user) {
        await apiRequest("POST", "/api/orders", {
          ...formData,
          bookId,
          characterId: activeCharacter.id,
          storyId: activeStory.id,
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
      toast({
        title: "Order failed",
        description: "There was a problem placing your order.",
        variant: "destructive",
      });
    }
  };

  // const handleBackToStep = (step: number) => {
  //   log("handleBackToStep: Navigating back to step", step);
  //   setCurrentStep(step);
  // };

  const handleCreateNewStory = () => {
    log(
      "handleCreateNewStory: Resetting all story data for new story creation",
    );
    setCurrentStep(1);
    setActiveCharacter(null);
    setActiveStory(null);
    setBookTitle("");
    setStoryPages([]);
    setStoryData(null);
    setShowShippingForm(false);
    setOrderCompleted(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StepIndicator currentStep={currentStep} steps={STEPS} />

          {currentStep === 1 && (
            <section>
              <h2 className="text-3xl font-heading font-bold text-center mb-2">
                Step 1: Choose Your Character
              </h2>
              <p className="text-center text-text-secondary mb-8">
                Select a predefined character or create your own custom hero!
              </p>
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
            </section>
          )}

          {currentStep === 2 && (
            <section>
              <h2 className="text-3xl font-heading font-bold text-center mb-2">
                Step 2: Choose Your Story
              </h2>
              <p className="text-center text-text-secondary mb-8">
                Select a predefined story or create your own custom adventure!
              </p>
              <StoryToggle type={storyType} onToggle={setStoryType} />
              {storyType === "predefined" ? (
                <PredefinedStories
                  onSelectStory={handleSelectStory}
                  characterName={activeCharacter?.name}
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
            </section>
          )}

          {currentStep === 3 && (
            <section>
              <h2 className="text-3xl font-heading font-bold text-center mb-2">
                Step 3: Preview Your Story
              </h2>
              <p className="text-center text-text-secondary mb-8">
                Review your book, make edits, and prepare to download or print.
              </p>

              {generatingStory && (
                <div className="flex justify-center mt-8">
                  <p className="text-lg text-center">
                    Creating the perfect story... making your character
                    life-like and magical...
                  </p>
                </div>
              )}

              {!generatingStory && storyData && (
                <BookPreview
                  bookTitle={bookTitle}
                  pages={storyPages}
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
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
