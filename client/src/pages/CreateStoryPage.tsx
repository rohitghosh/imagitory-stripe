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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  { id: 1, name: "Choose Character" },
  { id: 2, name: "Select Story" },
  { id: 3, name: "Preview & Download" },
];

const DEBUG_LOGGING = true;

// util hook placed above component definition
function useJobProgress(jobId?: string) {
  const [state, setState] = useState<{
    pct: number;
    phase: string;
    message?: string;
    error?: string;
  }>();

  useEffect(() => {
    if (!jobId) return;
    let cancel = false;

    const poll = async () => {
      const r = await fetch(`/api/jobs/${jobId}/progress`, {
        credentials: "include",
      });
      const j = await r.json();
      if (!cancel) {
        setState(j);
        if (j.phase !== "complete" && j.phase !== "error")
          setTimeout(poll, 3000);
      }
    };
    poll();

    return () => {
      cancel = true;
    };
  }, [jobId]);

  return state;
}

function ProgressDisplay({ prog }: { prog: any }) {
  return (
    <div className="max-w-md mx-auto my-6 space-y-2">
      <Progress value={prog.pct ?? 0} />
      <p className="text-center text-sm text-muted-foreground">
        {prog.message ?? prog.phase} – {Math.round(prog.pct ?? 0)}%
      </p>
      {prog.phase === "error" && (
        <p className="text-destructive text-center text-sm">{prog.error}</p>
      )}
    </div>
  );
}

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
  const [trainJobId, setTrainJobId] = useState<string>();
  const [storyJobId, setStoryJobId] = useState<string>();
  const trainProg = useJobProgress(trainJobId);
  const storyProg = useJobProgress(storyJobId);

  // Book Management
  const [bookId, setBookId] = useState<number | null>(null);

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
      ...(trainJobId ? { jobId: trainJobId } : {}),
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
      const kickoff = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!kickoff.ok) {
        const text = await kickoff.text();
        throw new Error(`Kickoff failed: ${kickoff.status} ${text}`);
      }
      const { jobId } = await kickoff.json();
      setStoryJobId(jobId);
      toast({
        title: "Story generation started",
        description: "This may take a few minutes.",
      });
      log("Story jobId:", jobId);

      let jobResp: any;
      while (true) {
       const r = await fetch(`/api/jobs/${jobId}/progress`, {
         credentials: "include",
        });
       jobResp = await r.json();

       if (jobResp.phase === "error") {
         throw new Error(jobResp.error || "Story generation failed");
       }
        // Exit only when the server has attached the payload we need
        if (jobResp.phase === "complete" && jobResp.pages) break;

        await new Promise(r => setTimeout(r, 1500));
      }

      const data = {
        pages: jobResp.pages,
        coverUrl: jobResp.coverUrl,
        backCoverUrl: jobResp.backCoverUrl,
        avatarUrl: jobResp.avatarUrl,
        avatarLora: jobResp.avatarLora,
      };

      const pages = data.pages.map((p, index) => ({
        id: index + 2,
        imageUrl: p.imageUrl,
        content: storyRhyming ? p.sceneText.split("\n") : p.sceneText,
        prompt: p.prompt,
        loraScale: p.loraScale,
        controlLoraStrength: p.controlLoraStrength,
      }));

      log("handleGenerateStoryWithData: Response received:", data);
      setStoryData(data);

      // Immediately save the generated story as a book
      if (user) {
        const newBook = {
          title: currentBookTitle,
          pages: pages,
          avatarUrl: data.avatarUrl,
          coverUrl: data.coverUrl,
          backCoverUrl: data.backCoverUrl,
          createdAt: new Date().toISOString(),
          userId: String(user.uid),
          userName: user.displayName,
          avatarLora: data.avatarLora,
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
          setLocation(`/book/${savedBook.id}`);
          return;
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
    log("handleTrainModel triggered", character);

    if (character.modelId) {
      setModelId(character.modelId);
      toast({
        title: "Model already trained",
        description: "Using the existing trained model for this character.",
      });
      return;
    }

    if (!character.imageUrls || character.imageUrls.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of your character",
        variant: "destructive",
      });
      log("handleTrainModel: No images found on character");
      return;
    }

    toast({
      title: "Training started",
      description: "Your model is now training. This can take a few minutes.",
    });

    try {
      // Kick off
      const kickoffResp = await fetch("/api/trainModel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: character.imageUrls,
          captions: character.imageUrls.map(() => character.name),
          kidName: character.name,
          characterId: character.id,
        }),
      });
      if (!kickoffResp.ok) {
        const text = await kickoffResp.text();
        throw new Error(
          `Training kickoff failed: ${kickoffResp.status} ${text}`,
        );
      }
      const { characterId, jobId } = await kickoffResp.json();
      setTrainJobId(jobId);
      log("handleTrainModel: Training job accepted for", characterId);

      // Poll
      let trainedModelId = "";
      while (!trainedModelId) {
        log("handleTrainModel: Polling status for", characterId);
        await new Promise((r) => setTimeout(r, 3000));

        const statusResp = await fetch(`/api/trainStatus/${characterId}`);

        const raw = await statusResp.text();
        const ct = statusResp.headers.get("content-type");
        log(
          "handleTrainModel: statusResp:",
          statusResp.status,
          "content-type:",
          ct,
        );
        log("handleTrainModel: raw body (200 chars):", raw.slice(0, 200));

        if (!statusResp.ok) {
          const text = await statusResp.text();
          throw new Error(`Status check failed: ${statusResp.status} ${text}`);
        }

        let json: any;
        try {
          json = JSON.parse(raw);
        } catch (err) {
          throw new Error(
            `Failed to parse JSON from /api/trainStatus: ${err}\nRaw body: ${raw}`,
          );
        }

        const { status, modelId } = json;
        log("handleTrainModel: Status response", { status, modelId });

        if (status === "complete" && modelId) {
          trainedModelId = modelId;
        }
      }

      log(
        "handleTrainModel: Training complete, setting modelId:",
        trainedModelId,
      );
      setModelId(trainedModelId);

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
  const waitForModelId = async (timeout = 600000, interval = 2000) => {
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

              {trainProg && trainProg.phase !== "complete" && (
                <ProgressDisplay prog={trainProg} />
              )}

              {storyProg && <ProgressDisplay prog={storyProg} />}

              {generatingStory && (
                <div className="flex justify-center mt-8">
                  <p className="text-lg text-center">
                    Creating the perfect story... making your character
                    life-like and magical...
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
