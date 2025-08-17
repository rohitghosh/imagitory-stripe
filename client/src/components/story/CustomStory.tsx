// // src/components/story/CustomStory.tsx
// import React, { useState, useEffect, useRef } from "react";
// import ReactMarkdown from "react-markdown";
// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent } from "@/components/ui/card";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Chip } from "@/components/ui/chip";
// import { FileUploadTile } from "@/components/FileUploadTile";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { apiRequest } from "@/lib/queryClient";
// import { Progress } from "@/components/ui/progress";

// // Persisted wizard state key
// const STORAGE_KEY = "customStoryWizardState";

// type ValidationError = {
//   check: string;
//   problem: string;
//   solutions: string[];
// };

// // Wizard sections
// const SECTION_STEPS = [
//   { id: 1, name: "Character" },
//   { id: 2, name: "Moral" },
//   { id: 3, name: "Theme & Rhyming" },
// ];

// const NO_ONE: CharacterDetails = {
//   id: "none",
//   avatar: "",
//   toonUrl: "",
//   name: "No one",
//   relation: "",
//   gender: "other",
//   description: "",
// };

// // Preset options (labels shown on chips)
// export const MORAL_OPTIONS = [
//   "Patience grows good things",
//   "Practice makes progress",
//   "Be gentle with living things",
//   "Take care of your world",
//   "Tell the truth and fix it",
//   "Think first, then act",
//   "Curiosity leads to discovery",
//   "Keep going, adjust the plan",
//   "Calm body, clear choices",
//   "Courage with care",
// ] as const;

// // Parent-facing one-liners (shown on hover)
// export const MORAL_BLURBS: Record<(typeof MORAL_OPTIONS)[number], string> = {
//   "Patience grows good things":
//     "Real growth takes time; caring and waiting beat rushing.",
//   "Practice makes progress":
//     "Small, steady effort improves skills more than instant perfection.",
//   "Be gentle with living things":
//     "Handle plants and animals with care, respect, and soft hands.",
//   "Take care of your world":
//     "Clean up, fix small messes, and leave places better than you found them.",
//   "Tell the truth and fix it":
//     "Own mistakes kindly, make amends, and set things right.",
//   "Think first, then act":
//     "Pause, notice details, and choose the safe, wise next step.",
//   "Curiosity leads to discovery":
//     "Looking closely and asking questions reveals new ideas and paths.",
//   "Keep going, adjust the plan":
//     "Try, tweak, and try again when things don't work at first.",
//   "Calm body, clear choices":
//     "Breathe, settle feelings, then decide what to do.",
//   "Courage with care":
//     "Be brave, move thoughtfully, and avoid risky or rough choices.",
// };

// type Section = { title: string; body: string };

// const THEME_OPTIONS = [
//   {
//     value: "discovering-hidden-worlds-through-curiosity-and-courage",
//     label: "Adventure Quest",
//   },
//   {
//     value: "finding-extraordinary-magic-in-everyday-moments-and-places",
//     label: "Magical Discovery",
//   },
//   {
//     value:
//       "building-meaningful-connections-through-shared-experiences-and-understanding",
//     label: "Friendship Tale",
//   },
//   {
//     value: "creating-peaceful-resolutions-to-gentle-challenges-before-sleep",
//     label: "Bedtime Comfort",
//   },
//   {
//     value: "solving-intriguing-puzzles-through-observation-and-clever-thinking",
//     label: "Mystery Solving",
//   },
//   {
//     value: "navigating-important-milestone-moments-with-confidence-and-joy",
//     label: "Big Day Story",
//   },
//   {
//     value: "transforming-creative-ideas-into-wonderful-reality-through-play",
//     label: "Imagination Play",
//   },
//   {
//     value: "overcoming-personal-fears-and-doubts-through-inner-strength",
//     label: "Courage Journey",
//   },
//   {
//     value: "exploring-natural-wonders-and-environmental-connections-outdoors",
//     label: "Nature Adventure",
//   },
//   {
//     value: "building-something-amazing-through-teamwork-and-perseverance",
//     label: "Creation Quest",
//   },
// ];

// // util to concat classNames
// const cn = (...classes: (string | false | undefined | null)[]) =>
//   classes.filter(Boolean).join(" ");

// type CharacterDetails = {
//   id: string;
//   avatar: string;
//   toonUrl: string;
//   name: string;
//   relation: string;
//   gender: string;
//   description: string;
// };

// interface CustomStoryProps {
//   primaryCharacterId: string;
//   onSubmit: (payload: {
//     storyType: "custom";
//     characters: CharacterDetails[];
//     moral: string;
//     theme: string;
//     rhyming: boolean;
//   }) => void;
// }

// const TypingDots = () => (
//   <span className="inline-flex gap-0.5 ml-1">
//     {[0, 1, 2].map((i) => (
//       <span
//         key={i}
//         className="w-1.5 h-1.5 rounded-full bg-imaginory-yellow animate-bounce"
//         style={{ animationDelay: `${i * 0.15}s` }}
//       />
//     ))}
//   </span>
// );

// // Simple hover/focus tooltip
// const HoverHint: React.FC<{ content: string; children: React.ReactNode }> = ({
//   content,
//   children,
// }) => (
//   <span className="relative inline-block group">
//     <span className="inline-block" aria-describedby="hint">
//       {children}
//     </span>
//     <span
//       role="tooltip"
//       className="
//         pointer-events-none absolute left-1/2 top-full z-20 w-56 -translate-x-1/2
//         translate-y-2 rounded-md bg-gray-900 px-2 py-1.5 text-[11px] leading-snug
//         text-white opacity-0 shadow-lg transition
//         group-hover:opacity-100 group-hover:translate-y-1
//         group-focus-within:opacity-100 group-focus-within:translate-y-1
//       "
//     >
//       {content}
//       <span
//         className="
//           absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45
//           bg-gray-900
//         "
//       />
//     </span>
//   </span>
// );

// export function CustomStory({
//   primaryCharacterId,
//   onSubmit,
// }: CustomStoryProps) {
//   const { toast } = useToast();
//   const { user } = useAuth();

//   // Wizard state
//   const [step, setStep] = useState<number>(0);
//   const [predefs, setPredefs] = useState<any[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   // Character states - UPDATED FOR MULTI-CHARACTER SUPPORT
//   const [selectedChars, setSelectedChars] = useState<CharacterDetails[]>([]);
//   const [tempAvatar, setTempAvatar] = useState<string | null>(null);
//   const [showDetailForm, setShowDetailForm] = useState<boolean>(false);
//   const [detailName, setDetailName] = useState<string>("");
//   const [uploading, setUploading] = useState(false);
//   const [uploadPct, setUploadPct] = useState(0);
//   const [detailRelation, setDetailRelation] = useState<string>("");
//   const [detailGender, setDetailGender] = useState<string>("other");
//   const [cartoonPending, setCartoonPending] = useState(false);
//   const uploadToken = React.useRef(0);
//   const [cartoonUrl, setCartoonUrl] = useState<string | null>(null);
//   const [draftChar, setDraftChar] = useState<{
//     id: string;
//     imageUrls: string[];
//   } | null>(null);

