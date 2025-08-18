// import React, { useState, useEffect, useRef } from "react";
// import ReactMarkdown from "react-markdown";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { getThemeById, Subject } from "@/types/ThemeSubjects";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/AuthContext";
// import { apiRequest } from "@/lib/queryClient";

// interface SubjectSelectionProps {
//   selectedTheme: string;
//   isCustomTheme: boolean;
//   onSubmit: (subject: string) => void;
//   onBack: () => void;
//   kidName: string;
//   pronoun: string;
//   age: number;
//   characters?: string[];
//   characterDescriptions?: string[];
//   initialSubject?: string; // NEW: allow parent to pass last selected subject
// }

// type ValidationError = {
//   check: string;
//   problem: string;
//   solutions: string[];
// };

// type Section = { title: string; body: string };

// const TypingDots = () => (
//   <span className="inline-flex gap-0.5 ml-1">
//     {[0, 1, 2].map((i) => (
//       <span
//         key={i}
//         className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce"
//         style={{ animationDelay: `${i * 0.15}s` }}
//       />
//     ))}
//   </span>
// );

// export function SubjectSelection({
//   selectedTheme,
//   isCustomTheme,
//   onSubmit,
//   onBack,
//   kidName,
//   pronoun,
//   age,
//   characters = [],
//   characterDescriptions = [],
//   initialSubject = "", // NEW
// }: SubjectSelectionProps) {
//   const { toast } = useToast();
//   const { user } = useAuth();

//   const [selectedSubject, setSelectedSubject] =
//     useState<string>(initialSubject);
//   const [customSubject, setCustomSubject] = useState<string>("");
//   const [isValidated, setIsValidated] = useState<boolean>(false);
//   const [isValidating, setIsValidating] = useState<boolean>(false);
//   const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
//     [],
//   );
//   const [section, setSection] = useState<Section | null>(null);
//   const [reasoningLog, setReasoningLog] = useState("");

//   const logRef = useRef<HTMLPreElement>(null);
//   const pending = useRef("");

//   // Get theme data if it's a predefined theme
//   const themeData = isCustomTheme ? null : getThemeById(selectedTheme);
//   const subjects = themeData?.subjects || [];

//   useEffect(() => {
//     logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
//   }, [section]);

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

//   const handleSubjectSelect = (subject: Subject) => {
//     setSelectedSubject(subject.name);
//     setIsValidated(false); // Reset validation when subject changes
//     onSubmit(subject.name); // Immediately advance on click
//   };

//   const validateStory = async () => {
//     setValidationErrors([]);
//     setReasoningLog("");
//     setIsValidating(true);
//     setSection(null);

//     const finalSubject = isCustomTheme ? customSubject.trim() : selectedSubject;
//     const finalTheme = isCustomTheme ? "Custom" : selectedTheme;
//     const payload = {
//       kidName,
//       pronoun,
//       age,
//       theme: finalTheme,
//       subject: finalSubject,
//       storyRhyming: false,
//       characters: characters.length ? characters : [],
//       character_descriptions: characterDescriptions.length
//         ? characterDescriptions
//         : [],
//     };

//     try {
//       // For now, we'll create a simple validation payload
//       // You might need to get actual character data from props or context
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
//         throw new Error("Validation request failed");
//       }

//       const reader = res.body?.getReader();
//       if (!reader) {
//         throw new Error("No response body");
//       }

//       const decoder = new TextDecoder();
//       let buf = "";

//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value, { stream: true });
//         buf += chunk;

//         let idx;
//         while ((idx = buf.indexOf("\n\n")) !== -1) {
//           const block = buf.slice(0, idx).trim();
//           buf = buf.slice(idx + 2);

//           const lines = block.split("\n");
//           const typeLine = lines.find((l) => l.startsWith("event:"));
//           const isResult = typeLine?.startsWith("event: result");
//           const dataLines = lines
//             .filter((l) => l.startsWith("data:"))
//             .map((l) => l.slice(5));

//           if (isResult) {
//             setIsValidating(false);
//             try {
//               const result = JSON.parse(dataLines.join("\n"));

