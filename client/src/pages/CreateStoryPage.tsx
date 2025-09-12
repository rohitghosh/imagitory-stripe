// import React, { useEffect, useRef, useState, useCallback } from "react";
// import ReactMarkdown from "react-markdown";
// import { useLocation, useParams } from "wouter";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { useIsMobile } from "@/hooks/use-mobile";

// import { Header } from "@/components/Header";
// import { Footer } from "@/components/Footer";
// import { StepIndicator } from "@/components/StepIndicator";
// import { CustomCharacter } from "@/components/character/CustomCharacter";
// import { SideCharacterSelection } from "@/components/story/SideCharacterSelection";
// import { ThemeSelection } from "@/components/story/ThemeSelection";
// import { SubjectSelection } from "@/components/story/SubjectSelection";
// import { StorySettings } from "@/components/story/StorySettings";
// import { ProgressDisplay } from "@/components/ui/progress-display";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/lib/queryClient";
// import { useAuth } from "@/contexts/AuthContext";
// import { useJobProgress } from "@/hooks/use-job-progress";
// import {
//   createThemeSubjectSchema,
//   requiresValidation,
//   type ThemeSubjectSchema,
// } from "@/types";
// const STEPS = [
//   { id: 1, name: "Choose Character" },
//   { id: 2, name: "Select Story" },
//   { id: 3, name: "Preview & Download" },
// ];

// const STORY_SUB_STEPS = [
//   { id: "characters", name: "Choose a Side Character" },
//   { id: "theme", name: "Choose Theme" },
//   { id: "subject", name: "Choose Subject", disabled: true }, // will override below
//   { id: "settings", name: "Story Settings" },
// ];

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

// type Section = { title: string; body: string };

// const DEBUG = true;
// const log = (...args: any[]) =>
//   DEBUG && console.log("[CreateStoryPage]", ...args);

// interface SelectedCharacter {
//   id: string;
//   name: string;
//   avatar: string;
//   toonUrl?: string;
//   description?: string;
// }

// export default function CreateStoryPage() {
//   /* ─────────────────────────── plumbing ────────────────────────── */
//   const { user } = useAuth();
//   const isMobile = useIsMobile();
//   const queryClient = useQueryClient();
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const { id } = useParams();

//   /* ─────────────────────────── state ───────────────────────────── */
//   const [bookId, setBookId] = useState<string | null>(null);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [currentSubStep, setCurrentSubStep] = useState<string>("characters");
//   const [activeChar, setActiveChar] = useState<any>(null);
//   const [kidName, setKidName] = useState("");
//   const [bookStyle, setBookStyle] = useState("default");
//   const [bookTitle, setBookTitle] = useState("Untitled");

//   // Story workflow state
//   const [selectedSideChars, setSelectedSideChars] = useState<
//     SelectedCharacter[]
//   >([]);
//   const [selectedTheme, setSelectedTheme] = useState<string>("");
//   const [isCustomTheme, setIsCustomTheme] = useState<boolean>(false);
//   const [selectedSubject, setSelectedSubject] = useState<string>("");
//   const [isSubjectValidated, setIsSubjectValidated] = useState<boolean>(false);
//   const [rhyming, setRhyming] = useState<boolean>(false);
//   const [themeSubjectSchema, setThemeSubjectSchema] =
//     useState<ThemeSubjectSchema | null>(null);

//   /* progress job ids */
//   const [imagesJobId, setImagesJobId] = useState<string>();
//   const imagesProg = useJobProgress(imagesJobId);
//   const [reasoningLog, setReasoningLog] = useState(""); // live CoT
//   const [section, setSection] = useState<Section | null>(null);
//   const cardRef = useRef<HTMLDivElement>(null);

//   const [working, setWorking] = useState<Section | null>(null);
//   const [visible, setVisible] = useState<Section | null>(null);
//   const hideTimer = useRef<ReturnType<typeof setTimeout>>();

//   /* ─────────────────────────── mutations ───────────────────────── */
//   const createBookM = useMutation({
//     mutationFn: (payload: any) => apiRequest("POST", "/api/books", payload),
//     onSuccess: (data) => {
//       setBookId(data.id);
//       setLocation(`/create/${data.id}`, { replace: true });
//     },
//     onError: (err) =>
//       toast({
//         title: "Error",
//         description: "Could not start story.",
//         variant: "destructive",
//       }),
//   });

//   const patchBookM = useMutation({
//     mutationFn: ({ id, payload }: { id: string; payload: any }) =>
//       apiRequest("PATCH", `/api/books/${id}`, payload),
//     onSuccess: (_data, { id }) => queryClient.invalidateQueries(["book", id]),
//     onError: () =>
//       toast({
//         title: "Error",
//         description: "Could not save progress.",
//         variant: "destructive",
//       }),
//   });

//   /* ─────────────────────────── fetch book (hydration) ──────────── */
//   const { data: book, isLoading: loadingBook } = useQuery({
//     queryKey: ["book", bookId],
//     queryFn: async () => {
//       const r = await fetch(`/api/books/${bookId}`, { credentials: "include" });
//       if (!r.ok) throw new Error();
//       return r.json();
//     },
//     enabled: !!bookId,
//   });

//   /* on mount via /create/:id */
//   useEffect(() => {
//     if (id && !bookId) {
//       setBookId(id);
//     } else if (!id && bookId) {
//       // Reset state when navigating from /create/:id to /create
//       setBookId(null);
//       setCurrentStep(1);
//       setCurrentSubStep("characters");
//       setActiveChar(null);
//       setKidName("");
//       setBookStyle("default");
//       setBookTitle("Untitled");
//       setSelectedSideChars([]);
//       setSelectedTheme("");
//       setIsCustomTheme(false);
//       setSelectedSubject("");
//       setIsSubjectValidated(false);
//       setRhyming(false);
//       setThemeSubjectSchema(null);
//       setImagesJobId(undefined);
//       setReasoningLog("");
//       setSection(null);
//     }
//   }, [id, bookId]);

//   /* ─────────────────────────── character pick (main character) ──────────────────── */
//   async function handleSelectCharacter(character: any) {
//     setActiveChar(character);
//     setKidName(character.name);

//     if (!bookId) {
//       createBookM.mutate({
//         title: "",
//         pages: [],
//         userId: user!.uid,
//         characterId: String(character.id),
//         createdAt: new Date().toISOString(),
//         stylePreference: bookStyle,
//       });
//     } else {
//       patchBookM.mutate({
//         id: bookId!,
//         payload: { characterId: String(character.id) },
//       });
//     }
//     setCurrentStep(2);
//   }

