// import React, { useEffect, useRef, useState } from "react";
// import { X, Minimize2, Maximize2 } from "lucide-react";

// interface ChatDrawerProps {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   onLayoutChange?: (isOpen: boolean) => void;
// }

// export const ChatDrawer: React.FC<ChatDrawerProps> = ({
//   isOpen,
//   onClose,
//   children,
//   onLayoutChange,
// }) => {
//   const [isMinimized, setIsMinimized] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const drawerRef = useRef<HTMLDivElement>(null);

//   // Detect mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   // Notify parent of layout changes
//   useEffect(() => {
//     onLayoutChange?.(isOpen && !isMinimized);
//   }, [isOpen, isMinimized, onLayoutChange]);

//   // Handle escape key
//   useEffect(() => {
//     const handleEscape = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && isOpen) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("keydown", handleEscape);
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//     };
//   }, [isOpen, onClose]);

//   if (!isOpen) return null;

//   // Mobile drawer (bottom sheet)
//   if (isMobile) {
//     return (
//       <>
//         {/* Backdrop */}
//         <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

//         {/* Mobile Bottom Sheet */}
//         <div
//           ref={drawerRef}
//           className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 ${
//             isOpen ? "translate-y-0" : "translate-y-full"
//           }`}
//           style={{
//             height: isMinimized ? "60px" : "70vh",
//             maxHeight: "90vh",
//           }}
//         >
//           {/* Handle bar */}
//           <div className="flex justify-center pt-2">
//             <div className="w-12 h-1 bg-gray-300 rounded-full" />
//           </div>

//           {/* Header */}
//           <div className="flex items-center justify-between px-4 py-2 border-b">
//             <h3 className="font-semibold">Customer Support</h3>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setIsMinimized(!isMinimized)}
//                 className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label={isMinimized ? "Maximize" : "Minimize"}
//               >
//                 {isMinimized ? (
//                   <Maximize2 className="w-4 h-4" />
//                 ) : (
//                   <Minimize2 className="w-4 h-4" />
//                 )}
//               </button>
//               <button
//                 onClick={onClose}
//                 className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label="Close chat"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           {/* Content */}
//           {!isMinimized && (
//             <div
//               className="flex-1 overflow-y-auto"
//               style={{ height: "calc(100% - 60px)" }}
//             >
//               {children}
//             </div>
//           )}
//         </div>
//       </>
//     );
//   }

//   // Desktop drawer (side panel)
//   return (
//     <>
//       {/* Desktop Side Panel */}
//       <div
//         ref={drawerRef}
//         className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ${
//           isOpen ? "translate-x-0" : "translate-x-full"
//         }`}
//         style={{
//           width: isMinimized ? "60px" : "400px",
//           maxWidth: "90vw",
//         }}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 py-4 border-b">
//           {!isMinimized && (
//             <h3 className="font-semibold text-lg">Customer Support</h3>
//           )}
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setIsMinimized(!isMinimized)}
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               aria-label={isMinimized ? "Maximize" : "Minimize"}
//             >
//               {isMinimized ? (
//                 <Maximize2 className="w-4 h-4" />
//               ) : (
//                 <Minimize2 className="w-4 h-4" />
//               )}
//             </button>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               aria-label="Close chat"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         {!isMinimized && (
//           <div
//             className="flex-1 h-full overflow-hidden"
//             style={{ height: "calc(100% - 73px)" }}
//           >
//             {children}
//           </div>
//         )}
//       </div>
//     </>
//   );
// };
// import React, { useEffect, useRef, useState } from "react";
// import { X, Minimize2, Maximize2, MessageCircle } from "lucide-react";

// interface ChatDrawerProps {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   onLayoutChange?: (isOpen: boolean) => void;
// }

// export const ChatDrawer: React.FC<ChatDrawerProps> = ({
//   isOpen,
//   onClose,
//   children,
//   onLayoutChange,
// }) => {
//   const [isMinimized, setIsMinimized] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const drawerRef = useRef<HTMLDivElement>(null);

//   // Detect mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   // Notify parent of layout changes
//   useEffect(() => {
//       onLayoutChange?.(isOpen && !isMinimized);
//     }, [isOpen, isMinimized, onLayoutChange]);