//   // Moral and theme / story mode
//   const [moralOption, setMoralOption] = useState<string>("none");
//   const [customMoral, setCustomMoral] = useState<string>("");
//   const [theme, setTheme] = useState<string>("none");
//   const [rhyming, setRhyming] = useState<boolean>(false);

//   const [reasoningLog, setReasoningLog] = useState("");
//   const [thinking, setThinking] = useState(false);

//   // Theme or 140‑char story mode
//   const [storyMode, setStoryMode] = useState<"theme" | "text">("theme");
//   const [customStory, setCustomStory] = useState<string>("");
//   const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
//     [],
//   );
//   const [section, setSection] = useState<Section | null>(null);

//   const logRef = useRef<HTMLPreElement>(null);
//   useEffect(() => {
//     logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
//   }, [reasoningLog]);

//   // Load persisted
//   useEffect(() => {
//     const saved = localStorage.getItem(STORAGE_KEY);
//     if (saved) {
//       try {
//         const st = JSON.parse(saved);
//         setSelectedChars(st.selectedChars || []);
//         setMoralOption(st.moralOption);
//         setCustomMoral(st.customMoral);
//         setTheme(st.theme);
//         setRhyming(st.rhyming);
//         setStoryMode(st.storyMode ?? "theme");
//         setCustomStory(st.customStory ?? "");
//       } catch {}
//     }
//   }, []);

//   // Persist
//   useEffect(() => {
//     localStorage.setItem(
//       STORAGE_KEY,
//       JSON.stringify({
//         selectedChars,
//         moralOption,
//         customMoral,
//         theme,
//         rhyming,
//         storyMode,
//         customStory,
//       }),
//     );
//   }, [
//     selectedChars,
//     moralOption,
//     customMoral,
//     theme,
//     rhyming,
//     storyMode,
//     customStory,
//   ]);

//   // Fetch presets
//   useEffect(() => {
//     apiRequest("GET", "/api/characters?type=predefined")
//       .then((data: any[]) => setPredefs(data.slice(0, 5)))
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, []);

//   useEffect(() => {
//     if (!primaryCharacterId) return;

//     apiRequest("GET", "/api/characters?type=custom")
//       .then((all: any[]) => {
//         const ours = all
//           .filter(
//             (c) =>
//               Array.isArray(c.relations) &&
//               c.relations.some(
//                 (r: any) => r.primaryCharacterId === primaryCharacterId,
//               ),
//           )
//           .filter((c) => !/^__(DRAFT|SIDE_DRAFT)__?$/.test(c.name));
//         setPredefs((prev) => [
//           ...ours,
//           ...prev.slice(0, Math.max(0, 5 - ours.length)),
//         ]);
//       })
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [primaryCharacterId]);

//   const isCustom = (char: CharacterDetails) =>
//     char.id !== NO_ONE.id && !predefs.find((c) => c.id === char.id);

//   const canSaveDetail = () =>
//     detailName.trim() !== "" && detailRelation.trim() !== "";

//   const canNext = () => {
//     if (showDetailForm) return false;
//     if (step === 0) return true;
//     if (step === 1) return moralOption !== "other" || customMoral.trim() !== "";
//     if (storyMode === "theme") {
//       return theme !== "none";
//     }
//     return customStory.trim().length > 0 && customStory.trim().length <= 140;
//   };

//   const cancelSideCharacter = () => {
//     uploadToken.current += 1;
//     setTempAvatar(null);
//     setCartoonUrl(null);
//     setCartoonPending(false);
//     setUploading(false);
//     setUploadPct(0);
//     setShowDetailForm(false);
//   };

//   const buildSubmitPayload = (storyTheme: string) => {
//     const finalMoral =
//       moralOption === "none"
//         ? "no moral"
//         : moralOption === "other"
//           ? customMoral.trim()
//           : moralOption;
//     return {
//       storyType: "custom" as const,
//       characters: selectedChars,
//       moral: finalMoral,
//       theme: storyTheme,
//       rhyming,
//     };
//   };

//   const pending = React.useRef("");

//   const appendToken = React.useCallback(
//     (raw: string) => {
//       if (raw === "" || raw === " " || raw === "\n") {
//         setSection((s) => (s ? { ...s, body: s.body + "\n\n" } : s));
//         return;
//       }

//       if (raw.startsWith(" ") && /[A-Za-z0-9*]$/.test(section?.body ?? ""))
//         raw = raw.slice(1);

//       pending.current += raw;

//       while (true) {
//         const open = pending.current.indexOf("**");
//         if (open === -1) break;

//         const close = pending.current.indexOf("**", open + 2);
//         if (close === -1) break;

//         if (pending.current.length === close + 2) break;
//         if (pending.current[close + 2] === "*") break;

//         const chunk = pending.current.slice(0, close + 2);
//         const tail = pending.current.slice(close + 2);
//         pending.current = tail;

//         const parts = chunk.split(/\*\*([^*]+)\*\*/g);

//         setSection((prev) => {
//           let cur = prev ?? { title: "Thinking…", body: "" };

//           cur.body += parts[0];

//           for (let i = 1; i < parts.length; i += 2) {
//             const title = parts[i].trim();
//             const body = parts[i + 1] ?? "";
//             cur = { title, body };
//           }
//           return cur;
//         });
//       }

//       if (pending.current && !pending.current.includes("**")) {
//         setSection((s) => (s ? { ...s, body: s.body + pending.current } : s));
//         pending.current = "";
//       }
//     },
//     [section],
//   );

//   const removeCharacter = (characterId: string) => {
//     setSelectedChars((prev) => prev.filter((char) => char.id !== characterId));
//   };

//   const selectCharacter = (character: CharacterDetails) => {
//     if (character.id === NO_ONE.id) {
//       setSelectedChars([]);
//       return;
//     }

//     const isAlreadySelected = selectedChars.find(
//       (char) => char.id === character.id,
//     );
//     if (isAlreadySelected) {
//       removeCharacter(character.id);
//       return;
//     }

//     if (selectedChars.length < 3) {
//       setSelectedChars((prev) => [...prev, character]);
//     }
//   };

//   const validateThenSubmit = async () => {
//     setValidationErrors([]);
//     setReasoningLog("");

//     const finalMoral =
//       moralOption === "none"
//         ? ""
//         : moralOption === "other"
//           ? customMoral.trim()
//           : moralOption;
//     const hero = await apiRequest(
//       "GET",
//       `/api/characters/${primaryCharacterId}`,
//     );

//     const pronoun = ["boy", "male", "man"].includes(
//       hero.gender?.toLowerCase() || "",
//     )
//       ? "he"
//       : ["girl", "female", "woman"].includes(hero.gender?.toLowerCase() || "")
//         ? "she"
//         : "they";

