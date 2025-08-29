// import React, { useState, useEffect } from "react";
// import { HelpCircle } from "lucide-react";

// interface CustomerSupportButtonProps {
//   onClick: () => void;
// }

// export const CustomerSupportButton: React.FC<CustomerSupportButtonProps> = ({
//   onClick,
// }) => {
//   const [isHovered, setIsHovered] = useState(false);
//   const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

//   // Show welcome message when component mounts
//   useEffect(() => {
//     const timer = setTimeout(() => setShowWelcomeMessage(true), 1000); // show after 1 s
//     const hideTimer = setTimeout(() => setShowWelcomeMessage(false), 8000); // hide after 8 s (longer duration)
//     return () => {
//       clearTimeout(timer);
//       clearTimeout(hideTimer);
//     };
//   }, []);

//   return (
//     <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
//       {/* Welcome message */}
//       {showWelcomeMessage && (
//         <div className="absolute bottom-full right-0 mb-4 px-4 py-3 bg-red-600 text-white text-sm rounded-lg shadow-lg max-w-xs animate-fadeIn">
//           <div className="flex items-start space-x-2">
//             <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
//             <div>
//               <p className="font-medium">Hey! I'm your StoryPal assistant.</p>
//               <p className="text-xs opacity-90 mt-1">
//                 I'm here to help you with any questions about your story!
//               </p>
//             </div>
//           </div>
//           <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600" />
//         </div>
//       )}

//       {/* Tooltip – desktop only */}
//       {isHovered && !showWelcomeMessage && (
//         <div className="hidden md:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap animate-fadeIn">
//           Need help with StoryPal?
//           <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
//         </div>
//       )}

//       {/* Button */}
//       <button
//         onClick={onClick}
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//         className="group relative p-4 md:p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl transition-all duration-200 hover:scale-110 touch-manipulation border-2 border-white"
//         aria-label="StoryPal support"
//         style={{ WebkitTapHighlightColor: "transparent" }}
//       >
//         <HelpCircle className="w-6 h-6 md:w-6 md:h-6" />

//         {/* Pulse animation for attention */}
//         <span className="absolute top-0 left-0 w-full h-full rounded-full bg-red-600 opacity-30 animate-ping" />
//         <span className="absolute top-0 left-0 w-full h-full rounded-full bg-red-600 opacity-20 animate-pulse" />
//       </button>

//       {/* Animation styles */}
//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(5px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.3s ease-out;
//         }
//         .touch-manipulation {
//           touch-action: manipulation;
//         }
//       `}</style>
//     </div>
//   );
// };
import React, { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface CustomerSupportButtonProps {
  onClick: () => void;
}

export const CustomerSupportButton: React.FC<CustomerSupportButtonProps> = ({
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Show welcome message when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcomeMessage(true), 1000); // show after 1 s
    const hideTimer = setTimeout(() => setShowWelcomeMessage(false), 8000); // hide after 8 s (longer duration)
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Welcome message */}
      {showWelcomeMessage && (
        <div className="absolute bottom-full right-0 mb-4 px-4 py-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-w-xs animate-fadeIn">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Hey! I'm your Imagitory assistant.</p>
              <p className="text-xs opacity-90 mt-1">
                I'm here to help you with any questions about your story!
              </p>
            </div>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}

      {/* Tooltip – desktop only */}
      {isHovered && !showWelcomeMessage && (
        <div className="hidden md:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap animate-fadeIn">
          Need help with Imagitory?
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}

      {/* Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative px-4 py-3 md:px-4 md:py-3 bg-white hover:bg-gray-50 text-red-600 rounded-full shadow-lg transition-all duration-200 hover:scale-105 touch-manipulation border-2 border-red-600 hover:border-red-700"
        aria-label="Imagitory support"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <span className="text-xs md:text-sm font-medium whitespace-nowrap">
          Chat & Edit
        </span>
      </button>

      {/* Animation styles */}
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
          animation: fadeIn 0.3s ease-out;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
};
