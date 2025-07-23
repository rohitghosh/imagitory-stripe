// src/components/story/CustomStory.tsx
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Chip } from "@/components/ui/chip";
import { FileUploadTile } from "@/components/FileUploadTile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { useValidationStream } from "@/hooks/useValidationStream";

// Persisted wizard state key
const STORAGE_KEY = "customStoryWizardState";

type ValidationError = {
  check: string;
  problem: string;
  solutions: string[];
};

// Wizard sections
const SECTION_STEPS = [
  { id: 1, name: "Character" },
  { id: 2, name: "Moral" },
  { id: 3, name: "Theme & Rhyming" },
];

const NO_ONE: CharacterDetails = {
  id: "none",
  avatar: "",
  toonUrl: "", // or a placeholder data-URI
  name: "No one",
  relation: "",
  gender: "other",
  description: "",
};

// Preset options
const MORAL_OPTIONS = [
  "Sharing is caring",
  "Be brave",
  "Friends help friends",
  "Kindness wins",
  "Never give up",
  "Honesty matters",
  "Courage over fear",
  "Dream big",
] as const;

type Section = { title: string; body: string };

const takeHeading = (buf: string) => {
  const open = buf.indexOf("**");
  if (open === -1) return null;                       // no opener yet
  const close = buf.indexOf("**", open + 2);
  if (close === -1) return null;                      // no closer yet
  return {
    before : buf.slice(0, open),                      // text before **
    title  : buf.slice(open + 2, close).trim(),       // heading text
    rest   : buf.slice(close + 2),                    // tail after **
  };
};

const THEME_OPTIONS = [
  { value: "adventure-quest", label: "Adventure Quest" },
  { value: "magical-discovery", label: "Magical Discovery" },
  { value: "friendship-tale", label: "Friendship Tale" },
  { value: "bedtime-comfort", label: "Bedtime Comfort" },
  { value: "mystery-solving", label: "Mystery Solving" },
  { value: "big-day-story", label: "Big Day Story" },
  { value: "imagination-play", label: "Imagination Play" },
  { value: "none", label: "No Special Theme" },
];

// util to concat classNames
const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

type CharacterDetails = {
  id: string;
  avatar: string;
  toonUrl: string;
  name: string;
  relation: string;
  gender: string;
  description: string;
};

interface CustomStoryProps {
  primaryCharacterId: string;
  onSubmit: (payload: {
    storyType: "custom";
    characters: CharacterDetails[];
    moral: string;
    theme: string; // holds either theme value or custom story text
    rhyming: boolean;
  }) => void;
}