//   // Handle escape key
//   useEffect(() => {
//     const handleEscape = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && isOpen) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("keydown", handleEscape);
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//     };
//   }, [isOpen, onClose]);

//   if (!isOpen) return null;

//   // Mobile drawer (bottom sheet with improved UX)
//   if (isMobile) {
//     return (
//       <>
//         {/* Backdrop with improved touch handling */}
//         <div
//           className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
//           onClick={onClose}
//           style={{ touchAction: "none" }}
//         />

//         {/* Mobile Bottom Sheet with enhanced design */}
//         <div
//           ref={drawerRef}
//           className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-all duration-300 ease-out ${
//             isOpen ? "translate-y-0" : "translate-y-full"
//           }`}
//           style={{
//             height: isMinimized ? "80px" : "75vh",
//             maxHeight: "90vh",
//             touchAction: "pan-y",
//           }}
//         >
//           {/* Enhanced handle bar */}
//           <div className="flex justify-center pt-3 pb-2">
//             <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
//           </div>

//           {/* Header with improved styling */}
//           <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//             <div className="flex items-center space-x-3">
//               <MessageCircle className="w-5 h-5 text-blue-600" />
//               <h3 className="font-semibold text-lg text-gray-800">
//                 StoryPal Assistant
//               </h3>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setIsMinimized(!isMinimized)}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label={isMinimized ? "Maximize" : "Minimize"}
//               >
//                 {isMinimized ? (
//                   <Maximize2 className="w-5 h-5 text-gray-600" />
//                 ) : (
//                   <Minimize2 className="w-5 h-5 text-gray-600" />
//                 )}
//               </button>
//               <button
//                 onClick={onClose}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label="Close chat"
//               >
//                 <X className="w-5 h-5 text-gray-600" />
//               </button>
//             </div>
//           </div>

//           {/* Content with improved scrolling */}
//           {!isMinimized && (
//             <div
//               className="flex-1 overflow-y-auto overscroll-contain"
//               style={{ height: "calc(100% - 80px)" }}
//             >
//               {children}
//             </div>
//           )}

//           {/* Minimized state indicator */}
//           {isMinimized && (
//             <div className="flex items-center justify-center h-full">
//               <div className="flex items-center space-x-2 text-gray-600">
//                 <MessageCircle className="w-5 h-5 text-blue-600" />
//                 <span className="font-medium">StoryPal Assistant</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </>
//     );
//   }

//   // Desktop drawer (side panel with improved design)
//   return (
//     <>
//       {/* Desktop Side Panel with enhanced styling */}
//       <div
//         ref={drawerRef}
//         className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ease-out ${
//           isOpen ? "translate-x-0" : "translate-x-full"
//         }`}
//         style={{
//           width: isMinimized ? "80px" : "420px",
//           maxWidth: "90vw",
//         }}
//       >
//         {/* Header with improved design */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
//           {!isMinimized && (
//             <div className="flex items-center space-x-3">
//               <MessageCircle className="w-6 h-6 text-blue-600" />
//               <h3 className="font-semibold text-xl text-gray-800">
//                 StoryPal Assistant
//               </h3>
//             </div>
//           )}
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setIsMinimized(!isMinimized)}
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               aria-label={isMinimized ? "Maximize" : "Minimize"}
//             >
//               {isMinimized ? (
//                 <Maximize2 className="w-5 h-5 text-gray-600" />
//               ) : (
//                 <Minimize2 className="w-5 h-5 text-gray-600" />
//               )}
//             </button>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               aria-label="Close chat"
//             >
//               <X className="w-6 h-6 text-gray-600" />
//             </button>
//           </div>
//         </div>

//         {/* Content with improved layout */}
//         {!isMinimized && (
//           <div
//             className="flex-1 h-full overflow-hidden bg-gray-50"
//             style={{ height: "calc(100% - 80px)" }}
//           >
//             {children}
//           </div>
//         )}

