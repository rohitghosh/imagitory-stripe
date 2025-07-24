import React, { useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ImageMaximizeModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageMaximizeModal: React.FC<ImageMaximizeModalProps> = ({
  imageUrl,
  isOpen,
  onClose,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  // Use portal to render outside of parent component
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close fullscreen"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Image Container */}
      <div className="relative max-w-full max-h-full p-4">
        <img
          src={imageUrl}
          alt="Fullscreen view"
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: "calc(100vh - 2rem)" }}
        />
      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>,
    document.body,
  );
};
