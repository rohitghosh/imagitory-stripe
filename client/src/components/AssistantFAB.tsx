import React, { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface AssistantFABProps {
  onClick: () => void;
  showWelcomePulse?: boolean;
}

export const AssistantFAB: React.FC<AssistantFABProps> = ({
  onClick,
  showWelcomePulse = true,
}) => {
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Show welcome message on first visit
  useEffect(() => {
    if (showWelcomePulse) {
      const timer = setTimeout(() => setShowWelcomeMessage(true), 2000);
      const hideTimer = setTimeout(() => setShowWelcomeMessage(false), 8000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [showWelcomePulse]);

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <div className="absolute bottom-full right-0 mb-4 px-4 py-3 bg-red-600 text-white text-sm rounded-lg shadow-xl max-w-xs animate-slideUp">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Need help with your story?</p>
              <p className="text-xs opacity-90 mt-1">
                Tap here to chat with StoryPal!
              </p>
            </div>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600" />
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onClick}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={`relative flex items-center justify-center w-14 h-14 bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 ${
          isPressed ? "scale-95 shadow-md" : "hover:scale-105 hover:shadow-xl"
        }`}
        style={{
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
        aria-label="Open Imaginory Assistant"
      >
        <HelpCircle className="w-6 h-6" />

        {/* Pulse rings for attention */}
        {showWelcomePulse && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-600 opacity-30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-red-600 opacity-20 animate-pulse" />
          </>
        )}

        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className={`absolute inset-0 bg-white transition-all duration-200 ${
              isPressed ? "scale-100 opacity-20" : "scale-0 opacity-0"
            }`}
          />
        </div>
      </button>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