//   /* ─────────────────────────── side character selection ──────────────────── */
//   function handleSideCharacterSelection(characters: SelectedCharacter[]) {
//     setSelectedSideChars(characters);
//     setCurrentSubStep("theme");
//   }

//   /* ─────────────────────────── theme selection ──────────────────── */
//   function handleThemeSelection(theme: string, isCustom: boolean) {
//     setSelectedTheme(theme);
//     setIsCustomTheme(isCustom);
//     // Reset subject validation when theme changes
//     setIsSubjectValidated(false);
//     setCurrentSubStep("subject");
//   }

//   /* ─────────────────────────── subject selection ──────────────────── */
//   function handleSubjectSelection(
//     subject: string,
//     isValidated: boolean = false,
//   ) {
//     setSelectedSubject(subject);
//     setIsSubjectValidated(isValidated);

//     // Create the theme-subject schema for downstream use
//     const schema = createThemeSubjectSchema(
//       selectedTheme,
//       isCustomTheme,
//       subject,
//       isCustomTheme, // Custom themes always have custom subjects
//     );
//     setThemeSubjectSchema(schema);

//     // For predefined themes, subject selection automatically validates and proceeds to settings
//     // For custom themes, only proceed to settings if validation is complete
//     if (!isCustomTheme || isValidated) {
//       setCurrentSubStep("settings");
//     }
//   }

//   /* ─────────────────────────── story settings and generation ──────────────────── */
//   function handleStorySettings(
//     rhymingEnabled: boolean,
//     animationStyle: string,
//     characterToonUrls?: Record<string, string>,
//   ) {
//     setRhyming(rhymingEnabled);

//     // Prepare character data for story generation
//     const characters = selectedSideChars.map((char) => char.name);
//     const characterDescriptions = selectedSideChars.map(
//       (char) => char.description || "",
//     );

//     // Use cartoonified URLs if available, otherwise fallback to original images
//     const characterImageMap = {
//       [kidName]: {
//         image_url:
//           characterToonUrls?.[activeChar.id] ||
//           activeChar.toonUrl ||
//           activeChar.imageUrls?.[0] ||
//           "",
//         description: `a ${activeChar.age} year old human kid`,
//       },
//       ...Object.fromEntries(
//         selectedSideChars.map((char) => [
//           char.name,
//           {
//             image_url:
//               characterToonUrls?.[char.id] || char.toonUrl || char.avatar,
//             description: char.description || "",
//           },
//         ]),
//       ),
//     };

//     // Use the schema to provide structured theme/subject data
//     const finalTheme = themeSubjectSchema?.theme.label || selectedTheme;
//     const finalSubject = themeSubjectSchema?.subject.value || selectedSubject;

//     const payload = {
//       bookId,
//       kidName,
//       pronoun:
//         activeChar.gender === "male"
//           ? "he"
//           : activeChar.gender === "female"
//             ? "she"
//             : "they",
//       age: activeChar.age,
//       theme: finalTheme,
//       subject: finalSubject,
//       storyRhyming: rhymingEnabled,
//       animationStyle, // Add animation style to payload
//       characters,
//       characterDescriptions,
//       characterImageMap,
//       // Include schema metadata for potential conditional logic in backend
//       themeSubjectSchema: themeSubjectSchema,
//     };

//     log("POST /api/generateFullStory", payload);
//     apiRequest("POST", "/api/generateFullStory", payload)
//       .then((r) => {
//         setImagesJobId(r.jobId);
//         patchBookM.mutate({ id: bookId!, payload: { imagesJobId: r.jobId } });
//         setCurrentStep(3);
//       })
//       .catch((err) => log("Full-story kickoff error", err));
//   }

//   /* ─────────────────────────── hydration logic ─────────────────── */
//   useEffect(() => {
//     if (!book) return;

//     /* character */
//     if (book.characterId && !activeChar) {
//       setActiveChar({ id: book.characterId, name: book.kidName });
//       setKidName(book.kidName);
//       setBookStyle(book.stylePreference);
//       setBookTitle(book.title);
//     }

//     /* existing jobs / pages */
//     if (book?.imagesJobId && !imagesJobId) setImagesJobId(book.imagesJobId);
//     if (book.pages?.length) setCurrentStep(3);
//   }, [book]);

//   useEffect(() => {
//     if (imagesProg?.phase === "complete") {
//       queryClient.invalidateQueries(["book", bookId]);
//     }
//   }, [imagesProg]);

//   useEffect(() => {
//     if (imagesProg?.log) {
//       setReasoningLog(imagesProg.log); // overwrite; backend already accumulates
//     }
//   }, [imagesProg?.log]);

//   useEffect(() => {
//     cardRef.current?.scrollTo({ top: cardRef.current.scrollHeight });
//   }, [section]);

//   useEffect(() => {
//     if (imagesProg?.phase === "error") {
//       toast({
//         title: "Story generation failed",
//         description: imagesProg.error ?? "Unknown error",
//         variant: "destructive",
//       });
//     }
//   }, [imagesProg]);

//   // B. or the book already contains pages
//   useEffect(() => {
//     if (book?.pages?.length) {
//       setLocation(`/book/${bookId}`);
//     }
//   }, [book]);

//   const appendToken = React.useCallback((raw: string) => {
//     // Keep spaces; convert lone newline → real paragraph break
//     if (raw === "\n") {
//       setSection((prev) =>
//         prev ? { ...prev, body: prev.body + "\n\n" } : prev,
//       );
//       return;
//     }

//     // Split chunk on every **Bold heading**
//     const parts = raw.split(/\*\*([^*]+)\*\*/g);
//     // parts = [beforeHeading, heading1, after1, heading2, after2, …]

//     setSection((prev) => {
//       let current = prev ?? { title: "Thinking…", body: "" };

//       // 0️⃣ prepend any text that arrived *before* the first heading
//       current.body += parts[0];

//       // 🔁 loop over each heading/body pair
//       for (let i = 1; i < parts.length; i += 2) {
//         const title = parts[i].trim();
//         const body = parts[i + 1] ?? "";

//         // push previous card? – we *replace*, so nothing to store
//         current = { title, body };
//       }
//       return current;
//     });
//   }, []);

//   useEffect(() => {
//     if (!imagesJobId) return;
//     const es = new EventSource(`/api/jobs/${imagesJobId}/stream`);