const TypingDots = () => (
  <span className="inline-flex gap-0.5 ml-1">
    {/* 3 animated dots */}
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

export function CustomStory({
  primaryCharacterId,
  onSubmit,
}: CustomStoryProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Wizard state
  const [step, setStep] = useState<number>(0);
  const [predefs, setPredefs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Character states
  const [selectedChar, setSelectedChar] = useState<CharacterDetails>(NO_ONE);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [showDetailForm, setShowDetailForm] = useState<boolean>(false);
  const [detailName, setDetailName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [detailRelation, setDetailRelation] = useState<string>("");
  const [detailGender, setDetailGender] = useState<string>("other");
  const [cartoonPending, setCartoonPending] = useState(false);
  const uploadToken = React.useRef(0);
  const [cartoonUrl, setCartoonUrl] = useState<string | null>(null);
  const [draftChar, setDraftChar] = useState<{
    id: string;
    imageUrls: string[];
  } | null>(null);

  // Moral and theme / story mode
  const [moralOption, setMoralOption] = useState<string>("none");
  const [customMoral, setCustomMoral] = useState<string>("");
  const [theme, setTheme] = useState<string>("none");
  const [rhyming, setRhyming] = useState<boolean>(false);

  const [reasoningLog, setReasoningLog] = useState("");
  const [thinking, setThinking] = useState(false);

  // NEW: theme or 140‑char story mode
  const [storyMode, setStoryMode] = useState<"theme" | "text">("theme");
  const [customStory, setCustomStory] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [section, setSection] = useState<Section | null>(null);

  // const { reasoning, result, done } = useValidationStream(
  //   streaming,
  //   validationPayload,
  // );

  const logRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [reasoningLog]);

  // useEffect(() => setReasoningLog(reasoning), [reasoning]);

  // Load persisted
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const st = JSON.parse(saved);
        setSelectedChar(st.selectedChar);
        setMoralOption(st.moralOption);
        setCustomMoral(st.customMoral);
        setTheme(st.theme);
        setRhyming(st.rhyming);
        // new
        setStoryMode(st.storyMode ?? "theme");
        setCustomStory(st.customStory ?? "");
      } catch {}
    }
  }, []);

  // useEffect(() => {
  //   if (!done) return; // wait until SSE closes

  //   // setStreaming(false);
  //   // setValidatingStory(false);

  //   if (result?.success) {
  //     onSubmit(buildSubmitPayload(customStory.trim()));
  //   } else if (result?.failures) {
  //     const mapped = result.failures.map((f: any) => ({
  //       check:     f.check,
  //       problem:   f.problem,
  //       solutions: Array.isArray(f.solution) ? f.solution : [],
  //     }));
  //     setValidationErrors(mapped);
  //   } else {
  //     setValidationErrors([
  //       {
  //         check: "Validation",
  //         problem: result?.error ?? "Unknown error",
  //         solutions: [],
  //       },
  //     ]);
  //   }
  // }, [done, result]);

  // Persist
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedChar,
        moralOption,
        customMoral,
        theme,
        rhyming,
        storyMode,
        customStory,
      }),
    );
  }, [
    selectedChar,
    moralOption,
    customMoral,
    theme,
    rhyming,
    storyMode,
    customStory,
  ]);

  // Fetch presets
  useEffect(() => {
    apiRequest("GET", "/api/characters?type=predefined")
      .then((data: any[]) => setPredefs(data.slice(0, 5)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!primaryCharacterId) return;

    apiRequest("GET", "/api/characters?type=custom")
      .then((all: any[]) => {
        const ours = all
          .filter(
            (c) =>
              Array.isArray(c.relations) &&
              c.relations.some(
                (r: any) => r.primaryCharacterId === primaryCharacterId,
              ),
          )
          .filter((c) => !/^__(DRAFT|SIDE_DRAFT)__?$/.test(c.name));
        setPredefs((prev) => [
          ...ours,
          ...prev.slice(0, Math.max(0, 5 - ours.length)),
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [primaryCharacterId]);

  const isCustom =
    selectedChar.id !== NO_ONE.id &&
    !predefs.find((c) => c.id === selectedChar.id);

  const canSaveDetail = () =>
    detailName.trim() !== "" && detailRelation.trim() !== "";

  const canNext = () => {
    if (showDetailForm) return false;
    if (step === 0) return true;
    if (step === 1) return moralOption !== "other" || customMoral.trim() !== "";
    // step === 2
    if (storyMode === "theme") {
      return theme !== "none"; // must pick a theme
    }
    return customStory.trim().length > 0 && customStory.trim().length <= 140;
  };

  const cancelSideCharacter = () => {
    uploadToken.current += 1; // invalidates in-flight cartoonify
    setTempAvatar(null);
    setCartoonUrl(null);
    setCartoonPending(false);
    setUploading(false);
    setUploadPct(0);
    setShowDetailForm(false);
    setSelectedChar(NO_ONE);
  };

  /** helper to assemble payload shared by both submit paths */
  const buildSubmitPayload = (storyTheme: string) => {
    const finalMoral =
      moralOption === "none"
        ? ""
        : moralOption === "other"
          ? customMoral.trim()
          : moralOption;
    const chars = selectedChar.id === NO_ONE.id ? [] : [selectedChar];
    return {
      storyType: "custom" as const,
      characters: chars,
      moral: finalMoral,
      theme: storyTheme,
      rhyming,
    };
  };
  
  /* -----------------------------------------------------------------
     Card builder that waits for "**Heading**X" (where X = any char
     that is *not* an asterisk) before it finalises the heading.
  ----------------------------------------------------------------- */
  const pending = React.useRef("");

  const appendToken = React.useCallback(
    (raw: string) => {
      /* 1 ─ blank payload  →  real paragraph break ---------------- */
      if (raw === "" || raw === " " || raw === "\n") {
        setSection(s => (s ? { ...s, body: s.body + "\n\n" } : s));
        return;
      }

      /* 2 ─ drop the single SSE artefact-space when it splits words */
      if (raw.startsWith(" ") && /[A-Za-z0-9*]$/.test(section?.body ?? ""))
        raw = raw.slice(1);

      /* 3 ─ accumulate the chunk                                     */
      pending.current += raw;

      /* 4 ─ while we have a *complete* “…**Heading**‹any-char›” ---- */
      // eslint-disable-next-line
      while (true) {
        const open  = pending.current.indexOf("**");
        if (open === -1) break;

        const close = pending.current.indexOf("**", open + 2);
        if (close === -1) break;

        // there must be at least ONE non-* char after the closer
        if (pending.current.length === close + 2) break;
        if (pending.current[close + 2] === "*") break;

        /* ─── we’ve got a whole heading + something after it ────── */
        const chunk = pending.current.slice(0, close + 2);           // …**Heading**
        const tail  = pending.current.slice(close + 2);              // what follows
        pending.current = tail;                                      // keep tail

        /* split the processed part on every **Heading** ------------ */
        const parts = chunk.split(/\*\*([^*]+)\*\*/g);
        //                [before, heading, after, heading, after …]

        setSection(prev => {
          let cur = prev ?? { title: "Thinking…", body: "" };

          cur.body += parts[0];                  // text before 1st heading

          for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i].trim();
            const body  = parts[i + 1] ?? "";
            cur = { title, body };               // replace card
          }
          return cur;
        });
      }

      /* 5 ─ whatever is left and has NO '**' is plain body text ---- */
      if (pending.current && !pending.current.includes("**")) {
        setSection(s => (s ? { ...s, body: s.body + pending.current } : s));
        pending.current = "";
      }
    },
    [section]
  );

  
  
  const validateThenSubmit = async () => {
    setValidationErrors([]);
    setReasoningLog("");
    // setValidatingStory(false);

    const finalMoral =
      moralOption === "none"
        ? ""
        : moralOption === "other"
          ? customMoral.trim()
          : moralOption;
    const hero = await apiRequest(
      "GET",
      `/api/characters/${primaryCharacterId}`,
    );
    const pronoun =
      hero.gender === "male" ? "he" : hero.gender === "female" ? "she" : "they";

    const payload: any = {
      kidName: hero.name, // e.g. "Aarav"
      pronoun, // "he" | "she" | "they"
      age: hero.age ?? 0, // fallback to 0 if missing
      moral: finalMoral, // already normalised earlier
      kidInterests: hero.interests ?? [], // [] if none saved
      storyThemes:
        storyMode === "theme"
          ? theme !== "none"
            ? [theme] // e.g. ["magical-discovery"]
            : []
          : [customStory.trim()],
    };

    if (selectedChar.id !== NO_ONE.id) {
      payload.characters = [selectedChar.name];
      payload.character_descriptions = [
        selectedChar?.description ||
          selectedChar?.relations?.find(
            (r) => r.primaryCharacterId === primaryCharacterId,
          )?.relation ||
          "",
      ];
    }

    try {
      setThinking(true);
      setReasoningLog("");

      const res = await fetch("/api/runValidation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // make it explicit so some CDNs/browsers don’t buffer
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        return;
      }

      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log("📦 4. raw chunk:", JSON.stringify(chunk));
        buf += chunk;

        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const block = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);

          console.log("🔬 5. SSE block:", block);

          /* Grab lines & classify */
          const lines = block.split("\n");
          const typeLine = lines.find((l) => l.startsWith("event:"));
          const isResult = typeLine?.startsWith("event: result");
          const dataLines = lines
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5)); // strip “data: ”

          if (isResult) {
            setThinking(false);
            try {
              const result = JSON.parse(dataLines.join("\n"));

              if (result.success) {
                onSubmit(buildSubmitPayload(customStory.trim()));
              } else {
                const mapped = (result.failures ?? []).map((f: any) => ({
                  check: f.check,
                  problem: f.problem,
                  solutions: Array.isArray(f.solution) ? f.solution : [],
                }));
                setValidationErrors(mapped);
              }
            } catch (err) {
              console.error("⚠️  6b. JSON parse error:", err, dataLines);
            }
            setReasoningLog(""); // hide overlay
            return; // stop reading
          }

          /* ---------- STREAMING TOKENS ------------------------------------ */
          if (dataLines.length) {
            if (thinking) setThinking(false);
            dataLines.forEach(tok => appendToken(tok)); 
          }
        }
      }
    } catch (err) {
      console.error(err);
      setValidationErrors(["Validation failed – please try again."]);
      setReasoningLog("");
    }
    // setValidationPayload(payload);
    // setStreaming(true);
  };

  const handleNext = () => {
    if (!canNext()) return;

    if (step < SECTION_STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // final step
    if (storyMode === "text") {
      validateThenSubmit();
    } else {
      onSubmit(buildSubmitPayload(theme));
    }
  };

  const handleUpload = async (url: string) => {
    const thisToken = ++uploadToken.current;
    // UI reset
    setTempAvatar(url);
    setCartoonPending(true);
    setCartoonUrl(null);
    setShowDetailForm(true);
    setDetailName("");
    setDetailRelation("");
    setDetailGender("other");

    try {
      /* ─────────────── 1️⃣  make / reuse a draft side-character ─────────────── */
      let id = draftChar?.id;

      if (!id) {
        const draft = await apiRequest("POST", "/api/characters", {
          imageUrls: [url],
          type: "custom",
          userId: user!.uid,
          name: "__SIDE_DRAFT__", // temporary
        });
        id = draft.id;
        setDraftChar({ id: draft.id, imageUrls: draft.imageUrls });
      }

      /* ─────────────── 2️⃣  cartoonify the very first image ────────────────── */
      const { toonUrl } = await apiRequest("POST", "/api/cartoonify", {
        characterId: id, // <- backend insists on this
        imageUrl: url,
      });
      if (uploadToken.current !== thisToken) return;
      setCartoonUrl(toonUrl);
    } catch (err) {
      console.error("cartoonify failed", err);
      toast({
        title: "Error",
        description: "Could not cartoonify image",
        variant: "destructive",
      });
      setCartoonUrl(url); // graceful fallback: show the original
    } finally {
      if (uploadToken.current === thisToken) setCartoonPending(false);
    }
  };

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tempAvatar || !cartoonUrl || !primaryCharacterId) {
      return toast({
        title: "Error",
        description: "Please finish the image step first.",
        variant: "destructive",
      });
    }

    /* normalise gender for the API */
    const genderPayload =
      detailGender === "male"
        ? "boy"
        : detailGender === "female"
          ? "girl"
          : "other";

    /* merge original + toon so both stay in the DB */
    const allImages = Array.from(
      new Set([tempAvatar, cartoonUrl]), // de-dup just in case
    );

    const payload = {
      name: detailName.trim(),
      age: 0,
      imageUrls: allImages,
      toonUrl: cartoonUrl,
      relation: detailRelation.trim(),
      gender: genderPayload,
      type: "custom",
      relations: [
        {
          primaryCharacterId,
          relation: detailRelation.trim(),
        },
      ],
    };

    try {
      const saved = draftChar
        ? await apiRequest("PUT", `/api/characters/${draftChar.id}`, payload)
        : await apiRequest("POST", "/api/characters", payload);

      const detail: CharacterDetails = {
        id: saved.id,
        avatar: saved.imageUrls[0],
        toonUrl: saved.toonUrl,
        name: saved.name,
        relation: saved.relation,
        gender: saved.gender,
        description: saved.description ?? saved.relations?.[0]?.relation ?? "", // fallback chain
      };

      setSelectedChar(detail);
      setShowDetailForm(false);
      toast({ title: "Character saved" });
    } catch (err) {
      console.error("save failed", err);
      toast({
        title: "Error",
        description: "Could not save character. Try again?",
        variant: "destructive",
      });
    }
  };

  if (!primaryCharacterId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Please select a hero character first.</p>
      </div>
    );
  }

  return (
    <div className="md:grid md:grid-cols-[auto_1fr] gap-6">
      {/* Left: Stepper */}
      <div className="border rounded-lg p-4">
        <nav className="flex md:flex-col items-start space-x-4 md:space-x-0 md:space-y-4">
          {SECTION_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setStep(idx)}
              className="flex items-center focus:outline-none"
            >
              <div
                className={
                  "h-8 w-8 flex items-center justify-center rounded-full border text-sm font-medium transition " +
                  (idx < step
                    ? "bg-green-50 text-green-600 border-green-200"
                    : idx === step
                      ? "bg-primary text-white border-transparent"
                      : "bg-gray-50 text-gray-400 border-gray-200")
                }
              >
                {s.id}
              </div>
              <span
                className={
                  "ml-2 text-sm transition " +
                  (idx === step
                    ? "text-primary font-semibold"
                    : "text-gray-500")
                }
              >
                {s.name}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Content */}
      <div className="space-y-6">
        {/* Character */}
        {step === 0 && (
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Choose a character</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select or add a custom sidekick for your hero.
              </p>
              {!showDetailForm && (
                <div className="grid grid-cols-3 gap-4">
                  {loading ? (
                    <div>Loading…</div>
                  ) : uploading || cartoonPending ? (
                    <div className="w-full max-w-xs mx-auto py-6">
                      <Progress value={uploadPct} />
                      <p className="text-center text-sm text-muted-foreground mt-1">
                        {cartoonPending
                          ? "Generating preview…"
                          : `Uploading… ${Math.round(uploadPct)}%`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        role="button"
                        onClick={() => {
                          setSelectedChar(NO_ONE);
                          setShowDetailForm(false);
                        }}
                        className={
                          "flex flex-col items-center p-1 cursor-pointer rounded transition " +
                          (selectedChar.id === NO_ONE.id
                            ? "ring-2 ring-primary"
                            : "hover:ring-1 hover:ring-gray-300")
                        }
                      >
                        <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center">
                          <span className="text-gray-400">—</span>
                        </div>
                        <span className="text-xs mt-1 text-slate-700">
                          No one
                        </span>
                      </div>
                      {/* Predefs */}
                      {predefs.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          role="button"
                          onClick={() => {
                            setSelectedChar({
                              id: c.id,
                              avatar: c.imageUrls[0],
                              name: c.name,
                              relation: "",
                              gender: "",
                              description: c.description ?? "",
                              toonUrl: c.toonUrl,
                            });
                            setShowDetailForm(false);
                          }}
                          className={
                            "flex flex-col items-center p-1 cursor-pointer rounded transition " +
                            (selectedChar?.id === c.id
                              ? "ring-2 ring-primary"
                              : "hover:ring-1 hover:ring-gray-300")
                          }
                        >
                          <img
                            src={c.imageUrls[0]}
                            alt={c.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <span className="text-xs mt-1 text-slate-700">
                            {c.name}
                          </span>
                        </div>
                      ))}
                      {/* Custom slot or tile */}
                      <div className="flex justify-center items-center">
                        {isCustom && selectedChar ? (
                          <div className="flex flex-col items-center p-1 cursor-pointer rounded transition ring-2 ring-primary relative group">
                            <img
                              src={selectedChar.avatar}
                              alt={selectedChar.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <span className="text-xs mt-1 text-slate-700 truncate">
                              {selectedChar.name}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedChar(NO_ONE);
                                setShowDetailForm(false);
                              }}
                              className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow hidden group-hover:block"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`${showDetailForm ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <FileUploadTile
                              onStart={() => {
                                setUploading(true);
                                setUploadPct(0);
                                uploadToken.current += 1;
                              }}
                              onProgress={(pct: number) => setUploadPct(pct)}
                              onUpload={(url: string) => {
                                setUploading(false);
                                handleUpload(url);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Custom detail form */}
              {showDetailForm && (
                <>
                  <div className="flex gap-4 items-center my-4">
                    <div className="relative">
                      <img
                        src={tempAvatar!}
                        className="h-24 w-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={cancelSideCharacter}
                        aria-label="Remove"
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                      >
                        ×
                      </button>
                    </div>
                    {cartoonPending ? (
                      <div className="h-24 w-24 flex items-center justify-center border rounded">
                        <i className="fas fa-spinner fa-spin text-gray-500 text-xl" />
                      </div>
                    ) : (
                      cartoonUrl && (
                        <img
                          src={cartoonUrl}
                          className="h-24 w-24 object-cover rounded border"
                        />
                      )
                    )}
                  </div>

                  <form onSubmit={submitDetails} className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={detailName}
                        onChange={(e) => setDetailName(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="relation">Relation</Label>
                      <Input
                        id="relation"
                        name="relation"
                        placeholder="e.g. Sidekick"
                        value={detailRelation}
                        onChange={(e) => setDetailRelation(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="block mb-1">Gender</Label>
                      <RadioGroup
                        value={detailGender}
                        onValueChange={setDetailGender}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="male" /> Male
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="female" /> Female
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="other" /> Other
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelSideCharacter} // ← NEW
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={!canSaveDetail()}>
                          Save Character
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Moral */}
        {step === 1 && (
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Select a moral</h3>
              <p className="text-sm text-gray-600 mb-4">
                Pick a moral that resonates with your story.
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  selected={moralOption === "none"}
                  onClick={() => setMoralOption("none")}
                >
                  No moral
                </Chip>
                {MORAL_OPTIONS.map((opt) => (
                  <Chip
                    key={opt}
                    selected={moralOption === opt}
                    onClick={() => setMoralOption(opt)}
                  >
                    {opt}
                  </Chip>
                ))}
                <Chip
                  selected={moralOption === "other"}
                  onClick={() => setMoralOption("other")}
                >
                  Other ✎
                </Chip>
              </div>
              {moralOption === "other" && (
                <textarea
                  value={customMoral}
                  onChange={(e) => setCustomMoral(e.target.value)}
                  rows={3}
                  className="w-full mt-3 border rounded p-2 focus:ring-primary/60 focus:outline-none"
                  placeholder="Type your moral here..."
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Theme & Rhyming OR 140‑char story */}
        {step === 2 && (
          <Card className="relative">
            <CardContent>
              {/* Overlay while validating */}
              {/* -------------- validation console -------------- */}

              <h3 className="text-lg font-semibold mb-2">Theme & Rhyming</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose a theme or supply your own 140‑character story prompt.
              </p>

              {/* Segmented toggle */}
              <div className="inline-flex bg-gray-50 p-1 rounded-md border mb-4 w-full md:w-auto">
                <button
                  type="button"
                  className={cn(
                    "flex-1 md:flex-none px-4 py-2 rounded-md text-sm transition",
                    storyMode === "theme"
                      ? "bg-white shadow text-primary"
                      : "text-gray-500",
                  )}
                  onClick={() => setStoryMode("theme")}
                >
                  Pick a theme
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 md:flex-none px-4 py-2 rounded-md text-sm transition",
                    storyMode === "text"
                      ? "bg-white shadow text-primary"
                      : "text-gray-500",
                  )}
                  onClick={() => setStoryMode("text")}
                >
                  Write my own
                </button>
              </div>

              {storyMode === "theme" ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {THEME_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.value}
                        selected={theme === opt.value}
                        onClick={() => setTheme(opt.value)}
                      >
                        {opt.label}
                      </Chip>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Do you want to enable rhyming for the story?
                  </p>
                  <Switch
                    checked={rhyming}
                    onCheckedChange={setRhyming}
                    id="rhyming"
                  />
                </>
              ) : (
                <>
                  <div className="relative">
                    <textarea
                      value={customStory}
                      onChange={(e) =>
                        setCustomStory(e.target.value.slice(0, 140))
                      }
                      rows={4}
                      maxLength={140}
                      className="w-full border rounded p-3 focus:ring-primary focus:outline-none"
                      placeholder="Your story idea in 140 characters…"
                      disabled={thinking}
                    />
                    {thinking && (
                      <div
                        className="absolute inset-0 bg-white/70 flex items-center
                                    justify-center rounded-md z-10"
                      >
                        <i className="fas fa-circle-notch fa-spin text-primary text-2xl" />
                        <span className="ml-2 text-sm text-gray-700">
                          Validating…
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>{customStory.length} / 140</span>
                    {customStory.length > 140 && (
                      <span className="text-red-600">Too long</span>
                    )}
                  </div>

                  {(thinking || reasoningLog) && (
                    <div className="mt-4">
                      {/* Header line */}
                      <p className="text-xs mb-1 flex items-center">
                        <span className="font-semibold text-red-600">
                          {thinking ? "Thinking" : "Listening"}
                        </span>
                        {thinking && <TypingDots />} {/* animated dots */}
                      </p>

                      {/* White sheet with red border */}
                      {section && (
                        <div className="mt-4">
                          <p className="font-semibold mb-1 flex items-center shimmer">
                            {section.title}
                            
                          </p>

                          {/* <div
                            className="bg-white border border-red-300 rounded-md p-3
                                       text-xs text-gray-800 whitespace-pre-wrap
                                       max-h-56 overflow-y-auto"
                          >
                            <ReactMarkdown>{section.body}</ReactMarkdown>
                          </div> */}
                        </div>
                      )}
                    </div>
                  )}
                  {validationErrors.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-start p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
                        <i className="fas fa-exclamation-circle mt-0.5 mr-2" />
                        <p className="text-sm">
                          We couldn’t approve your story yet. Please review the
                          suggestions below and try again.
                        </p>
                      </div>
                      {validationErrors.map((err, i) => (
                        <div
                          key={i}
                          className="border border-red-300 rounded-lg p-4 bg-red-50/60"
                        >
                          {/* Check title */}
                          <p className="font-semibold text-red-700">
                            {err.check}
                          </p>

                          {/* Problem description */}
                          <p className="text-sm text-red-600 mt-1">
                            {err.problem}
                          </p>

                          {/* Solutions list */}
                          {Array.isArray(err.solutions) &&
                            err.solutions.length > 0 && (
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-600">
                                {err.solutions.map((s, j) => (
                                  <li key={j}>{s}</li>
                                ))}
                              </ul>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Next/Finish */}
        <div className="text-right sticky bottom-0 bg-white py-3 md:static md:bg-transparent">
          <Button onClick={handleNext} disabled={!canNext() || thinking}>
            {step < SECTION_STEPS.length - 1
              ? "Next"
              : storyMode === "text"
                ? "Validate & Finish"
                : "Finish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
