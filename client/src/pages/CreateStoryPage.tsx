// src/pages/CreateStoryPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StepIndicator } from "@/components/StepIndicator";
import { CustomCharacter } from "@/components/character/CustomCharacter";
import { StoryToggle } from "@/components/story/StoryToggle";
import { PredefinedStories } from "@/components/story/PredefinedStories";
import { CustomStory } from "@/components/story/CustomStory";
import { ProgressDisplay } from "@/components/ui/progress-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useJobProgress } from "@/hooks/use-job-progress";

const STEPS = [
  { id: 1, name: "Choose Character" },
  { id: 2, name: "Select Story" },
  { id: 3, name: "Preview & Download" },
];

const DEBUG = true;
const log = (...args: any[]) =>
  DEBUG && console.log("[CreateStoryPage]", ...args);

type Relation = { primaryCharacterId: string; relation: string };
type SecondaryChar = {
  id: string;
  name: string;
  toonUrl?: string;
  description?: string;
  relations?: Relation[];
};

export default function CreateStoryPage() {
  /* ─────────────────────────── plumbing ────────────────────────── */
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { id } = useParams();

  /* ─────────────────────────── state ───────────────────────────── */
  const [bookId, setBookId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeChar, setActiveChar] = useState<any>(null);
  const [kidName, setKidName] = useState("");
  const [bookStyle, setBookStyle] = useState("default");
  const [bookTitle, setBookTitle] = useState("Untitled");

  /* progress job ids */
  const [imagesJobId, setImagesJobId] = useState<string>();
  const imagesProg = useJobProgress(imagesJobId);

  /* ─────────────────────────── mutations ───────────────────────── */
  const createBookM = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", "/api/books", payload),
    onSuccess: (data) => {
      setBookId(data.id);
      setLocation(`/create/${data.id}`, { replace: true });
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: "Could not start story.",
        variant: "destructive",
      }),
  });

  const patchBookM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      apiRequest("PATCH", `/api/books/${id}`, payload),
    onSuccess: (_data, { id }) => queryClient.invalidateQueries(["book", id]),
    onError: () =>
      toast({
        title: "Error",
        description: "Could not save progress.",
        variant: "destructive",
      }),
  });

  /* ─────────────────────────── fetch book (hydration) ──────────── */
  const { data: book, isLoading: loadingBook } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const r = await fetch(`/api/books/${bookId}`, { credentials: "include" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!bookId,
  });

  /* on mount via /create/:id */
  useEffect(() => {
    if (id && !bookId) setBookId(id);
  }, [id]);

  /* ─────────────────────────── character pick ──────────────────── */
  async function handleSelectCharacter(character: any) {
    setActiveChar(character);
    setKidName(character.name);

    if (!bookId) {
      createBookM.mutate({
        title: "",
        pages: [],
        userId: user!.uid,
        characterId: String(character.id),
        createdAt: new Date().toISOString(),
        stylePreference: bookStyle,
      });
    } else {
      patchBookM.mutate({
        id: bookId!,
        payload: { characterId: String(character.id) },
      });
    }
    setCurrentStep(2);
  }

  /* ─────────────────────────── story submit ────────────────────── */
  function handleCustomStorySubmit(data: {
    storyType: "custom";
    characters: SecondaryChar[];
    moral: string;
    theme: string;
    rhyming: boolean;
  }) {
    const side = data.characters[0];
    const sideDescription =
      side?.description ||
      side?.relations?.find((r) => r.primaryCharacterId === activeChar.id)
        ?.relation ||
      "";

    localStorage.removeItem("customStoryWizardState");

    const pronoun =
      activeChar.gender === "male"
        ? "he"
        : activeChar.gender === "female"
          ? "she"
          : "they";

    const payload = {
      bookId,
      kidName,
      pronoun,
      age: activeChar.age,
      moral: data.moral,
      storyRhyming: data.rhyming,
      kidInterests: activeChar.interests ?? [],
      storyThemes: [data.theme],
      characters: side ? [side.name] : [],
      characterDescriptions: side ? [sideDescription] : [],
      characterImageMap: {
        [kidName]: activeChar.toonUrl,
        ...(side?.toonUrl ? { [side.name]: side.toonUrl } : {}),
      },
    };

    log("POST /api/generateFullStory", payload);
    apiRequest("POST", "/api/generateFullStory", payload)
      .then((r) => {
        setImagesJobId(r.jobId);
        patchBookM.mutate({ id: bookId!, payload: { imagesJobId: r.jobId } });
        setCurrentStep(3);
      })
      .catch((err) => log("Full-story kickoff error", err));
  }

  /* ─────────────────────────── hydration logic ─────────────────── */
  useEffect(() => {
    if (!book) return;

    /* character */
    if (book.characterId && !activeChar) {
      setActiveChar({ id: book.characterId, name: book.kidName });
      setKidName(book.kidName);
      setBookStyle(book.stylePreference);
      setBookTitle(book.title);
    }

    /* existing jobs / pages */
    if (book?.imagesJobId && !imagesJobId) setImagesJobId(book.imagesJobId);
    if (book.pages?.length) setCurrentStep(3);
  }, [book]);

  useEffect(() => {
    if (imagesProg?.phase === "complete") {
      queryClient.invalidateQueries(["book", bookId]);
    }
  }, [imagesProg]);

  useEffect(() => {
    if (imagesProg?.phase === "error") {
      toast({
        title: "Story generation failed",
        description: imagesProg.error ?? "Unknown error",
        variant: "destructive",
      });
    }
  }, [imagesProg]);

  // B. or the book already contains pages
  useEffect(() => {
    if (book?.pages?.length) {
      setLocation(`/book/${bookId}`);
    }
  }, [book]);

  /* when final images arrive – patch & redirect */
  // useEffect(()=>{
  //   if(imagesProg?.phase==="complete" && imagesProg.pages){
  //     apiRequest("PUT",`/api/books/${bookId}`,{
  //       title:bookTitle || "Untitled",
  //       pages: imagesProg.pages.map((p:any,idx:number)=>({id:idx+2,...p})),
  //       coverUrl     : imagesProg.coverUrl,
  //       backCoverUrl : imagesProg.backCoverUrl
  //     })
  //     .then(()=>{ toast({title:"Done!",description:"Your book is ready."}); setLocation(`/book/${bookId}`); })
  //     .catch(()=> toast({title:"Error",description:"Could not save final book.",variant:"destructive"}));
  //   }
  // },[imagesProg]);

  /* ─────────────────────────── UI  ─────────────────────────────── */
  if (loadingBook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        className={
          isMobile
            ? "flex-grow px-4 pt-4 pb-6"
            : "flex-grow max-w-4xl mx-auto p-6"
        }
      >
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {currentStep === 1 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Step 1: Choose Character
            </h2>
            <CustomCharacter onSubmit={handleSelectCharacter} />
          </section>
        )}

        {currentStep === 2 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Step 2: Select Story</h2>
            <StoryToggle
              type="custom"
              onToggle={() => {
                /* keep only custom for now*/
              }}
            />
            <CustomStory
              primaryCharacterId={activeChar?.id!}
              onSubmit={handleCustomStorySubmit}
            />
          </section>
        )}

        {currentStep === 3 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Step 3: Preview & Download
            </h2>

            {imagesProg && (
              <div className="mb-4">
                <p className="text-center text-sm text-gray-500">
                  Generating pages… — {imagesProg.pct.toFixed(0)}%
                </p>
                <ProgressDisplay prog={imagesProg} />
              </div>
            )}

            {/* When pages are done the user will be redirected automatically */}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