//               if (result.success) {
//                 setIsValidated(true);
//                 setValidationErrors([]);
//                 toast({
//                   title: "Story Validated!",
//                   description:
//                     "Your story idea looks great. You can now continue to settings.",
//                 });
//               } else {
//                 setIsValidated(false);
//                 const mapped = (result.failures ?? []).map((f: any) => ({
//                   check: f.check,
//                   problem: f.problem,
//                   solutions: Array.isArray(f.solution) ? f.solution : [],
//                 }));
//                 setValidationErrors(mapped);
//               }
//             } catch (err) {
//               console.error("JSON parse error:", err);
//               throw new Error("Failed to parse validation result");
//             }
//             setReasoningLog("");
//             return;
//           }

//           if (dataLines.length) {
//             if (isValidating) setIsValidating(false);
//             dataLines.forEach((tok) => appendToken(tok));
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Validation error:", err);
//       setIsValidating(false);
//       setValidationErrors([
//         {
//           check: "Validation Error",
//           problem: "Validation failed to complete. Please try again.",
//           solutions: ["Check your internet connection and try again."],
//         },
//       ]);
//       setReasoningLog("");
//       toast({
//         title: "Validation Failed",
//         description: "Could not validate your story. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleNext = () => {
//     const finalSubject = isCustomTheme ? customSubject.trim() : selectedSubject;

//     if (finalSubject) {
//       onSubmit(finalSubject);
//     }
//   };

//   // Reset validation when custom subject changes
//   useEffect(() => {
//     if (isCustomTheme) {
//       setIsValidated(false);
//     }
//   }, [customSubject, isCustomTheme]);

//   const canValidate = isCustomTheme
//     ? customSubject.trim().length > 0 && customSubject.trim().length <= 140
//     : selectedSubject !== "";

//   const canProceed = isCustomTheme
//     ? customSubject.trim().length > 0 &&
//       customSubject.trim().length <= 140 &&
//       isValidated
//     : selectedSubject !== "";

//   return (
//     <Card className="bg-transparent border-0 shadow-none">
//       <CardContent className="bg-transparent p-0">
//         <div className="space-y-6">
//           <div>
//             <h3 className="text-lg font-semibold mb-2">Choose a Subject</h3>
//             <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
//               <span>Theme:</span>
//               <span className="font-medium">
//                 {isCustomTheme ? selectedTheme : themeData?.name}
//               </span>
//             </div>
//             <p className="text-sm text-gray-600">
//               {isCustomTheme
//                 ? "Describe the specific subject for your custom theme story."
//                 : "Choose a specific subject for your story within this theme."}
//             </p>
//           </div>

//           {/* Subject Selection for Predefined Themes */}
//           {!isCustomTheme && subjects.length > 0 && (
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//               {subjects.map((subject) => (
//                 <div
//                   key={subject.id}
//                   className={`cursor-pointer rounded-lg border p-4 text-center transition-colors ${
//                     selectedSubject === subject.name
//                       ? "border-yellow-500 bg-yellow-50"
//                       : "border-gray-200 hover:border-gray-300"
//                   }`}
//                   onClick={() => handleSubjectSelect(subject)}
//                 >
//                   <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-gray-100">
//                     <img
//                       src={subject.image}
//                       alt={subject.name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <h4 className="font-medium text-sm">{subject.name}</h4>
//                   {subject.description && (
//                     <p className="text-xs text-gray-500 mt-1">
//                       {subject.description}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Custom Subject Input for Custom Themes */}
//           {isCustomTheme && (
//             <div className="bg-gray-50 rounded-lg p-4 space-y-4">
//               <div>
//                 <Label htmlFor="custom-subject">Your Story Subject</Label>
//                 <Textarea
//                   id="custom-subject"
//                   value={customSubject}
//                   onChange={(e) => setCustomSubject(e.target.value)}
//                   placeholder="Describe the specific subject or focus of your story (e.g., 'Finding a lost treasure in the deep ocean', 'Making friends with a shy robot')"
//                   className="mt-1 text-base p-4"
//                   rows={7}
//                   style={{ minHeight: "180px", width: "100%" }}
//                   maxLength={140}
//                   disabled={isValidating}
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   {customSubject.length}/140 characters
//                 </p>
//               </div>

