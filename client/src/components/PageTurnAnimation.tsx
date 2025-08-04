import React, { useEffect, useState } from "react";

interface PageTurnAnimationProps {
  currentIndex: number;
  previousIndex: number;
  direction: "left" | "right" | null;
  isAnimating: boolean;
}

export const PageTurnAnimation: React.FC<PageTurnAnimationProps> = ({
  currentIndex,
  previousIndex,
  direction,
  isAnimating,
}) => {
  const [animationState, setAnimationState] = useState<
    "idle" | "turning" | "complete"
  >("idle");

  useEffect(() => {
    if (isAnimating && direction) {
      setAnimationState("turning");
      const timer = setTimeout(() => {
        setAnimationState("complete");
        setTimeout(() => setAnimationState("idle"), 300);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, direction]);

  if (!isAnimating || !direction) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Page turn overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-gray-900/20 to-transparent transition-all duration-500 ease-out ${
          direction === "left" ? "translate-x-0" : "translate-x-full"
        } ${animationState === "turning" ? "opacity-100" : "opacity-0"}`}
        style={{
          transform:
            direction === "left" ? "translateX(0%)" : "translateX(100%)",
        }}
      >
        {/* Page curl effect */}
        <div
          className={`absolute top-0 bottom-0 w-32 bg-gradient-to-r from-gray-800/30 to-transparent ${
            direction === "left" ? "right-0" : "left-0"
          }`}
          style={{
            transform:
              direction === "left"
                ? "skewY(-2deg) translateX(50%)"
                : "skewY(2deg) translateX(-50%)",
          }}
        />

        {/* Page shadow */}
        <div
          className={`absolute top-0 bottom-0 w-16 bg-black/20 ${
            direction === "left" ? "right-0" : "left-0"
          }`}
          style={{
            transform:
              direction === "left" ? "translateX(100%)" : "translateX(-100%)",
          }}
        />
      </div>

      {/* Direction indicator */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-6xl font-bold opacity-60 transition-opacity duration-300 ${
          animationState === "turning" ? "opacity-60" : "opacity-0"
        }`}
      >
        {direction === "left" ? "→" : "←"}
      </div>
    </div>
  );
};