//     const payload: any = {
//       kidName: hero.name,
//       pronoun,
//       age: hero.age ?? 0,
//       moral: finalMoral,
//       kidInterests: hero.interests ?? [],
//       storyThemes:
//         storyMode === "theme"
//           ? theme !== "none"
//             ? [theme]
//             : []
//           : [customStory.trim()],
//       storyRhyming: rhyming,
//     };

//     if (selectedChars.length > 0) {
//       payload.characters = selectedChars.map((char) => char.name);
//       payload.character_descriptions = selectedChars.map(
//         (char) =>
//           char?.description ||
//           char?.relations?.find(
//             (r) => r.primaryCharacterId === primaryCharacterId,
//           )?.relation ||
//           "",
//       );
//     }

//     try {
//       setThinking(true);
//       setReasoningLog("");

//       const res = await fetch("/api/runValidation", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "text/event-stream",
//           "Cache-Control": "no-cache",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         return;
//       }

//       const reader = res.body?.getReader();
//       if (!reader) {
//         return;
//       }

//       const decoder = new TextDecoder();
//       let buf = "";

//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) {
//           break;
//         }

//         const chunk = decoder.decode(value, { stream: true });
//         console.log("📦 4. raw chunk:", JSON.stringify(chunk));
//         buf += chunk;

//         let idx;
//         while ((idx = buf.indexOf("\n\n")) !== -1) {
//           const block = buf.slice(0, idx).trim();
//           buf = buf.slice(idx + 2);

//           console.log("🔬 5. SSE block:", block);

//           const lines = block.split("\n");
//           const typeLine = lines.find((l) => l.startsWith("event:"));
//           const isResult = typeLine?.startsWith("event: result");
//           const dataLines = lines
//             .filter((l) => l.startsWith("data:"))
//             .map((l) => l.slice(5));

//           if (isResult) {
//             setThinking(false);
//             try {
//               const result = JSON.parse(dataLines.join("\n"));

//               if (result.success) {
//                 onSubmit(buildSubmitPayload(customStory.trim()));
//               } else {
//                 const mapped = (result.failures ?? []).map((f: any) => ({
//                   check: f.check,
//                   problem: f.problem,
//                   solutions: Array.isArray(f.solution) ? f.solution : [],
//                 }));
//                 setValidationErrors(mapped);
//               }
//             } catch (err) {
//               console.error("⚠️  6b. JSON parse error:", err, dataLines);
//             }
//             setReasoningLog("");
//             return;
//           }

//           if (dataLines.length) {
//             if (thinking) setThinking(false);
//             dataLines.forEach((tok) => appendToken(tok));
//           }
//         }
//       }
//     } catch (err) {
//       console.error(err);
//       setValidationErrors(["Validation failed – please try again."]);
//       setReasoningLog("");
//     }
//   };

//   const handleNext = () => {
//     if (!canNext()) return;

//     if (step < SECTION_STEPS.length - 1) {
//       setStep(step + 1);
//       return;
//     }

//     if (storyMode === "text") {
//       validateThenSubmit();
//     } else {
//       onSubmit(buildSubmitPayload(theme));
//     }
//   };

//   const handleUpload = async (url: string) => {
//     const thisToken = ++uploadToken.current;
//     setTempAvatar(url);
//     setCartoonPending(true);
//     setCartoonUrl(null);
//     setShowDetailForm(true);
//     setDetailName("");
//     setDetailRelation("");
//     setDetailGender("other");

//     try {
//       let id = draftChar?.id;

//       if (!id) {
//         const draft = await apiRequest("POST", "/api/characters", {
//           imageUrls: [url],
//           type: "custom",
//           userId: user!.uid,
//           name: "__SIDE_DRAFT__",
//         });
//         id = draft.id;
//         setDraftChar({ id: draft.id, imageUrls: draft.imageUrls });
//       }

//       const { toonUrl } = await apiRequest("POST", "/api/cartoonify", {
//         characterId: id,
//         imageUrl: url,
//       });
//       if (uploadToken.current !== thisToken) return;
//       setCartoonUrl(toonUrl);
//     } catch (err) {
//       console.error("cartoonify failed", err);
//       toast({
//         title: "Error",
//         description: "Could not cartoonify image",
//         variant: "destructive",
//       });
//       setCartoonUrl(url);
//     } finally {
//       if (uploadToken.current === thisToken) setCartoonPending(false);
//     }
//   };

//   const submitDetails = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!tempAvatar || !cartoonUrl || !primaryCharacterId) {
//       return toast({
//         title: "Error",
//         description: "Please finish the image step first.",
//         variant: "destructive",
//       });
//     }

//     const genderPayload = ["male", "man", "boy"].includes(
//       detailGender?.toLowerCase() || "",
//     )
//       ? "boy"
//       : ["female", "woman", "girl"].includes(detailGender?.toLowerCase() || "")
//         ? "girl"
//         : "other";

//     const allImages = Array.from(new Set([tempAvatar, cartoonUrl]));

//     const payload = {
//       name: detailName.trim(),
//       age: 0,
//       imageUrls: allImages,
//       toonUrl: cartoonUrl,
//       relation: detailRelation.trim(),
//       gender: genderPayload,
//       type: "custom",
//       relations: [
//         {
//           primaryCharacterId,
//           relation: detailRelation.trim(),
//         },
//       ],
//     };

//     try {
//       const saved = draftChar
//         ? await apiRequest("PUT", `/api/characters/${draftChar.id}`, payload)
//         : await apiRequest("POST", "/api/characters", payload);

//       const detail: CharacterDetails = {
//         id: saved.id,
//         avatar: saved.imageUrls[0],
//         toonUrl: saved.toonUrl,
//         name: saved.name,
//         relation: saved.relation,
//         gender: saved.gender,
//         description: saved.description ?? saved.relations?.[0]?.relation ?? "",
//       };

//       if (selectedChars.length < 3) {
//         setSelectedChars((prev) => [...prev, detail]);
//       }
//       setShowDetailForm(false);
//       toast({ title: "Character saved" });
//     } catch (err) {
//       console.error("save failed", err);
//       toast({
//         title: "Error",
//         description: "Could not save character. Try again?",
//         variant: "destructive",
//       });
//     }
//   };

