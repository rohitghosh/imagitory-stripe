import React, { useState, useEffect } from "react";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyHeaderProps {
  bookTitle: string;
  onBack: () => void;
  onEditPDF: () => void;
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
  isDirty?: boolean;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  bookTitle,
  onBack,
  onEditPDF,
  onToggleAssistant,
  isAssistantOpen,
  isDirty = false,
}) => {
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Show welcome message for chat support button
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcomeMessage(true), 1000);
    const hideTimer = setTimeout(() => setShowWelcomeMessage(false), 6000); // 5 seconds display
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="sticky top-16 md:top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left: Back navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate max-w-xs md:max-w-md">
              {bookTitle}
            </h1>
          </div>

          {/* Right: Primary CTA and Assistant toggle */}
          <div className="flex items-center space-x-2 md:space-x-3 relative">
            {/* Chat Support Button with Animation */}
            <div className="relative">
              {/* Welcome message */}
              {showWelcomeMessage && (
                <div className="absolute top-full right-0 mt-3 px-4 py-3 bg-imaginory-yellow text-imaginory-black text-sm rounded-lg shadow-xl max-w-xs animate-slideUp z-50">
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Need help with imagitory?</p>
                      <p className="text-xs opacity-90 mt-1">
                        Click here to get assistance!
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-imaginory-yellow" />
                </div>
              )}

              {/* Tooltip for desktop */}
              {isHovered && !showWelcomeMessage && (
                <div className="hidden md:block absolute top-full right-0 mt-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap z-50">
                  Imaginory Assistant
                  <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800" />
                </div>
              )}

              <Button
                onClick={onToggleAssistant}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative bg-gray-100 hover:bg-gray-50 text-gray-700 font-semibold shadow-inner border-2 border-black transition-all duration-200 hover:shadow-inner-lg"
                style={{
                  boxShadow:
                    "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)",
                }}
                size="default"
                aria-label="Chat & Edit"
              >
                <span className="hidden sm:inline text-base">Chat & Edit</span>
                <span className="sm:hidden">Chat</span>
              </Button>
            </div>

            {/* Primary CTA: Edit PDF - Made Bigger */}
            <Button
              onClick={onEditPDF}
              className="bg-imaginory-yellow hover:bg-imaginory-yellow/90 text-imaginory-black font-semibold transition-all duration-200 hover:scale-105"
              style={{
                boxShadow:
                  "2px 2px 6px rgba(0,0,0,0.2), -1px -1px 3px rgba(255,255,255,0.6), inset -1px -1px 2px rgba(0,0,0,0.1)",
              }}
              size="default" // Changed from "sm" to "default" for bigger size
            >
              <span className="hidden sm:inline text-base">Preview PDF</span>
              <span className="sm:hidden">Preview</span>
              {isDirty && (
                <span className="ml-2 w-2 h-2 bg-imaginory-blue rounded-full animate-pulse"></span>
              )}
            </Button>
          </div>
        </div>
      </div>

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