//               {/* Validation Button for Custom Stories */}
//               <div className="flex justify-center">
//                 <Button
//                   onClick={validateStory}
//                   disabled={!canValidate || isValidating}
//                   className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
//                 >
//                   {isValidating ? (
//                     <>
//                       <span>Validating</span>
//                       <TypingDots />
//                     </>
//                   ) : (
//                     "Validate Story"
//                   )}
//                 </Button>
//               </div>

//               {/* Validation Progress Display */}
//               {(isValidating || reasoningLog || section) && (
//                 <div className="mt-4">
//                   <p className="text-xs mb-1 flex items-center">
//                     <span className="font-semibold text-yellow-600">
//                       {isValidating ? "Thinking" : "Listening"}
//                     </span>
//                     {isValidating && <TypingDots />}
//                   </p>

//                   {section && (
//                     <div className="mt-4">
//                       <p className="font-semibold mb-1 flex items-center shimmer">
//                         {section.title}
//                       </p>
//                       <div
//                         ref={logRef}
//                         className="bg-white border border-yellow-300/30 rounded-md p-3
//                                    text-xs text-gray-800 whitespace-pre-wrap
//                                    max-h-56 overflow-y-auto"
//                       >
//                         <ReactMarkdown>{section.body}</ReactMarkdown>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Validation Errors */}
//               {validationErrors.length > 0 && (
//                 <div className="space-y-3 mt-4">
//                   <div className="flex items-start p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
//                     <i className="fas fa-exclamation-circle mt-0.5 mr-2" />
//                     <p className="text-sm">
//                       We couldn't approve your story yet. Please review the
//                       suggestions below and try again.
//                     </p>
//                   </div>
//                   {validationErrors.map((err, i) => (
//                     <div
//                       key={i}
//                       className="border border-red-300 rounded-lg p-4 bg-red-50/60"
//                     >
//                       <p className="font-semibold text-red-700">{err.check}</p>
//                       <p className="text-sm text-red-600 mt-1">{err.problem}</p>
//                       {Array.isArray(err.solutions) &&
//                         err.solutions.length > 0 && (
//                           <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-600">
//                             {err.solutions.map((s, j) => (
//                               <li key={j}>{s}</li>
//                             ))}
//                           </ul>
//                         )}
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Validation Success */}
//               {isValidated && validationErrors.length === 0 && (
//                 <div className="flex items-center p-4 rounded-lg bg-green-100 border border-green-300 text-green-700">
//                   <i className="fas fa-check-circle mr-2" />
//                   <p className="text-sm">
//                     Great! Your story idea has been validated and approved.
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Navigation */}
//           <div className="flex justify-between">
//             <Button variant="outline" onClick={onBack}>
//               ← Back to Theme
//             </Button>
//             {/* Continue button removed */}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getThemeById, Subject } from "@/types/ThemeSubjects";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

interface SubjectSelectionProps {
  selectedTheme: string;
  isCustomTheme: boolean;
  onSubmit: (subject: string, isValidated?: boolean) => void;
  onBack: () => void;
  kidName: string;
  pronoun: string;
  age: number;
  characters?: string[];
  characterDescriptions?: string[];
  initialSubject?: string; // NEW: allow parent to pass last selected subject
  onChange?: (subject: string) => void; // NEW: callback when subject text changes
  onValidationChange?: (isValidated: boolean) => void; // NEW: callback when validation status changes
}

type ValidationError = {
  check: string;
  problem: string;
  solutions: string[];
};

type Section = { title: string; body: string };

