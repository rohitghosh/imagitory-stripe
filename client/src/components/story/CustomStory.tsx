// src/components/story/CustomStory.tsx
import React, { useState, useEffect } from "react";
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

// Persisted wizard state key
const STORAGE_KEY = "customStoryWizardState";

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
    theme: string;
    rhyming: boolean;
  }) => void;
}

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
  const [detailRelation, setDetailRelation] = useState<string>("");
  const [detailGender, setDetailGender] = useState<string>("other");
  const [cartoonPending, setCartoonPending] = useState(false);
  const [cartoonUrl, setCartoonUrl] = useState<string | null>(null);
  const [draftChar, setDraftChar] = useState<{
    id: string;
    imageUrls: string[];
  } | null>(null);

  // Moral and theme
  const [moralOption, setMoralOption] = useState<string>("none");
  const [customMoral, setCustomMoral] = useState<string>("");
  const [theme, setTheme] = useState<string>("none");
  const [rhyming, setRhyming] = useState<boolean>(false);

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
      } catch {}
    }
  }, []);

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
      }),
    );
  }, [selectedChar, moralOption, customMoral, theme, rhyming]);

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
        // filter by any relation.primaryCharacterId === our hero
        const ours = all.filter(
          (c) =>
            Array.isArray(c.relations) &&
            c.relations.some(
              (r: any) => r.primaryCharacterId === primaryCharacterId,
            ),
        );
        // merge them in front of your 5 predefined slots:
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
    return true;
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (step < SECTION_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      const finalMoral =
        moralOption === "none"
          ? ""
          : moralOption === "other"
            ? customMoral.trim()
            : moralOption;
      const chars = selectedChar.id === NO_ONE.id ? [] : [selectedChar];
      onSubmit({
        storyType: "custom",
        characters: chars,
        moral: finalMoral,
        theme,
        rhyming,
      });
    }
  };

  const handleUpload = async (url: string) => {
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
      setCartoonPending(false);
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
      age: 0, // ↙ (optional fields you don’t need)
      imageUrls: allImages,
      toonUrl: cartoonUrl, // ⬅️ keep the cartoon reference
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
      /* PUT if we already have a draft, otherwise POST (should be rare) */
      const saved = draftChar
        ? await apiRequest("PUT", `/api/characters/${draftChar.id}`, payload)
        : await apiRequest("POST", "/api/characters", payload);

      /* map server → local shape */
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
    <div className="md:grid md:grid-cols-[auto_400px] gap-6">
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
                  `h-8 w-8 flex items-center justify-center rounded-full border text-sm font-medium transition ` +
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
                  `ml-2 text-sm transition ` +
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
                    <div>Loading...</div>
                  ) : (
                    <>
                      <div
                        role="button"
                        onClick={() => {
                          setSelectedChar(NO_ONE);
                          setShowDetailForm(false);
                        }}
                        className={
                          `flex flex-col items-center p-1 cursor-pointer rounded transition ` +
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
                            `flex flex-col items-center p-1 cursor-pointer rounded transition ` +
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
                            <FileUploadTile onUpload={handleUpload} />
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
                    <img
                      src={tempAvatar!}
                      className="h-24 w-24 object-cover rounded border"
                    />
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
                          <RadioGroupItem value="male" />
                          Male
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="female" />
                          Female
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="other" />
                          Other
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="text-right">
                      <Button type="submit" disabled={!canSaveDetail()}>
                        Save Character
                      </Button>
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

        {/* Theme & Rhyming */}
        {step === 2 && (
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Theme & Rhyming</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose a theme and set rhyming.
              </p>
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
            </CardContent>
          </Card>
        )}

        {/* Next/Finish */}
        <div className="text-right">
          <Button onClick={handleNext} disabled={!canNext()}>
            {step < SECTION_STEPS.length - 1 ? "Next" : "Finish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
