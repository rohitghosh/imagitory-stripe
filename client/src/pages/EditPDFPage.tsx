// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useParams, useLocation } from "wouter";
// import { Rnd } from "react-rnd";
// import { useSwipeable } from "react-swipeable";
// import { Header } from "@/components/Header";
// import { Footer } from "@/components/Footer";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { ShippingForm } from "@/components/preview/ShippingForm";
// import { useAuth } from "@/contexts/AuthContext";
// import { apiRequest } from "@/lib/queryClient";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { ProgressDisplay } from "@/components/ui/progress-display";
// import { useJobProgress } from "@/hooks/use-job-progress";
// // EditPDFPage.tsx (top of the file, with your other shadcn imports)
// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogClose,
// } from "@/components/ui/dialog";

// const FULL_W = 2048;
// const FULL_H = 1024;
// const HALF_W = FULL_W / 2;
// const LOGICAL_W = 600;
// const LOGICAL_H = Math.round((FULL_H * LOGICAL_W) / HALF_W);
// const DEFAULT_FONT_SIZE = 22;
// const DEFAULT_FONT_FAMILY = "Cormorant Garamond";
// const DEFAULT_FONT_WEIGHT = 700;

// // Configuration for the pages:
// const MOBILE_BREAKPOINT = 768;
// const pageConfig = {
//   finalWidth: LOGICAL_W,
//   finalHeight: LOGICAL_H,
//   idealMinContainerWidth: 2 * LOGICAL_W + 32,
// };

// function normalize(rawX: number, rawY: number) {
//   return {
//     x: (rawX / HALF_W) * pageConfig.finalWidth,
//     y: (rawY / FULL_H) * pageConfig.finalHeight,
//   };
// }
// // ---- decode-aware preloader for all page/cover images ----
// function useImagePreloader(book: any) {
//   const [readyUrls, setReadyUrls] = React.useState<Set<string>>(new Set());
//   const [allDecoded, setAllDecoded] = React.useState(false);
//   const decodeCache = React.useRef<Record<string, Promise<void>>>({});

//   // helper to register a url into cache (decode promise)
//   const prime = React.useCallback((url: string) => {
//     if (!url) return;
//     if (!decodeCache.current[url]) {
//       const img = new Image();
//       // Optional: drop this if your images are same-origin; keeps browsers happy with caches
//       img.crossOrigin = "anonymous";
//       img.src = url;

//       // Prefer decode() for "ready-to-paint"; fallback to onload for older engines
//       const p =
//         typeof img.decode === "function"
//           ? img.decode().catch(() => void 0) // don't block on decode errors
//           : new Promise<void>((resolve) => {
//               img.onload = () => resolve();
//               img.onerror = () => resolve(); // don't block on errors
//             });

//       decodeCache.current[url] = p.then(() => {
//         setReadyUrls((prev) => {
//           if (prev.has(url)) return prev;
//           const next = new Set(prev);
//           next.add(url);
//           return next;
//         });
//       });
//     } else {
//       // already primed; still mark as ready when it resolves
//       decodeCache.current[url].then(() =>
//         setReadyUrls((prev) => {
//           if (prev.has(url)) return prev;
//           const next = new Set(prev);
//           next.add(url);
//           return next;
//         }),
//       );
//     }
//   }, []);

//   // collect all unique urls from the book and pre-decode them
//   useEffect(() => {
//     if (!book) return;

//     const urls = new Set<string>();
//     const coverUrls: string[] = book.cover?.final_cover_urls || [];
//     coverUrls.forEach((u) => u && urls.add(u));
//     book.pages?.forEach((p: any) => {
//       if (p?.expanded_scene_url) urls.add(p.expanded_scene_url);
//     });
//     if (book.cover?.back_cover_url) urls.add(book.cover.back_cover_url);

//     if (urls.size === 0) {
//       setAllDecoded(true);
//       return;
//     }

//     const allPromises: Promise<void>[] = [];
//     urls.forEach((u) => {
//       prime(u);
//       if (decodeCache.current[u]) allPromises.push(decodeCache.current[u]);
//     });

//     let cancelled = false;
//     Promise.all(allPromises).then(() => !cancelled && setAllDecoded(true));
//     return () => {
//       cancelled = true;
//     };
//   }, [book, prime]);

//   // allow the caller to await specific urls
//   const ensureReady = React.useCallback(
//     async (urls: string[]) => {
//       const unique = Array.from(new Set(urls.filter(Boolean)));
//       const promises = unique.map((u) => {
//         prime(u);
//         return decodeCache.current[u] ?? Promise.resolve();
//       });
//       await Promise.all(promises);
//     },
//     [prime],
//   );

//   return { readyUrls, allDecoded, ensureReady };
// }

// function PageImage({
//   url,
//   side,
//   onLoad,
//   isLoaded,
// }: {
//   url: string;
//   side: "left" | "right" | "full";
//   onLoad?: () => void;
//   isLoaded?: boolean;
// }) {
//   const opacity = isLoaded ? 1 : 0;
//   if (side === "full") {
//     // cover: fill the whole canvas
//     return (
//       <img
//         src={url}
//         alt=""
//         draggable={false}
//         className="absolute inset-0 w-full h-full object-cover"
//         style={{ opacity, transition: "opacity 150ms ease" }}
//         onLoad={onLoad}
//       />
//     );
//   }

//   // split-cropping for story pages
//   return (
//     <img
//       src={url}
//       alt=""
//       draggable={false}
//       className="absolute inset-0 w-full h-full object-cover"
//       style={{
//         objectPosition: side === "left" ? "left center" : "right center",
//         opacity,
//         transition: "opacity 150ms ease",
//       }}
//       onLoad={onLoad}
//     />
//   );
// }

// //
// // ScalablePreview Component (unchanged)
// //
// function ScalablePreview({ children, onScaleChange }) {
//   const containerRef = useRef(null);
//   const [scale, setScale] = useState(1);
//   useEffect(() => {
//     function handleResize() {
//       if (containerRef.current) {
//         const available = containerRef.current.getBoundingClientRect().width;
//         const scaleFactor = Math.min(1, available / pageConfig.finalWidth);
//         // console.log("🎯 ScalablePreview:", {
//         //   available,
//         //   scaleFactor,
//         //   finalWidth: pageConfig.finalWidth,
//         // });
//         setScale(scaleFactor);
//         if (onScaleChange) onScaleChange(scaleFactor);
//       }
//     }
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [onScaleChange]);
//   return (
//     <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
//       <div
//         style={{
//           width: `${pageConfig.finalWidth}px`,
//           height: `${pageConfig.finalHeight}px`,
//           transform: `scale(${scale})`,
//           transformOrigin: "top left",
//           position: "relative",
//         }}
//       >
//         {children}
//       </div>
//     </div>
//   );
// }

// //
// // ResizableTextBox Component – Final Version
// //
// const ResizableTextBox = ({
//   x,
//   y,
//   width,
//   height,
//   fontSize,
//   color,
//   fontFamily,
//   fontWeight,
//   lines,
//   scale,
//   onUpdate,
//   onTextChange,
//   setGlobalIsEditing,
//   initialSide,
//   isRhyming,
//   setGlobalIsInteracting,
// }) => {
//   // Maintain local (internal) position state.
//   const [localX, setLocalX] = useState(x);
//   const [localY, setLocalY] = useState(y);
//   // Maintain local (internal) size state to keep resized dimensions after stop.
//   const [localWidth, setLocalWidth] = useState(width);
//   const [localHeight, setLocalHeight] = useState(height);
//   // Track which page the box is on
//   const [currentSide, setCurrentSide] = useState(initialSide);
//   // Track editing mode for styling.
//   const [isEditingMode, setIsEditingMode] = useState(false);
//   const [isHovered, setIsHovered] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const textBoxRef = useRef(null);
//   const measureRef = useRef(null);
//   type UpdateCause = "auto" | "drag" | "resize" | "text";
//   const didBootstrapRef = useRef(false);
//   const [reflowMode, setReflowMode] = useState(false);
//   const measureCanvasRef = useRef(null);
//   const [operationInProgress, setOperationInProgress] = useState(false);

//   if (!measureCanvasRef.current) {
//     measureCanvasRef.current = document.createElement("canvas");
//   }

//   const wrapText = useCallback(
//     (text, maxWidthPx) => {
//       const ctx = measureCanvasRef.current.getContext("2d");
//       ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
//       const words = text.split(/\s+/).filter(Boolean);
//       const out = [];
//       let line = "";

//       const measure = (s) => ctx.measureText(s).width;

//       const breakLongWord = (w) => {
//         const chars = [...w];
//         let chunk = "",
//           parts = [];
//         for (const ch of chars) {
//           const test = chunk + ch;
//           if (measure(test) <= maxWidthPx) {
//             chunk = test;
//           } else {
//             if (chunk) parts.push(chunk);
//             chunk = ch;
//           }
//         }
//         if (chunk) parts.push(chunk);
//         return parts;
//       };

//       for (let i = 0; i < words.length; i++) {
//         const w = words[i];
//         const candidate = line ? line + " " + w : w;
//         if (measure(candidate) <= maxWidthPx) {
//           line = candidate;
//         } else {
//           if (!line) {
//             const pieces = breakLongWord(w);
//             if (pieces.length) {
//               out.push(pieces[0]);
//               for (let j = 1; j < pieces.length; j++) out.push(pieces[j]);
//               line = "";
//             }
//           } else {
//             out.push(line);
//             if (measure(w) <= maxWidthPx) {
//               line = w;
//             } else {
//               const pieces = breakLongWord(w);
//               out.push(...pieces.slice(0, pieces.length - 1));
//               line = pieces[pieces.length - 1] || "";
//             }
//           }
//         }
//       }
//       if (line) out.push(line);
//       return out.length ? out : [""];
//     },
//     [fontFamily, fontSize, fontWeight],
//   );

//   // Auto-resize to fit content
//   const adjustSizeToContent = useCallback(() => {
//     if (
//       !textBoxRef.current ||
//       isEditingMode ||
//       reflowMode ||
//       operationInProgress
//     )
//       return;

//     // Create a temporary element to measure text dimensions
//     const temp = document.createElement("div");
//     temp.style.position = "absolute";
//     temp.style.visibility = "hidden";
//     temp.style.whiteSpace = "pre";
//     temp.style.fontSize = fontSize + "px";
//     temp.style.fontFamily = fontFamily;
//     temp.style.fontWeight = fontWeight;
//     temp.style.padding = "10px";
//     temp.style.boxSizing = "border-box";
//     temp.style.width = "auto";
//     temp.style.height = "auto";
//     temp.style.maxWidth = "400px"; // Reasonable max width
//     temp.textContent = lines.join("\n") || " "; // Ensure at least some content

//     document.body.appendChild(temp);

//     const contentWidth = Math.max(temp.scrollWidth, 100); // Minimum width
//     const contentHeight = Math.max(temp.scrollHeight, 40); // Minimum height

//     document.body.removeChild(temp);

//     // Only update if size changed significantly
//     const threshold = 5;
//     if (
//       Math.abs(contentWidth - localWidth) > threshold ||
//       Math.abs(contentHeight - localHeight) > threshold
//     ) {
//       setLocalWidth(contentWidth);
//       setLocalHeight(contentHeight);
//       if (didBootstrapRef.current) {
//         onUpdate(
//           {
//             x: localX,
//             y: localY,
//             width: contentWidth,
//             height: contentHeight,
//             side: currentSide,
//           },
//           "auto",
//         );
//       }
//     }
//   }, [
//     fontSize,
//     fontFamily,
//     fontWeight,
//     lines,
//     localX,
//     localY,
//     localWidth,
//     localHeight,
//     currentSide,
//     onUpdate,
//     isEditingMode,
//     reflowMode,
//     operationInProgress,
//   ]);

//   const reflowText = useCallback(
//     (newWidth) => {
//       if (isEditingMode || isRhyming || !lines.length) return;

//       console.log("🔄 Starting text reflow:", {
//         newWidth,
//         currentLines: lines.length,
//       });

//       setReflowMode(true);

//       // Join all text into a single paragraph
//       const paragraph = lines.join(" ").replace(/\s+/g, " ").trim();

//       // Calculate available text width (subtract padding)
//       const maxTextWidth = Math.max(50, newWidth - 20); // 10px padding each side, min 50px

//       // Wrap the text to fit the new width
//       const wrappedLines = wrapText(paragraph, maxTextWidth);

//       // console.log("🔄 Text reflow result:", {
//       //   originalLines: lines.length,
//       //   newLines: wrappedLines.length,
//       //   maxTextWidth,
//       //   paragraph: paragraph.substring(0, 50) + "..."
//       // });

//       // Only update if the lines actually changed
//       if (wrappedLines.join("\n") !== lines.join("\n")) {
//         onTextChange(wrappedLines, "text");
//       }

//       // Reset reflow mode after a short delay
//       setTimeout(() => setReflowMode(false), 100);
//     },
//     [lines, wrapText, onTextChange, isEditingMode, isRhyming],
//   );

//   // Sync internal position and size if parent's values change.
//   useEffect(() => {
//     setLocalX(x);
//     setLocalY(y);
//     setLocalWidth(width);
//     setLocalHeight(height);
//     setCurrentSide(initialSide);
//   }, [x, y, width, height, initialSide]);

//   // Auto-resize when content changes
//   useEffect(() => {
//     adjustSizeToContent();
//   }, [adjustSizeToContent]);

//   useEffect(() => {
//     const id = Math.random().toString(36).slice(2, 7);
//     setTimeout(() => {
//       const box = textBoxRef.current?.closest(".rnd");
//       if (box) {
//         const r = box.getBoundingClientRect();
//         // console.log(`📦 Box[${id}] mount`, {
//         //   initX: x,
//         //   initY: y,
//         //   scaledX: r.left,
//         //   scaledY: r.top,
//         //   scale,
//         // });
//       }
//     }, 0);
//   }, []);

//   return (
//     <Rnd
//       scale={scale}
//       bounds="parent"
//       enableUserSelectHack={false}
//       disableDragging={isEditingMode}
//       size={{ width: localWidth, height: localHeight }}
//       position={{ x: localX, y: localY }}
//       onDragStart={() => {
//         setIsDragging(true);
//         setIsHovered(true); // Hide handles during drag

//         setOperationInProgress(true);
//       }}
//       onDrag={(e, d) => {
//         const newX = d.x;
//         const newY = d.y;