//     es.onmessage = (e) => {
//       const state = JSON.parse(e.data);
//       if (state.log) appendToken(state.logDelta ?? state.log); // pick delta or full
//       // … handle pct / phase …
//     };
//     return () => es.close();
//   }, [imagesJobId, appendToken]);

//   /* when final images arrive – patch & redirect */
//   // useEffect(()=>{
//   //   if(imagesProg?.phase==="complete" && imagesProg.pages){
//   //     apiRequest("PUT",`/api/books/${bookId}`,{
//   //       title:bookTitle || "Untitled",
//   //       pages: imagesProg.pages.map((p:any,idx:number)=>({id:idx+2,...p})),
//   //       coverUrl     : imagesProg.coverUrl,
//   //       backCoverUrl : imagesProg.backCoverUrl
//   //     })
//   //     .then(()=>{ toast({title:"Done!",description:"Your book is ready."}); setLocation(`/book/${bookId}`); })
//   //     .catch(()=> toast({title:"Error",description:"Could not save final book.",variant:"destructive"}));
//   //   }
//   // },[imagesProg]);

//   /* ─────────────────────────── UI  ─────────────────────────────── */
//   if (loadingBook) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading…
//       </div>
//     );
//   }

//   // Add derived variables for disabling tabs
//   const isSubjectTabDisabled = selectedTheme === "";
//   const isSettingsTabDisabled = isCustomTheme
//     ? selectedSubject === "" || !isSubjectValidated
//     : selectedSubject === "";

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />
//       <main
//         className={
//           isMobile
//             ? "flex-grow px-4 pt-4 pb-6"
//             : "flex-grow max-w-4xl mx-auto p-6"
//         }
//       >
//         <StepIndicator steps={STEPS} currentStep={currentStep} />

//         {currentStep === 1 && (
//           <section>
//             <h2 className="text-2xl font-bold mb-4">
//               Step 1: Choose Character
//             </h2>
//             <CustomCharacter onSubmit={handleSelectCharacter} />
//           </section>
//         )}

//         {currentStep === 2 && (
//           <section>
//             <h2 className="text-2xl font-bold mb-4">Step 2: Select Story</h2>
//             {/* Responsive Substep Navigation */}
//             <div className={isMobile ? "flex flex-col gap-4" : "flex gap-6"}>
//               {/* Substep Navigation */}
//               <nav
//                 className={
//                   isMobile
//                     ? "flex flex-row overflow-x-auto pb-2 -mx-4 px-4 sticky top-0 z-10 bg-white shadow-sm"
//                     : "w-64 flex-shrink-0"
//                 }
//                 style={isMobile ? { borderBottom: "1px solid #f3f4f6" } : {}}
//               >
//                 <div
//                   className={
//                     isMobile
//                       ? "flex flex-row w-full"
//                       : "flex flex-col space-y-1"
//                   }
//                 >
//                   {STORY_SUB_STEPS.map((subStep) => {
//                     const isActive = currentSubStep === subStep.id;
//                     const isCompleted =
//                       (subStep.id === "characters" &&
//                         selectedSideChars.length >= 0) ||
//                       (subStep.id === "theme" && selectedTheme !== "") ||
//                       (subStep.id === "subject" &&
//                         selectedSubject !== "" &&
//                         (!isCustomTheme || isSubjectValidated)) ||
//                       (subStep.id === "settings" && false); // Will be completed when story generates
//                     // Disable tabs based on dependencies
//                     const isDisabled =
//                       (subStep.id === "subject" && isSubjectTabDisabled) ||
//                       (subStep.id === "settings" && isSettingsTabDisabled);
//                     return (
//                       <button
//                         key={subStep.id}
//                         onClick={() =>
//                           !isDisabled && setCurrentSubStep(subStep.id)
//                         }
//                         className={
//                           isMobile
//                             ? `flex flex-col items-center px-1 py-2 min-w-[75px] transition-colors text-xs font-medium ${
//                                 isActive
//                                   ? "bg-yellow-100 text-yellow-800 border-b-4 border-yellow-500"
//                                   : isCompleted
//                                     ? "bg-green-50 text-green-700 hover:bg-green-100"
//                                     : isDisabled
//                                       ? "text-gray-400 bg-gray-50 cursor-not-allowed"
//                                       : "text-gray-600 hover:bg-gray-100"
//                               }`
//                             : `flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
//                                 isActive
//                                   ? "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
//                                   : isCompleted
//                                     ? "bg-green-50 text-green-700 hover:bg-green-100"
//                                     : isDisabled
//                                       ? "text-gray-400 bg-gray-50 cursor-not-allowed"
//                                       : "text-gray-600 hover:bg-gray-100"
//                               }`
//                         }
//                         disabled={isDisabled}
//                       >
//                         <div
//                           className={
//                             isMobile
//                               ? `w-6 h-6 rounded-full mb-1 flex items-center justify-center text-xs font-medium ${
//                                   isActive
//                                     ? "bg-yellow-500 text-white"
//                                     : isCompleted
//                                       ? "bg-green-500 text-white"
//                                       : isDisabled
//                                         ? "bg-gray-200 text-gray-400"
//                                         : "bg-gray-300 text-gray-600"
//                                 }`
//                               : `w-6 h-6 rounded-full mr-3 flex items-center justify-center text-sm font-medium ${
//                                   isActive
//                                     ? "bg-yellow-500 text-white"
//                                     : isCompleted
//                                       ? "bg-green-500 text-white"
//                                       : isDisabled
//                                         ? "bg-gray-200 text-gray-400"
//                                         : "bg-gray-300 text-gray-600"
//                                 }`
//                           }
//                         >
//                           {isCompleted
//                             ? "✓"
//                             : subStep.id === "characters"
//                               ? "1"
//                               : subStep.id === "theme"
//                                 ? "2"
//                                 : subStep.id === "subject"
//                                   ? "3"
//                                   : "4"}
//                         </div>
//                         <span
//                           className={
//                             isMobile ? "text-center leading-tight" : ""
//                           }
//                         >
//                           {subStep.name}
//                         </span>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </nav>
//               {/* Right: Content Area */}
//               <div className="flex-1">
//                 {currentSubStep === "characters" && (
//                   <SideCharacterSelection
//                     onSubmit={handleSideCharacterSelection}
//                     maxCharacters={3}
//                     initialSelected={selectedSideChars} // NEW
//                   />
//                 )}
//                 {currentSubStep === "theme" && (
//                   <ThemeSelection
//                     onSubmit={handleThemeSelection}
//                     onBack={() => setCurrentSubStep("characters")}
//                     initialTheme={selectedTheme} // NEW
//                   />
//                 )}
//                 {currentSubStep === "subject" && (
//                   <SubjectSelection
//                     selectedTheme={selectedTheme}
//                     isCustomTheme={isCustomTheme}
//                     onSubmit={(subject, isValidated) =>
//                       handleSubjectSelection(subject, isValidated)
//                     }
//                     onBack={() => setCurrentSubStep("theme")}
//                     kidName={kidName}
//                     pronoun={
//                       activeChar?.gender === "male"
//                         ? "he"
//                         : activeChar?.gender === "female"
//                           ? "she"
//                           : "they"
//                     }
//                     age={activeChar?.age || 5}
//                     characters={
//                       selectedSideChars.length
//                         ? selectedSideChars.map((char) => char.name)
//                         : []
//                     }
//                     characterDescriptions={
//                       selectedSideChars.length
//                         ? selectedSideChars.map(
//                             (char) => char.description || "",
//                           )
//                         : []
//                     }
//                     initialSubject={selectedSubject} // NEW
//                     onChange={setSelectedSubject} // NEW: Update selectedSubject when custom subject changes
//                     onValidationChange={setIsSubjectValidated} // NEW: Update validation state
//                   />
//                 )}
//                 {currentSubStep === "settings" && (
//                   <StorySettings
//                     onSubmit={handleStorySettings}
//                     onBack={() => setCurrentSubStep("subject")}
//                     characterIds={[
//                       activeChar?.id,
//                       ...selectedSideChars.map((char) => char.id),
//                     ].filter(Boolean)}
//                   />
//                 )}
//               </div>
//             </div>
//           </section>
//         )}

