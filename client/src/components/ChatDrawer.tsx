import React, { useEffect, useRef, useState } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onLayoutChange?: (isOpen: boolean) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  children,
  onLayoutChange,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.(isOpen && !isMinimized);
  }, [isOpen, isMinimized, onLayoutChange]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mobile drawer (bottom sheet)
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

        {/* Mobile Bottom Sheet */}
        <div
          ref={drawerRef}
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            height: isMinimized ? "60px" : "70vh",
            maxHeight: "90vh",
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="font-semibold">Customer Support</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div
              className="flex-1 overflow-y-auto"
              style={{ height: "calc(100% - 60px)" }}
            >
              {children}
            </div>
          )}
        </div>
      </>
    );
  }

  // Desktop drawer (side panel)
  return (
    <>
      {/* Desktop Side Panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          width: isMinimized ? "60px" : "400px",
          maxWidth: "90vw",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          {!isMinimized && (
            <h3 className="font-semibold text-lg">Customer Support</h3>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div
            className="flex-1 h-full overflow-hidden"
            style={{ height: "calc(100% - 73px)" }}
          >
            {children}
          </div>
        )}
      </div>
    </>
  );
};