//         {/* Minimized state for desktop */}
//         {isMinimized && (
//           <div className="flex flex-col items-center justify-center h-full space-y-4">
//             <MessageCircle className="w-8 h-8 text-blue-600" />
//             <div className="text-center">
//               <p className="text-xs font-medium text-gray-600 rotate-90 whitespace-nowrap">
//                 StoryPal
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };
// import React, { useEffect, useRef, useState } from "react";
// import { X, Minimize2, Maximize2, MessageCircle } from "lucide-react";

// interface ChatDrawerProps {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   onLayoutChange?: (isOpen: boolean) => void;
// }

// export const ChatDrawer: React.FC<ChatDrawerProps> = ({
//   isOpen,
//   onClose,
//   children,
//   onLayoutChange,
// }) => {
//   const [isMinimized, setIsMinimized] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const drawerRef = useRef<HTMLDivElement>(null);

//   // Detect mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   // Notify parent of layout changes
//   useEffect(() => {
//     onLayoutChange?.(isOpen && !isMinimized && !isMobile);
//   }, [isOpen, isMinimized, onLayoutChange, isMobile]);

//   // Handle escape key
//   useEffect(() => {
//     const handleEscape = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && isOpen) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("keydown", handleEscape);
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//     };
//   }, [isOpen, onClose]);

//   if (!isOpen) return null;

//   // Mobile: Full-screen bottom sheet
//   if (isMobile) {
//     return (
//       <>
//         {/* Backdrop */}
//         <div
//           className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
//           onClick={onClose}
//           style={{ touchAction: "none" }}
//         />

//         {/* Mobile Full-Screen Bottom Sheet */}
//         <div
//           ref={drawerRef}
//           className={`fixed inset-x-0 bottom-0 bg-white z-50 transition-all duration-300 ease-out ${
//             isOpen ? "translate-y-0" : "translate-y-full"
//           }`}
//           style={{
//             height: isMinimized ? "80px" : "90vh",
//             borderTopLeftRadius: "16px",
//             borderTopRightRadius: "16px",
//             touchAction: "pan-y",
//           }}
//         >
//           {/* Handle bar */}
//           <div className="flex justify-center pt-3 pb-2">
//             <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
//           </div>

//           {/* Header */}
//           <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
//             <div className="flex items-center space-x-3">
//               <MessageCircle className="w-5 h-5 text-red-600" />
//               <h3 className="font-semibold text-lg text-gray-900">
//                 Imaginory Assistant
//               </h3>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setIsMinimized(!isMinimized)}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label={isMinimized ? "Maximize" : "Minimize"}
//               >
//                 {isMinimized ? (
//                   <Maximize2 className="w-5 h-5 text-gray-600" />
//                 ) : (
//                   <Minimize2 className="w-5 h-5 text-gray-600" />
//                 )}
//               </button>
//               <button
//                 onClick={onClose}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 aria-label="Close chat"
//               >
//                 <X className="w-5 h-5 text-gray-600" />
//               </button>
//             </div>
//           </div>

//           {/* Content */}
//           {!isMinimized && (
//             <div
//               className="flex-1 overflow-y-auto overscroll-contain bg-gray-50"
//               style={{ height: "calc(100% - 100px)" }}
//             >
//               {children}
//             </div>
//           )}

//           {/* Minimized state indicator */}
//           {isMinimized && (
//             <div className="flex items-center justify-center h-full">
//               <div className="flex items-center space-x-2 text-gray-600">
//                 <MessageCircle className="w-5 h-5 text-red-600" />
//                 <span className="font-medium">Imaginory Assistant</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </>
//     );
//   }

//   // Desktop: Side panel that pushes content
//   return (
//     <div
//       ref={drawerRef}
//       className={`fixed top-16 right-0 h-[calc(100vh-64px)] bg-white border-l border-gray-200 shadow-2xl z-40 transition-all duration-300 ease-out ${
//         isOpen ? "translate-x-0" : "translate-x-full"
//       }`}
//       style={{
//         width: isMinimized ? "80px" : "420px",
//         maxWidth: "90vw",
//       }}
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
//         {!isMinimized && (
//           <div className="flex items-center space-x-3">
//             <MessageCircle className="w-6 h-6 text-red-600" />
//             <h3 className="font-semibold text-xl text-gray-900">
//               Imaginory Assistant
//             </h3>
//           </div>
//         )}
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={() => setIsMinimized(!isMinimized)}
//             className="p-2 hover:bg-white/60 rounded-lg transition-colors"
//             aria-label={isMinimized ? "Maximize" : "Minimize"}
//           >
//             {isMinimized ? (
//               <Maximize2 className="w-5 h-5 text-gray-600" />
//             ) : (
//               <Minimize2 className="w-5 h-5 text-gray-600" />
//             )}
//           </button>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-white/60 rounded-lg transition-colors"
//             aria-label="Close chat"
//           >
//             <X className="w-6 h-6 text-gray-600" />
//           </button>
//         </div>
//       </div>