//         {currentStep === 3 && (
//           <section>
//             <h2 className="text-2xl font-bold mb-4">
//               Step 3: Preview & Download
//             </h2>

//             {imagesProg && (
//               <div className="mb-4">
//                 <p className="text-center text-sm text-gray-500">
//                   Generating pages… — {imagesProg.pct.toFixed(0)}%
//                 </p>
//                 <ProgressDisplay prog={imagesProg} />
//               </div>
//             )}

//             {(imagesProg?.phase === "prompting" || reasoningLog) && (
//               <div className="mt-6">
//                 <p className="text-xs mb-1 flex items-center">
//                   <span className="font-semibold text-imaginory-black">
//                     {imagesProg?.phase === "prompting"
//                       ? "Planning story"
//                       : "Story planner reasoning"}
//                   </span>
//                   <TypingDots />
//                 </p>

//                 {section && (
//                   <div className="mt-6">
//                     <p className="font-semibold mb-1 flex items-center shimmer">
//                       {section.title}
//                     </p>
//                     {/* <div
//                       ref={cardRef}
//                       className="bg-white border border-imaginory-yellow/30 rounded-md p-3
//                                  text-xs text-gray-800 whitespace-pre-wrap
//                                  max-h-56 overflow-y-auto"
//                     >
//                       <ReactMarkdown>{section.body}</ReactMarkdown>
//                     </div> */}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* When pages are done the user will be redirected automatically */}
//           </section>
//         )}
//       </main>
//       <Footer />
//     </div>
//   );
// }

import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StepIndicator } from "@/components/StepIndicator";
import { CustomCharacter } from "@/components/character/CustomCharacter";
import { SideCharacterSelection } from "@/components/story/SideCharacterSelection";
import { ThemeSelection } from "@/components/story/ThemeSelection";
import { SubjectSelection } from "@/components/story/SubjectSelection";
import { StorySettings } from "@/components/story/StorySettings";
import { ProgressDisplay } from "@/components/ui/progress-display";
import { AvatarTuner } from "@/components/avatar/AvatarTuner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useJobProgress } from "@/hooks/use-job-progress";
import { Button } from "@/components/ui/button";
import {
  createThemeSubjectSchema,
  requiresValidation,
  type ThemeSubjectSchema,
} from "@/types";
const STEPS = [
  { id: 1, name: "Choose Character" },
  { id: 2, name: "Select Story" },
  { id: 3, name: "Payment" },
  { id: 4, name: "Review & Finalize" },
];

const STORY_SUB_STEPS = [
  { id: "characters", name: "Choose a Side Character" },
  { id: "theme", name: "Choose Theme" },
  { id: "subject", name: "Choose Subject", disabled: true }, // will override below
  { id: "settings", name: "Story Settings" },
];

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

type Section = { title: string; body: string };

const DEBUG = true;
const log = (...args: any[]) =>
  DEBUG && console.log("[CreateStoryPage]", ...args);