//   if (!primaryCharacterId) {
//     return (
//       <div className="p-6">
//         <p className="text-red-600">Please select a hero character first.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="md:grid md:grid-cols-[auto_1fr] gap-6">
//       {/* Left: Stepper */}
//       <div className="border rounded-lg p-4">
//         <nav className="flex md:flex-col items-start space-x-4 md:space-x-0 md:space-y-4">
//           {SECTION_STEPS.map((s, idx) => (
//             <button
//               key={s.id}
//               onClick={() => setStep(idx)}
//               className="flex items-center focus:outline-none"
//             >
//               <div
//                 className={
//                   "h-8 w-8 flex items-center justify-center rounded-full border text-sm font-medium transition " +
//                   (idx < step
//                     ? "bg-green-50 text-green-600 border-green-200"
//                     : idx === step
//                       ? "bg-imaginory-yellow text-imaginory-black border-transparent"
//                       : "bg-gray-50 text-gray-400 border-gray-200")
//                 }
//               >
//                 {s.id}
//               </div>
//               <span
//                 className={
//                   "ml-2 text-sm transition " +
//                   (idx === step
//                     ? "text-imaginory-black font-semibold"
//                     : "text-gray-500")
//                 }
//               >
//                 {s.name}
//               </span>
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Right: Content */}
//       <div className="space-y-6">
//         {/* Character */}
//         {step === 0 && (
//           <Card className="bg-transparent border-0 shadow-none">
//             <CardContent className="bg-transparent">
//               <h3 className="text-lg font-semibold mb-2">Choose characters</h3>
//               <p className="text-sm text-gray-600 mb-4">
//                 Select up to 3 additional characters for your story.
//               </p>