//       {/* Content */}
//       {!isMinimized && (
//         <div
//           className="flex-1 h-full overflow-hidden bg-gray-50"
//           style={{ height: "calc(100% - 80px)" }}
//         >
//           {children}
//         </div>
//       )}

//       {/* Minimized state for desktop */}
//       {isMinimized && (
//         <div className="flex flex-col items-center justify-center h-full space-y-4">
//           <MessageCircle className="w-8 h-8 text-red-600" />
//           <div className="text-center">
//             <p className="text-xs font-medium text-gray-600 rotate-90 whitespace-nowrap">
//               StoryPal
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useEffect, useRef, useState } from "react";
import { X, Minimize2, Maximize2, MessageCircle } from "lucide-react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onLayoutChange?: (isOpen: boolean) => void;

  /** Small “peek” height (px) when minimized on mobile */
  peekPx?: number; // default 72

  /** Snap heights as fractions of viewport height (0..1) */
  snapPoints?: number[]; // default [0.25, 0.6, 0.92]

  /** Which snap to use when opening on mobile (index into snapPoints) */
  initialSnap?: number; // default 0

  /** Layer order */
  zIndex?: number; // default 80

  /** If true, tapping scrim minimizes to peek (instead of closing) */
  closeOnScrim?: boolean; // default true

  /** Start minimized on mobile so art is clear at first glance */
  startMobileMinimized?: boolean; // default true
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  children,
  onLayoutChange,

  peekPx = 72,
  snapPoints = [0.25, 0.6, 0.92],
  initialSnap = 0,
  zIndex = 80,
  closeOnScrim = true,
  startMobileMinimized = true,
}) => {
  const [isMinimized, setIsMinimized] = useState(false); // desktop “thin” / mobile “peek”
  const [isMobile, setIsMobile] = useState(false);

  // Mobile bottom-sheet state
  const [snapIdx, setSnapIdx] = useState<number>(initialSnap); // -1 = peek
  const [lastExpandedIdx, setLastExpandedIdx] = useState<number>(initialSnap);
  const [dragging, setDragging] = useState(false);
  const [sheetHeightPx, setSheetHeightPx] = useState<number | null>(null);

  const startYRef = useRef(0);
  const startHRef = useRef(0);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Notify parent of desktop layout changes (keeps your original semantics)
  useEffect(() => {
    onLayoutChange?.(isOpen && !isMinimized && !isMobile);
  }, [isOpen, isMinimized, isMobile, onLayoutChange]);

  // ESC closes (desktop) or minimizes (mobile)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isMobile) {
          setIsMinimized(true);
          setSnapIdx(-1);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isMobile, onClose]);

  // Mobile open behavior
  useEffect(() => {
    if (!isMobile) return;
    if (isOpen) {
      if (startMobileMinimized) {
        setIsMinimized(true);
        setSnapIdx(-1);
      } else {
        setIsMinimized(false);
        setSnapIdx(initialSnap);
      }
      setLastExpandedIdx(initialSnap);
    } else {
      setDragging(false);
      setSheetHeightPx(null);
    }
  }, [isOpen, isMobile, startMobileMinimized, initialSnap]);

  if (!isOpen) return null;

  // Helpers
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const clamp = (n: number, min: number, max: number) =>
    Math.min(max, Math.max(min, n));
  const getSnapHeightPx = (idx: number) =>
    Math.max(0, Math.min(vh, Math.round((snapPoints[idx] ?? 0) * vh)));

  const currentTargetHeight = (() => {
    if (!isMobile) return 0;
    if (dragging && sheetHeightPx != null) return sheetHeightPx;
    if (isMinimized || snapIdx === -1) return peekPx;
    return getSnapHeightPx(snapIdx);
  })();

  const nearestSnapIdx = (heightPx: number): number => {
    const candidates: Array<{ idx: number; h: number }> = [
      { idx: -1, h: peekPx },
      ...snapPoints.map((_, i) => ({ idx: i, h: getSnapHeightPx(i) })),
    ];
    let best = candidates[0];
    let bestDist = Math.abs(heightPx - best.h);
    for (let i = 1; i < candidates.length; i++) {
      const d = Math.abs(heightPx - candidates[i].h);
      if (d < bestDist) {
        best = candidates[i];
        bestDist = d;
      }
    }
    return best.idx;
  };

  // Drag handlers (mobile)
  const onHandlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isMobile) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    startYRef.current = e.clientY;
    const h = isMinimized || snapIdx === -1 ? peekPx : getSnapHeightPx(snapIdx);
    startHRef.current = h;
    setSheetHeightPx(h);
  };

  const onHandlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragging || !isMobile) return;
    const dy = e.clientY - startYRef.current; // +dy means move down
    const nextH = clamp(startHRef.current - dy, peekPx, Math.round(vh * 0.98));
    setSheetHeightPx(nextH);
  };

  const onHandlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragging || !isMobile) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
    const h = sheetHeightPx ?? peekPx;
    const idx = nearestSnapIdx(h);
    if (idx === -1) {
      setIsMinimized(true);
      setSnapIdx(-1);
    } else {
      setIsMinimized(false);
      setSnapIdx(idx);
      setLastExpandedIdx(idx);
    }
    setSheetHeightPx(null);
  };

  // Mobile expanded?
  const isExpanded = isMobile && !isMinimized && snapIdx >= 0;

  /* ─────────────── Mobile: Bottom Sheet with snap/peek ─────────────── */
  if (isMobile) {
    return (
      <>
        {/* Scrim (only when expanded; no blur) */}
        {isExpanded && (
          <div
            className="fixed inset-0 bg-black/30"
            style={{ zIndex }}
            onClick={() => {
              if (closeOnScrim) {
                setIsMinimized(true);
                setSnapIdx(-1);
              } else {
                onClose();
              }
            }}
          />
        )}

        {/* Bottom sheet */}
        <div
          ref={drawerRef}
          className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: currentTargetHeight || peekPx, zIndex: zIndex + 1 }}
        >
          <div className="flex flex-col h-full">
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 touch-none select-none"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
            >
              <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-lg text-gray-900">
                  Imaginory Assistant
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // toggle peek <-> last expanded snap
                    if (isMinimized || snapIdx === -1) {
                      setIsMinimized(false);
                      setSnapIdx(lastExpandedIdx);
                    } else {
                      setIsMinimized(true);
                      setSnapIdx(-1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Minimize2 className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => {
                    // Mobile ✕ minimizes by default (keeps chat available)
                    setIsMinimized(true);
                    setSnapIdx(-1);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50">
              {!isMinimized ? (
                children
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Imaginory Assistant</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ─────────────── Desktop: Side panel (unchanged) ─────────────── */
  return (
    <div
      ref={drawerRef}
      className="fixed top-16 right-0 h-[calc(100vh-64px)] bg-white border-l border-gray-200 shadow-2xl transition-all duration-300 ease-out"
      style={{
        width: isMinimized ? "80px" : "420px",
        maxWidth: "90vw",
        zIndex,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
        {!isMinimized && (
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-red-600" />
            <h3 className="font-semibold text-xl text-gray-900">
              Imaginory Assistant
            </h3>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="w-5 h-5 text-gray-600" />
            ) : (
              <Minimize2 className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 h-full overflow-hidden bg-gray-50" style={{ height: "calc(100% - 80px)" }}>
          {children}
        </div>
      )}

      {/* Minimized state for desktop */}
      {isMinimized && (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <MessageCircle className="w-8 h-8 text-red-600" />
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 rotate-90 whitespace-nowrap">
              StoryPal
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