//         // If on the left page and newX meets or exceeds the page's width,
//         // commit the position to the right page.
//         if (currentSide === "left" && newX >= pageConfig.finalWidth) {
//           const excess = newX - pageConfig.finalWidth;
//           setCurrentSide("right");
//           onTextChange({ left: [], right: lines });
//           setLocalX(excess);
//           setLocalY(newY);
//           onUpdate({
//             x: excess,
//             y: newY,
//             width: localWidth,
//             height: localHeight,
//             side: "right",
//           });
//           return;
//         }
//         // If on the right page and newX becomes negative, commit the position to the left page.
//         if (currentSide === "right" && newX < 0) {
//           const excess = newX; // negative
//           const newXForLeft = pageConfig.finalWidth + excess;
//           setCurrentSide("left");
//           onTextChange({ left: lines, right: [] });
//           setLocalX(newXForLeft);
//           setLocalY(newY);
//           onUpdate({
//             x: newXForLeft,
//             y: newY,
//             width: localWidth,
//             height: localHeight,
//             side: "left",
//           });
//           return;
//         }
//         // Otherwise update the position normally.
//         setLocalX(newX);
//         setLocalY(newY);
//         onUpdate({
//           x: newX,
//           y: newY,
//           width: localWidth,
//           height: localHeight,
//           side: currentSide,
//         });
//       }}
//       onDragStop={(e, d) => {
//         setTimeout(() => {
//           const finalX = d.x;
//           const finalY = d.y;
//           setLocalX(finalX);
//           setLocalY(finalY);
//           setIsDragging(false); // Reset dragging state
//           onUpdate(
//             {
//               x: finalX,
//               y: finalY,
//               width: localWidth,
//               height: localHeight,
//               side: currentSide,
//             },
//             "drag",
//           );
//           setOperationInProgress(false);

//           console.log("📦 Box drag/resize", {
//             side: currentSide,
//             x: localX,
//             y: localY,
//             scale,
//           });
//         }, 0);
//       }}
//       onResizeStart={() => {
//         setIsDragging(true);
//         setIsHovered(true); // Hide handles during resize
//         setOperationInProgress(true);
//       }}
//       onResize={(e, direction, ref, delta, position) => {
//         // Live-update size while resizing for smoother UX
//         const newW = ref.offsetWidth;
//         const newH = ref.offsetHeight;
//         setLocalWidth(newW);
//         setLocalHeight(newH);
//         const updatedX = position.x;
//         const updatedY = position.y;
//         setLocalX(updatedX);
//         setLocalY(updatedY);
//       }}
//       onResizeStop={(e, direction, ref, delta, position) => {
//         setTimeout(() => {
//           const updatedX = position.x;
//           const updatedY = position.y;
//           const newW = ref.offsetWidth;
//           const newH = ref.offsetHeight;
//           setLocalX(updatedX);
//           setLocalY(updatedY);
//           setLocalWidth(newW);
//           setLocalHeight(newH);
//           setIsDragging(false); // Reset dragging state

//           onUpdate(
//             {
//               x: updatedX,
//               y: updatedY,
//               width: newW,
//               height: newH,
//               side: currentSide,
//             },
//             "resize",
//           );

//           if (lines.length > 0) {
//             setTimeout(() => {
//               reflowText(newW);
//             }, 50); // Small delay to ensure state is updated
//           }

//           setOperationInProgress(false);

//           console.log("📦 Box drag/resize", {
//             side: currentSide,
//             x: localX,
//             y: localY,
//             scale,
//           });
//         }, 0);
//       }}
//       onMouseDown={(e) => e.stopPropagation()}
//       onMouseEnter={() => {
//         if (!isDragging) {
//           setIsHovered(true);
//         }
//       }}
//       onMouseLeave={() => {
//         if (!isDragging) {
//           setIsHovered(false);
//         }
//       }}
//       style={{
//         border: isEditingMode
//           ? "2px solid #3b82f6"
//           : isHovered && lines.join("").trim() !== ""
//             ? `2px solid ${color === "#ffffff" || color === "white" ? "#000000" : "#ffffff"}`
//             : "2px solid transparent",
//         cursor: isEditingMode ? "text" : "move",
//         background: "transparent",
//         boxSizing: "border-box",
//         transition: "border-color 0.2s ease",
//       }}
//     >
//       {/* Custom resize handles */}
//       {(isHovered || isEditingMode) &&
//         !isDragging &&
//         lines.join("").trim() !== "" && (
//           <>
//             {/* Corner handles */}
//             <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize" />
//             <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize" />
//             <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize" />
//             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize" />

//             {/* Edge handles */}
//             <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-n-resize" />
//             <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-s-resize" />
//             <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize" />
//             <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize" />
//           </>
//         )}
//       <div
//         ref={textBoxRef}
//         contentEditable={isEditingMode}
//         suppressContentEditableWarning
//         style={{
//           width: "100%",
//           height: "100%",
//           fontSize,
//           color,
//           fontFamily,
//           fontWeight,
//           padding: "10px",
//           outline: "none",
//           whiteSpace: "pre",
//           overflowWrap: "normal",
//           wordBreak: "keep-all",
//           textAlign: "left",
//           boxSizing: "border-box",
//           userSelect: isEditingMode ? "text" : "none",
//           pointerEvents: "auto",
//           cursor: isEditingMode ? "text" : "move",
//         }}
//         onDoubleClick={(e) => {
//           e.stopPropagation();
//           setIsEditingMode(true);
//           setIsHovered(false); // Hide handles when editing starts
//           setGlobalIsEditing(true);
//           setTimeout(() => {
//             const range = document.createRange();
//             range.selectNodeContents(textBoxRef.current);
//             const sel = window.getSelection();
//             sel?.removeAllRanges();
//             sel?.addRange(range);
//           }, 0);
//         }}
//         onBlur={(e) => {
//           setIsEditingMode(false);
//           setGlobalIsEditing(false);
//           const html = e.currentTarget.innerHTML;
//           const newLines = html
//             .replace(/<div><br><\/div>/g, "\n")
//             .replace(/<div>/g, "\n")
//             .replace(/<\/div>/g, "")
//             .replace(/<br>/g, "\n")
//             .replace(/&nbsp;/g, " ")
//             .trim()
//             .split("\n");
//           onTextChange(newLines, "text");
//           if (!isRhyming && reflowMode) {
//             const paragraph = newLines.join(" ").replace(/\s+/g, " ").trim();
//             const maxTextWidth = Math.max(0, (localWidth ?? 0) - 20);
//             const wrapped = wrapText(paragraph, maxTextWidth);
//             onTextChange(wrapped, "text");
//           } else {
//             onTextChange(newLines, "text");
//           }

//           window.getSelection()?.removeAllRanges();
//           // Auto-resize after text change
//           setTimeout(() => adjustSizeToContent(), 10);
//         }}
//       >
//         {lines.join("\n")}
//       </div>
//     </Rnd>
//   );
// };

// //
// // EditPDFPage Component – Final Version
// //
// export default function EditPDFPage() {
//   const { bookId } = useParams();
//   const { user } = useAuth();
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();

//   const isMobile = useIsMobile();
//   const [orientation, setOrientation] = useState<"portrait" | "landscape">(
//     window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
//   );
//   const [book, setBook] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [jobId, setJobId] = useState<string>();
//   const prog = useJobProgress(jobId);
//   const [isEditing, setIsEditing] = useState(false);
//   const [availableWidth, setAvailableWidth] = useState(window.innerWidth);
//   const [currentScale, setCurrentScale] = useState(1);
//   const [currentSpreadIdx, setCurrentSpreadIdx] = useState(0);

//   // NEW: Track which individual images are loaded in the DOM
//   const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

//   // Decode-aware preloading (replaces loadedImageUrls/imagesReady logic)
//   const { readyUrls, allDecoded, ensureReady } = useImagePreloader(book);
//   // Optional: global overlay while waiting to switch spreads
//   const [navLoading, setNavLoading] = useState(false);

//   // Editing controls for selected text box
//   const [selectedPageIdx, setSelectedPageIdx] = useState(null);
//   const [currentPageIdx, setCurrentPageIdx] = useState(0);
//   const [editingFontSize, setEditingFontSize] = useState(DEFAULT_FONT_SIZE);
//   const [editingColor, setEditingColor] = useState("#000000");
//   const [editingFontFamily, setEditingFontFamily] =
//     useState(DEFAULT_FONT_FAMILY);

//   const [showShippingForm, setShowShippingForm] = useState(false);
//   const [orderCompleted, setOrderCompleted] = useState(false);
//   const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
//   const [isInteracting, setIsInteracting] = useState(false);
//   const [showSaveConfirm, setShowSaveConfirm] = useState(false);

//   // Track changes for save functionality - start as false, only enable on actual changes
//   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);

//   // Function to handle when an individual image loads
//   const handleImageLoad = (imageUrl: string) => {
//     setLoadedImages((prev) => {
//       if (prev.has(imageUrl)) return prev;
//       const next = new Set(prev);
//       next.add(imageUrl);
//       return next;
//     });
//   };

//   // Reset loaded images when navigating between spreads/pages
//   useEffect(() => {
//     setLoadedImages(new Set());
//   }, [currentSpreadIdx, currentPageIdx]);