//               {/* Selected Characters Display */}
//               {selectedChars.length > 0 && (
//                 <div className="mb-4">
//                   <p className="text-sm text-gray-600 mb-2">
//                     Selected Characters ({selectedChars.length}/3):
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {selectedChars.map((char) => (
//                       <div
//                         key={char.id}
//                         className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
//                       >
//                         <img
//                           src={char.avatar}
//                           alt={char.name}
//                           className="w-6 h-6 rounded-full object-cover"
//                         />
//                         <span className="text-sm">{char.name}</span>
//                         <button
//                           onClick={() => removeCharacter(char.id)}
//                           className="text-gray-500 hover:text-red-500"
//                         >
//                           ×
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {!showDetailForm && (
//                 <div className="grid grid-cols-3 gap-4">
//                   {loading ? (
//                     <div>Loading…</div>
//                   ) : uploading || cartoonPending ? (
//                     <div className="w-full max-w-xs mx-auto py-6">
//                       <Progress value={uploadPct} />
//                       <p className="text-center text-sm text-muted-foreground mt-1">
//                         {cartoonPending
//                           ? "Generating preview…"
//                           : `Uploading… ${Math.round(uploadPct)}%`}
//                       </p>
//                     </div>
//                   ) : (
//                     <>
//                       <div
//                         role="button"
//                         onClick={() => selectCharacter(NO_ONE)}
//                         className={
//                           "flex flex-col items-center p-1 cursor-pointer rounded transition " +
//                           (selectedChars.length === 0
//                             ? "ring-2 ring-primary"
//                             : "hover:ring-1 hover:ring-gray-300")
//                         }
//                       >
//                         <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center">
//                           <span className="text-gray-400">—</span>
//                         </div>
//                         <span className="text-xs mt-1 text-slate-700">
//                           No one
//                         </span>
//                       </div>
//                       {/* Predefs */}
//                       {predefs.slice(0, 4).map((c) => {
//                         const isSelected = selectedChars.find(
//                           (char) => char.id === c.id,
//                         );
//                         return (
//                           <div
//                             key={c.id}
//                             role="button"
//                             onClick={() =>
//                               selectCharacter({
//                                 id: c.id,
//                                 avatar: c.imageUrls[0],
//                                 name: c.name,
//                                 relation: "",
//                                 gender: "",
//                                 description: c.description ?? "",
//                                 toonUrl: c.toonUrl,
//                               })
//                             }
//                             className={
//                               "flex flex-col items-center p-1 cursor-pointer rounded transition " +
//                               (isSelected
//                                 ? "ring-2 ring-primary"
//                                 : "hover:ring-1 hover:ring-gray-300")
//                             }
//                           >
//                             <img
//                               src={c.imageUrls[0]}
//                               alt={c.name}
//                               className="w-12 h-12 rounded-full object-cover"
//                             />
//                             <span className="text-xs mt-1 text-slate-700">
//                               {c.name}
//                             </span>
//                           </div>
//                         );
//                       })}
//                       {/* Custom slot or tile */}
//                       <div className="flex justify-center items-center">
//                         {selectedChars.some((char) => isCustom(char)) ? (
//                           <div className="flex flex-col items-center">
//                             {selectedChars
//                               .filter((char) => isCustom(char))
//                               .map((char) => (
//                                 <div
//                                   key={char.id}
//                                   className="flex flex-col items-center p-1 cursor-pointer rounded transition ring-2 ring-primary relative group mb-2"
//                                 >
//                                   <img
//                                     src={char.avatar}
//                                     alt={char.name}
//                                     className="w-12 h-12 rounded-full object-cover"
//                                   />
//                                   <span className="text-xs mt-1 text-slate-700 truncate">
//                                     {char.name}
//                                   </span>
//                                   <button
//                                     onClick={() => removeCharacter(char.id)}
//                                     className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow hidden group-hover:block"
//                                   >
//                                     ×
//                                   </button>
//                                 </div>
//                               ))}
//                           </div>
//                         ) : (
//                           <div
//                             className={`${showDetailForm ? "opacity-50 pointer-events-none" : ""}`}
//                           >
//                             <FileUploadTile
//                               onStart={() => {
//                                 setUploading(true);
//                                 setUploadPct(0);
//                                 uploadToken.current += 1;
//                               }}
//                               onProgress={(pct: number) => setUploadPct(pct)}
//                               onUpload={(url: string) => {
//                                 setUploading(false);
//                                 handleUpload(url);
//                               }}
//                             />
//                           </div>
//                         )}
//                       </div>
//                     </>
//                   )}
//                 </div>
//               )}

//               {/* Custom detail form */}
//               {showDetailForm && (
//                 <>
//                   <div className="flex gap-4 items-center my-4">
//                     <div className="relative">
//                       <img
//                         src={tempAvatar!}
//                         className="h-24 w-24 object-cover rounded border"
//                       />
//                       <button
//                         type="button"
//                         onClick={cancelSideCharacter}
//                         aria-label="Remove"
//                         className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
//                       >
//                         ×
//                       </button>
//                     </div>
//                     {cartoonPending ? (
//                       <div className="h-24 w-24 flex items-center justify-center border rounded">
//                         <i className="fas fa-spinner fa-spin text-gray-500 text-xl" />
//                       </div>
//                     ) : (
//                       cartoonUrl && (
//                         <img
//                           src={cartoonUrl}
//                           className="h-24 w-24 object-cover rounded border"
//                         />
//                       )
//                     )}
//                   </div>

//                   <form onSubmit={submitDetails} className="mt-4 space-y-3">
//                     <div>
//                       <Label htmlFor="name">Name</Label>
//                       <Input
//                         id="name"
//                         name="name"
//                         value={detailName}
//                         onChange={(e) => setDetailName(e.target.value)}
//                         required
//                         className="mt-1"
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="relation">Relation</Label>
//                       <Input
//                         id="relation"
//                         name="relation"
//                         placeholder="e.g. Sidekick"
//                         value={detailRelation}
//                         onChange={(e) => setDetailRelation(e.target.value)}
//                         required
//                         className="mt-1"
//                       />
//                     </div>
//                     <div>
//                       <Label className="block mb-1">Pronoun</Label>
//                       <RadioGroup
//                         value={detailGender}
//                         onValueChange={setDetailGender}
//                         className="flex space-x-4"
//                       >
//                         <div className="flex items-center space-x-1">
//                           <RadioGroupItem value="male" /> He/Him
//                         </div>
//                         <div className="flex items-center space-x-1">
//                           <RadioGroupItem value="female" /> She/Her
//                         </div>
//                         <div className="flex items-center space-x-1">
//                           <RadioGroupItem value="other" /> They/Them
//                         </div>
//                       </RadioGroup>
//                     </div>
//                     <div className="text-right">
//                       <div className="flex justify-end gap-3">
//                         <Button
//                           type="button"
//                           variant="outline"
//                           onClick={cancelSideCharacter}
//                         >
//                           Cancel
//                         </Button>
//                         <Button type="submit" disabled={!canSaveDetail()}>
//                           Save Character
//                         </Button>
//                       </div>
//                     </div>
//                   </form>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         )}

//         {/* Moral */}
//         {step === 1 && (
//           <Card className="relative bg-transparent border-0 shadow-none">
//             <CardContent className="bg-transparent">
//               <h3 className="text-lg font-semibold mb-2">Select a moral</h3>
//               <p className="text-sm text-gray-600 mb-4">
//                 Hover to see what each moral means.
//               </p>

//               <div className="flex flex-wrap gap-2 items-start">
//                 <Chip
//                   selected={moralOption === "none"}
//                   onClick={() => setMoralOption("none")}
//                   className="px-2 py-1 text-xs"
//                   title="Skip the moral (you can add it later)"
//                 >
//                   No moral
//                 </Chip>

//                 {MORAL_OPTIONS.map((opt) => (
//                   <HoverHint key={opt} content={MORAL_BLURBS[opt]}>
//                     <Chip
//                       selected={moralOption === opt}
//                       onClick={() => setMoralOption(opt)}
//                       className={cn(
//                         "px-2 py-1 text-xs rounded-full",
//                         moralOption === opt ? "ring-2 ring-primary" : "",
//                       )}
//                       title={MORAL_BLURBS[opt]}
//                     >
//                       {opt}
//                     </Chip>
//                   </HoverHint>
//                 ))}

//                 <Chip
//                   selected={moralOption === "other"}
//                   onClick={() => setMoralOption("other")}
//                   className="px-2 py-1 text-xs"
//                   title="Write your own moral"
//                 >
//                   Other ✎
//                 </Chip>
//               </div>

//               {moralOption === "other" && (
//                 <textarea
//                   value={customMoral}
//                   onChange={(e) => setCustomMoral(e.target.value)}
//                   rows={3}
//                   className="w-full mt-3 border rounded p-2 text-sm focus:ring-primary/60 focus:outline-none"
//                   placeholder="Type your moral here..."
//                 />
//               )}
//             </CardContent>
//           </Card>
//         )}

//         {/* Theme & Rhyming OR 140‑char story */}
//         {step === 2 && (
//           <Card className="relative bg-transparent border-0 shadow-none">
//             <CardContent className="bg-transparent">
//               <h3 className="text-lg font-semibold mb-2">Theme & Rhyming</h3>
//               <p className="text-sm text-gray-600 mb-4">
//                 Choose a theme or supply your own 140‑character story prompt.
//               </p>

//               {/* Segmented toggle */}
//               <div className="inline-flex bg-gray-50 p-1 rounded-md border mb-4 w-full md:w-auto">
//                 <button
//                   type="button"
//                   className={cn(
//                     "flex-1 md:flex-none px-4 py-2 rounded-md text-sm transition",
//                     storyMode === "theme"
//                       ? "bg-imaginory-yellow shadow text-imaginory-black"
//                       : "text-gray-500",
//                   )}
//                   onClick={() => setStoryMode("theme")}
//                 >
//                   Pick a theme
//                 </button>
//                 <button
//                   type="button"
//                   className={cn(
//                     "flex-1 md:flex-none px-4 py-2 rounded-md text-sm transition",
//                     storyMode === "text"
//                       ? "bg-imaginory-yellow shadow text-imaginory-black"
//                       : "text-gray-500",
//                   )}
//                   onClick={() => setStoryMode("text")}
//                 >
//                   Write my own
//                 </button>
//               </div>

//               {storyMode === "theme" ? (
//                 <>
//                   <div className="flex flex-wrap gap-2 mb-4">
//                     {THEME_OPTIONS.map((opt) => (
//                       <Chip
//                         key={opt.value}
//                         selected={theme === opt.value}
//                         onClick={() => setTheme(opt.value)}
//                       >
//                         {opt.label}
//                       </Chip>
//                     ))}
//                   </div>
//                   <p className="text-sm text-gray-700 mb-2">
//                     Do you want to enable rhyming for the story?
//                   </p>
//                   <Switch
//                     checked={rhyming}
//                     onCheckedChange={setRhyming}
//                     id="rhyming"
//                   />
//                 </>
//               ) : (
//                 <>
//                   <div className="relative">
//                     <textarea
//                       value={customStory}
//                       onChange={(e) =>
//                         setCustomStory(e.target.value.slice(0, 140))
//                       }
//                       rows={4}
//                       maxLength={140}
//                       className="w-full border rounded p-3 focus:ring-primary focus:outline-none"
//                       placeholder="Your story idea in 140 characters…"
//                       disabled={thinking}
//                     />
//                     {thinking && (
//                       <div
//                         className="absolute inset-0 bg-white/70 flex items-center
//                                     justify-center rounded-md z-10"
//                       >
//                         <i className="fas fa-circle-notch fa-spin text-primary text-2xl" />
//                         <span className="ml-2 text-sm text-gray-700">
//                           Validating…
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                   <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
//                     <span>{customStory.length} / 140</span>
//                     {customStory.length > 140 && (
//                       <span className="text-red-600">Too long</span>
//                     )}
//                   </div>

//                   {(thinking || reasoningLog) && (
//                     <div className="mt-4">
//                       <p className="text-xs mb-1 flex items-center">
//                         <span className="font-semibold text-imaginory-yellow">
//                           {thinking ? "Thinking" : "Listening"}
//                         </span>
//                         {thinking && <TypingDots />}
//                       </p>

//                       {section && (
//                         <div className="mt-4">
//                           <p className="font-semibold mb-1 flex items-center shimmer">
//                             {section.title}
//                           </p>

//                           <div
//                             className="bg-white border border-red-300 rounded-md p-3
//                                        text-xs text-gray-800 whitespace-pre-wrap
//                                        max-h-56 overflow-y-auto"
//                           >
//                             <ReactMarkdown>{section.body}</ReactMarkdown>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                   {validationErrors.length > 0 && (
//                     <div className="space-y-3 mt-4">
//                       <div className="flex items-start p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
//                         <i className="fas fa-exclamation-circle mt-0.5 mr-2" />
//                         <p className="text-sm">
//                           We couldn't approve your story yet. Please review the
//                           suggestions below and try again.
//                         </p>
//                       </div>
//                       {validationErrors.map((err, i) => (
//                         <div
//                           key={i}
//                           className="border border-red-300 rounded-lg p-4 bg-red-50/60"
//                         >
//                           <p className="font-semibold text-red-700">
//                             {err.check}
//                           </p>

//                           <p className="text-sm text-red-600 mt-1">
//                             {err.problem}
//                           </p>

//                           {Array.isArray(err.solutions) &&
//                             err.solutions.length > 0 && (
//                               <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-600">
//                                 {err.solutions.map((s, j) => (
//                                   <li key={j}>{s}</li>
//                                 ))}
//                               </ul>
//                             )}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         )}

//         {/* Next/Finish */}
//         <div className="text-right sticky bottom-0 bg-white py-3 md:static md:bg-transparent">
//           <Button onClick={handleNext} disabled={!canNext() || thinking}>
//             {step < SECTION_STEPS.length - 1
//               ? "Next"
//               : storyMode === "text"
//                 ? "Validate & Finish"
//                 : "Finish"}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
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
  toonUrl: "",
  name: "No one",
  relation: "",
  gender: "other",
  description: "",
};

// Preset options (labels shown on chips)
export const MORAL_OPTIONS = [
  "Patience grows good things",
  "Practice makes progress",
  "Be gentle with living things",
  "Take care of your world",
  "Tell the truth and fix it",
  "Think first, then act",
  "Curiosity leads to discovery",
  "Keep going, adjust the plan",
  "Calm body, clear choices",
  "Courage with care",
] as const;

// Parent-facing one-liners (shown on hover)
export const MORAL_BLURBS: Record<(typeof MORAL_OPTIONS)[number], string> = {
  "Patience grows good things":
    "Real growth takes time; caring and waiting beat rushing.",
  "Practice makes progress":
    "Small, steady effort improves skills more than instant perfection.",
  "Be gentle with living things":
    "Handle plants and animals with care, respect, and soft hands.",
  "Take care of your world":
    "Clean up, fix small messes, and leave places better than you found them.",
  "Tell the truth and fix it":
    "Own mistakes kindly, make amends, and set things right.",
  "Think first, then act":
    "Pause, notice details, and choose the safe, wise next step.",
  "Curiosity leads to discovery":
    "Looking closely and asking questions reveals new ideas and paths.",
  "Keep going, adjust the plan":
    "Try, tweak, and try again when things don't work at first.",
  "Calm body, clear choices":
    "Breathe, settle feelings, then decide what to do.",
  "Courage with care":
    "Be brave, move thoughtfully, and avoid risky or rough choices.",
};

type Section = { title: string; body: string };

const THEME_OPTIONS = [
  {
    value: "discovering-hidden-worlds-through-curiosity-and-courage",
    label: "Adventure Quest",
  },
  {
    value: "finding-extraordinary-magic-in-everyday-moments-and-places",
    label: "Magical Discovery",
  },
  {
    value:
      "building-meaningful-connections-through-shared-experiences-and-understanding",
    label: "Friendship Tale",
  },
  {
    value: "creating-peaceful-resolutions-to-gentle-challenges-before-sleep",
    label: "Bedtime Comfort",
  },
  {
    value: "solving-intriguing-puzzles-through-observation-and-clever-thinking",
    label: "Mystery Solving",
  },
  {
    value: "navigating-important-milestone-moments-with-confidence-and-joy",
    label: "Big Day Story",
  },
  {
    value: "transforming-creative-ideas-into-wonderful-reality-through-play",
    label: "Imagination Play",
  },
  {
    value: "overcoming-personal-fears-and-doubts-through-inner-strength",
    label: "Courage Journey",
  },
  {
    value: "exploring-natural-wonders-and-environmental-connections-outdoors",
    label: "Nature Adventure",
  },
  {
    value: "building-something-amazing-through-teamwork-and-perseverance",
    label: "Creation Quest",
  },
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
    theme: string;
    rhyming: boolean;
  }) => void;
}

const TypingDots = () => (
  <span className="inline-flex gap-0.5 ml-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-imaginory-yellow animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

// Simple hover/focus tooltip
const HoverHint: React.FC<{ content: string; children: React.ReactNode }> = ({
  content,
  children,
}) => (
  <span className="relative inline-block group">
    <span className="inline-block" aria-describedby="hint">
      {children}
    </span>
    <span
      role="tooltip"
      className="
        pointer-events-none absolute left-1/2 top-full z-20 w-56 -translate-x-1/2
        translate-y-2 rounded-md bg-gray-900 px-2 py-1.5 text-[11px] leading-snug
        text-white opacity-0 shadow-lg transition
        group-hover:opacity-100 group-hover:translate-y-1
        group-focus-within:opacity-100 group-focus-within:translate-y-1
      "
    >
      {content}
      <span
        className="
          absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45
          bg-gray-900
        "
      />
    </span>
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

  // Character states - UPDATED FOR MULTI-CHARACTER SUPPORT
  const [selectedChars, setSelectedChars] = useState<CharacterDetails[]>([]);
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

  // Theme or 140‑char story mode
  const [storyMode, setStoryMode] = useState<"theme" | "text">("theme");
  const [customStory, setCustomStory] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [section, setSection] = useState<Section | null>(null);

  const logRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [reasoningLog]);

  // Load persisted
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const st = JSON.parse(saved);
        setSelectedChars(st.selectedChars || []);
        setMoralOption(st.moralOption);
        setCustomMoral(st.customMoral);
        setTheme(st.theme);
        setRhyming(st.rhyming);
        setStoryMode(st.storyMode ?? "theme");
        setCustomStory(st.customStory ?? "");
      } catch {}
    }
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedChars,
        moralOption,
        customMoral,
        theme,
        rhyming,
        storyMode,
        customStory,
      }),
    );
  }, [
    selectedChars,
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

  const isCustom = (char: CharacterDetails) =>
    char.id !== NO_ONE.id && !predefs.find((c) => c.id === char.id);

  const canSaveDetail = () =>
    detailName.trim() !== "" && detailRelation.trim() !== "";

  const canNext = () => {
    if (showDetailForm) return false;
    if (step === 0) return true;
    if (step === 1) return moralOption !== "other" || customMoral.trim() !== "";
    if (storyMode === "theme") {
      return theme !== "none";
    }
    return customStory.trim().length > 0 && customStory.trim().length <= 140;
  };

  const cancelSideCharacter = () => {
    uploadToken.current += 1;
    setTempAvatar(null);
    setCartoonUrl(null);
    setCartoonPending(false);
    setUploading(false);
    setUploadPct(0);
    setShowDetailForm(false);
  };

  const buildSubmitPayload = (storyTheme: string) => {
    const finalMoral =
      moralOption === "none"
        ? "no moral"
        : moralOption === "other"
          ? customMoral.trim()
          : moralOption;
    return {
      storyType: "custom" as const,
      characters: selectedChars,
      moral: finalMoral,
      theme: storyTheme,
      rhyming,
    };
  };

  const pending = React.useRef("");

  const appendToken = React.useCallback(
    (raw: string) => {
      if (raw === "" || raw === " " || raw === "\n") {
        setSection((s) => (s ? { ...s, body: s.body + "\n\n" } : s));
        return;
      }

      if (raw.startsWith(" ") && /[A-Za-z0-9*]$/.test(section?.body ?? ""))
        raw = raw.slice(1);

      pending.current += raw;

      while (true) {
        const open = pending.current.indexOf("**");
        if (open === -1) break;

        const close = pending.current.indexOf("**", open + 2);
        if (close === -1) break;

        if (pending.current.length === close + 2) break;
        if (pending.current[close + 2] === "*") break;

        const chunk = pending.current.slice(0, close + 2);
        const tail = pending.current.slice(close + 2);
        pending.current = tail;

        const parts = chunk.split(/\*\*([^*]+)\*\*/g);

        setSection((prev) => {
          let cur = prev ?? { title: "Thinking…", body: "" };

          cur.body += parts[0];

          for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i].trim();
            const body = parts[i + 1] ?? "";
            cur = { title, body };
          }
          return cur;
        });
      }

      if (pending.current && !pending.current.includes("**")) {
        setSection((s) => (s ? { ...s, body: s.body + pending.current } : s));
        pending.current = "";
      }
    },
    [section],
  );

  const removeCharacter = (characterId: string) => {
    setSelectedChars((prev) => prev.filter((char) => char.id !== characterId));
  };

  const selectCharacter = (character: CharacterDetails) => {
    if (character.id === NO_ONE.id) {
      setSelectedChars([]);
      return;
    }

    const isAlreadySelected = selectedChars.find(
      (char) => char.id === character.id,
    );
    if (isAlreadySelected) {
      removeCharacter(character.id);
      return;
    }

    if (selectedChars.length < 3) {
      setSelectedChars((prev) => [...prev, character]);
    }
  };

  const validateThenSubmit = async () => {
    setValidationErrors([]);
    setReasoningLog("");

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

    const pronoun = ["boy", "male", "man"].includes(
      hero.gender?.toLowerCase() || "",
    )
      ? "he"
      : ["girl", "female", "woman"].includes(hero.gender?.toLowerCase() || "")
        ? "she"
        : "they";

    const payload: any = {
      kidName: hero.name,
      pronoun,
      age: hero.age ?? 0,
      moral: finalMoral,
      kidInterests: hero.interests ?? [],
      storyThemes:
        storyMode === "theme"
          ? theme !== "none"
            ? [theme]
            : []
          : [customStory.trim()],
      storyRhyming: rhyming,
    };

    if (selectedChars.length > 0) {
      payload.characters = selectedChars.map((char) => char.name);
      payload.character_descriptions = selectedChars.map(
        (char) =>
          char?.description ||
          char?.relations?.find(
            (r) => r.primaryCharacterId === primaryCharacterId,
          )?.relation ||
          "",
      );
    }

    try {
      setThinking(true);
      setReasoningLog("");

      const res = await fetch("/api/runValidation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

          const lines = block.split("\n");
          const typeLine = lines.find((l) => l.startsWith("event:"));
          const isResult = typeLine?.startsWith("event: result");
          const dataLines = lines
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5));

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
            setReasoningLog("");
            return;
          }

          if (dataLines.length) {
            if (thinking) setThinking(false);
            dataLines.forEach((tok) => appendToken(tok));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setValidationErrors(["Validation failed – please try again."]);
      setReasoningLog("");
    }
  };

  const handleNext = () => {
    if (!canNext()) return;

    if (step < SECTION_STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    if (storyMode === "text") {
      validateThenSubmit();
    } else {
      onSubmit(buildSubmitPayload(theme));
    }
  };

  const handleUpload = async (url: string) => {
    const thisToken = ++uploadToken.current;
    setTempAvatar(url);
    setCartoonPending(true);
    setCartoonUrl(null);
    setShowDetailForm(true);
    setDetailName("");
    setDetailRelation("");
    setDetailGender("other");

    try {
      let id = draftChar?.id;

      if (!id) {
        const draft = await apiRequest("POST", "/api/characters", {
          imageUrls: [url],
          type: "custom",
          userId: user!.uid,
          name: "__SIDE_DRAFT__",
        });
        id = draft.id;
        setDraftChar({ id: draft.id, imageUrls: draft.imageUrls });
      }

      const { toonUrl } = await apiRequest("POST", "/api/cartoonify", {
        characterId: id,
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
      setCartoonUrl(url);
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

    const genderPayload = ["male", "man", "boy"].includes(
      detailGender?.toLowerCase() || "",
    )
      ? "boy"
      : ["female", "woman", "girl"].includes(detailGender?.toLowerCase() || "")
        ? "girl"
        : "other";

    const allImages = Array.from(new Set([tempAvatar, cartoonUrl]));

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
        description: saved.description ?? saved.relations?.[0]?.relation ?? "",
      };

      if (selectedChars.length < 3) {
        setSelectedChars((prev) => [...prev, detail]);
      }
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
    <div className="flex flex-col md:grid md:grid-cols-[auto_1fr] gap-4 md:gap-6">
      {/* Stepper */}
      <div className="border rounded-lg p-3 md:p-4">
        <nav className="flex flex-row md:flex-col items-start space-x-2 md:space-x-0 md:space-y-4 overflow-x-auto md:overflow-x-visible">
          {SECTION_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setStep(idx)}
              className="flex flex-col md:flex-row items-center focus:outline-none min-w-[80px] md:min-w-0"
            >
              <div
                className={
                  "h-6 w-6 md:h-8 md:w-8 flex items-center justify-center rounded-full border text-xs md:text-sm font-medium transition " +
                  (idx < step
                    ? "bg-green-50 text-green-600 border-green-200"
                    : idx === step
                      ? "bg-imaginory-yellow text-imaginory-black border-transparent"
                      : "bg-gray-50 text-gray-400 border-gray-200")
                }
              >
                {s.id}
              </div>
              <span
                className={
                  "mt-1 md:mt-0 md:ml-2 text-xs md:text-sm transition text-center " +
                  (idx === step
                    ? "text-imaginory-black font-semibold"
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
          <Card className="bg-transparent border-0 shadow-none">
            <CardContent className="bg-transparent">
              <h3 className="text-lg font-semibold mb-2">Choose characters</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select up to 3 additional characters for your story.
              </p>

              {/* Selected Characters Display */}
              {selectedChars.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected Characters ({selectedChars.length}/3):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChars.map((char) => (
                      <div
                        key={char.id}
                        className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                      >
                        <img
                          src={char.avatar}
                          alt={char.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm">{char.name}</span>
                        <button
                          onClick={() => removeCharacter(char.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showDetailForm && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
                        onClick={() => selectCharacter(NO_ONE)}
                        className={
                          "flex flex-col items-center p-1 cursor-pointer rounded transition " +
                          (selectedChars.length === 0
                            ? "ring-2 ring-primary"
                            : "hover:ring-1 hover:ring-gray-300")
                        }
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-300 flex items-center justify-center">
                          <span className="text-gray-400">—</span>
                        </div>
                        <span className="text-xs mt-1 text-slate-700 text-center">
                          No one
                        </span>
                      </div>
                      {/* Predefs */}
                      {predefs.slice(0, 4).map((c) => {
                        const isSelected = selectedChars.find(
                          (char) => char.id === c.id,
                        );
                        return (
                          <div
                            key={c.id}
                            role="button"
                            onClick={() =>
                              selectCharacter({
                                id: c.id,
                                avatar: c.imageUrls[0],
                                name: c.name,
                                relation: "",
                                gender: "",
                                description: c.description ?? "",
                                toonUrl: c.toonUrl,
                              })
                            }
                            className={
                              "flex flex-col items-center p-1 cursor-pointer rounded transition " +
                              (isSelected
                                ? "ring-2 ring-primary"
                                : "hover:ring-1 hover:ring-gray-300")
                            }
                          >
                            <img
                              src={c.imageUrls[0]}
                              alt={c.name}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                            />
                            <span className="text-xs mt-1 text-slate-700 text-center">
                              {c.name}
                            </span>
                          </div>
                        );
                      })}
                      {/* Custom slot or tile */}
                      <div className="flex justify-center items-center">
                        {selectedChars.some((char) => isCustom(char)) ? (
                          <div className="flex flex-col items-center">
                            {selectedChars
                              .filter((char) => isCustom(char))
                              .map((char) => (
                                <div
                                  key={char.id}
                                  className="flex flex-col items-center p-1 cursor-pointer rounded transition ring-2 ring-primary relative group mb-2"
                                >
                                  <img
                                    src={char.avatar}
                                    alt={char.name}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                                  />
                                  <span className="text-xs mt-1 text-slate-700 truncate text-center">
                                    {char.name}
                                  </span>
                                  <button
                                    onClick={() => removeCharacter(char.id)}
                                    className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow hidden group-hover:block"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
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
                  <div className="flex gap-3 md:gap-4 items-center my-4 justify-center md:justify-start">
                    <div className="relative">
                      <img
                        src={tempAvatar!}
                        className="h-20 w-20 md:h-24 md:w-24 object-cover rounded border"
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
                      <div className="h-20 w-20 md:h-24 md:w-24 flex items-center justify-center border rounded">
                        <i className="fas fa-spinner fa-spin text-gray-500 text-lg md:text-xl" />
                      </div>
                    ) : (
                      cartoonUrl && (
                        <img
                          src={cartoonUrl}
                          className="h-20 w-20 md:h-24 md:w-24 object-cover rounded border"
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
                      <Label className="block mb-1">Pronoun</Label>
                      <RadioGroup
                        value={detailGender}
                        onValueChange={setDetailGender}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="male" /> He/Him
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="female" /> She/Her
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="other" /> They/Them
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col md:flex-row justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelSideCharacter}
                          className="w-full md:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!canSaveDetail()}
                          className="w-full md:w-auto"
                        >
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
          <Card className="relative bg-transparent border-0 shadow-none">
            <CardContent className="bg-transparent">
              <h3 className="text-lg font-semibold mb-2">Select a moral</h3>
              <p className="text-sm text-gray-600 mb-4">
                Hover to see what each moral means.
              </p>

              <div className="flex flex-wrap gap-2 items-start">
                <Chip
                  selected={moralOption === "none"}
                  onClick={() => setMoralOption("none")}
                  className="px-2 py-1 text-xs"
                  title="Skip the moral (you can add it later)"
                >
                  No moral
                </Chip>

                {MORAL_OPTIONS.map((opt) => (
                  <HoverHint key={opt} content={MORAL_BLURBS[opt]}>
                    <Chip
                      selected={moralOption === opt}
                      onClick={() => setMoralOption(opt)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        moralOption === opt ? "ring-2 ring-primary" : "",
                      )}
                      title={MORAL_BLURBS[opt]}
                    >
                      {opt}
                    </Chip>
                  </HoverHint>
                ))}

                <Chip
                  selected={moralOption === "other"}
                  onClick={() => setMoralOption("other")}
                  className="px-2 py-1 text-xs"
                  title="Write your own moral"
                >
                  Other ✎
                </Chip>
              </div>

              {moralOption === "other" && (
                <textarea
                  value={customMoral}
                  onChange={(e) => setCustomMoral(e.target.value)}
                  rows={3}
                  className="w-full mt-3 border rounded p-2 text-sm focus:ring-primary/60 focus:outline-none"
                  placeholder="Type your moral here..."
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Theme & Rhyming OR 140‑char story */}
        {step === 2 && (
          <Card className="relative bg-transparent border-0 shadow-none">
            <CardContent className="bg-transparent">
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
                      ? "bg-imaginory-yellow shadow text-imaginory-black"
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
                      ? "bg-imaginory-yellow shadow text-imaginory-black"
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
                      rows={3}
                      maxLength={140}
                      className="w-full border rounded p-2 md:p-3 text-sm md:text-base focus:ring-primary focus:outline-none"
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
                      <p className="text-xs mb-1 flex items-center">
                        <span className="font-semibold text-imaginory-yellow">
                          {thinking ? "Thinking" : "Listening"}
                        </span>
                        {thinking && <TypingDots />}
                      </p>

                      {section && (
                        <div className="mt-4">
                          <p className="font-semibold mb-1 flex items-center shimmer">
                            {section.title}
                          </p>

                          <div
                            className="bg-white border border-red-300 rounded-md p-2 md:p-3
                                       text-xs text-gray-800 whitespace-pre-wrap
                                       max-h-40 md:max-h-56 overflow-y-auto"
                          >
                            <ReactMarkdown>{section.body}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {validationErrors.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-start p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
                        <i className="fas fa-exclamation-circle mt-0.5 mr-2" />
                        <p className="text-sm">
                          We couldn't approve your story yet. Please review the
                          suggestions below and try again.
                        </p>
                      </div>
                      {validationErrors.map((err, i) => (
                        <div
                          key={i}
                          className="border border-red-300 rounded-lg p-4 bg-red-50/60"
                        >
                          <p className="font-semibold text-red-700">
                            {err.check}
                          </p>

                          <p className="text-sm text-red-600 mt-1">
                            {err.problem}
                          </p>

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
        <div className="text-center md:text-right sticky bottom-0 bg-white py-3 md:static md:bg-transparent">
          <Button
            onClick={handleNext}
            disabled={!canNext() || thinking}
            className="w-full md:w-auto"
          >
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

// Add named export for compatibility
export { CustomStory };