interface SelectedCharacter {
  id: string;
  name: string;
  avatar: string;
  toonUrl?: string;
  description?: string;
}

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
  const [currentSubStep, setCurrentSubStep] = useState<string>("characters");
  const [activeChar, setActiveChar] = useState<any>(null);
  const [kidName, setKidName] = useState("");
  const [bookStyle, setBookStyle] = useState("default");
  const [bookTitle, setBookTitle] = useState("Untitled");

  // Story workflow state
  const [selectedSideChars, setSelectedSideChars] = useState<
    SelectedCharacter[]
  >([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [isCustomTheme, setIsCustomTheme] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isSubjectValidated, setIsSubjectValidated] = useState<boolean>(false);
  const [rhyming, setRhyming] = useState<boolean>(false);
  const [themeSubjectSchema, setThemeSubjectSchema] =
    useState<ThemeSubjectSchema | null>(null);

  // Payment and order state
  const [showPaymentStep, setShowPaymentStep] = useState<boolean>(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);
  const [pendingStoryPayload, setPendingStoryPayload] = useState<any>(null);

  /* progress job ids */
  const [imagesJobId, setImagesJobId] = useState<string>();
  const imagesProg = useJobProgress(imagesJobId);
  const [reasoningLog, setReasoningLog] = useState(""); // live CoT
  const [section, setSection] = useState<Section | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [toonUrls, setToonUrls] = useState<Record<string, string>>({});
  const [avatarFinalized, setAvatarFinalized] = useState<boolean>(false);
  const [showAvatarTuner, setShowAvatarTuner] = useState<boolean>(false);
  const imagesStartedRef = useRef<boolean>(false);

  const [working, setWorking] = useState<Section | null>(null);
  const [visible, setVisible] = useState<Section | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

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
    onSuccess: (_data, { id }) =>
      queryClient.invalidateQueries({ queryKey: ["book", id] }),
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
    if (id && !bookId) {
      setBookId(id);
    } else if (!id && bookId) {
      // Reset state when navigating from /create/:id to /create
      setBookId(null);
      setCurrentStep(1);
      setCurrentSubStep("characters");
      setActiveChar(null);
      setKidName("");
      setBookStyle("default");
      setBookTitle("Untitled");
      setSelectedSideChars([]);
      setSelectedTheme("");
      setIsCustomTheme(false);
      setSelectedSubject("");
      setIsSubjectValidated(false);
      setRhyming(false);
      setThemeSubjectSchema(null);
      setImagesJobId(undefined);
      setReasoningLog("");
      setSection(null);
      // Clear any stored payment payload when starting fresh
      localStorage.removeItem("pendingStoryPayload");
      setPendingStoryPayload(null);
    }
  }, [id, bookId]);

  /* ─────────────────────────── handle payment completion ──────────────────── */
  useEffect(() => {
    // Check if we're returning from payment and need to generate story
    const urlParams = new URLSearchParams(window.location.search);
    const paymentCompleted = urlParams.get("payment_completed");

    if (paymentCompleted === "true" && bookId) {
      console.log("Payment completed, checking for stored payload...");

      // Get payload from localStorage or current state
      const storedPayload = localStorage.getItem("pendingStoryPayload");
      const payload = storedPayload
        ? JSON.parse(storedPayload)
        : pendingStoryPayload;

      if (payload) {
        console.log("Payment completed, generating story...", payload);

        // Set the current step to the progress step (4 for returning users)
        setCurrentStep(4);

        // Generate the story
        generateStory(payload);

        // Clean up
        localStorage.removeItem("pendingStoryPayload");
        setPendingStoryPayload(null);
      } else {
        console.log(
          "No stored payload found, user may need to recreate the story",
        );
        toast({
          title: "Story generation ready",
          description: "Please complete the story creation steps.",
        });
      }

      // Clean up URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [bookId, pendingStoryPayload, toast]); // Add dependencies

  /* ─────────────────────────── character pick (main character) ──────────────────── */
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

  /* ─────────────────────────── side character selection ──────────────────── */
  function handleSideCharacterSelection(characters: SelectedCharacter[]) {
    setSelectedSideChars(characters);
    setCurrentSubStep("theme");
  }

  /* ─────────────────────────── theme selection ──────────────────── */
  function handleThemeSelection(theme: string, isCustom: boolean) {
    setSelectedTheme(theme);
    setIsCustomTheme(isCustom);
    // Reset subject validation when theme changes
    setIsSubjectValidated(false);
    setCurrentSubStep("subject");
  }

  /* ─────────────────────────── subject selection ──────────────────── */
  function handleSubjectSelection(
    subject: string,
    isValidated: boolean = false,
  ) {
    setSelectedSubject(subject);
    setIsSubjectValidated(isValidated);

    // Create the theme-subject schema for downstream use
    const schema = createThemeSubjectSchema(
      selectedTheme,
      isCustomTheme,
      subject,
      isCustomTheme, // Custom themes always have custom subjects
    );
    setThemeSubjectSchema(schema);

    // For predefined themes, subject selection automatically validates and proceeds to settings
    // For custom themes, only proceed to settings if validation is complete
    if (!isCustomTheme || isValidated) {
      setCurrentSubStep("settings");
    }
  }

  /* ─────────────────────────── check user status ──────────────────── */
  async function checkUserStatus() {
    try {
      // Check if user has any previous orders
      console.log("Checking user status...");
      const response = await apiRequest("GET", "/api/user/orders");
      const orders = response || [];
      console.log("User orders found:", orders.length);
      return orders.length === 0; // First time if no previous orders
    } catch (error) {
      console.error("Error checking user status:", error);
      return false; // Default to returning user if we can't check
    }
  }

  /* ─────────────────────────── story settings and generation ──────────────────── */
  async function handleStorySettings(
    rhymingEnabled: boolean,
    animationStyle: string,
    characterToonUrls?: Record<string, string>,
  ) {
    setRhyming(rhymingEnabled);
    setBookStyle(animationStyle);

    // Prepare character data for story generation
    const characters = selectedSideChars.map((char) => char.name);
    const characterDescriptions = selectedSideChars.map(
      (char) => char.description || "",
    );

    // Use cartoonified URLs if available, otherwise fallback to original images
    const characterImageMap = {
      [kidName]: {
        image_url:
          characterToonUrls?.[activeChar.id] ||
          toonUrls[activeChar.id] ||
          activeChar.toonUrl ||
          activeChar.imageUrls?.[0] ||
          "",
        description: `a ${activeChar.age} year old human kid`,
      },
      ...Object.fromEntries(
        selectedSideChars.map((char) => [
          char.name,
          {
            image_url:
              characterToonUrls?.[char.id] ||
              toonUrls[char.id] ||
              char.toonUrl ||
              char.avatar,
            description: char.description || "",
          },
        ]),
      ),
    };

    // Use the schema to provide structured theme/subject data
    const finalTheme = themeSubjectSchema?.theme.label || selectedTheme;
    const finalSubject = themeSubjectSchema?.subject.value || selectedSubject;

    const payload = {
      bookId,
      kidName,
      pronoun:
        activeChar.gender === "male"
          ? "he"
          : activeChar.gender === "female"
            ? "she"
            : "they",
      age: activeChar.age,
      theme: finalTheme,
      subject: finalSubject,
      storyRhyming: rhymingEnabled,
      animationStyle, // Add animation style to payload
      characters,
      characterDescriptions,
      characterImageMap,
      // Include schema metadata for potential conditional logic in backend
      themeSubjectSchema: themeSubjectSchema,
    };

    // Check if this is a first-time user
    const isFirstTime = await checkUserStatus();
    setIsFirstTimeUser(isFirstTime);

    if (isFirstTime) {
      // First-time users: Generate story immediately (skip payment)
      log("First-time user: generating story directly", payload);
      setCurrentStep(4); // Step 4 for "Preview & Download" (skipping payment step)
      generateStory(payload);
    } else {
      // Returning users: Skip shipping form and go directly to payment
      log("Returning user: creating order and redirecting to payment");
      setPendingStoryPayload(payload);
      // Store payload in localStorage so it survives payment redirect
      localStorage.setItem("pendingStoryPayload", JSON.stringify(payload));

      // Create order and redirect to payment directly, passing payload to avoid race condition
      handleDirectPayment(payload);
    }
  }

  /* ─────────────────────────── story generation ──────────────────── */
  function generateStory(payload: any) {
    log("POST /api/generateFullStory", payload);
    apiRequest("POST", "/api/generateFullStory", payload)
      .then((r) => {
        setImagesJobId(r.jobId);
        patchBookM.mutate({ id: bookId!, payload: { imagesJobId: r.jobId } });
        setCurrentStep(4);
        const preMain = (activeChar as any)?.toonUrls?.[bookStyle || "pixar"];
        if (preMain) {
          setToonUrls((prev) => ({ ...prev, [activeChar.id]: preMain }));
          setAvatarFinalized(true);
          setShowAvatarTuner(false);
        } else {
          // Show avatar tuner immediately while story outline is generating
          setShowAvatarTuner(true);
        }
      })
      .catch((err) => {
        log("Full-story kickoff error", err);
        toast({
          title: "Story generation failed",
          description:
            "There was an error starting your story generation. Please try again.",
          variant: "destructive",
        });
      });
  }

  /* ─────────────────────────── payment handling ──────────────────── */
  async function handleDirectPayment(payload: any) {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue with payment.",
          variant: "destructive",
        });
        return;
      }

      if (!bookId) {
        toast({
          title: "Missing book",
          description: "Book ID is required to create an order.",
          variant: "destructive",
        });
        return;
      }

      console.log("🚀 Creating order for direct payment (no shipping form)");
      // Create order with minimal required data, shipping can be collected later if needed
      const orderResponse = await apiRequest("POST", "/api/orders", {
        bookId,
        userId: user.uid,
        // Provide default values for shipping fields (can be updated later if needed)
        firstName: user.displayName?.split(" ")[0] || "Customer",
        lastName: user.displayName?.split(" ")[1] || "",
        address: "TBD", // To Be Determined - can be updated later
        city: "TBD",
        state: "TBD",
        zip: "00000",
        country: "US",
      });

      console.log("✅ Order created, redirecting to payment:", orderResponse);
      // Redirect to payment page
      setLocation(`/payment/${orderResponse.id}`);
    } catch (error) {
      console.error("❌ Order creation failed:", error);
      toast({
        title: "Order failed",
        description:
          "There was a problem creating your order. Please try again.",
        variant: "destructive",
      });

      // Reset to settings step on failure to allow retry
      setCurrentSubStep("settings");
    }
  }

  function getCurrentStoryPayload() {
    return {
      bookId,
      userId: user?.uid,
      kidName,
      kidAge: activeChar?.age,
      characterId: activeChar?.id,
      sideCharacterIds: selectedSideChars.map((char) => char.id),
      theme: selectedTheme,
      customTheme: isCustomTheme ? selectedSubject : null,
      subject: selectedSubject,
      rhyming,
      style: bookStyle,
      title: bookTitle,
    };
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
    if (book.pages?.length) {
      // If book already has pages, redirect to book view instead of staying on create page
      // setLocation(`/book/${bookId}`);
      // return;
      setCurrentStep(4);
    }
  }, [book]);

  useEffect(() => {
    if (imagesProg?.phase === "complete") {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
    }
  }, [imagesProg]);

  useEffect(() => {
    if (imagesProg?.log) {
      setReasoningLog(imagesProg.log); // overwrite; backend already accumulates
    }
  }, [imagesProg?.log]);

  useEffect(() => {
    cardRef.current?.scrollTo({ top: cardRef.current.scrollHeight });
  }, [section]);

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
    if (!bookId) return;
    if (imagesProg?.phase === "complete") {
      (async () => {
        await queryClient.invalidateQueries({ queryKey: ["book", bookId] });
        await queryClient.refetchQueries({ queryKey: ["book", bookId] });
        setLocation(`/book/${bookId}`, { replace: true });
      })();
    }
  }, [imagesProg?.phase, bookId]);

  // Hydrate active character details (imageUrls, toonUrl) after mount/refresh
  useEffect(() => {
    (async () => {
      if (activeChar && (!activeChar.imageUrls || !activeChar.imageUrls[0])) {
        try {
          const detail = await apiRequest(
            "GET",
            `/api/characters/${activeChar.id}`,
          );
          setActiveChar(detail);
        } catch {}
      }
    })();
  }, [activeChar?.id]);

  // Auto-start image generation when both prerequisites are ready:
  // 1) Story outline finished (phase === "awaiting_avatar")
  // 2) Avatar finalized by user
  useEffect(() => {
    if (
      imagesProg?.phase === "awaiting_avatar" &&
      avatarFinalized &&
      !imagesStartedRef.current &&
      activeChar
    ) {
      (async () => {
        try {
          imagesStartedRef.current = true;
          console.log(
            "[Create] Preflight: building characterImageMap with style",
            bookStyle,
            {
              main: activeChar?.id,
              sides: selectedSideChars.map((s) => s.id),
            },
          );
          const characterImageMap = await buildCharacterImageMap(
            activeChar,
            selectedSideChars,
            toonUrls,
            bookStyle || "pixar",
          );

          console.log(
            "[Create] Preflight result keys:",
            Object.keys(characterImageMap || {}),
          );

          const r = await apiRequest("POST", "/api/startImageGeneration", {
            bookId,
            characterImageMap,
            animationStyle: bookStyle || "pixar",
          });
          if (r?.jobId) {
            setImagesJobId(r.jobId);
            patchBookM.mutate({
              id: bookId!,
              payload: { imagesJobId: r.jobId },
            });
          }
        } catch (e) {
          console.error(e);
          toast({
            title: "Failed to start image generation",
            variant: "destructive",
          });
        }
      })();
    }
  }, [
    imagesProg?.phase,
    avatarFinalized,
    activeChar,
    toonUrls,
    selectedSideChars,
    kidName,
  ]);

  async function buildCharacterImageMap(
    main: any,
    sides: { id: string; name: string; avatar: string; description?: string }[],
    existingToons: Record<string, string>,
    style: string,
  ) {
    const needs: { characterId: string; imageUrl: string }[] = [];
    const resultMap: any = {};

    // Main
    const mainToon =
      existingToons[main.id] || (main.toonUrls?.[style] ?? main.toonUrl);
    if (mainToon) {
      resultMap[main.name] = {
        image_url: mainToon,
        description: `a ${main.age} year old human kid`,
      };
    } else if (main.imageUrls?.[0]) {
      needs.push({ characterId: main.id, imageUrl: main.imageUrls[0] });
    }

    // Sides
    sides.forEach((s) => {
      const sToon = existingToons[s.id];
      if (sToon) {
        resultMap[s.name] = {
          image_url: sToon,
          description: s.description || "",
        };
      } else {
        needs.push({ characterId: s.id, imageUrl: s.avatar });
      }
    });

    if (needs.length) {
      const resp = await apiRequest(
        "POST",
        "/api/cartoonify-configurable-batch",
        {
          items: needs,
          guidance_scale: 5,
          num_inference_steps: 40,
          style,
        },
      );
      const newToons: Record<string, string> = resp.results || {};
      console.log("[Create] Toonify batch results:", Object.keys(newToons));
      // Merge into state cache
      setToonUrls((prev) => ({ ...prev, ...newToons }));

      // Fill main if missing
      if (!resultMap[main.name]) {
        const m = newToons[main.id] || main.imageUrls?.[0] || "";
        resultMap[main.name] = {
          image_url: m,
          description: `a ${main.age} year old human kid`,
        };
      }
      // Fill sides
      sides.forEach((s) => {
        if (!resultMap[s.name]) {
          const url = newToons[s.id] || s.avatar;
          resultMap[s.name] = {
            image_url: url,
            description: s.description || "",
          };
        }
      });
    }

    return resultMap;
  }

  const appendToken = React.useCallback((raw: string) => {
    // Keep spaces; convert lone newline → real paragraph break
    if (raw === "\n") {
      setSection((prev) =>
        prev ? { ...prev, body: prev.body + "\n\n" } : prev,
      );
      return;
    }

    // Split chunk on every **Bold heading**
    const parts = raw.split(/\*\*([^*]+)\*\*/g);
    // parts = [beforeHeading, heading1, after1, heading2, after2, …]

    setSection((prev) => {
      let current = prev ?? { title: "Thinking…", body: "" };

      // 0️⃣ prepend any text that arrived *before* the first heading
      current.body += parts[0];

      // 🔁 loop over each heading/body pair
      for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i].trim();
        const body = parts[i + 1] ?? "";

        // push previous card? – we *replace*, so nothing to store
        current = { title, body };
      }
      return current;
    });
  }, []);

  useEffect(() => {
    if (!imagesJobId) return;
    const es = new EventSource(`/api/jobs/${imagesJobId}/stream`);

    es.onmessage = (e) => {
      const state = JSON.parse(e.data);
      if (state.log) appendToken(state.logDelta ?? state.log); // pick delta or full
      // … handle pct / phase …
    };
    return () => es.close();
  }, [imagesJobId, appendToken]);

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

  // Add derived variables for disabling tabs
  const isSubjectTabDisabled = selectedTheme === "";
  const isSettingsTabDisabled = isCustomTheme
    ? selectedSubject === "" || !isSubjectValidated
    : selectedSubject === "";

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
            {/* Responsive Substep Navigation */}
            <div className={isMobile ? "flex flex-col gap-4" : "flex gap-6"}>
              {/* Substep Navigation */}
              <nav
                className={
                  isMobile
                    ? "flex flex-row overflow-x-auto pb-2 -mx-4 px-4 sticky top-0 z-10 bg-white shadow-sm"
                    : "w-64 flex-shrink-0"
                }
                style={isMobile ? { borderBottom: "1px solid #f3f4f6" } : {}}
              >
                <div
                  className={
                    isMobile
                      ? "flex flex-row w-full"
                      : "flex flex-col space-y-1"
                  }
                >
                  {STORY_SUB_STEPS.map((subStep) => {
                    const isActive = currentSubStep === subStep.id;
                    const isCompleted =
                      (subStep.id === "charactes" &&
                        selectedSideChars.length >= 0) ||
                      (subStep.id === "theme" && selectedTheme !== "") ||
                      (subStep.id === "subject" &&
                        selectedSubject !== "" &&
                        (!isCustomTheme || isSubjectValidated)) ||
                      (subStep.id === "settings" && false); // Will be completed when story generates
                    // Disable tabs based on dependencies
                    const isDisabled =
                      (subStep.id === "subject" && isSubjectTabDisabled) ||
                      (subStep.id === "settings" && isSettingsTabDisabled);
                    return (
                      <button
                        key={subStep.id}
                        onClick={() =>
                          !isDisabled && setCurrentSubStep(subStep.id)
                        }
                        className={
                          isMobile
                            ? `flex flex-col items-center px-1 py-2 min-w-[75px] transition-colors text-xs font-medium ${
                                isActive
                                  ? "bg-yellow-100 text-yellow-800 border-b-4 border-yellow-500"
                                  : isCompleted
                                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                                    : isDisabled
                                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                      : "text-gray-600 hover:bg-gray-100"
                              }`
                            : `flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                                isActive
                                  ? "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
                                  : isCompleted
                                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                                    : isDisabled
                                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                      : "text-gray-600 hover:bg-gray-100"
                              }`
                        }
                        disabled={isDisabled}
                      >
                        <div
                          className={
                            isMobile
                              ? `w-6 h-6 rounded-full mb-1 flex items-center justify-center text-xs font-medium ${
                                  isActive
                                    ? "bg-yellow-500 text-white"
                                    : isCompleted
                                      ? "bg-green-500 text-white"
                                      : isDisabled
                                        ? "bg-gray-200 text-gray-400"
                                        : "bg-gray-300 text-gray-600"
                                }`
                              : `w-6 h-6 rounded-full mr-3 flex items-center justify-center text-sm font-medium ${
                                  isActive
                                    ? "bg-yellow-500 text-white"
                                    : isCompleted
                                      ? "bg-green-500 text-white"
                                      : isDisabled
                                        ? "bg-gray-200 text-gray-400"
                                        : "bg-gray-300 text-gray-600"
                                }`
                          }
                        >
                          {isCompleted
                            ? "✓"
                            : subStep.id === "characters"
                              ? "1"
                              : subStep.id === "theme"
                                ? "2"
                                : subStep.id === "subject"
                                  ? "3"
                                  : "4"}
                        </div>
                        <span
                          className={
                            isMobile ? "text-center leading-tight" : ""
                          }
                        >
                          {subStep.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>
              {/* Right: Content Area */}
              <div className="flex-1">
                {currentSubStep === "characters" && (
                  <SideCharacterSelection
                    onSubmit={handleSideCharacterSelection}
                    maxCharacters={3}
                    initialSelected={selectedSideChars} // NEW
                  />
                )}
                {currentSubStep === "theme" && (
                  <ThemeSelection
                    onSubmit={handleThemeSelection}
                    onBack={() => setCurrentSubStep("characters")}
                    initialTheme={selectedTheme} // NEW
                  />
                )}
                {currentSubStep === "subject" && (
                  <SubjectSelection
                    selectedTheme={selectedTheme}
                    isCustomTheme={isCustomTheme}
                    onSubmit={(subject, isValidated) =>
                      handleSubjectSelection(subject, isValidated)
                    }
                    onBack={() => setCurrentSubStep("theme")}
                    kidName={kidName}
                    pronoun={
                      activeChar?.gender === "male"
                        ? "he"
                        : activeChar?.gender === "female"
                          ? "she"
                          : "they"
                    }
                    age={activeChar?.age || 5}
                    characters={
                      selectedSideChars.length
                        ? selectedSideChars.map((char) => char.name)
                        : []
                    }
                    characterDescriptions={
                      selectedSideChars.length
                        ? selectedSideChars.map(
                            (char) => char.description || "",
                          )
                        : []
                    }
                    initialSubject={selectedSubject} // NEW
                    onChange={setSelectedSubject} // NEW: Update selectedSubject when custom subject changes
                    onValidationChange={setIsSubjectValidated} // NEW: Update validation state
                  />
                )}
                {currentSubStep === "settings" && (
                  <StorySettings
                    onSubmit={handleStorySettings}
                    onBack={() => setCurrentSubStep("subject")}
                    characterIds={[
                      activeChar?.id,
                      ...selectedSideChars.map((char) => char.id),
                    ].filter(Boolean)}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {currentStep === 3 && !isFirstTimeUser && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Step 3: Payment</h2>
            <p className="text-gray-600 mb-6">
              Complete your payment to start generating your personalized story.
            </p>
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="p-4 bg-imaginory-yellow/10 border border-imaginory-yellow/30 rounded-lg">
                <p className="text-sm text-imaginory-black font-body">
                  🎨 Ready to create your personalized story! Click below to
                  proceed to secure payment.
                </p>
              </div>
              <Button
                onClick={() =>
                  handleDirectPayment(
                    pendingStoryPayload || getCurrentStoryPayload(),
                  )
                }
                className="imaginory-button text-lg px-8 py-3 w-full"
                data-testid="button-proceed-payment"
              >
                Proceed to Payment ($29.99)
              </Button>
            </div>
          </section>
        )}

        {((currentStep === 3 && isFirstTimeUser) || currentStep === 4) && (
          <section>
            <h2 className="text-2xl font-bold mb-4">
              {isFirstTimeUser
                ? "Step 3: Preview & Download"
                : "Step 4: Preview & Download"}
            </h2>

            {/* Show Avatar Tuner immediately after kickoff until finalized */}
            {showAvatarTuner && !avatarFinalized && activeChar && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 text-center">
                  Choose your avatar while we plan your story. We’ll use it for
                  the images.
                </p>
                <AvatarTuner
                  primary={{
                    id: activeChar.id,
                    name: activeChar.name,
                    imageUrl: activeChar.imageUrls?.[0] || "",
                    toonUrl: toonUrls[activeChar.id] || activeChar.toonUrl,
                  }}
                  sides={selectedSideChars.map((c) => ({
                    id: c.id,
                    name: c.name,
                    imageUrl: c.avatar,
                    toonUrl: toonUrls[c.id] || c.toonUrl,
                  }))}
                  style={bookStyle || "pixar"}
                  onFinalized={async (map, _cfg) => {
                    setToonUrls((prev) => ({ ...prev, ...map }));
                    setAvatarFinalized(true);
                    // If the outline is already finished (awaiting_avatar), kick off images now
                    if (
                      imagesProg?.phase === "awaiting_avatar" &&
                      !imagesStartedRef.current
                    ) {
                      try {
                        imagesStartedRef.current = true;
                        const characterImageMap = {
                          [kidName]: {
                            image_url:
                              map[activeChar.id] ||
                              activeChar.toonUrl ||
                              activeChar.imageUrls?.[0] ||
                              "",
                            description: `a ${activeChar.age} year old human kid`,
                          },
                          ...Object.fromEntries(
                            selectedSideChars.map((char) => [
                              char.name,
                              {
                                image_url:
                                  map[char.id] || char.toonUrl || char.avatar,
                                description: char.description || "",
                              },
                            ]),
                          ),
                        } as any;

                        const r = await apiRequest(
                          "POST",
                          "/api/startImageGeneration",
                          {
                            bookId,
                            characterImageMap,
                            animationStyle: "pixar",
                          },
                        );
                        if (r?.jobId) {
                          setImagesJobId(r.jobId);
                          patchBookM.mutate({
                            id: bookId!,
                            payload: { imagesJobId: r.jobId },
                          });
                        }
                      } catch (e) {
                        console.error(e);
                        toast({
                          title: "Failed to start image generation",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Always show progress (story outline first, then images) */}
            {imagesProg && !(showAvatarTuner && !avatarFinalized) && (
              <div className="mb-4">
                <div className="text-center text-sm text-gray-500 space-y-1">
                  <p>Generating pages… — {imagesProg.pct.toFixed(0)}%</p>
                  {/* {imagesProg.message && (
                    <p className="text-[12px] text-gray-400">{imagesProg.message}</p>
                  )} */}
                </div>
                <ProgressDisplay prog={imagesProg} />
              </div>
            )}

            {(imagesProg?.phase === "prompting" || reasoningLog) && (
              <div className="mt-6">
                {/* <p className="text-xs mb-1 flex items-center">
                  <span className="font-semibold text-imaginory-black">
                    {imagesProg?.phase === "prompting"
                      ? "Planning story"
                      : "Story planner reasoning"}
                  </span>
                  <TypingDots />
                </p> */}

                {section && (
                  <div className="mt-6">
                    {/* <p className="font-semibold mb-1 flex items-center shimmer">
                      {section.title}
                    </p> */}
                    {/* <div
                      ref={cardRef}
                      className="bg-white border border-imaginory-yellow/30 rounded-md p-3
                                 text-xs text-gray-800 whitespace-pre-wrap
                                 max-h-56 overflow-y-auto"
                    >
                      <ReactMarkdown>{section.body}</ReactMarkdown>
                    </div> */}
                  </div>
                )}
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