//   useEffect(() => {
//     function handleResize() {
//       setAvailableWidth(window.innerWidth);
//     }
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   useEffect(() => {
//     const fn = () =>
//       setOrientation(
//         window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
//       );
//     window.addEventListener("resize", fn);
//     return () => window.removeEventListener("resize", fn);
//   }, []);

//   const singlePageMode = isMobile && orientation === "portrait";

//   const viewerRef = useRef<HTMLDivElement | null>(null);
//   const spreadRef = useRef<HTMLDivElement | null>(null);

//   // FIXED: Remove the problematic minWidth and calculate proper container width
//   const getContainerWidth = () => {
//     if (singlePageMode) {
//       return Math.min(availableWidth - 32, pageConfig.finalWidth); // 32px for padding
//     }
//     return Math.min(availableWidth - 64, pageConfig.idealMinContainerWidth);
//   };

//   const effectivePageWidth = singlePageMode
//     ? getContainerWidth()
//     : pageConfig.finalWidth;

//   const effectivePageHeight = pageConfig.finalHeight;

//   async function mark(phase: string, pct = 0, message = phase) {
//     await fetch(`/api/jobs/${jobId}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ phase, pct, message }),
//     });
//   }

//   function normalisePages(raw: any[]) {
//     return raw.map((p) => {
//       const rawLX = p.leftX ?? p.x ?? HALF_W / 2;
//       const rawLY = p.leftY ?? p.y ?? FULL_H / 2;
//       const rawRX = p.rightX ?? p.x ?? HALF_W / 2;
//       const rawRY = p.rightY ?? p.y ?? FULL_H / 2;

//       const { x: leftX, y: leftY } = normalize(rawLX, rawLY);
//       const { x: rightX, y: rightY } = normalize(rawRX, rawRY);

//       return {
//         ...p,
//         leftX,
//         leftY,
//         rightX,
//         rightY,
//         width: ((p.width ?? 400) / HALF_W) * pageConfig.finalWidth,
//         height: ((p.height ?? 100) / FULL_H) * pageConfig.finalHeight,
//         fontSize: p.fontSize ?? DEFAULT_FONT_SIZE,
//         color: p.color ?? "#000",
//         leftText: Array.isArray(p.leftText)
//           ? p.leftText
//           : (p.leftText ?? "").split("\n"),
//         rightText: Array.isArray(p.rightText)
//           ? p.rightText
//           : (p.rightText ?? "").split("\n"),
//       };
//     });
//   }

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         // ── book meta ─────────────────────────────────────────
//         const metaRes = await fetch(`/api/books/${bookId}`, {
//           credentials: "include",
//         });
//         if (!metaRes.ok) throw new Error("Failed to fetch book data");
//         const meta = await metaRes.json();

//         // ── launch split job ─────────────────────────────────
//         const splitRes = await fetch(`/api/books/${bookId}/prepareSplit`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ id: bookId, pages: meta.pages }),
//         });

//         // • As-a-Service (202)  → save jobId, stay in "loading"
//         if (splitRes.status === 202) {
//           const jid = splitRes.headers.get("X-Job-Id");
//           if (!cancelled && jid) setJobId(jid);
//           return; // wait for poller effect
//         }

//         // • Synchronous finish (200) → we already have pages
//         if (!splitRes.ok) throw new Error("prepareSplit failed");
//         const { pages } = await splitRes.json();
//         if (!cancelled) {
//           setBook({ ...meta, pages: normalisePages(pages) });
//           setLoading(false);
//         }
//       } catch (err: any) {
//         if (!cancelled) {
//           console.error(err);
//           toast({
//             title: "Error",
//             description: err.message,
//             variant: "destructive",
//           });
//           setLoading(false);
//         }
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [bookId, toast]);

//   /* --------------------------------------------------------- *
//    * 2) Completion – when poller hits "complete", refetch book *
//    * --------------------------------------------------------- */
//   useEffect(() => {
//     if (!jobId) return; // nothing to poll
//     if (prog?.phase !== "complete") return;

//     let cancelled = false;
//     (async () => {
//       try {
//         const res = await fetch(`/api/books/${bookId}`, {
//           credentials: "include",
//         });
//         if (!res.ok) throw new Error("Failed to fetch processed book");
//         const data = await res.json();
//         if (!cancelled) {
//           setBook({ ...data, pages: normalisePages(data.pages) });
//           setLoading(false);
//         }
//       } catch (err: any) {
//         if (!cancelled) {
//           console.error(err);
//           toast({
//             title: "Error",
//             description: err.message,
//             variant: "destructive",
//           });
//           setLoading(false);
//         }
//       }
//     })();

//     // clean-up
//     return () => {
//       cancelled = true;
//     };
//   }, [prog?.phase, jobId, bookId, toast]);

//   // This old effect is no longer needed - replaced by useImagePreloader hook

//   useEffect(() => {
//     const logWidths = () => {
//       const viewport = window.innerWidth;
//       const viewer = viewerRef.current?.getBoundingClientRect().width ?? 0;
//       const spread = spreadRef.current?.getBoundingClientRect().width ?? 0;
//       const scaled = spreadRef.current
//         ? ((
//             spreadRef.current.querySelector(
//               '[style*="transform: scale"]',
//             ) as HTMLElement
//           )?.offsetWidth ?? 0)
//         : 0;
//       // console.table({
//       //   viewport,
//       //   viewer_frame: viewer,
//       //   spreadContainer: spread,
//       //   scaledCanvas: scaled,
//       //   currentScale,
//       // });
//     };

//     logWidths();
//     window.addEventListener("resize", logWidths);
//     return () => window.removeEventListener("resize", logWidths);
//   }, [currentScale, singlePageMode]);

//   function buildFlipPages() {
//     if (!book) return [];

//     const coverUrl = book.cover?.final_cover_urls[0];
//     const backCoverUrl = book.cover?.back_cover_url;

//     const result = [];
//     if (coverUrl) {
//       result.push({
//         id: -1,
//         imageUrl: coverUrl,
//         content: [],
//         isCover: true,
//         side: "full",
//         x: 50,
//         y: 50,
//         fontSize: DEFAULT_FONT_SIZE,
//         color: "#ffffff",
//         fontFamily: DEFAULT_FONT_FAMILY,
//         fontWeight: DEFAULT_FONT_WEIGHT,
//       });
//     }
//     book.pages.forEach((p) => {
//       if (!p.isCover && !p.isBackCover) {
//         result.push({
//           id: p.scene_number * 1000,
//           side: "left",
//           imageUrl: p.expanded_scene_url,
//           content: p.leftText || [],
//           x: p.leftX ?? pageConfig.finalWidth / 2 - 100,
//           y: p.leftY ?? pageConfig.finalHeight / 2 - 25,
//           width: p.width,
//           height: p.height ?? 100,
//           fontSize: p.fontSize ?? DEFAULT_FONT_SIZE,
//           color: p.leftTextColor ?? "#000000",
//           fontFamily: p.leftFontFamily ?? DEFAULT_FONT_FAMILY,
//           fontWeight: p.leftFontWeight ?? DEFAULT_FONT_WEIGHT,
//         });
//         result.push({
//           id: p.scene_number * 1000 + 1,
//           side: "right",
//           imageUrl: p.expanded_scene_url,
//           content: p.rightText || [],
//           x: p.rightX ?? pageConfig.finalWidth / 2 - 100,
//           y: p.rightY ?? pageConfig.finalHeight / 2 - 25,
//           width: p.width,
//           height: p.height ?? 100,
//           fontSize: p.fontSize ?? DEFAULT_FONT_SIZE,
//           color: p.rightTextColor ?? "#000000",
//           fontFamily: p.rightFontFamily ?? DEFAULT_FONT_FAMILY,
//           fontWeight: p.rightFontWeight ?? DEFAULT_FONT_WEIGHT,
//         });
//       }
//     });
//     if (backCoverUrl) {
//       result.push({
//         id: -2,
//         imageUrl: backCoverUrl,
//         content: [],
//         isBackCover: true,
//         side: "left",
//         x: 50,
//         y: 50,
//         fontSize: DEFAULT_FONT_SIZE,
//         color: "#000000",
//         fontFamily: DEFAULT_FONT_FAMILY,
//         fontWeight: DEFAULT_FONT_WEIGHT,
//       });
//     }

//     return result;
//   }

//   function buildSpreads(pages) {
//     let spreads = [];
//     if (pages.length === 0) return spreads;
//     let idx = 0;
//     if (pages[0].isCover) {
//       spreads.push([pages[0]]);
//       idx = 1;
//     }

//     // Handle story pages (always in pairs of 2)
//     while (idx < pages.length - 1) {
//       spreads.push([pages[idx], pages[idx + 1]]);
//       idx += 2;
//     }

//     // Handle back cover (single page spread)
//     if (idx < pages.length && pages[idx].isBackCover) {
//       spreads.push([pages[idx]]);
//     }
//     return spreads;
//   }

//   const flipPages = buildFlipPages();
//   const spreads = buildSpreads(flipPages);

//   // Ensure currentSpreadIdx is valid when spreads change
//   useEffect(() => {
//     if (spreads.length > 0 && currentSpreadIdx >= spreads.length) {
//       setCurrentSpreadIdx(spreads.length - 1);
//     }
//   }, [spreads.length, currentSpreadIdx]);

//   // Debug logging
//   // console.log("📚 Book structure:", {
//   //   flipPagesCount: flipPages.length,
//   //   spreadsCount: spreads.length,
//   //   flipPages: flipPages.map((fp) => ({
//   //     id: fp.id,
//   //     isCover: fp.isCover,
//   //     isBackCover: fp.isBackCover,
//   //   })),
//   //   spreads: spreads.map((spread, idx) => ({
//   //     spreadIdx: idx,
//   //     pages: spread.map((p) => ({
//   //       id: p.id,
//   //       isCover: p.isCover,
//   //       isBackCover: p.isBackCover,
//   //     })),
//   //   })),
//   // });

//   // const next = () => {
//   //   if (singlePageMode) {
//   //     setCurrentPageIdx((i) => Math.min(i + 1, flipPages.length - 1));
//   //   } else {
//   //     setCurrentSpreadIdx((i) => {
//   //       const newIdx = Math.min(i + 1, spreads.length - 1);
//   //       console.log("🔄 Next navigation:", {
//   //         from: i,
//   //         to: newIdx,
//   //         spreadsLength: spreads.length,
//   //       });
//   //       return newIdx;
//   //     });
//   //   }
//   // };
//   // const prev = () => {
//   //   if (singlePageMode) {
//   //     setCurrentPageIdx((i) => Math.max(i - 1, 0));
//   //   } else {
//   //     setCurrentSpreadIdx((i) => {
//   //       const newIdx = Math.max(i - 1, 0);
//   //       console.log("🔄 Prev navigation:", {
//   //         from: i,
//   //         to: newIdx,
//   //         spreadsLength: spreads.length,
//   //       });
//   //       return newIdx;
//   //     });
//   //   }
//   // };

//   const goToSpreadIndex = async (newIdx: number) => {
//     const target = spreads[newIdx] ?? [];
//     const targetUrls = target.map((p: any) => p.imageUrl).filter(Boolean);
//     if (targetUrls.some((u: string) => !readyUrls.has(u))) {
//       setNavLoading(true);

//       await ensureReady(targetUrls);
//       setNavLoading(false);
//     }
//     setCurrentSpreadIdx(newIdx);
//   };

//   const goToPageIndex = async (newIdx: number) => {
//     const fp = flipPages[newIdx];
//     const targetUrl = fp?.imageUrl;
//     if (targetUrl && !readyUrls.has(targetUrl)) {
//       setNavLoading(true);

//       await ensureReady([targetUrl]);
//       setNavLoading(false);
//     }
//     setCurrentPageIdx(newIdx);
//   };

//   const next = () => {
//     if (singlePageMode) {
//       const ni = Math.min(currentPageIdx + 1, flipPages.length - 1);
//       if (ni !== currentPageIdx) void goToPageIndex(ni);
//     } else {
//       const ni = Math.min(currentSpreadIdx + 1, spreads.length - 1);
//       if (ni !== currentSpreadIdx) void goToSpreadIndex(ni);
//     }
//   };

//   const prev = () => {
//     if (singlePageMode) {
//       const ni = Math.max(currentPageIdx - 1, 0);
//       if (ni !== currentPageIdx) void goToPageIndex(ni);
//     } else {
//       const ni = Math.max(currentSpreadIdx - 1, 0);
//       if (ni !== currentSpreadIdx) void goToSpreadIndex(ni);
//     }
//   };

//   const swipeHandlers = useSwipeable({
//     onSwipedLeft: next,
//     onSwipedRight: prev,
//     disabled: !singlePageMode || isInteracting || isEditing,
//     trackMouse: true,
//   });

//   function updatePageLayout(fp, newLayout, cause = "drag") {
//     console.log("🔄 updatePageLayout called:", { fpId: fp.id, newLayout });
//     const origPageId = Math.floor(fp.id / 1000);
//     setBook((prev) => {
//       if (!prev) return prev;
//       const newPages = prev.pages.map((p) => {
//         if (p.scene_number === origPageId) {
//           if (fp.id % 1000 === 0) {
//             return {
//               ...p,
//               leftX: newLayout.x,
//               leftY: newLayout.y,
//               width: newLayout.width,
//               height: newLayout.height,
//             };
//           } else {
//             return {
//               ...p,
//               rightX: newLayout.x,
//               rightY: newLayout.y,
//               width: newLayout.width,
//               height: newLayout.height,
//             };
//           }
//         }
//         return p;
//       });
//       return { ...prev, pages: newPages };
//     });
//     // Mark as having unsaved changes
//     if (cause !== "auto") setHasUnsavedChanges(true);
//   }

//   function updatePageText(fp, newValue, cause = "text") {
//     const origPageId = Math.floor(fp.id / 1000);
//     setBook((prev) => {
//       if (!prev) return prev;
//       const newPages = prev.pages.map((p) => {
//         if (p.scene_number === origPageId) {
//           if (Array.isArray(newValue)) {
//             if (fp.id % 1000 === 0) {
//               return { ...p, leftText: newValue };
//             } else {
//               return { ...p, rightText: newValue };
//             }
//           } else {
//             return {
//               ...p,
//               leftText:
//                 newValue.left !== undefined ? newValue.left : p.leftText,
//               rightText:
//                 newValue.right !== undefined ? newValue.right : p.rightText,
//             };
//           }
//         }
//         return p;
//       });
//       return { ...prev, pages: newPages };
//     });
//     // Mark as having unsaved changes
//     if (cause !== "auto") setHasUnsavedChanges(true);
//   }

//   function handleSelectPage(pageIdx) {
//     if (isEditing) return;
//     setSelectedPageIdx(pageIdx);
//     if (!book) return;
//     let pageData;
//     book.pages.forEach((p) => {
//       if (p.isCover && pageIdx === -1) pageData = p;
//       if (p.isBackCover && pageIdx === -2) pageData = p;
//       if (
//         p.scene_number * 1000 === pageIdx ||
//         p.scene_number * 1000 + 1 === pageIdx
//       ) {
//         pageData = p;
//       }
//     });
//     if (pageData) {
//       setEditingFontSize(pageData.fontSize ?? DEFAULT_FONT_SIZE);
//       setEditingColor(pageData.color ?? "#000000");
//       setEditingFontFamily(pageData.fontFamily ?? DEFAULT_FONT_FAMILY);
//     }
//   }

//   function handleUpdateStyle(
//     fontSize: number,
//     color: string,
//     fontFamily: string,
//   ) {
//     if (!book) return;
//     const visibleIds = singlePageMode
//       ? [flipPages[currentPageIdx].id]
//       : spreads[currentSpreadIdx].map((p: any) => p.id);

//     setBook((prev: any) => {
//       if (!prev) return prev;
//       const updated = prev.pages.map((p: any) => {
//         const pageHits = [
//           p.isCover ? -1 : null,
//           p.isBackCover ? -2 : null,
//           p.scene_number * 1000,
//           p.scene_number * 1000 + 1,
//         ].filter(Boolean);

//         const shouldApply =
//           selectedPageIdx !== null
//             ? pageHits.includes(selectedPageIdx)
//             : pageHits.some((id) => visibleIds.includes(id as number));

//         if (!shouldApply) return p;

//         return {
//           ...p,
//           fontSize,
//           color,
//           leftTextColor: color,
//           rightTextColor: color,
//           fontFamily,
//           leftFontFamily: fontFamily,
//           rightFontFamily: fontFamily,
//         };
//       });
//       return { ...prev, pages: updated };
//     });
//     setHasUnsavedChanges(true);
//   }

//   // Color-only updater that applies to the currently visible page(s)
//   function handleUpdateColor(color: string) {
//     if (!book) return;
//     // Determine visible flip pages we want to affect
//     const targetFlipPages: Array<{ imageUrl: string; side: "left" | "right" }> =
//       [];
//     if (selectedPageIdx !== null) {
//       const fp = flipPages.find((f: any) => f.id === selectedPageIdx);
//       if (fp && (fp.side === "left" || fp.side === "right")) {
//         targetFlipPages.push({ imageUrl: fp.imageUrl, side: fp.side });
//       }
//     } else if (singlePageMode) {
//       const fp = flipPages[currentPageIdx];
//       if (fp && (fp.side === "left" || fp.side === "right")) {
//         targetFlipPages.push({ imageUrl: fp.imageUrl, side: fp.side });
//       }
//     } else {
//       (spreads[currentSpreadIdx] || []).forEach((fp: any) => {
//         if (fp.side === "left" || fp.side === "right") {
//           targetFlipPages.push({ imageUrl: fp.imageUrl, side: fp.side });
//         }
//       });
//     }

//     // console.log("🎯 handleUpdateColor targets (by url/side)", targetFlipPages);

//     setBook((prev: any) => {
//       if (!prev) return prev;
//       let updates = 0;
//       const updated = prev.pages.map((p: any) => {
//         const matchesAny = targetFlipPages.filter(
//           (t) => t.imageUrl === p.expanded_scene_url,
//         );
//         if (matchesAny.length === 0) return p;

//         // Copy fields and apply per-side updates based on matches
//         let next = { ...p } as any;
//         for (const m of matchesAny) {
//           if (m.side === "left") next.leftTextColor = color;
//           if (m.side === "right") next.rightTextColor = color;
//           next.color = color;
//           updates++;
//         }
//         return next;
//       });
//       // console.log("✅ handleUpdateColor applied updates:", updates);

//       // Mark as having unsaved changes if updates were made
//       if (updates > 0) {
//         setHasUnsavedChanges(true);
//       }

//       return { ...prev, pages: updated };
//     });
//   }

//   const handleColorClick = (hex: string) => {
//     setEditingColor(hex);
//     // console.log("🎨 Color click", {
//     //   hex,
//     //   singlePageMode,
//     //   currentSpreadIdx,
//     //   currentPageIdx,
//     // });
//     handleUpdateColor(hex);
//   };

//   // Helper function to scale coordinates back to original dimensions for storage
//   const scaleCoordinatesForSave = (x: number, y: number) => {
//     // The coordinates we get from the UI are in logical coordinates (LOGICAL_W x LOGICAL_H)
//     // But the backend expects raw coordinates (HALF_W x FULL_H for left side, or offset for right side)
//     //
//     // The normalize function converts: rawCoord -> logicalCoord
//     // We need to reverse it: logicalCoord -> rawCoord
//     //
//     // normalize function:
//     // x = (rawX / HALF_W) * pageConfig.finalWidth
//     // y = (rawY / FULL_H) * pageConfig.finalHeight
//     //
//     // So reverse transformation:
//     // rawX = (x / pageConfig.finalWidth) * HALF_W
//     // rawY = (y / pageConfig.finalHeight) * FULL_H

//     const rawX = Math.round((x / pageConfig.finalWidth) * HALF_W);
//     const rawY = Math.round((y / pageConfig.finalHeight) * FULL_H);

//     console.log("🔄 Coordinate transformation:", {
//       logical: { x, y },
//       raw: { x: rawX, y: rawY },
//       scaleFactor: {
//         x: HALF_W / pageConfig.finalWidth,
//         y: FULL_H / pageConfig.finalHeight,
//       },
//     });

//     return { x: rawX, y: rawY };
//   };

//   // Save changes function using existing PUT endpoint
//   const handleSaveChanges = async () => {
//     if (!book) return false;
//     if (!hasUnsavedChanges) return true;

//     setIsSaving(true);
//     try {
//       // Transform book data to match schema requirements
//       const transformedBook = {
//         ...book,
//         // imagesJobId can now be null per updated schema
//         // Transform pages to scale coordinates back to original dimensions
//         pages: book.pages?.map((page) => {
//           // Scale coordinates back to original dimensions
//           const scaledLeftCoords =
//             page.leftX !== undefined && page.leftY !== undefined
//               ? scaleCoordinatesForSave(page.leftX, page.leftY)
//               : { x: page.leftX, y: page.leftY };

//           const scaledRightCoords =
//             page.rightX !== undefined && page.rightY !== undefined
//               ? scaleCoordinatesForSave(page.rightX, page.rightY)
//               : { x: page.rightX, y: page.rightY };

//           const transformedPage = {
//             ...page,
//             // Update coordinates with scaled values - keep arrays as arrays
//             leftX: scaledLeftCoords.x,
//             leftY: scaledLeftCoords.y,
//             rightX: scaledRightCoords.x,
//             rightY: scaledRightCoords.y,
//             // Keep content, leftText, rightText as arrays - schema now supports both
//           };

//           // console.log(`📊 Page ${page.scene_number} transformed for save:`, {
//           //   original: {
//           //     leftX: page.leftX,
//           //     leftY: page.leftY,
//           //     rightX: page.rightX,
//           //     rightY: page.rightY,
//           //   },
//           //   scaled: {
//           //     leftX: scaledLeftCoords.x,
//           //     leftY: scaledLeftCoords.y,
//           //     rightX: scaledRightCoords.x,
//           //     rightY: scaledRightCoords.y,
//           //   },
//           // });

//           return transformedPage;
//         }),
//       };

//       // console.log("Original book data:", book);
//       // console.log("Saving transformed book data:", transformedBook);

//       const saveResp = await fetch(`/api/books/${bookId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(transformedBook),
//       });

//       if (!saveResp.ok) {
//         const errorData = await saveResp.json();
//         console.error("Save failed with error:", errorData);
//         throw new Error(
//           `Failed to save book changes: ${errorData.message || "Unknown error"}`,
//         );
//       }

//       // Reset the unsaved changes flag after successful save
//       setHasUnsavedChanges(false);

//       toast({
//         title: "Success",
//         description: "Book changes saved successfully.",
//       });
//       return true;
//     } catch (error: any) {
//       console.error("Save error:", error);
//       toast({
//         title: "Error",
//         description: `Failed to save book changes: ${error.message}`,
//         variant: "destructive",
//       });
//       return false;
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handlePrint = () => {
//     if (hasUnsavedChanges) setShowSaveConfirm(true);
//     else setShowShippingForm(true);
//   };

//   const handleShippingSubmit = async (formData) => {
//     try {
//       if (user) {
//         await apiRequest("POST", "/api/orders", {
//           ...formData,
//           bookId,
//           userId: user.uid,
//         });
//         setOrderCompleted(true);
//         setShowShippingForm(false);
//         toast({
//           title: "Order placed successfully!",
//           description: "Your book will be delivered soon.",
//         });
//       }
//     } catch (error) {
//       toast({
//         title: "Order failed",
//         description: "There was a problem placing your order.",
//         variant: "destructive",
//       });
//     }
//   };

//   async function handleSaveAndGeneratePDF() {
//     if (!book) return;
//     setIsGeneratingPdf(true);
//     const saveResp = await fetch(`/api/books/${bookId}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ ...book, pages: book.pages }),
//     });
//     if (!saveResp.ok) {
//       toast({
//         title: "Error",
//         description: "Failed to save book.",
//         variant: "destructive",
//       });
//       return;
//     }
//     const generateResp = await fetch("/api/pdf/generate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         title: book.title,
//         pages: book.pages,
//         coverUrl: book.coverUrl,
//         backCoverUrl: book.backCoverUrl,
//       }),
//     });
//     if (!generateResp.ok) {
//       toast({
//         title: "Error",
//         description: "Failed to generate PDF",
//         variant: "destructive",
//       });
//       return;
//     }
//     const pdfBlob = await generateResp.blob();
//     const url = URL.createObjectURL(pdfBlob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `${book.title}.pdf`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     URL.revokeObjectURL(url);
//     toast({ title: "Success", description: "PDF downloaded." });
//     setIsGeneratingPdf(false);
//     setLocation(`/book/${bookId}`);
//   }

//   function goToNextSpread() {
//     if (currentSpreadIdx < spreads.length - 1)
//       setCurrentSpreadIdx(currentSpreadIdx + 1);
//   }
//   function goToPrevSpread() {
//     if (currentSpreadIdx > 0) setCurrentSpreadIdx(currentSpreadIdx - 1);
//   }

//   const pagesToRender = singlePageMode
//     ? flipPages[currentPageIdx]
//       ? [flipPages[currentPageIdx]]
//       : []
//     : (spreads[currentSpreadIdx] ?? []);

//   // Debug spread selection
//   // console.log("📖 Spread selection:", {
//   //   currentSpreadIdx,
//   //   spreadsLength: spreads.length,
//   //   selectedSpread: spreads[currentSpreadIdx]?.map((p) => ({
//   //     id: p.id,
//   //     isCover: p.isCover,
//   //     isBackCover: p.isBackCover,
//   //   })),
//   //   pagesToRenderCount: pagesToRender.length,
//   // });

//   // Debug current spread
//   // console.log("🎯 Current spread:", {
//   //   currentSpreadIdx,
//   //   spreadsLength: spreads.length,
//   //   singlePageMode,
//   //   currentPageIdx,
//   //   pagesToRenderCount: pagesToRender.length,
//   //   pagesToRender: pagesToRender.map((p) => ({
//   //     id: p.id,
//   //     isCover: p.isCover,
//   //     isBackCover: p.isBackCover,
//   //   })),
//   //   isValidIndex: currentSpreadIdx < spreads.length,
//   // });

//   const spreadPx =
//     pagesToRender.length === 1
//       ? pageConfig.finalWidth
//       : pageConfig.finalWidth * 2 + 32;

//   // Debug container width calculation
//   // console.log("📏 Container width:", {
//   //   pagesToRenderLength: pagesToRender.length,
//   //   spreadPx,
//   //   pageConfigFinalWidth: pageConfig.finalWidth,
//   //   calculatedWidth:
//   //     pagesToRender.length * pageConfig.finalWidth +
//   //     (pagesToRender.length > 1 ? 32 : 0),
//   // });

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       <Header />
//       <main className="flex-grow mx-auto px-4 py-8 w-full max-w-full overflow-hidden">
//         <h1 className="text-2xl font-bold mb-4 text-center">
//           {" "}
//           {book ? book.title : ""}
//         </h1>

//         {loading || !allDecoded ? (
//           // ← show while loading and while preloading images
//           <div className="flex items-center justify-center py-20 px-4">
//             {jobId && prog ? (
//               <div className="w-full max-w-screen-lg">
//                 <ProgressDisplay
//                   prog={{
//                     ...prog,
//                     message:
//                       prog.phase === "splitting"
//                         ? "Editing PDF: preparing pages…"
//                         : prog.phase === "generating"
//                           ? "Editing PDF: laying out each page…"
//                           : "Preparing images…",
//                   }}
//                   className="w-full"
//                 />
//               </div>
//             ) : (
//               <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-imaginory-yellow" />
//             )}
//           </div>
//         ) : (
//           <>
//             <div
//               ref={viewerRef}
//               className="flex justify-center bg-white p-4 shadow-lg rounded relative mx-auto overflow-hidden"
//               style={{
//                 maxWidth: "100%",
//                 width: singlePageMode
//                   ? "100%"
//                   : pagesToRender.length * pageConfig.finalWidth +
//                     (pagesToRender.length > 1 ? 32 : 0),
//               }}
//               {...swipeHandlers}
//             >
//               <div
//                 id="spreadContainer"
//                 ref={spreadRef}
//                 className="relative flex justify-center"
//                 style={{
//                   width: singlePageMode
//                     ? "100%"
//                     : pagesToRender.length * pageConfig.finalWidth +
//                       (pagesToRender.length > 1 ? 32 : 0),
//                   height: singlePageMode ? "auto" : pageConfig.finalHeight,
//                   maxWidth: "100%",
//                   overflow: "hidden", // Add this
//                   position: "relative",
//                 }}
//               >
//                 {/* Global navigation loading overlay */}
//                 {navLoading && (
//                   <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90">
//                     <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-imaginory-yellow"></div>
//                   </div>
//                 )}
//                 <div className="flex gap-0.5 justify-center w-full">
//                   {pagesToRender.map((fp) => {
//                     const isPreloaded = readyUrls.has(fp.imageUrl);
//                     const isImageLoaded = loadedImages.has(fp.imageUrl);
//                     const isFullyReady = isPreloaded && isImageLoaded;

//                     // ── Log 4: show every frame's key props before rendering
//                     // console.log("🖼️ Render FP", {
//                     //   id: fp.id,
//                     //   x: fp.x,
//                     //   y: fp.y,
//                     //   width: fp.width,
//                     //   height: fp.height,
//                     //   scale: currentScale,
//                     //   isPreloaded,
//                     //   isImageLoaded,
//                     //   isFullyReady,
//                     // });

//                     // Resolve latest color from book state to reflect immediate updates
//                     let resolvedColor = fp.color ?? "#000000";
//                     if (book && typeof fp.id === "number" && fp.id >= 0) {
//                       const originalId = Math.floor(fp.id / 1000);
//                       const isLeft = fp.id % 1000 === 0;
//                       const page = book.pages?.find(
//                         (p: any) => p.scene_number === originalId,
//                       );
//                       if (page) {
//                         resolvedColor = isLeft
//                           ? (page.leftTextColor ?? resolvedColor)
//                           : (page.rightTextColor ?? resolvedColor);
//                       }
//                     }
//                     // console.log(
//                     //   "🖍️ Resolved color for FP",
//                     //   fp.id,
//                     //   resolvedColor,
//                     // );

//                     return (
//                       <div
//                         key={fp.id}
//                         className="relative bg-white overflow-hidden flex-shrink-0"
//                         style={{
//                           width: singlePageMode
//                             ? "100%"
//                             : pageConfig.finalWidth,
//                           height: singlePageMode
//                             ? pageConfig.finalHeight / 2
//                             : pageConfig.finalHeight,
//                           maxWidth: singlePageMode
//                             ? "100%"
//                             : pageConfig.finalWidth,
//                         }}
//                         onClick={(e) => {
//                           if (isEditing) return;
//                           if (e.currentTarget.querySelector(":focus-within"))
//                             return;
//                           handleSelectPage(fp.id);
//                         }}
//                       >
//                         <ScalablePreview onScaleChange={setCurrentScale}>
//                           {/* {console.log(
//                             "🎨 Image slice",
//                             fp.id,
//                             fp.side,
//                             fp.side ?? (fp.id % 2 ? "right" : "left"),
//                           )} */}

//                           {/* Always show spinner until image is fully ready */}
//                           {!isFullyReady && (
//                             <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
//                               <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-imaginory-yellow"></div>
//                             </div>
//                           )}

//                           {/* Image - render as soon as preloaded, but may still be loading visually */}
//                           {isPreloaded && (
//                             <PageImage
//                               url={fp.imageUrl}
//                               side={fp.side ?? (fp.id % 2 ? "right" : "left")}
//                               isLoaded={isImageLoaded}
//                               onLoad={() => handleImageLoad(fp.imageUrl)}
//                             />
//                           )}

//                           {/* Text box - only show after image is completely loaded */}
//                           {isFullyReady && (
//                             <ResizableTextBox
//                               x={fp.x ?? 50}
//                               y={fp.y ?? 50}
//                               width={0}
//                               height={0}
//                               fontSize={fp.fontSize ?? DEFAULT_FONT_SIZE}
//                               color={resolvedColor}
//                               fontFamily={fp.fontFamily ?? DEFAULT_FONT_FAMILY}
//                               fontWeight={fp.fontWeight ?? DEFAULT_FONT_WEIGHT}
//                               lines={fp.content}
//                               scale={currentScale}
//                               initialSide={
//                                 fp.id % 1000 === 0 ? "left" : "right"
//                               }
//                               onUpdate={(newLayout) =>
//                                 updatePageLayout(fp, newLayout)
//                               }
//                               onTextChange={(newValue) =>
//                                 updatePageText(fp, newValue)
//                               }
//                               setGlobalIsEditing={setIsEditing}
//                               isRhyming={!!book?.isStoryRhyming}
//                               setGlobalIsInteracting={setIsInteracting}
//                             />
//                           )}
//                         </ScalablePreview>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//               {/* Arrow buttons */}
//               <button
//                 onClick={prev}
//                 disabled={
//                   singlePageMode ? currentPageIdx === 0 : currentSpreadIdx === 0
//                 }
//                 className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow disabled:opacity-40 z-10"
//               >
//                 ◀
//               </button>
//               <button
//                 onClick={next}
//                 disabled={
//                   singlePageMode
//                     ? currentPageIdx === flipPages.length - 1
//                     : currentSpreadIdx === spreads.length - 1
//                 }
//                 className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow disabled:opacity-40 z-10"
//               >
//                 ▶
//               </button>
//             </div>

//             {/* Controls */}
//             {singlePageMode ? (
//               /* FIXED BOTTOM SHEET for mobile */
//               <div
//                 className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50"
//                 style={{
//                   paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
//                   paddingLeft: "16px",
//                   paddingRight: "16px",
//                   paddingTop: "16px",
//                   maxHeight: "200vh",
//                   minHeight: "180px",
//                   overflow: "visible",
//                 }}
//               >
//                 <div className="w-full flex items-center justify-center gap-4">
//                   <span className="text-sm font-medium">Text color:</span>
//                   <Button
//                     variant={editingColor === "#000000" ? "default" : "outline"}
//                     className="px-4"
//                     onClick={() => handleColorClick("#000000")}
//                   >
//                     Black
//                   </Button>
//                   <Button
//                     variant={editingColor === "#ffffff" ? "default" : "outline"}
//                     className="px-4"
//                     onClick={() => handleColorClick("#ffffff")}
//                   >
//                     White
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               /* ORIGINAL inline controls for desktop */
//               <div
//                 className="mt-6 flex items-center justify-center space-x-8 mx-auto"
//                 style={{ width: `${spreadPx}px`, maxWidth: "100%" }}
//               >
//                 <div className="flex items-center gap-3">
//                   <span className="font-medium">Text color:</span>
//                   <Button
//                     variant={editingColor === "#000000" ? "default" : "outline"}
//                     onClick={() => handleColorClick("#000000")}
//                   >
//                     Black
//                   </Button>
//                   <Button
//                     variant={editingColor === "#ffffff" ? "default" : "outline"}
//                     onClick={() => handleColorClick("#ffffff")}
//                   >
//                     White
//                   </Button>
//                 </div>

//                 <Button onClick={prev} disabled={currentSpreadIdx === 0}>
//                   {"<<"}
//                 </Button>
//                 <Button
//                   onClick={next}
//                   disabled={currentSpreadIdx === spreads.length - 1}
//                 >
//                   {">>"}
//                 </Button>
//               </div>
//             )}

//             {/* Save Changes & Print Buttons - Yellow themed and mobile optimized */}
//             <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-6 md:mt-12">
//               {/* Save Changes Button */}
//               <Button
//                 variant={hasUnsavedChanges ? "default" : "outline"}
//                 size="lg"
//                 className={`w-full md:w-auto flex items-center justify-center shadow-lg font-semibold ${
//                   hasUnsavedChanges
//                     ? "bg-imaginory-yellow hover:bg-imaginory-yellow text-imaginory-black border-2 border-imaginory-yellow"
//                     : "bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed"
//                 }`}
//                 onClick={handleSaveChanges}
//                 disabled={!hasUnsavedChanges || isSaving}
//               >
//                 {isSaving ? (
//                   <>
//                     <i className="fas fa-spinner mr-2 animate-spin"></i>
//                     <span>Saving...</span>
//                   </>
//                 ) : (
//                   <>
//                     <i className="fas fa-save mr-2"></i>
//                     <span>Save Changes</span>
//                   </>
//                 )}
//               </Button>

//               {/* <Button
//                 variant="default"
//                 size="lg"
//                 className="w-full md:w-auto flex items-center justify-center bg-imaginory-yellow hover:bg-imaginory-yellow/90 text-imaginory-black shadow-lg font-semibold"
//                 onClick={handleSaveAndGeneratePDF}
//                 disabled={isGeneratingPdf}
//               >
//                 {isGeneratingPdf ? (
//                   <>
//                     <i className="fas fa-spinner mr-2 animate-spin"></i>
//                     <span>Compiling PDF...</span>
//                   </>
//                 ) : (
//                   <>
//                     <i className="fas fa-download mr-2"></i>
//                     <span>Download PDF</span>
//                   </>
//                 )}
//               </Button> */}

//               <Button
//                 variant="outline"
//                 size="lg"
//                 className="w-full md:w-auto flex items-center justify-center bg-imaginory-yellow border-2 border-imaginory-yellow text-imaginory-black hover:bg-imaginory-yellow/90"
//                 onClick={handlePrint}
//               >
//                 <i className="fas fa-print mr-2"></i>
//                 <span>Print & Ship</span>
//               </Button>
//             </div>

//             {showSaveConfirm && (
//               <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
//                 <div className="bg-white rounded-xl shadow-2xl w-[min(92vw,420px)] p-6">
//                   <h3 className="text-lg font-semibold">
//                     Save changes before printing?
//                   </h3>
//                   <p className="text-sm text-gray-600 mt-2">
//                     You have unsaved edits. Would you like to save them first?
//                   </p>

//                   <div className="mt-6 flex gap-3 justify-end">
//                     <Button
//                       variant="outline"
//                       disabled={isSaving}
//                       onClick={() => {
//                         setShowSaveConfirm(false);
//                         setShowShippingForm(true); // continue without saving
//                       }}
//                     >
//                       No, continue
//                     </Button>
//                     <Button
//                       disabled={isSaving}
//                       onClick={async () => {
//                         const ok = await handleSaveChanges();
//                         if (ok) {
//                           setShowSaveConfirm(false);
//                           setShowShippingForm(true);
//                         }
//                       }}
//                     >
//                       {isSaving ? "Saving…" : "Yes, save & continue"}
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* ==========  PRINT & SHIP dialog ========== */}
//             <Dialog open={showShippingForm} onOpenChange={setShowShippingForm}>
//               {/* trigger is *already* your Print button; keep it as-is */}
//               <DialogContent
//                 className="max-w-screen-sm max-h-[90vh] overflow-y-auto"   // make form scroll inside modal
//               >
//                 <DialogHeader>
//                   <DialogTitle>Shipping information</DialogTitle>
//                 </DialogHeader>

//                 {/*  A. show either the form or the success message  */}
//                 {orderCompleted ? (
//                   <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg">
//                     <i className="fas fa-check-circle mr-2 text-xl" />
//                     Order successfully placed! Your book will be delivered soon.
//                   </div>
//                 ) : (
//                   <ShippingForm onSubmit={handleShippingSubmit} />
//                 )}

//                 {/*  B. extra footer buttons if you need them  */}
//                 {!orderCompleted && (
//                   <DialogFooter>
//                     <DialogClose asChild>
//                       <button className="text-sm underline text-gray-500">Cancel</button>
//                     </DialogClose>
//                   </DialogFooter>
//                 )}
//               </DialogContent>
//             </Dialog>

//           </>
//         )}
//       </main>
//       <Footer />
//     </div>
//   );
// }

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Rnd } from "react-rnd";
import { useSwipeable } from "react-swipeable";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShippingForm } from "@/components/preview/ShippingForm";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProgressDisplay } from "@/components/ui/progress-display";
import { useJobProgress } from "@/hooks/use-job-progress";
// EditPDFPage.tsx (top of the file, with your other shadcn imports)
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const FULL_W = 2048;
const FULL_H = 1024;
const HALF_W = FULL_W / 2;
const LOGICAL_W = 600;
const LOGICAL_H = Math.round((FULL_H * LOGICAL_W) / HALF_W);
const DEFAULT_FONT_SIZE = 22;
const DEFAULT_FONT_FAMILY = "Cormorant Garamond";
const DEFAULT_FONT_WEIGHT = 700;

