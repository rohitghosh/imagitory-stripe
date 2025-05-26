// src/pages/CreateStoryPage.tsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
import { useAuth } from "@/contexts/AuthContext";
import { useJobProgress } from "@/hooks/use-job-progress";
import { ProgressDisplay } from "@/components/ui/progress-display";

const STEPS = [
  { id: 1, name: "Choose Character" },
  { id: 2, name: "Select Story" },
  { id: 3, name: "Preview & Download" },
];

const DEBUG = true;
const log = (...args: any[]) =>
  DEBUG && console.log("[CreateStoryPage]", ...args);

export default function CreateStoryPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { id } = useParams();
  useEffect(() => {
    if (id && !bookId) {
      setBookId(id);
    }
  }, [id]);

  // --- Wizard step & Book persistence ---
  const [currentStep, setCurrentStep] = useState(1);
  const [bookId, setBookId] = useState<string | null>(null);

  const lastAvatarInteraction = useRef<number>(Date.now());
  const STORAGE_KEY = (bookId?: string) => `book:${bookId}:lastAvatarTouch`;
  const DELTA = 0.05; // how much loraScale nudges
  type AvatarMode = "cartoon" | "hyper";

  useEffect(() => {
    if (!bookId) return;
    const saved = sessionStorage.getItem(STORAGE_KEY(bookId));
    if (saved) lastAvatarInteraction.current = Number(saved);
  }, [bookId]);

  const createBookM = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", "/api/books", payload),
    onSuccess(data) {
      log("Draft Book created:", data.id);
      setBookId(data.id);
      setLocation(`/create/${data.id}`, { replace: true });
    },
    onError(err) {
      log("Create Book error:", err);
      toast({
        title: "Error",
        description: "Could not start story.",
        variant: "destructive",
      });
    },
  });

  const patchBookM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      apiRequest("PATCH", `/api/books/${id}`, payload),
    onSuccess() {
      log("Book patched");
      queryClient.invalidateQueries(["book", bookId]);
    },
    onError(err) {
      log("Patch Book error:", err);
      toast({
        title: "Error",
        description: "Could not save progress.",
        variant: "destructive",
      });
    },
  });

  // --- Load existing draft if user reloads ---
  const { data: book, isLoading: loadingBook } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Book not found");
      return res.json();
    },
    enabled: !!bookId,
  });

  useEffect(() => {
    if (book && typeof book.avatarFinalized === "boolean") {
      setAvatarFinalized(book.avatarFinalized);
    }
  }, [book]);

  const { data: hero, isSuccess: heroLoaded } = useQuery({
    queryKey: ["character", book?.characterId],
    queryFn: async () => {
      const res = await fetch(`/api/characters/${book!.characterId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Character not found");
      return res.json();
    },
    enabled: !!book?.characterId,
  });

  // --- Step 1: Character & Model training ---
  const [characterType, setCharacterType] = useState<"predefined" | "custom">(
    "predefined",
  );
  const [activeCharacter, setActiveCharacter] = useState<any>(null);
  const [kidName, setKidName] = useState("");
  const [modelId, setModelId] = useState("");
  const modelIdRef = useRef(modelId);
  const [trainJobId, setTrainJobId] = useState<string>();
  const trainProg = useJobProgress(trainJobId);

  async function handleTrainModel(character: any) {
    log("Starting training for", character);
    const resp = await fetch("/api/trainModel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        imageUrls: character.imageUrls,
        captions: character.imageUrls.map(() => character.name),
        kidName: character.name,
        characterId: character.id,
      }),
    });
    if (!resp.ok) throw new Error("Train kickoff failed");
    const { jobId } = await resp.json();
    setTrainJobId(jobId);

    // Poll until character.modelId is available in DB
    // or you can watch trainProg for completion then fetch /api/trainStatus
  }

  const handleSelectCharacter = async (character: any) => {
    log("Character selected", character);
    setActiveCharacter(character);
    setKidName(character.name);
    setBookStyle(
      character.type === "custom" ? character.stylePreference : "predefined",
    );

    // 1) Create or patch draft Book
    if (!bookId) {
      createBookM.mutate({
        title: "",
        pages: [],
        coverUrl: null,
        backCoverUrl: null,
        avatarUrl: null,
        avatarLora: null,
        userId: user!.uid,
        characterId: String(character.id),
        storyId: null,
        stylePreference:
          character.type === "custom"
            ? character.stylePreference
            : "predefined",
        createdAt: new Date().toISOString(),
      });
    } else {
      patchBookM.mutate({
        id: bookId!,
        payload: { characterId: String(character.id) },
      });
    }

    // 2) Kick off training
    if (character.modelId) {
      // ✔ character was pretrained
      setModelId(character.modelId); // triggers avatar generation effect
    } else {
      // ❌ needs training first
      await handleTrainModel(character);
    }
    setCurrentStep(2);
  };

  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);

  // When modelId arrives (from trainProg or trainStatus), patch Book
  useEffect(() => {
    if (!activeCharacter || !modelId || !bookId) return;

    if (modelId && bookId) {
      log("Patching modelId", modelId);
      patchBookM.mutate({ id: bookId, payload: { modelId } });
      // 3) Start avatar generation automatically
      apiRequest("POST", "/api/generateAvatar", {
        bookId,
        modelId,
        kidName,
        age: activeCharacter.age,
        gender: activeCharacter.gender,
        stylePreference: bookStyle,
      })
        .then((r) => setAvatarJobId(r.jobId))
        .catch((err) => log("Avatar kickoff error", err));
    }
  }, [activeCharacter, modelId, bookId]);

  useEffect(() => {
    if (trainProg?.phase === "complete" && activeCharacter?.id) {
      log("Training done — fetching modelId from server");
      apiRequest("GET", `/api/trainStatus/${activeCharacter.id}`, {})
        .then((data: any) => {
          if (data.modelId) {
            log("Received modelId", data.modelId);
            setModelId(data.modelId);
            // (we’ll patch it to the Book in your existing effect)
          }
        })
        .catch((err) => {
          console.error("Failed to fetch modelId:", err);
          toast({
            title: "Error",
            description: "Could not retrieve trained model. Try again?",
            variant: "destructive",
          });
        });
    }
  }, [trainProg?.phase, activeCharacter]);

  // --- Avatar job ---
  const [avatarJobId, setAvatarJobId] = useState<string>();
  const avatarProg = useJobProgress(avatarJobId);
  const [avatarUrlState, setAvatarUrlState] = useState<string>();
  const [avatarLoraState, setAvatarLoraState] = useState<number>(1);
  const [avatarRegenerating, setAvatarRegenerating] = useState(false);
  const imagesJobIdRef = useRef<string | null>(null);
  const [avatarFinalized, setAvatarFinalized] = useState<boolean>(
    () => book?.avatarFinalized ?? false,
  );

  function touchAvatar() {
    lastAvatarInteraction.current = Date.now();
    if (bookId)
      sessionStorage.setItem(
        STORAGE_KEY(bookId),
        String(lastAvatarInteraction.current),
      );
  }

  useEffect(() => {
    if (avatarProg?.phase === "complete" && avatarProg.avatarUrl) {
      touchAvatar();
      log("Avatar ready", avatarProg.avatarUrl, avatarProg.avatarLora);
      setAvatarUrlState(avatarProg.avatarUrl);
      setAvatarLoraState(avatarProg.avatarLora!);
    }
  }, [avatarProg]);

  // --- Step 2: Story & Skeleton generation ---
  const [storyType, setStoryType] = useState<"predefined" | "custom">(
    "predefined",
  );
  const [activeStory, setActiveStory] = useState<any>(null);
  const [storyPrompt, setStoryPrompt] = useState("");
  const [storyMoral, setStoryMoral] = useState("");
  const [storyRhyming, setStoryRhyming] = useState(false);
  const [storyTheme, setStoryTheme] = useState("none");
  const [bookStyle, setBookStyle] = useState<string>("predefined");
  const [bookTitle, setBookTitle] = useState<string>("");

  const handleSelectStory = (story: any) => {
    log("Story selected", story);
    setActiveStory(story);
    const prompt = story.instructions || story.description || "";
    setStoryPrompt(prompt);
    const resolvedTitle =
      storyType === "predefined"
        ? `${kidName} and ${story.title}`
        : story.title;
    setBookTitle(resolvedTitle);
    setStoryMoral(story.moral || "");
    setStoryRhyming(!!story.rhyming);
    setStoryTheme(story.theme || "none");

    // patch Book
    patchBookM.mutate({
      id: bookId!,
      payload: { storyId: String(story.id), title: resolvedTitle },
    });

    // kick off skeleton job
    apiRequest("POST", "/api/storySkeleton", {
      bookId,
      kidName,
      baseStoryPrompt: prompt,
      moral: story.moral,
      age: activeCharacter.age,
      gender: activeCharacter.gender,
      storyRhyming: !!story.rhyming,
      storyTheme: story.theme || "none",
    })
      .then((r) => setSkeletonJobId(r.jobId))
      .catch((err) => log("Skeleton kickoff error", err));

    setCurrentStep(3);
  };

  // Skeleton job
  const [skeletonJobId, setSkeletonJobId] = useState<string>();
  const skeletonProg = useJobProgress(skeletonJobId);
  const [skeletonData, setSkeletonData] = useState<{
    sceneTexts: string[];
    imagePrompts: string[];
  }>();

  // --- Step 3: Final image batch ---
  const [imagesJobId, setImagesJobId] = useState<string>();
  const imagesProg = useJobProgress(imagesJobId);

  useEffect(() => {
    if (skeletonProg?.phase === "complete" && skeletonProg.sceneTexts) {
      log("Skeleton ready", skeletonProg.sceneTexts);
      setSkeletonData({
        sceneTexts: skeletonProg.sceneTexts,
        imagePrompts: skeletonProg.imagePrompts!,
      });
    }
  }, [skeletonProg?.phase]);

  useEffect(() => {
    if (
      skeletonProg?.phase === "complete" &&
      avatarFinalized &&
      skeletonData &&
      !imagesJobIdRef.current &&
      activeCharacter
    ) {
      startPageGeneration();
    }
  }, [avatarFinalized, skeletonData, activeCharacter]);

  useEffect(() => {
    imagesJobIdRef.current = imagesJobId ?? null;
  }, [imagesJobId]);

  async function regenerateAvatar(mode: AvatarMode) {
    if (avatarRegenerating) return;
    setAvatarRegenerating(true);

    const newLora =
      mode === "cartoon"
        ? Math.max(0, avatarLoraState - DELTA)
        : Math.min(1, avatarLoraState + DELTA);

    try {
      const res = await fetch("/api/regenerateAvatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          modelId,
          prompt: `close-up photo of ${activeCharacter.age} year old ${activeCharacter.gender} kid <${kidName}kidName>, pixar cartoon style, white bg`,
          loraScale: newLora,
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const { avatarUrl } = await res.json();
      setAvatarUrlState(avatarUrl);
      setAvatarLoraState(newLora);
    } catch (e) {
      console.error("Avatar regen error", e);
      toast({
        title: "Avatar error",
        description: "Could not regenerate",
        variant: "destructive",
      });
    } finally {
      setAvatarRegenerating(false);
    }
  }

  function finalizeAvatar() {
    touchAvatar(); // mark recent activity

    // write the flag once (skip network traffic on repeat clicks)
    if (!avatarFinalized) {
      setAvatarFinalized(true); // optimistic UI
      patchBookM.mutate({ id: bookId!, payload: { avatarFinalized: true } });
    }

    // if the outline already exists, kick off the page batch now
    if (
      skeletonProg?.phase === "complete" &&
      skeletonData &&
      !imagesJobIdRef.current
    ) {
      startPageGeneration();
    }
  }

  function startPageGeneration() {
    if (imagesJobIdRef.current) return;
    const payload = {
      bookId,
      modelId,
      kidName,
      title: book?.title || "Untitled",
      age: activeCharacter.age,
      gender: activeCharacter.gender,
      stylePreference: bookStyle,
      avatarUrl: avatarUrlState,
      avatarLora: avatarLoraState,
      ...skeletonData,
    };
    console.log("🚀 generateStoryImages payload:", payload);
    apiRequest("POST", "/api/generateStoryImages", payload)
      .then((r) => setImagesJobId(r.jobId))
      .catch((err) => log("Images kickoff error", err));
  }

  // --- Hydrate local state from fetched book ---
  useEffect(() => {
    if (!book) return; // wait for book fetch

    log("Hydrating from Book:", bookId, book);

    /* 1️⃣ Character + kidName ----------------------------------------- */
    if (book.characterId && !activeCharacter && heroLoaded && hero) {
      setActiveCharacter({ id: hero.id, name: hero.name });
      setKidName(hero.name);
      setBookStyle(book.stylePreference);
      setBookTitle(book.title);
    }

    if (book.skeletonJobId) setSkeletonJobId(book.skeletonJobId);
    if (book.imagesJobId) setImagesJobId(book.imagesJobId);

    /* 2️⃣ ModelId ----------------------------------------------------- */
    const modelFromBook = book.modelId;
    const modelFromHero = heroLoaded && hero ? hero.modelId : null;

    if (modelFromBook && modelFromBook !== modelId) {
      setModelId(modelFromBook); // normal path
    } else if (!modelId && modelFromHero) {
      setModelId(modelFromHero); // legacy fallback
    }

    /* 3️⃣ Avatar & meta ---------------------------------------------- */
    if (book.avatarUrl && !avatarUrlState) {
      setAvatarUrlState(book.avatarUrl);
      setAvatarLoraState(book.avatarLora ?? 1);
    }
    if (book.avatarFinalized !== undefined) {
      setAvatarFinalized(book.avatarFinalized);
    }

    /* 4️⃣ Skeleton ---------------------------------------------------- */
    if (
      Array.isArray(book.sceneTexts) &&
      book.sceneTexts.length > 0 &&
      Array.isArray(book.imagePrompts) &&
      book.imagePrompts.length > 0 &&
      !skeletonData
    ) {
      setSkeletonData({
        sceneTexts: book.sceneTexts,
        imagePrompts: book.imagePrompts,
      });
    }

    /* 5️⃣ Story ------------------------------------------------------- */
    if (book.storyId && !activeStory) {
      setActiveStory({ id: book.storyId, title: book.title });
    }

    /* 6️⃣ Decide current step ---------------------------------------- */
    if (book.pages?.length > 0) {
      setCurrentStep(3); // finished book
    } else if (book.imagePrompts?.length > 0 || book.storyId) {
      setCurrentStep(3); // waiting for images
    } else if (book.characterId) {
      setCurrentStep(2); // character done
    } else {
      setCurrentStep(1); // fresh start
    }
  }, [
    book,
    book?.avatarFinalized,
    heroLoaded,
    hero,
    activeCharacter,
    activeStory,
    kidName,
    modelId,
    skeletonData,
  ]);

  // When images arrive, patch Book and navigate
  useEffect(() => {
    if (imagesProg?.phase === "complete" && imagesProg.pages) {
      log("Images batch complete", imagesProg.pages.length);
      // patch final pages & covers
      apiRequest("PUT", `/api/books/${bookId}`, {
        title: bookTitle || book?.title || "Untitled",
        pages: imagesProg.pages.map((p: any, idx: number) => ({
          id: idx + 2,
          ...p,
        })),
        coverUrl: imagesProg.coverUrl,
        backCoverUrl: imagesProg.backCoverUrl,
        avatarFinalized: avatarFinalized,
      })
        .then(() => {
          toast({ title: "All done!", description: "Your book is ready." });
          setLocation(`/book/${bookId}`);
        })
        .catch((err) => {
          log("Final patch error", err);
          toast({
            title: "Error",
            description: "Could not save final book.",
            variant: "destructive",
          });
        });
    }
  }, [imagesProg]);

  const warnedRef = useRef(false);

  useEffect(() => {
    if (
      !imagesJobIdRef.current &&
      skeletonData &&
      avatarUrlState &&
      skeletonProg?.phase === "complete"
    ) {
      const msSinceLastTouch = Date.now() - lastAvatarInteraction.current;
      const remaining = 5 * 60_000 - msSinceLastTouch; // may be < 0

      // warn 30 s before kick-off
      if (remaining > 0 && remaining <= 30_000 && !warnedRef.current) {
        warnedRef.current = true;
        toast({
          title: "Generating pages soon…",
          description:
            "No interaction detected. Page generation will start in 30 seconds.",
        });
      }

      const tid = setTimeout(
        () => {
          // run only if a job still hasn’t started and nothing changed meanwhile
          if (!imagesJobIdRef.current) startPageGeneration();
        },
        Math.max(0, remaining),
      );

      return () => clearTimeout(tid); // clean up if deps change
    }
  }, [skeletonData, avatarUrlState, imagesJobId]);

  // --- Render ---
  if (loadingBook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading draft…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto p-6">
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {currentStep === 1 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Step 1: Choose Character
            </h2>
            <CharacterToggle type={characterType} onToggle={setCharacterType} />
            {characterType === "predefined" ? (
              <PredefinedCharacters onSelectCharacter={handleSelectCharacter} />
            ) : (
              <CustomCharacter onSubmit={handleSelectCharacter} />
            )}
            {trainProg && trainProg.phase !== "complete" && (
              <ProgressDisplay prog={trainProg} />
            )}
          </section>
        )}

        {currentStep === 2 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Step 2: Select Story</h2>
            <StoryToggle type={storyType} onToggle={setStoryType} />
            {storyType === "predefined" ? (
              <PredefinedStories
                onSelectStory={handleSelectStory}
                characterName={kidName}
              />
            ) : (
              <CustomStory onSubmit={handleSelectStory} />
            )}
          </section>
        )}

        {currentStep === 3 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Step 3: Preview & Download
            </h2>

            {/* Avatar preview */}
            {avatarUrlState && !loadingBook && (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden shadow">
                  <img
                    src={avatarUrlState}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  {avatarRegenerating && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                      <i className="fas fa-spinner fa-spin text-gray-600 text-2xl" />
                    </div>
                  )}
                </div>

                {/* tweak buttons shown only before finalisation */}
                {!avatarFinalized && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={avatarRegenerating}
                      onClick={() => {
                        touchAvatar();
                        regenerateAvatar("cartoon");
                      }}
                    >
                      More Cartoonish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={avatarRegenerating}
                      onClick={() => {
                        touchAvatar();
                        regenerateAvatar("hyper");
                      }}
                    >
                      More Realistic
                    </Button>
                  </div>
                )}

                {/* Finalise / status label */}
                {!avatarFinalized ? (
                  <Button
                    className="mt-2"
                    disabled={avatarRegenerating}
                    onClick={finalizeAvatar}
                  >
                    Looks good → Generate Pages
                  </Button>
                ) : (
                  <span className="text-sm text-gray-500">Avatar locked ✓</span>
                )}
              </div>
            )}

            {/* PROGRESS BARS */}
            {/* 1) Avatar generation */}
            {!avatarUrlState && avatarProg && (
              <div className="mb-4">
                <p className="text-center text-sm text-gray-500">
                  Generating avatar… — {avatarProg.pct.toFixed(0)}%
                </p>
                <ProgressDisplay prog={avatarProg} />
              </div>
            )}

            {/* 2) Skeleton (outline) */}
            {avatarUrlState &&
              avatarFinalized &&
              !skeletonData &&
              skeletonProg && (
                <div className="mb-4">
                  <p className="text-center text-sm text-gray-500">
                    Generating story outline… — {skeletonProg.pct.toFixed(0)}%
                  </p>
                  <ProgressDisplay prog={skeletonProg} />
                </div>
              )}

            {/* 3) Pages & covers */}
            {avatarUrlState &&
              avatarFinalized &&
              skeletonData &&
              imagesProg && (
                <div className="mb-4">
                  <p className="text-center text-sm text-gray-500">
                    Generating pages & covers… — {imagesProg.pct.toFixed(0)}%
                  </p>
                  <ProgressDisplay prog={imagesProg} />
                </div>
              )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
