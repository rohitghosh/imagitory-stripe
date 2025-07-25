import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface CustomerSupportButtonProps {
  onClick: () => void;
}

export const CustomerSupportButton: React.FC<CustomerSupportButtonProps> = ({
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Tooltip - Desktop only */}
      {isHovered && (
        <div className="hidden md:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap animate-fadeIn">
          Something Wrong?
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}

      {/* Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative p-3 md:p-3 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 touch-manipulation"
        aria-label="Customer support"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <HelpCircle className="w-5 h-5 md:w-5 md:h-5" />

        {/* Pulse animation for attention - Desktop only */}
        <span className="hidden md:block absolute top-0 left-0 w-full h-full rounded-full bg-black opacity-20 animate-ping" />
      </button>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
};