const INTRO_LEFT_ID = -100; // new blank page after cover (left)
const INTRO_RIGHT_ID = -101; // new message page after cover (right)

// Configuration for the pages:
const MOBILE_BREAKPOINT = 768;
const pageConfig = {
  finalWidth: LOGICAL_W,
  finalHeight: LOGICAL_H,
  idealMinContainerWidth: 2 * LOGICAL_W + 32,
};

const DEFAULT_MESSAGE_LAYOUT = {
  x: pageConfig.finalWidth/2 - 20,
  y: pageConfig.finalHeight/2 - 20 ,
  width: pageConfig.finalWidth - 50, // leave a nice margin inside the border
  height: pageConfig.finalHeight - 192,
};

function normalize(rawX: number, rawY: number) {
  return {
    x: (rawX / HALF_W) * pageConfig.finalWidth,
    y: (rawY / FULL_H) * pageConfig.finalHeight,
  };
}
// ---- decode-aware preloader for all page/cover images ----
function useImagePreloader(book: any) {
  const [readyUrls, setReadyUrls] = React.useState<Set<string>>(new Set());
  const [allDecoded, setAllDecoded] = React.useState(false);
  const decodeCache = React.useRef<Record<string, Promise<void>>>({});

  // helper to register a url into cache (decode promise)
  const prime = React.useCallback((url: string) => {
    if (!url) return;
    if (!decodeCache.current[url]) {
      const img = new Image();
      // Optional: drop this if your images are same-origin; keeps browsers happy with caches
      img.crossOrigin = "anonymous";
      img.src = url;

      // Prefer decode() for "ready-to-paint"; fallback to onload for older engines
      const p =
        typeof img.decode === "function"
          ? img.decode().catch(() => void 0) // don't block on decode errors
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // don't block on errors
            });

      decodeCache.current[url] = p.then(() => {
        setReadyUrls((prev) => {
          if (prev.has(url)) return prev;
          const next = new Set(prev);
          next.add(url);
          return next;
        });
      });
    } else {
      // already primed; still mark as ready when it resolves
      decodeCache.current[url].then(() =>
        setReadyUrls((prev) => {
          if (prev.has(url)) return prev;
          const next = new Set(prev);
          next.add(url);
          return next;
        }),
      );
    }
  }, []);

  // collect all unique urls from the book and pre-decode them
  useEffect(() => {
    if (!book) return;

    const urls = new Set<string>();
    const coverUrls: string[] = book.cover?.final_cover_urls || [];
    coverUrls.forEach((u) => u && urls.add(u));
    book.pages?.forEach((p: any) => {
      if (p?.expanded_scene_url) urls.add(p.expanded_scene_url);
    });
    if (book.cover?.back_cover_url) urls.add(book.cover.back_cover_url);

    if (urls.size === 0) {
      setAllDecoded(true);
      return;
    }

    const allPromises: Promise<void>[] = [];
    urls.forEach((u) => {
      prime(u);
      if (decodeCache.current[u]) allPromises.push(decodeCache.current[u]);
    });

    let cancelled = false;
    Promise.all(allPromises).then(() => !cancelled && setAllDecoded(true));
    return () => {
      cancelled = true;
    };
  }, [book, prime]);

  // allow the caller to await specific urls
  const ensureReady = React.useCallback(
    async (urls: string[]) => {
      const unique = Array.from(new Set(urls.filter(Boolean)));
      const promises = unique.map((u) => {
        prime(u);
        return decodeCache.current[u] ?? Promise.resolve();
      });
      await Promise.all(promises);
    },
    [prime],
  );

  return { readyUrls, allDecoded, ensureReady };
}