const TypingDots = () => (
  <span className="inline-flex gap-0.5 ml-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

export function SubjectSelection({
  selectedTheme,
  isCustomTheme,
  onSubmit,
  onBack,
  kidName,
  pronoun,
  age,
  characters = [],
  characterDescriptions = [],
  initialSubject = "", // NEW
  onChange, // NEW
  onValidationChange, // NEW
}: SubjectSelectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedSubject, setSelectedSubject] =
    useState<string>(initialSubject);
  const [customSubject, setCustomSubject] = useState<string>(
    isCustomTheme ? initialSubject : "",
  );
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [section, setSection] = useState<Section | null>(null);
  const [reasoningLog, setReasoningLog] = useState("");

  const logRef = useRef<HTMLPreElement>(null);
  const pending = useRef("");

  // Get theme data if it's a predefined theme
  const themeData = isCustomTheme ? null : getThemeById(selectedTheme);
  const subjects = themeData?.subjects || [];

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [section]);

  // Update customSubject when initialSubject changes (for custom themes)
  useEffect(() => {
    if (isCustomTheme) {
      setCustomSubject(initialSubject);
    }
  }, [initialSubject, isCustomTheme]);

  // Notify parent when custom subject changes
  useEffect(() => {
    if (isCustomTheme && onChange) {
      onChange(customSubject);
    }
  }, [customSubject, isCustomTheme, onChange]);

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

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject.name);
    setIsValidated(true); // Predefined subjects are automatically validated
    if (onValidationChange) onValidationChange(true);
    onSubmit(subject.name, true); // Immediately advance on click with validation true
  };

  const validateStory = async () => {
    setValidationErrors([]);
    setReasoningLog("");
    setIsValidating(true);
    setSection(null);

    const finalSubject = isCustomTheme ? customSubject.trim() : selectedSubject;
    const finalTheme = isCustomTheme ? "Custom" : selectedTheme;
    const payload = {
      kidName,
      pronoun,
      age,
      theme: finalTheme,
      subject: finalSubject,
      storyRhyming: false,
      characters: characters.length ? characters : [],
      character_descriptions: characterDescriptions.length
        ? characterDescriptions
        : [],
    };

    try {
      // For now, we'll create a simple validation payload
      // You might need to get actual character data from props or context
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
        throw new Error("Validation request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buf += chunk;

        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const block = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);

          const lines = block.split("\n");
          const typeLine = lines.find((l) => l.startsWith("event:"));
          const isResult = typeLine?.startsWith("event: result");
          const dataLines = lines
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5));

          if (isResult) {
            setIsValidating(false);
            try {
              const result = JSON.parse(dataLines.join("\n"));

              if (result.success) {
                setIsValidated(true);
                setValidationErrors([]);
                if (onValidationChange) onValidationChange(true);
                toast({
                  title: "Story Validated!",
                  description:
                    "Your story idea looks great. You can now continue to settings.",
                });
              } else {
                setIsValidated(false);
                if (onValidationChange) onValidationChange(false);
                const mapped = (result.failures ?? []).map((f: any) => ({
                  check: f.check,
                  problem: f.problem,
                  solutions: Array.isArray(f.solution) ? f.solution : [],
                }));
                setValidationErrors(mapped);
              }
            } catch (err) {
              console.error("JSON parse error:", err);
              throw new Error("Failed to parse validation result");
            }
            setReasoningLog("");
            return;
          }

          if (dataLines.length) {
            if (isValidating) setIsValidating(false);
            dataLines.forEach((tok) => appendToken(tok));
          }
        }
      }
    } catch (err) {
      console.error("Validation error:", err);
      setIsValidating(false);
      setValidationErrors([
        {
          check: "Validation Error",
          problem: "Validation failed to complete. Please try again.",
          solutions: ["Check your internet connection and try again."],
        },
      ]);
      setReasoningLog("");
      toast({
        title: "Validation Failed",
        description: "Could not validate your story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    const finalSubject = isCustomTheme ? customSubject.trim() : selectedSubject;

    if (finalSubject) {
      onSubmit(finalSubject, isValidated);
    }
  };

  // Reset validation when custom subject changes
  useEffect(() => {
    if (isCustomTheme) {
      setIsValidated(false);
      if (onValidationChange) onValidationChange(false);
    }
  }, [customSubject, isCustomTheme, onValidationChange]);

  const canValidate = isCustomTheme
    ? customSubject.trim().length > 0 && customSubject.trim().length <= 1000
    : selectedSubject !== "";

  const canProceed = isCustomTheme
    ? customSubject.trim().length > 0 &&
      customSubject.trim().length <= 1000 &&
      isValidated
    : selectedSubject !== "";

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="bg-transparent p-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Choose a Subject</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>Theme:</span>
              <span className="font-medium">
                {isCustomTheme ? selectedTheme : themeData?.name}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {isCustomTheme
                ? "Describe the specific subject for your custom theme story."
                : "Choose a specific subject for your story within this theme."}
            </p>
          </div>

          {/* Subject Selection for Predefined Themes */}
          {!isCustomTheme && subjects.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className={`cursor-pointer rounded-lg border p-3 md:p-4 text-center transition-colors ${
                    selectedSubject === subject.name
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleSubjectSelect(subject)}
                >
                  <div className="aspect-square w-full mb-2 md:mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={subject.image}
                      alt={subject.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-medium text-xs md:text-sm">
                    {subject.name}
                  </h4>
                  {subject.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {subject.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Custom Subject Input for Custom Themes */}
          {isCustomTheme && (
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
              <div className="relative">
                <Label htmlFor="custom-subject">Your Story Subject</Label>
                <div className="relative">
                  <Textarea
                    id="custom-subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Describe the specific subject or focus of your story (e.g., 'Finding a lost treasure in the deep ocean', 'Making friends with a shy robot')"
                    className="mt-1 text-sm md:text-base p-3 md:p-4"
                    rows={5}
                    style={{ minHeight: "120px", width: "100%" }}
                    maxLength={1000}
                    disabled={isValidating}
                  />
                  {/* Validation Overlay */}
                  {isValidating && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md mt-1">
                      <div className="text-center">
                        <div className="text-yellow-600 font-semibold text-sm mb-2">
                          Validating Story
                        </div>
                        <TypingDots />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {customSubject.length}/1000 characters
                </p>
              </div>

              {/* Validation Button for Custom Stories */}
              <div className="flex justify-center">
                <Button
                  onClick={validateStory}
                  disabled={!canValidate || isValidating}
                  className="bg-imaginory-yellow hover:bg-imaginory-yellow-600 disabled:bg-gray-300 w-full md:w-auto"
                >
                  {isValidating ? (
                    <>
                      <span>Validating</span>
                      <TypingDots />
                    </>
                  ) : (
                    "Validate Story"
                  )}
                </Button>
              </div>

              {/* Validation Progress Display */}
              {(isValidating || reasoningLog || section) && (
                <div className="mt-4">
                  <p className="text-xs mb-1 flex items-center">
                    <span className="font-semibold text-yellow-600">
                      {isValidating ? "Thinking" : "Listening"}
                    </span>
                    {isValidating && <TypingDots />}
                  </p>

                  {section && (
                    <div className="mt-4">
                      <p className="font-semibold mb-1 flex items-center shimmer">
                        {section.title}
                      </p>
                      <div
                        ref={logRef}
                        className="bg-white border border-yellow-300/30 rounded-md p-2 md:p-3
                                   text-xs text-gray-800 whitespace-pre-wrap
                                   max-h-40 md:max-h-56 overflow-y-auto"
                      >
                        <ReactMarkdown>{section.body}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Errors */}
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
                      <p className="font-semibold text-red-700">{err.check}</p>
                      <p className="text-sm text-red-600 mt-1">{err.problem}</p>
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

              {/* Validation Success */}
              {isValidated && validationErrors.length === 0 && (
                <div className="flex items-center p-4 rounded-lg bg-green-100 border border-green-300 text-green-700">
                  <i className="fas fa-check-circle mr-2" />
                  <p className="text-sm">
                    Great! Your story idea has been validated and approved.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col md:flex-row gap-3 md:justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full md:w-auto order-2 md:order-1"
            >
              ← Back to Theme
            </Button>

            {/* Continue button - always visible but only enabled when canProceed is true */}
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 w-full md:w-auto order-1 md:order-2"
            >
              Continue to Settings →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
