// import { Progress } from "@/components/ui/progress";

// export function ProgressDisplay({ prog }: { prog: any }) {
//   return (
//     <div className="max-w-md mx-auto my-6 space-y-2">
//       <Progress value={prog.pct ?? 0} />
//       <p className="text-center text-sm text-muted-foreground">
//         {prog.message ?? prog.phase} – {Math.round(prog.pct ?? 0)}%
//       </p>
//       {prog.phase === "error" && (
//         <p className="text-destructive text-center text-sm">{prog.error}</p>
//       )}
//     </div>
//   );
// }

import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

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

// Funny and engaging progress messages for different phases
const PROGRESS_MESSAGES = {
  initializing: [
    "🎭 Warming up the storytelling engines...",
    "📚 Dusting off the imagination workshop...",
    "✨ Sprinkling some creative fairy dust...",
    "🎨 Preparing the literary canvas...",
  ],
  prompting: [
    "🧠 Brainstorming with our AI storytellers...",
    "💭 Cooking up some plot twists...",
    "📝 Weaving words into wonderful tales...",
    "🎪 Setting up the story circus...",
    "🌟 Consulting with the muses...",
    "📖 Flipping through the book of infinite possibilities...",
  ],
  reasoning: [
    "🤔 Our AI is having deep thoughts...",
    "💡 Connecting the narrative dots...",
    "🎯 Fine-tuning the story architecture...",
    "🔍 Examining every plot detail...",
    "🧩 Assembling the perfect story puzzle...",
    "⚡ Lightning strikes of creativity happening...",
  ],
  generating: [
    "🎨 Painting scenes with pixels and imagination...",
    "🖼️ Bringing characters to life on digital canvas...",
    "🌈 Adding color to your story world...",
    "📸 Capturing magical moments frame by frame...",
    "🎬 Directing an epic visual adventure...",
    "✨ Sprinkling visual magic into every scene...",
  ],
  complete: [
    "🎉 Ta-da! Your story is ready for its grand debut!",
    "🌟 All done! Time to dive into your personalized adventure!",
    "📚 Your masterpiece awaits! Ready to turn the first page?",
  ],
};

export function ProgressDisplay({
  prog,
  className,
}: {
  prog: any;
  className?: string;
}) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayMessage, setDisplayMessage] = useState("");

  useEffect(() => {
    const phaseMessages = PROGRESS_MESSAGES[prog?.phase] || [
      prog?.message || prog?.phase || "Working on it...",
    ];

    // Rotate through messages every 2.5 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % phaseMessages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [prog?.phase, prog?.message]);

  useEffect(() => {
    const phaseMessages = PROGRESS_MESSAGES[prog?.phase] || [
      prog?.message || prog?.phase || "Working on it...",
    ];
    setDisplayMessage(phaseMessages[currentMessageIndex] || phaseMessages[0]);
  }, [currentMessageIndex, prog?.phase, prog?.message]);

  // Show a minimum of 1% to indicate something is happening
  const displayPct = Math.max(prog?.pct ?? 0, 1);

  return (
    <div className={`max-w-lg mx-auto my-6 space-y-3 ${className || ""}`}>
      <div className="space-y-2">
        <Progress value={displayPct} className="h-3" />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-mono">{Math.round(displayPct)}%</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-imaginory-black flex items-center justify-center">
          {displayMessage}
          {prog?.phase !== "complete" && prog?.phase !== "error" && (
            <TypingDots />
          )}
        </p>

        {prog?.phase === "reasoning" && prog?.log && (
          <div className="text-xs text-gray-600 max-h-16 overflow-hidden">
            <div className="opacity-70">{prog.log.slice(-100)}...</div>
          </div>
        )}
      </div>

      {prog?.phase === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-center text-sm font-medium">
            😅 Oops! Something went wonky
          </p>
          <p className="text-red-600 text-center text-xs mt-1">{prog.error}</p>
        </div>
      )}
    </div>
  );
}