function PageImage({
  url,
  side,
  onLoad,
  isLoaded,
}: {
  url: string;
  side: "left" | "right" | "full";
  onLoad?: () => void;
  isLoaded?: boolean;
}) {
  const opacity = isLoaded ? 1 : 0;
  if (side === "full") {
    // cover: fill the whole canvas
    return (
      <img
        src={url}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity, transition: "opacity 150ms ease" }}
        onLoad={onLoad}
      />
    );
  }

  // split-cropping for story pages
  return (
    <img
      src={url}
      alt=""
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover"
      style={{
        objectPosition: side === "left" ? "left center" : "right center",
        opacity,
        transition: "opacity 150ms ease",
      }}
      onLoad={onLoad}
    />
  );
}

//
// ScalablePreview Component (unchanged)
//
function ScalablePreview({ children, onScaleChange }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const available = containerRef.current.getBoundingClientRect().width;
        const scaleFactor = Math.min(1, available / pageConfig.finalWidth);
        // console.log("🎯 ScalablePreview:", {
        //   available,
        //   scaleFactor,
        //   finalWidth: pageConfig.finalWidth,
        // });
        setScale(scaleFactor);
        if (onScaleChange) onScaleChange(scaleFactor);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onScaleChange]);
  return (
    <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
      <div
        style={{
          width: `${pageConfig.finalWidth}px`,
          height: `${pageConfig.finalHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

//
// ResizableTextBox Component – Final Version
//
const ResizableTextBox = ({
  x,
  y,
  width,
  height,
  fontSize,
  color,
  fontFamily,
  fontWeight,
  lines,
  scale,
  onUpdate,
  onTextChange,
  setGlobalIsEditing,
  initialSide,
  isRhyming,
  setGlobalIsInteracting,
  alwaysShowBorderWhenEmpty = false,
}) => {
  // Maintain local (internal) position state.
  const [localX, setLocalX] = useState(x);
  const [localY, setLocalY] = useState(y);
  // Maintain local (internal) size state to keep resized dimensions after stop.
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);
  // Track which page the box is on
  const [currentSide, setCurrentSide] = useState(initialSide);
  // Track editing mode for styling.
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textBoxRef = useRef(null);
  const measureRef = useRef(null);
  type UpdateCause = "auto" | "drag" | "resize" | "text";
  const didBootstrapRef = useRef(false);
  const [reflowMode, setReflowMode] = useState(false);
  const measureCanvasRef = useRef(null);
  const [operationInProgress, setOperationInProgress] = useState(false);

  const isEmpty = !lines || lines.join("").trim() === "";

  if (!measureCanvasRef.current) {
    measureCanvasRef.current = document.createElement("canvas");
  }

  const wrapText = useCallback(
    (text, maxWidthPx) => {
      const ctx = measureCanvasRef.current.getContext("2d");
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const words = text.split(/\s+/).filter(Boolean);
      const out = [];
      let line = "";

      const measure = (s) => ctx.measureText(s).width;

      const breakLongWord = (w) => {
        const chars = [...w];
        let chunk = "",
          parts = [];
        for (const ch of chars) {
          const test = chunk + ch;
          if (measure(test) <= maxWidthPx) {
            chunk = test;
          } else {
            if (chunk) parts.push(chunk);
            chunk = ch;
          }
        }
        if (chunk) parts.push(chunk);
        return parts;
      };

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const candidate = line ? line + " " + w : w;
        if (measure(candidate) <= maxWidthPx) {
          line = candidate;
        } else {
          if (!line) {
            const pieces = breakLongWord(w);
            if (pieces.length) {
              out.push(pieces[0]);
              for (let j = 1; j < pieces.length; j++) out.push(pieces[j]);
              line = "";
            }
          } else {
            out.push(line);
            if (measure(w) <= maxWidthPx) {
              line = w;
            } else {
              const pieces = breakLongWord(w);
              out.push(...pieces.slice(0, pieces.length - 1));
              line = pieces[pieces.length - 1] || "";
            }
          }
        }
      }
      if (line) out.push(line);
      return out.length ? out : [""];
    },
    [fontFamily, fontSize, fontWeight],
  );

  // Auto-resize to fit content
  const adjustSizeToContent = useCallback(() => {
    if (
      !textBoxRef.current ||
      isEditingMode ||
      reflowMode ||
      operationInProgress
    )
      return;

    // Create a temporary element to measure text dimensions
    const temp = document.createElement("div");
    temp.style.position = "absolute";
    temp.style.visibility = "hidden";
    temp.style.whiteSpace = "pre";
    temp.style.fontSize = fontSize + "px";
    temp.style.fontFamily = fontFamily;
    temp.style.fontWeight = fontWeight;
    temp.style.padding = "10px";
    temp.style.boxSizing = "border-box";
    temp.style.width = "auto";
    temp.style.height = "auto";
    temp.style.maxWidth = "400px"; // Reasonable max width
    temp.textContent = lines.join("\n") || " "; // Ensure at least some content

    document.body.appendChild(temp);

    const contentWidth = Math.max(temp.scrollWidth, 100); // Minimum width
    const contentHeight = Math.max(temp.scrollHeight, 40); // Minimum height

    document.body.removeChild(temp);

    // Only update if size changed significantly
    const threshold = 5;
    if (
      Math.abs(contentWidth - localWidth) > threshold ||
      Math.abs(contentHeight - localHeight) > threshold
    ) {
      setLocalWidth(contentWidth);
      setLocalHeight(contentHeight);
      if (didBootstrapRef.current) {
        onUpdate(
          {
            x: localX,
            y: localY,
            width: contentWidth,
            height: contentHeight,
            side: currentSide,
          },
          "auto",
        );
      }
    }
  }, [
    fontSize,
    fontFamily,
    fontWeight,
    lines,
    localX,
    localY,
    localWidth,
    localHeight,
    currentSide,
    onUpdate,
    isEditingMode,
    reflowMode,
    operationInProgress,
  ]);

  const reflowText = useCallback(
    (newWidth) => {
      if (isEditingMode || isRhyming || !lines.length) return;

      console.log("🔄 Starting text reflow:", {
        newWidth,
        currentLines: lines.length,
      });

      setReflowMode(true);

      // Join all text into a single paragraph
      const paragraph = lines.join(" ").replace(/\s+/g, " ").trim();

      // Calculate available text width (subtract padding)
      const maxTextWidth = Math.max(50, newWidth - 20); // 10px padding each side, min 50px

      // Wrap the text to fit the new width
      const wrappedLines = wrapText(paragraph, maxTextWidth);

      // console.log("🔄 Text reflow result:", {
      //   originalLines: lines.length,
      //   newLines: wrappedLines.length,
      //   maxTextWidth,
      //   paragraph: paragraph.substring(0, 50) + "..."
      // });

      // Only update if the lines actually changed
      if (wrappedLines.join("\n") !== lines.join("\n")) {
        onTextChange(wrappedLines, "text");
      }

      // Reset reflow mode after a short delay
      setTimeout(() => setReflowMode(false), 100);
    },
    [lines, wrapText, onTextChange, isEditingMode, isRhyming],
  );

  // Sync internal position and size if parent's values change.
  useEffect(() => {
    setLocalX(x);
    setLocalY(y);
    setLocalWidth(width);
    setLocalHeight(height);
    setCurrentSide(initialSide);
  }, [x, y, width, height, initialSide]);

  // Auto-resize when content changes
  useEffect(() => {
    adjustSizeToContent();
  }, [adjustSizeToContent]);

  useEffect(() => {
    const id = Math.random().toString(36).slice(2, 7);
    setTimeout(() => {
      const box = textBoxRef.current?.closest(".rnd");
      if (box) {
        const r = box.getBoundingClientRect();
        // console.log(`📦 Box[${id}] mount`, {
        //   initX: x,
        //   initY: y,
        //   scaledX: r.left,
        //   scaledY: r.top,
        //   scale,
        // });
      }
    }, 0);
  }, []);

  return (
    <Rnd
      scale={scale}
      bounds="parent"
      enableUserSelectHack={false}
      disableDragging={isEditingMode}
      size={{ width: localWidth, height: localHeight }}
      position={{ x: localX, y: localY }}
      onDragStart={() => {
        setIsDragging(true);
        setIsHovered(true); // Hide handles during drag

        setOperationInProgress(true);
      }}
      onDrag={(e, d) => {
        const newX = d.x;
        const newY = d.y;

        // If on the left page and newX meets or exceeds the page's width,
        // commit the position to the right page.
        if (currentSide === "left" && newX >= pageConfig.finalWidth) {
          const excess = newX - pageConfig.finalWidth;
          setCurrentSide("right");
          onTextChange({ left: [], right: lines });
          setLocalX(excess);
          setLocalY(newY);
          onUpdate({
            x: excess,
            y: newY,
            width: localWidth,
            height: localHeight,
            side: "right",
          });
          return;
        }
        // If on the right page and newX becomes negative, commit the position to the left page.
        if (currentSide === "right" && newX < 0) {
          const excess = newX; // negative
          const newXForLeft = pageConfig.finalWidth + excess;
          setCurrentSide("left");
          onTextChange({ left: lines, right: [] });
          setLocalX(newXForLeft);
          setLocalY(newY);
          onUpdate({
            x: newXForLeft,
            y: newY,
            width: localWidth,
            height: localHeight,
            side: "left",
          });
          return;
        }
        // Otherwise update the position normally.
        setLocalX(newX);
        setLocalY(newY);
        onUpdate({
          x: newX,
          y: newY,
          width: localWidth,
          height: localHeight,
          side: currentSide,
        });
      }}
      onDragStop={(e, d) => {
        setTimeout(() => {
          const finalX = d.x;
          const finalY = d.y;
          setLocalX(finalX);
          setLocalY(finalY);
          setIsDragging(false); // Reset dragging state
          onUpdate(
            {
              x: finalX,
              y: finalY,
              width: localWidth,
              height: localHeight,
              side: currentSide,
            },
            "drag",
          );
          setOperationInProgress(false);

          console.log("📦 Box drag/resize", {
            side: currentSide,
            x: localX,
            y: localY,
            scale,
          });
        }, 0);
      }}
      onResizeStart={() => {
        setIsDragging(true);
        setIsHovered(true); // Hide handles during resize
        setOperationInProgress(true);
      }}
      onResize={(e, direction, ref, delta, position) => {
        // Live-update size while resizing for smoother UX
        const newW = ref.offsetWidth;
        const newH = ref.offsetHeight;
        setLocalWidth(newW);
        setLocalHeight(newH);
        const updatedX = position.x;
        const updatedY = position.y;
        setLocalX(updatedX);
        setLocalY(updatedY);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setTimeout(() => {
          const updatedX = position.x;
          const updatedY = position.y;
          const newW = ref.offsetWidth;
          const newH = ref.offsetHeight;
          setLocalX(updatedX);
          setLocalY(updatedY);
          setLocalWidth(newW);
          setLocalHeight(newH);
          setIsDragging(false); // Reset dragging state

          onUpdate(
            {
              x: updatedX,
              y: updatedY,
              width: newW,
              height: newH,
              side: currentSide,
            },
            "resize",
          );

          if (lines.length > 0) {
            setTimeout(() => {
              reflowText(newW);
            }, 50); // Small delay to ensure state is updated
          }

          setOperationInProgress(false);

          console.log("📦 Box drag/resize", {
            side: currentSide,
            x: localX,
            y: localY,
            scale,
          });
        }, 0);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => {
        if (!isDragging) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isDragging) {
          setIsHovered(false);
        }
      }}
      style={{
        border: isEditingMode
          ? "2px solid #3b82f6"
          : isEmpty && alwaysShowBorderWhenEmpty
            ? "1px dashed #000"
            : isHovered
              ? `2px solid ${color === "#ffffff" || color === "white" ? "#000000" : "#000000"}`
              : "2px solid transparent",
        cursor: isEditingMode ? "text" : "move",
        background: "transparent",
        boxSizing: "border-box",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Custom resize handles */}
      {(isHovered || isEditingMode) &&
        !isDragging &&
        lines.join("").trim() !== "" && (
          <>
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize" />

            {/* Edge handles */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-n-resize" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-s-resize" />
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize" />
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize" />
          </>
        )}
      <div
        ref={textBoxRef}
        contentEditable={isEditingMode}
        suppressContentEditableWarning
        style={{
          width: "100%",
          height: "100%",
          fontSize,
          color,
          fontFamily,
          fontWeight,
          padding: "10px",
          outline: "none",
          whiteSpace: "pre",
          overflowWrap: "normal",
          wordBreak: "keep-all",
          textAlign: "left",
          boxSizing: "border-box",
          userSelect: isEditingMode ? "text" : "none",
          pointerEvents: "auto",
          cursor: isEditingMode ? "text" : "move",
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditingMode(true);
          setIsHovered(false); // Hide handles when editing starts
          setGlobalIsEditing(true);
          setTimeout(() => {
            const range = document.createRange();
            range.selectNodeContents(textBoxRef.current);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }, 0);
        }}
        onBlur={(e) => {
          setIsEditingMode(false);
          setGlobalIsEditing(false);
          const html = e.currentTarget.innerHTML;
          const newLines = html
            .replace(/<div><br><\/div>/g, "\n")
            .replace(/<div>/g, "\n")
            .replace(/<\/div>/g, "")
            .replace(/<br>/g, "\n")
            .replace(/&nbsp;/g, " ")
            .trim()
            .split("\n");
          onTextChange(newLines, "text");
          if (!isRhyming && reflowMode) {
            const paragraph = newLines.join(" ").replace(/\s+/g, " ").trim();
            const maxTextWidth = Math.max(0, (localWidth ?? 0) - 20);
            const wrapped = wrapText(paragraph, maxTextWidth);
            onTextChange(wrapped, "text");
          } else {
            onTextChange(newLines, "text");
          }

          window.getSelection()?.removeAllRanges();
          // Auto-resize after text change
          setTimeout(() => adjustSizeToContent(), 10);
        }}
      >
        {lines.join("\n")}
      </div>
    </Rnd>
  );
};

//
// EditPDFPage Component – Final Version
//
export default function EditPDFPage() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const isMobile = useIsMobile();
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
  );
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobId, setJobId] = useState<string>();
  const prog = useJobProgress(jobId);
  const [isEditing, setIsEditing] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(window.innerWidth);
  const [currentScale, setCurrentScale] = useState(1);
  const [currentSpreadIdx, setCurrentSpreadIdx] = useState(0);

  // NEW: Track which individual images are loaded in the DOM
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Decode-aware preloading (replaces loadedImageUrls/imagesReady logic)
  const { readyUrls, allDecoded, ensureReady } = useImagePreloader(book);
  // Optional: global overlay while waiting to switch spreads
  const [navLoading, setNavLoading] = useState(false);

  // Editing controls for selected text box
  const [selectedPageIdx, setSelectedPageIdx] = useState(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [editingFontSize, setEditingFontSize] = useState(DEFAULT_FONT_SIZE);
  const [editingColor, setEditingColor] = useState("#000000");
  const [editingFontFamily, setEditingFontFamily] =
    useState(DEFAULT_FONT_FAMILY);

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Track changes for save functionality - start as false, only enable on actual changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Function to handle when an individual image loads
  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages((prev) => {
      if (prev.has(imageUrl)) return prev;
      const next = new Set(prev);
      next.add(imageUrl);
      return next;
    });
  };

  // Reset loaded images when navigating between spreads/pages
  useEffect(() => {
    setLoadedImages(new Set());
  }, [currentSpreadIdx, currentPageIdx]);

  useEffect(() => {
    function handleResize() {
      setAvailableWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fn = () =>
      setOrientation(
        window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
      );
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const singlePageMode = isMobile && orientation === "portrait";

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const spreadRef = useRef<HTMLDivElement | null>(null);

  // FIXED: Remove the problematic minWidth and calculate proper container width
  const getContainerWidth = () => {
    if (singlePageMode) {
      return Math.min(availableWidth - 32, pageConfig.finalWidth); // 32px for padding
    }
    return Math.min(availableWidth - 64, pageConfig.idealMinContainerWidth);
  };

  const effectivePageWidth = singlePageMode
    ? getContainerWidth()
    : pageConfig.finalWidth;

  const effectivePageHeight = pageConfig.finalHeight;

  async function mark(phase: string, pct = 0, message = phase) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, pct, message }),
    });
  }

  function normalisePages(raw: any[]) {
    return raw.map((p) => {
      const rawLX = p.leftX ?? p.x ?? HALF_W / 2;
      const rawLY = p.leftY ?? p.y ?? FULL_H / 2;
      const rawRX = p.rightX ?? p.x ?? HALF_W / 2;
      const rawRY = p.rightY ?? p.y ?? FULL_H / 2;

      const { x: leftX, y: leftY } = normalize(rawLX, rawLY);
      const { x: rightX, y: rightY } = normalize(rawRX, rawRY);

      return {
        ...p,
        leftX,
        leftY,
        rightX,
        rightY,
        width: ((p.width ?? 400) / HALF_W) * pageConfig.finalWidth,
        height: ((p.height ?? 100) / FULL_H) * pageConfig.finalHeight,
        fontSize: p.fontSize ?? DEFAULT_FONT_SIZE,
        color: p.color ?? "#000",
        leftText: Array.isArray(p.leftText)
          ? p.leftText
          : (p.leftText ?? "").split("\n"),
        rightText: Array.isArray(p.rightText)
          ? p.rightText
          : (p.rightText ?? "").split("\n"),
      };
    });
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ── book meta ─────────────────────────────────────────
        const metaRes = await fetch(`/api/books/${bookId}`, {
          credentials: "include",
        });
        if (!metaRes.ok) throw new Error("Failed to fetch book data");
        const meta = await metaRes.json();

        // ── launch split job ─────────────────────────────────
        const splitRes = await fetch(`/api/books/${bookId}/prepareSplit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: bookId, pages: meta.pages }),
        });

        // • As-a-Service (202)  → save jobId, stay in "loading"
        if (splitRes.status === 202) {
          const jid = splitRes.headers.get("X-Job-Id");
          if (!cancelled && jid) setJobId(jid);
          return; // wait for poller effect
        }

        // • Synchronous finish (200) → we already have pages
        if (!splitRes.ok) throw new Error("prepareSplit failed");
        const { pages } = await splitRes.json();
        if (!cancelled) {
          setBook({ ...meta, pages: normalisePages(pages) });
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookId, toast]);

  /* --------------------------------------------------------- *
   * 2) Completion – when poller hits "complete", refetch book *
   * --------------------------------------------------------- */
  useEffect(() => {
    if (!jobId) return; // nothing to poll
    if (prog?.phase !== "complete") return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch processed book");
        const data = await res.json();
        if (!cancelled) {
          setBook({ ...data, pages: normalisePages(data.pages) });
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
          setLoading(false);
        }
      }
    })();

    // clean-up
    return () => {
      cancelled = true;
    };
  }, [prog?.phase, jobId, bookId, toast]);

  // This old effect is no longer needed - replaced by useImagePreloader hook

  useEffect(() => {
    const logWidths = () => {
      const viewport = window.innerWidth;
      const viewer = viewerRef.current?.getBoundingClientRect().width ?? 0;
      const spread = spreadRef.current?.getBoundingClientRect().width ?? 0;
      const scaled = spreadRef.current
        ? ((
            spreadRef.current.querySelector(
              '[style*="transform: scale"]',
            ) as HTMLElement
          )?.offsetWidth ?? 0)
        : 0;
      // console.table({
      //   viewport,
      //   viewer_frame: viewer,
      //   spreadContainer: spread,
      //   scaledCanvas: scaled,
      //   currentScale,
      // });
    };

    logWidths();
    window.addEventListener("resize", logWidths);
    return () => window.removeEventListener("resize", logWidths);
  }, [currentScale, singlePageMode]);

  function buildFlipPages() {
    if (!book) return [];

    const coverUrl = book.cover?.final_cover_urls[0];
    const backCoverUrl = book.cover?.back_cover_url;

    const result = [];
    if (coverUrl) {
      result.push({
        id: -1,
        imageUrl: coverUrl,
        content: [],
        isCover: true,
        side: "full",
        x: 50,
        y: 50,
        fontSize: DEFAULT_FONT_SIZE,
        color: "#ffffff",
        fontFamily: DEFAULT_FONT_FAMILY,
        fontWeight: DEFAULT_FONT_WEIGHT,
      });

      result.push({
        id: INTRO_LEFT_ID,
        side: "left",
        custom: "blank", // tells renderer to draw a white page
        content: [],
      });
      result.push({
        id: INTRO_RIGHT_ID,
        side: "right",
        custom: "message", // tells renderer to use DecorativeMessageFrame + text box
        content: book?.personalMessageLines ?? [],
        x: book?.personalMessageLayout?.x ?? DEFAULT_MESSAGE_LAYOUT.x,
        y: book?.personalMessageLayout?.y ?? DEFAULT_MESSAGE_LAYOUT.y,
        width:
          book?.personalMessageLayout?.width ?? DEFAULT_MESSAGE_LAYOUT.width,
        height:
          book?.personalMessageLayout?.height ?? DEFAULT_MESSAGE_LAYOUT.height,
        fontSize: book?.personalMessageFontSize ?? DEFAULT_FONT_SIZE,
        color: book?.personalMessageColor ?? "#000000",
        fontFamily: book?.personalMessageFontFamily ?? DEFAULT_FONT_FAMILY,
        fontWeight: DEFAULT_FONT_WEIGHT,
      });
    }
    book.pages.forEach((p) => {
      if (!p.isCover && !p.isBackCover) {
        result.push({
          id: p.scene_number * 1000,
          side: "left",
          imageUrl: p.expanded_scene_url,
          content: p.leftText || [],
          x: p.leftX ?? pageConfig.finalWidth / 2 - 100,
          y: p.leftY ?? pageConfig.finalHeight / 2 - 25,
          width: p.width,
          height: p.height ?? 100,
          fontSize: p.fontSize ?? DEFAULT_FONT_SIZE,
          color: p.leftTextColor ?? "#000000",
          fontFamily: p.leftFontFamily ?? DEFAULT_FONT_FAMILY,
          fontWeight: p.leftFontWeight ?? DEFAULT_FONT_WEIGHT,
        });
        result.push({
          id: p.scene_number * 1000 + 1,
          side: "right",
          imageUrl: p.expanded_scene_url,
          content: p.rightText || [],
          x: p.rightX ?? pageConfig.finalWidth / 2 - 100,
          y: p.rightY ?? pageConfig.finalHeight / 2 - 25,
          width: p.width,
          height: p.height ?? 100,
          fontSize: p.fontSize ?? DEFAULT_FONT_SIZE,
          color: p.rightTextColor ?? "#000000",
          fontFamily: p.rightFontFamily ?? DEFAULT_FONT_FAMILY,
          fontWeight: p.rightFontWeight ?? DEFAULT_FONT_WEIGHT,
        });
      }
    });
    if (backCoverUrl) {
      result.push({
        id: -2,
        imageUrl: backCoverUrl,
        content: [],
        isBackCover: true,
        side: "left",
        x: 50,
        y: 50,
        fontSize: DEFAULT_FONT_SIZE,
        color: "#000000",
        fontFamily: DEFAULT_FONT_FAMILY,
        fontWeight: DEFAULT_FONT_WEIGHT,
      });
    }

    return result;
  }

  function buildSpreads(pages) {
    let spreads = [];
    if (pages.length === 0) return spreads;
    let idx = 0;
    if (pages[0].isCover) {
      spreads.push([pages[0]]);
      idx = 1;
    }

    // Handle story pages (always in pairs of 2)
    while (idx < pages.length - 1) {
      spreads.push([pages[idx], pages[idx + 1]]);
      idx += 2;
    }

    // Handle back cover (single page spread)
    if (idx < pages.length && pages[idx].isBackCover) {
      spreads.push([pages[idx]]);
    }
    return spreads;
  }

  const flipPages = buildFlipPages();
  const spreads = buildSpreads(flipPages);

  // Ensure currentSpreadIdx is valid when spreads change
  useEffect(() => {
    if (spreads.length > 0 && currentSpreadIdx >= spreads.length) {
      setCurrentSpreadIdx(spreads.length - 1);
    }
  }, [spreads.length, currentSpreadIdx]);

  // Debug logging
  // console.log("📚 Book structure:", {
  //   flipPagesCount: flipPages.length,
  //   spreadsCount: spreads.length,
  //   flipPages: flipPages.map((fp) => ({
  //     id: fp.id,
  //     isCover: fp.isCover,
  //     isBackCover: fp.isBackCover,
  //   })),
  //   spreads: spreads.map((spread, idx) => ({
  //     spreadIdx: idx,
  //     pages: spread.map((p) => ({
  //       id: p.id,
  //       isCover: p.isCover,
  //       isBackCover: p.isBackCover,
  //     })),
  //   })),
  // });

  // const next = () => {
  //   if (singlePageMode) {
  //     setCurrentPageIdx((i) => Math.min(i + 1, flipPages.length - 1));
  //   } else {
  //     setCurrentSpreadIdx((i) => {
  //       const newIdx = Math.min(i + 1, spreads.length - 1);
  //       console.log("🔄 Next navigation:", {
  //         from: i,
  //         to: newIdx,
  //         spreadsLength: spreads.length,
  //       });
  //       return newIdx;
  //     });
  //   }
  // };
  // const prev = () => {
  //   if (singlePageMode) {
  //     setCurrentPageIdx((i) => Math.max(i - 1, 0));
  //   } else {
  //     setCurrentSpreadIdx((i) => {
  //       const newIdx = Math.max(i - 1, 0);
  //       console.log("🔄 Prev navigation:", {
  //         from: i,
  //         to: newIdx,
  //         spreadsLength: spreads.length,
  //       });
  //       return newIdx;
  //     });
  //   }
  // };

  const goToSpreadIndex = async (newIdx: number) => {
    const target = spreads[newIdx] ?? [];
    const targetUrls = target.map((p: any) => p.imageUrl).filter(Boolean);
    if (targetUrls.some((u: string) => !readyUrls.has(u))) {
      setNavLoading(true);

      await ensureReady(targetUrls);
      setNavLoading(false);
    }
    setCurrentSpreadIdx(newIdx);
  };

  const goToPageIndex = async (newIdx: number) => {
    const fp = flipPages[newIdx];
    const targetUrl = fp?.imageUrl;
    if (targetUrl && !readyUrls.has(targetUrl)) {
      setNavLoading(true);

      await ensureReady([targetUrl]);
      setNavLoading(false);
    }
    setCurrentPageIdx(newIdx);
  };

  const next = () => {
    if (singlePageMode) {
      const ni = Math.min(currentPageIdx + 1, flipPages.length - 1);
      if (ni !== currentPageIdx) void goToPageIndex(ni);
    } else {
      const ni = Math.min(currentSpreadIdx + 1, spreads.length - 1);
      if (ni !== currentSpreadIdx) void goToSpreadIndex(ni);
    }
  };

  const prev = () => {
    if (singlePageMode) {
      const ni = Math.max(currentPageIdx - 1, 0);
      if (ni !== currentPageIdx) void goToPageIndex(ni);
    } else {
      const ni = Math.max(currentSpreadIdx - 1, 0);
      if (ni !== currentSpreadIdx) void goToSpreadIndex(ni);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    disabled: !singlePageMode || isInteracting || isEditing,
    trackMouse: true,
  });

  function updatePageLayout(fp, newLayout, cause = "drag") {
    console.log("🔄 updatePageLayout called:", { fpId: fp.id, newLayout });

    if (fp.id === INTRO_RIGHT_ID) {
      setBook((prev: any) =>
        !prev
          ? prev
          : {
              ...prev,
              personalMessageLayout: {
                x: newLayout.x,
                y: newLayout.y,
                width: newLayout.width,
                height: newLayout.height,
              },
            },
      );
      if (cause !== "auto") setHasUnsavedChanges(true);
      return;
    }

    const origPageId = Math.floor(fp.id / 1000);
    setBook((prev) => {
      if (!prev) return prev;
      const newPages = prev.pages.map((p) => {
        if (p.scene_number === origPageId) {
          if (fp.id % 1000 === 0) {
            return {
              ...p,
              leftX: newLayout.x,
              leftY: newLayout.y,
              width: newLayout.width,
              height: newLayout.height,
            };
          } else {
            return {
              ...p,
              rightX: newLayout.x,
              rightY: newLayout.y,
              width: newLayout.width,
              height: newLayout.height,
            };
          }
        }
        return p;
      });
      return { ...prev, pages: newPages };
    });
    // Mark as having unsaved changes
    if (cause !== "auto") setHasUnsavedChanges(true);
  }

  function updatePageText(fp, newValue, cause = "text") {
    if (fp.id === INTRO_RIGHT_ID) {
      const newLines = Array.isArray(newValue)
        ? newValue
        : (newValue.right ?? newValue.left ?? []);
      setBook((prev: any) =>
        !prev ? prev : { ...prev, personalMessageLines: newLines },
      );
      if (cause !== "auto") setHasUnsavedChanges(true);
      return;
    }

    const origPageId = Math.floor(fp.id / 1000);
    setBook((prev) => {
      if (!prev) return prev;
      const newPages = prev.pages.map((p) => {
        if (p.scene_number === origPageId) {
          if (Array.isArray(newValue)) {
            if (fp.id % 1000 === 0) {
              return { ...p, leftText: newValue };
            } else {
              return { ...p, rightText: newValue };
            }
          } else {
            return {
              ...p,
              leftText:
                newValue.left !== undefined ? newValue.left : p.leftText,
              rightText:
                newValue.right !== undefined ? newValue.right : p.rightText,
            };
          }
        }
        return p;
      });
      return { ...prev, pages: newPages };
    });
    // Mark as having unsaved changes
    if (cause !== "auto") setHasUnsavedChanges(true);
  }

  function handleSelectPage(pageIdx) {
    if (isEditing) return;
    setSelectedPageIdx(pageIdx);
    if (!book) return;
    let pageData;
    book.pages.forEach((p) => {
      if (p.isCover && pageIdx === -1) pageData = p;
      if (p.isBackCover && pageIdx === -2) pageData = p;
      if (
        p.scene_number * 1000 === pageIdx ||
        p.scene_number * 1000 + 1 === pageIdx
      ) {
        pageData = p;
      }
    });
    if (pageData) {
      setEditingFontSize(pageData.fontSize ?? DEFAULT_FONT_SIZE);
      setEditingColor(pageData.color ?? "#000000");
      setEditingFontFamily(pageData.fontFamily ?? DEFAULT_FONT_FAMILY);
    }
  }

  function handleUpdateStyle(
    fontSize: number,
    color: string,
    fontFamily: string,
  ) {
    if (!book) return;
    const visibleIds = singlePageMode
      ? [flipPages[currentPageIdx].id]
      : spreads[currentSpreadIdx].map((p: any) => p.id);

    setBook((prev: any) => {
      if (!prev) return prev;
      const updated = prev.pages.map((p: any) => {
        const pageHits = [
          p.isCover ? -1 : null,
          p.isBackCover ? -2 : null,
          p.scene_number * 1000,
          p.scene_number * 1000 + 1,
        ].filter(Boolean);

        const shouldApply =
          selectedPageIdx !== null
            ? pageHits.includes(selectedPageIdx)
            : pageHits.some((id) => visibleIds.includes(id as number));

        if (!shouldApply) return p;

        return {
          ...p,
          fontSize,
          color,
          leftTextColor: color,
          rightTextColor: color,
          fontFamily,
          leftFontFamily: fontFamily,
          rightFontFamily: fontFamily,
        };
      });
      return { ...prev, pages: updated };
    });
    setHasUnsavedChanges(true);
  }

  // Color-only updater that applies to the currently visible page(s)
  function handleUpdateColor(color: string) {
    if (!book) return;
    // Determine visible flip pages we want to affect
    const targetFlipPages: Array<{ imageUrl: string; side: "left" | "right" }> =
      [];
    if (selectedPageIdx !== null) {
      const fp = flipPages.find((f: any) => f.id === selectedPageIdx);
      if (fp && (fp.side === "left" || fp.side === "right")) {
        targetFlipPages.push({ imageUrl: fp.imageUrl, side: fp.side });
      }
    } else if (singlePageMode) {
      const fp = flipPages[currentPageIdx];
      if (fp && (fp.side === "left" || fp.side === "right")) {
        targetFlipPages.push({ imageUrl: fp.imageUrl, side: fp.side });
      }
    } else {
      (spreads[currentSpreadIdx] || []).forEach((fp: any) => {
        if (fp.side === "left" || fp.side === "right") {
          targetFlipPages.push({ imageUrl: fp.imageUrl, side: fp.side });
        }
      });
    }

    // console.log("🎯 handleUpdateColor targets (by url/side)", targetFlipPages);

    setBook((prev: any) => {
      if (!prev) return prev;
      let updates = 0;
      const updated = prev.pages.map((p: any) => {
        const matchesAny = targetFlipPages.filter(
          (t) => t.imageUrl === p.expanded_scene_url,
        );
        if (matchesAny.length === 0) return p;

        // Copy fields and apply per-side updates based on matches
        let next = { ...p } as any;
        for (const m of matchesAny) {
          if (m.side === "left") next.leftTextColor = color;
          if (m.side === "right") next.rightTextColor = color;
          next.color = color;
          updates++;
        }
        return next;
      });
      // console.log("✅ handleUpdateColor applied updates:", updates);

      // Mark as having unsaved changes if updates were made
      if (updates > 0) {
        setHasUnsavedChanges(true);
      }

      return { ...prev, pages: updated };
    });
  }

  const handleColorClick = (hex: string) => {
    setEditingColor(hex);
    // console.log("🎨 Color click", {
    //   hex,
    //   singlePageMode,
    //   currentSpreadIdx,
    //   currentPageIdx,
    // });
    handleUpdateColor(hex);
  };

  // Helper function to scale coordinates back to original dimensions for storage
  const scaleCoordinatesForSave = (x: number, y: number) => {
    // The coordinates we get from the UI are in logical coordinates (LOGICAL_W x LOGICAL_H)
    // But the backend expects raw coordinates (HALF_W x FULL_H for left side, or offset for right side)
    //
    // The normalize function converts: rawCoord -> logicalCoord
    // We need to reverse it: logicalCoord -> rawCoord
    //
    // normalize function:
    // x = (rawX / HALF_W) * pageConfig.finalWidth
    // y = (rawY / FULL_H) * pageConfig.finalHeight
    //
    // So reverse transformation:
    // rawX = (x / pageConfig.finalWidth) * HALF_W
    // rawY = (y / pageConfig.finalHeight) * FULL_H

    const rawX = Math.round((x / pageConfig.finalWidth) * HALF_W);
    const rawY = Math.round((y / pageConfig.finalHeight) * FULL_H);

    console.log("🔄 Coordinate transformation:", {
      logical: { x, y },
      raw: { x: rawX, y: rawY },
      scaleFactor: {
        x: HALF_W / pageConfig.finalWidth,
        y: FULL_H / pageConfig.finalHeight,
      },
    });

    return { x: rawX, y: rawY };
  };

  // Save changes function using existing PUT endpoint
  const handleSaveChanges = async () => {
    if (!book) return false;
    if (!hasUnsavedChanges) return true;

    setIsSaving(true);
    try {
      // Transform book data to match schema requirements
      const transformedBook = {
        ...book,
        // imagesJobId can now be null per updated schema
        // Transform pages to scale coordinates back to original dimensions
        pages: book.pages?.map((page) => {
          // Scale coordinates back to original dimensions
          const scaledLeftCoords =
            page.leftX !== undefined && page.leftY !== undefined
              ? scaleCoordinatesForSave(page.leftX, page.leftY)
              : { x: page.leftX, y: page.leftY };

          const scaledRightCoords =
            page.rightX !== undefined && page.rightY !== undefined
              ? scaleCoordinatesForSave(page.rightX, page.rightY)
              : { x: page.rightX, y: page.rightY };

          const transformedPage = {
            ...page,
            // Update coordinates with scaled values - keep arrays as arrays
            leftX: scaledLeftCoords.x,
            leftY: scaledLeftCoords.y,
            rightX: scaledRightCoords.x,
            rightY: scaledRightCoords.y,
            // Keep content, leftText, rightText as arrays - schema now supports both
          };

          // console.log(`📊 Page ${page.scene_number} transformed for save:`, {
          //   original: {
          //     leftX: page.leftX,
          //     leftY: page.leftY,
          //     rightX: page.rightX,
          //     rightY: page.rightY,
          //   },
          //   scaled: {
          //     leftX: scaledLeftCoords.x,
          //     leftY: scaledLeftCoords.y,
          //     rightX: scaledRightCoords.x,
          //     rightY: scaledRightCoords.y,
          //   },
          // });

          return transformedPage;
        }),
      };

      // console.log("Original book data:", book);
      // console.log("Saving transformed book data:", transformedBook);

      const saveResp = await fetch(`/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(transformedBook),
      });

      if (!saveResp.ok) {
        const errorData = await saveResp.json();
        console.error("Save failed with error:", errorData);
        throw new Error(
          `Failed to save book changes: ${errorData.message || "Unknown error"}`,
        );
      }

      // Reset the unsaved changes flag after successful save
      setHasUnsavedChanges(false);

      toast({
        title: "Success",
        description: "Book changes saved successfully.",
      });
      return true;
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: `Failed to save book changes: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (hasUnsavedChanges) setShowSaveConfirm(true);
    else setShowShippingForm(true);
  };

  const handleShippingSubmit = async (formData) => {
    try {
      if (user) {
        await apiRequest("POST", "/api/orders", {
          ...formData,
          bookId,
          userId: user.uid,
        });
        setOrderCompleted(true);
        setShowShippingForm(false);
        toast({
          title: "Order placed successfully!",
          description: "Your book will be delivered soon.",
        });
      }
    } catch (error) {
      toast({
        title: "Order failed",
        description: "There was a problem placing your order.",
        variant: "destructive",
      });
    }
  };

  async function handleSaveAndGeneratePDF() {
    if (!book) return;
    setIsGeneratingPdf(true);
    const saveResp = await fetch(`/api/books/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...book, pages: book.pages }),
    });
    if (!saveResp.ok) {
      toast({
        title: "Error",
        description: "Failed to save book.",
        variant: "destructive",
      });
      return;
    }
    const generateResp = await fetch("/api/pdf/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: book.title,
        pages: book.pages,
        coverUrl: book.coverUrl,
        backCoverUrl: book.backCoverUrl,
      }),
    });
    if (!generateResp.ok) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
      return;
    }
    const pdfBlob = await generateResp.blob();
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${book.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "PDF downloaded." });
    setIsGeneratingPdf(false);
    setLocation(`/book/${bookId}`);
  }

  function goToNextSpread() {
    if (currentSpreadIdx < spreads.length - 1)
      setCurrentSpreadIdx(currentSpreadIdx + 1);
  }
  function goToPrevSpread() {
    if (currentSpreadIdx > 0) setCurrentSpreadIdx(currentSpreadIdx - 1);
  }

  const pagesToRender = singlePageMode
    ? flipPages[currentPageIdx]
      ? [flipPages[currentPageIdx]]
      : []
    : (spreads[currentSpreadIdx] ?? []);

  // Debug spread selection
  // console.log("📖 Spread selection:", {
  //   currentSpreadIdx,
  //   spreadsLength: spreads.length,
  //   selectedSpread: spreads[currentSpreadIdx]?.map((p) => ({
  //     id: p.id,
  //     isCover: p.isCover,
  //     isBackCover: p.isBackCover,
  //   })),
  //   pagesToRenderCount: pagesToRender.length,
  // });

  // Debug current spread
  // console.log("🎯 Current spread:", {
  //   currentSpreadIdx,
  //   spreadsLength: spreads.length,
  //   singlePageMode,
  //   currentPageIdx,
  //   pagesToRenderCount: pagesToRender.length,
  //   pagesToRender: pagesToRender.map((p) => ({
  //     id: p.id,
  //     isCover: p.isCover,
  //     isBackCover: p.isBackCover,
  //   })),
  //   isValidIndex: currentSpreadIdx < spreads.length,
  // });

  const spreadPx =
    pagesToRender.length === 1
      ? pageConfig.finalWidth
      : pageConfig.finalWidth * 2 + 32;

  // Debug container width calculation
  // console.log("📏 Container width:", {
  //   pagesToRenderLength: pagesToRender.length,
  //   spreadPx,
  //   pageConfigFinalWidth: pageConfig.finalWidth,
  //   calculatedWidth:
  //     pagesToRender.length * pageConfig.finalWidth +
  //     (pagesToRender.length > 1 ? 32 : 0),
  // });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow mx-auto px-4 py-8 w-full max-w-full overflow-hidden">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {" "}
          {book ? book.title : ""}
        </h1>

        {loading || !allDecoded ? (
          // ← show while loading and while preloading images
          <div className="flex items-center justify-center py-20 px-4">
            {jobId && prog ? (
              <div className="w-full max-w-screen-lg">
                <ProgressDisplay
                  prog={{
                    ...prog,
                    message:
                      prog.phase === "splitting"
                        ? "Editing PDF: preparing pages…"
                        : prog.phase === "generating"
                          ? "Editing PDF: laying out each page…"
                          : "Preparing images…",
                  }}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-imaginory-yellow" />
            )}
          </div>
        ) : (
          <>
            <div
              ref={viewerRef}
              className="flex justify-center bg-white p-4 shadow-lg rounded relative mx-auto overflow-hidden"
              style={{
                maxWidth: "100%",
                width: singlePageMode
                  ? "100%"
                  : pagesToRender.length * pageConfig.finalWidth +
                    (pagesToRender.length > 1 ? 32 : 0),
              }}
              {...swipeHandlers}
            >
              <div
                id="spreadContainer"
                ref={spreadRef}
                className="relative flex justify-center"
                style={{
                  width: singlePageMode
                    ? "100%"
                    : pagesToRender.length * pageConfig.finalWidth +
                      (pagesToRender.length > 1 ? 32 : 0),
                  height: singlePageMode ? "auto" : pageConfig.finalHeight,
                  maxWidth: "100%",
                  overflow: "hidden", // Add this
                  position: "relative",
                }}
              >
                {/* Global navigation loading overlay */}
                {navLoading && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-imaginory-yellow"></div>
                  </div>
                )}
                <div className="flex gap-0.5 justify-center w-full">
                  {pagesToRender.map((fp) => {
                    const isCustomBlank = fp.custom === "blank";
                    const isCustomMessage = fp.custom === "message";
                    const isCustom = isCustomBlank || isCustomMessage;

                    const isPreloaded = readyUrls.has(fp.imageUrl);
                    const isImageLoaded = loadedImages.has(fp.imageUrl);
                    const isFullyReady = isCustom
                      ? true
                      : isPreloaded && isImageLoaded;

                    let resolvedColor = fp.color ?? "#000000";
                    if (book && typeof fp.id === "number" && fp.id >= 0) {
                      const originalId = Math.floor(fp.id / 1000);
                      const isLeft = fp.id % 1000 === 0;
                      const page = book.pages?.find(
                        (p: any) => p.scene_number === originalId,
                      );
                      if (page) {
                        resolvedColor = isLeft
                          ? (page.leftTextColor ?? resolvedColor)
                          : (page.rightTextColor ?? resolvedColor);
                      }
                    }
                    // console.log(
                    //   "🖍️ Resolved color for FP",
                    //   fp.id,
                    //   resolvedColor,
                    // );

                    return (
                      <div
                        key={fp.id}
                        className="relative bg-white overflow-hidden flex-shrink-0"
                        style={{
                          width: singlePageMode
                            ? "100%"
                            : pageConfig.finalWidth,
                          height: singlePageMode
                            ? pageConfig.finalHeight
                            : pageConfig.finalHeight,
                          maxWidth: singlePageMode
                            ? "100%"
                            : pageConfig.finalWidth,
                        }}
                        onClick={(e) => {
                          if (isEditing) return;
                          if (e.currentTarget.querySelector(":focus-within"))
                            return;
                          handleSelectPage(fp.id);
                        }}
                      >
                        {isCustom && (
                          <div className="pointer-events-none absolute inset-0.5 border border-black z-10" />
                        )}
                        
                        <ScalablePreview onScaleChange={setCurrentScale}>
                          {/* {console.log(
                            "🎨 Image slice",
                            fp.id,
                            fp.side,
                            fp.side ?? (fp.id % 2 ? "right" : "left"),
                          )} */}

                          {/* Always show spinner until image is fully ready */}
                          {!isFullyReady && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
                              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-imaginory-yellow"></div>
                            </div>
                          )}

                          {isCustom && (
                            <>
                              {/* Left intro page: clean white */}
                              {isCustomBlank && (
                                <div className="absolute inset-0 bg-white" />
                              )}

                              {/* Right intro page: decorative frame + message area */}
                              {isCustomMessage && (
                                <>
                                  <img
                                    src="/frame_imagitory.png"
                                    alt=""
                                    draggable={false}
                                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                                    style={{ objectFit: "fill" }}
                                  />
                                  {/* Optional helper hint if empty */}
                                  {(!fp.content ||
                                    fp.content.join("").trim() === "") && (
                                      <div
                                        className="absolute left-1/2 -translate-x-1/2 top-[26%] w-[52%] text-center text-sm text-gray-600 select-none pointer-events-none z-10"
                                        style={{ lineHeight: 1.35 }}
                                      >
                                      Type your personal message here, or leave
                                      this page blank to handwrite it later.
                                    </div>
                                  )}

                                  <ResizableTextBox
                                    x={fp.x ?? DEFAULT_MESSAGE_LAYOUT.x}
                                    y={fp.y ?? DEFAULT_MESSAGE_LAYOUT.y}
                                    width={
                                      fp.width ?? DEFAULT_MESSAGE_LAYOUT.width
                                    }
                                    height={
                                      fp.height ?? DEFAULT_MESSAGE_LAYOUT.height
                                    }
                                    fontSize={
                                      book?.personalMessageFontSize ??
                                      fp.fontSize ??
                                      DEFAULT_FONT_SIZE
                                    }
                                    color={resolvedColor}
                                    fontFamily={
                                      book?.personalMessageFontFamily ??
                                      fp.fontFamily ??
                                      DEFAULT_FONT_FAMILY
                                    }
                                    fontWeight={
                                      fp.fontWeight ?? DEFAULT_FONT_WEIGHT
                                    }
                                    lines={fp.content ?? []}
                                    scale={currentScale}
                                    initialSide="right"
                                    onUpdate={(newLayout) =>
                                      updatePageLayout(fp, newLayout)
                                    }
                                    onTextChange={(newValue) =>
                                      updatePageText(fp, newValue)
                                    }
                                    setGlobalIsEditing={setIsEditing}
                                    isRhyming={!!book?.isStoryRhyming}
                                    setGlobalIsInteracting={setIsInteracting}
                                    alwaysShowBorderWhenEmpty
                                  />
                                </>
                              )}
                            </>
                          )}

                          {/* Image - render as soon as preloaded, but may still be loading visually */}
                          {!isCustom && isPreloaded && (
                            <PageImage
                              url={fp.imageUrl}
                              side={fp.side ?? (fp.id % 2 ? "right" : "left")}
                              isLoaded={isImageLoaded}
                              onLoad={() => handleImageLoad(fp.imageUrl)}
                            />
                          )}

                          {/* Text box - only show after image is completely loaded */}
                          {!isCustom && isFullyReady && (
                            <ResizableTextBox
                              x={fp.x ?? 50}
                              y={fp.y ?? 50}
                              width={0}
                              height={0}
                              fontSize={fp.fontSize ?? DEFAULT_FONT_SIZE}
                              color={resolvedColor}
                              fontFamily={fp.fontFamily ?? DEFAULT_FONT_FAMILY}
                              fontWeight={fp.fontWeight ?? DEFAULT_FONT_WEIGHT}
                              lines={fp.content}
                              scale={currentScale}
                              initialSide={
                                fp.id % 1000 === 0 ? "left" : "right"
                              }
                              onUpdate={(newLayout) =>
                                updatePageLayout(fp, newLayout)
                              }
                              onTextChange={(newValue) =>
                                updatePageText(fp, newValue)
                              }
                              setGlobalIsEditing={setIsEditing}
                              isRhyming={!!book?.isStoryRhyming}
                              setGlobalIsInteracting={setIsInteracting}
                            />
                          )}
                        </ScalablePreview>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Arrow buttons */}
              <button
                onClick={prev}
                disabled={
                  singlePageMode ? currentPageIdx === 0 : currentSpreadIdx === 0
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow disabled:opacity-40 z-10"
              >
                ◀
              </button>
              <button
                onClick={next}
                disabled={
                  singlePageMode
                    ? currentPageIdx === flipPages.length - 1
                    : currentSpreadIdx === spreads.length - 1
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow disabled:opacity-40 z-10"
              >
                ▶
              </button>
            </div>

            {/* Controls */}
            {singlePageMode ? (
              /* FIXED BOTTOM SHEET for mobile */
              <div
                className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  paddingTop: "16px",
                  maxHeight: "200vh",
                  minHeight: "180px",
                  overflow: "visible",
                }}
              >
                <div className="w-full flex items-center justify-center gap-4">
                  <span className="text-sm font-medium">Text color:</span>
                  <Button
                    variant={editingColor === "#000000" ? "default" : "outline"}
                    className="px-4"
                    onClick={() => handleColorClick("#000000")}
                  >
                    Black
                  </Button>
                  <Button
                    variant={editingColor === "#ffffff" ? "default" : "outline"}
                    className="px-4"
                    onClick={() => handleColorClick("#ffffff")}
                  >
                    White
                  </Button>
                </div>
              </div>
            ) : (
              /* ORIGINAL inline controls for desktop */
              <div
                className="mt-6 flex items-center justify-center space-x-8 mx-auto"
                style={{ width: `${spreadPx}px`, maxWidth: "100%" }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">Text color:</span>
                  <Button
                    variant={editingColor === "#000000" ? "default" : "outline"}
                    onClick={() => handleColorClick("#000000")}
                  >
                    Black
                  </Button>
                  <Button
                    variant={editingColor === "#ffffff" ? "default" : "outline"}
                    onClick={() => handleColorClick("#ffffff")}
                  >
                    White
                  </Button>
                </div>

                <Button onClick={prev} disabled={currentSpreadIdx === 0}>
                  {"<<"}
                </Button>
                <Button
                  onClick={next}
                  disabled={currentSpreadIdx === spreads.length - 1}
                >
                  {">>"}
                </Button>
              </div>
            )}

            {/* Save Changes & Print Buttons - Yellow themed and mobile optimized */}
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-6 md:mt-12">
              {/* Save Changes Button */}
              <Button
                variant={hasUnsavedChanges ? "default" : "outline"}
                size="lg"
                className={`w-full md:w-auto flex items-center justify-center shadow-lg font-semibold ${
                  hasUnsavedChanges
                    ? "bg-imaginory-yellow hover:bg-imaginory-yellow text-imaginory-black border-2 border-imaginory-yellow"
                    : "bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed"
                }`}
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner mr-2 animate-spin"></i>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    <span>Save Changes</span>
                  </>
                )}
              </Button>

              {/* <Button
                variant="default"
                size="lg"
                className="w-full md:w-auto flex items-center justify-center bg-imaginory-yellow hover:bg-imaginory-yellow/90 text-imaginory-black shadow-lg font-semibold"
                onClick={handleSaveAndGeneratePDF}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <>
                    <i className="fas fa-spinner mr-2 animate-spin"></i>
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    <span>Download PDF</span>
                  </>
                )}
              </Button> */}

              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto flex items-center justify-center bg-imaginory-yellow border-2 border-imaginory-yellow text-imaginory-black hover:bg-imaginory-yellow/90"
                onClick={handlePrint}
              >
                <i className="fas fa-print mr-2"></i>
                <span>Print & Ship</span>
              </Button>
            </div>

            {showSaveConfirm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-2xl w-[min(92vw,420px)] p-6">
                  <h3 className="text-lg font-semibold">
                    Save changes before printing?
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    You have unsaved edits. Would you like to save them first?
                  </p>

                  <div className="mt-6 flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => {
                        setShowSaveConfirm(false);
                        setShowShippingForm(true); // continue without saving
                      }}
                    >
                      No, continue
                    </Button>
                    <Button
                      disabled={isSaving}
                      onClick={async () => {
                        const ok = await handleSaveChanges();
                        if (ok) {
                          setShowSaveConfirm(false);
                          setShowShippingForm(true);
                        }
                      }}
                    >
                      {isSaving ? "Saving…" : "Yes, save & continue"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ==========  PRINT & SHIP dialog ========== */}
            <Dialog open={showShippingForm} onOpenChange={setShowShippingForm}>
              {/* trigger is *already* your Print button; keep it as-is */}
              <DialogContent
                className="max-w-screen-sm max-h-[90vh] overflow-y-auto" // make form scroll inside modal
              >
                <DialogHeader>
                  <DialogTitle>Shipping information</DialogTitle>
                </DialogHeader>

                {/*  A. show either the form or the success message  */}
                {orderCompleted ? (
                  <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg">
                    <i className="fas fa-check-circle mr-2 text-xl" />
                    Order successfully placed! Your book will be delivered soon.
                  </div>
                ) : (
                  <ShippingForm onSubmit={handleShippingSubmit} />
                )}

                {/*  B. extra footer buttons if you need them  */}
                {!orderCompleted && (
                  <DialogFooter>
                    <DialogClose asChild>
                      <button className="text-sm underline text-gray-500">
                        Cancel
                      </button>
                    </DialogClose>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
