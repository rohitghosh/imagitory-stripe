// import React, { useState, useEffect, useRef } from "react";
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

// const FULL_W = 2048;
// const FULL_H = 1024;
// const HALF_W = FULL_W / 2;
// const LOGICAL_W = 600;
// const LOGICAL_H = Math.round((FULL_H * LOGICAL_W) / HALF_W);
// const DEFAULT_FONT_SIZE = 22
// const DEFAULT_FONT_FAMILY = "Chewy"

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

// function PageImage({
//   url,
//   side,
// }: {
//   url: string;
//   side: "left" | "right" | "full";
// }) {
//   if (side === "full") {
//     // cover: fill the whole canvas
//     return (
//       <img
//         src={url}
//         alt=""
//         draggable={false}
//         className="absolute inset-0 w-full h-full object-cover"
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
//       }}
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
//         console.log("🎯 ScalablePreview:", {
//           available,
//           scaleFactor,
//           finalWidth: pageConfig.finalWidth,
//         });
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
//   lines,
//   scale,
//   onUpdate,
//   onTextChange,
//   setGlobalIsEditing,
//   initialSide, // "left" or "right" when mounted (based on page id)
// }) => {
//   // Maintain local (internal) position state.
//   const [localX, setLocalX] = useState(x);
//   const [localY, setLocalY] = useState(y);
//   // Track which page the box is on
//   const [currentSide, setCurrentSide] = useState(initialSide);
//   // Track editing mode for styling.
//   const [isEditingMode, setIsEditingMode] = useState(false);
//   const textBoxRef = useRef(null);

//   // Sync internal position if parent's values change.
//   useEffect(() => {
//     setLocalX(x);
//     setLocalY(y);
//     setCurrentSide(initialSide);
//   }, [x, y, initialSide]);

//   useEffect(() => {
//     const id = Math.random().toString(36).slice(2, 7);
//     setTimeout(() => {
//       const box = textBoxRef.current?.closest(".rnd");
//       if (box) {
//         const r = box.getBoundingClientRect();
//         console.log(`📦 Box[${id}] mount`, {
//           initX: x,
//           initY: y,
//           scaledX: r.left,
//           scaledY: r.top,
//           scale,
//         });
//       }
//     }, 0);
//   }, []);

//   return (
//     <Rnd
//       bounds="parent"
//       enableUserSelectHack={false}
//       disableDragging={isEditingMode}
//       size={{ width: width, height: height }}
//       position={{ x: localX, y: localY }}
//       onDrag={(e, d) => {
//         const newX = d.x / scale;
//         const newY = d.y / scale;

//         // If on the left page and newX meets or exceeds the page's width,
//         // commit the position to the right page.
//         if (currentSide === "left" && newX >= pageConfig.finalWidth) {
//           const excess = newX - pageConfig.finalWidth;
//           setCurrentSide("right");
//           onTextChange({ left: [], right: lines });
//           setLocalX(excess);
//           setLocalY(newY);
//           onUpdate({ x: excess, y: newY, width, height, side: "right" });
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
//           onUpdate({ x: newXForLeft, y: newY, width, height, side: "left" });
//           return;
//         }
//         // Otherwise update the position normally.
//         setLocalX(newX);
//         setLocalY(newY);
//         onUpdate({ x: newX, y: newY, width, height, side: currentSide });
//       }}
//       onDragStop={(e, d) => {
//         const finalX = d.x / scale;
//         const finalY = d.y / scale;
//         setLocalX(finalX);
//         setLocalY(finalY);
//         onUpdate({ x: finalX, y: finalY, width, height, side: currentSide });
//         console.log("📦 Box drag/resize", {
//           side: currentSide,
//           x: localX,
//           y: localY,
//           scale,
//         });
//       }}
//       onResizeStop={(e, direction, ref, delta, position) => {
//         const updatedX = position.x / scale;
//         const updatedY = position.y / scale;
//         setLocalX(updatedX);
//         setLocalY(updatedY);
//         onUpdate({
//           x: updatedX,
//           y: updatedY,
//           width: ref.offsetWidth / scale,
//           height: ref.offsetHeight / scale,
//           side: currentSide,
//         });
//         console.log("📦 Box drag/resize", {
//           side: currentSide,
//           x: localX,
//           y: localY,
//           scale,
//         });
//       }}
//       onMouseDown={(e) => e.stopPropagation()}
//       style={{
//         border: isEditingMode
//           ? "2px solid #3b82f6"
//           : lines.join("").trim() === ""
//             ? "none"
//             : "1px dashed #ddd",
//         cursor: isEditingMode ? "text" : "move",
//         background: "transparent",
//         boxSizing: "border-box",
//       }}
//     >
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
//           padding: "10px",
//           outline: "none",
//           whiteSpace: "pre-wrap",
//           overflowWrap: "break-word",
//           textAlign: "left",
//           boxSizing: "border-box",
//           userSelect: isEditingMode ? "text" : "none",
//           pointerEvents: "auto",
//           cursor: isEditingMode ? "text" : "move",
//         }}
//         onDoubleClick={(e) => {
//           e.stopPropagation();
//           setIsEditingMode(true);
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
//           onTextChange(newLines);
//           window.getSelection()?.removeAllRanges();
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

//   // Editing controls for selected text box
//   const [selectedPageIdx, setSelectedPageIdx] = useState(null);
//   const [currentPageIdx, setCurrentPageIdx] = useState(0);
//   const [editingFontSize, setEditingFontSize] = useState(DEFAULT_FONT_SIZE);
//   const [editingColor, setEditingColor] = useState("#000000");
//   const [editingFontFamily, setEditingFontFamily] = useState(DEFAULT_FONT_FAMILY);

//   const [showShippingForm, setShowShippingForm] = useState(false);
//   const [orderCompleted, setOrderCompleted] = useState(false);
//   const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
//       console.table({
//         viewport,
//         viewer_frame: viewer,
//         spreadContainer: spread,
//         scaledCanvas: scaled,
//         currentScale,
//       });
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
//       });
//     }
//     book.pages.forEach((p) => {
//       if (!p.isCover && !p.isBackCover) {
//         result.push({
//           id: p.current_scene_index * 1000,
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
//         });
//         result.push({
//           id: p.current_scene_index * 1000 + 1,
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
//   console.log("📚 Book structure:", {
//     flipPagesCount: flipPages.length,
//     spreadsCount: spreads.length,
//     flipPages: flipPages.map((fp) => ({
//       id: fp.id,
//       isCover: fp.isCover,
//       isBackCover: fp.isBackCover,
//     })),
//     spreads: spreads.map((spread, idx) => ({
//       spreadIdx: idx,
//       pages: spread.map((p) => ({
//         id: p.id,
//         isCover: p.isCover,
//         isBackCover: p.isBackCover,
//       })),
//     })),
//   });

//   const next = () => {
//     if (singlePageMode) {
//       setCurrentPageIdx((i) => Math.min(i + 1, flipPages.length - 1));
//     } else {
//       setCurrentSpreadIdx((i) => {
//         const newIdx = Math.min(i + 1, spreads.length - 1);
//         console.log("🔄 Next navigation:", {
//           from: i,
//           to: newIdx,
//           spreadsLength: spreads.length,
//         });
//         return newIdx;
//       });
//     }
//   };
//   const prev = () => {
//     if (singlePageMode) {
//       setCurrentPageIdx((i) => Math.max(i - 1, 0));
//     } else {
//       setCurrentSpreadIdx((i) => {
//         const newIdx = Math.max(i - 1, 0);
//         console.log("🔄 Prev navigation:", {
//           from: i,
//           to: newIdx,
//           spreadsLength: spreads.length,
//         });
//         return newIdx;
//       });
//     }
//   };

//   const swipeHandlers = useSwipeable({
//     onSwipedLeft: next,
//     onSwipedRight: prev,
//     disabled: !singlePageMode,
//     trackMouse: true,
//   });

//   function updatePageLayout(fp, newLayout) {
//     const origPageId = Math.floor(fp.id / 1000);
//     setBook((prev) => {
//       if (!prev) return prev;
//       const newPages = prev.pages.map((p) => {
//         if (p.id === origPageId) {
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
//   }

//   function updatePageText(fp, newValue) {
//     const origPageId = Math.floor(fp.id / 1000);
//     setBook((prev) => {
//       if (!prev) return prev;
//       const newPages = prev.pages.map((p) => {
//         if (p.id === origPageId) {
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
//   }

//   function handleSelectPage(pageIdx) {
//     if (isEditing) return;
//     setSelectedPageIdx(pageIdx);
//     if (!book) return;
//     let pageData;
//     book.pages.forEach((p) => {
//       if (p.isCover && pageIdx === -1) pageData = p;
//       if (p.isBackCover && pageIdx === -2) pageData = p;
//       if (p.id * 1000 === pageIdx || p.id * 1000 + 1 === pageIdx) {
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
//           p.id * 1000,
//           p.id * 1000 + 1,
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
//   }

//   const handlePrint = () => {
//     setShowShippingForm(true);
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
//   console.log("📖 Spread selection:", {
//     currentSpreadIdx,
//     spreadsLength: spreads.length,
//     selectedSpread: spreads[currentSpreadIdx]?.map((p) => ({
//       id: p.id,
//       isCover: p.isCover,
//       isBackCover: p.isBackCover,
//     })),
//     pagesToRenderCount: pagesToRender.length,
//   });

//   // Debug current spread
//   console.log("🎯 Current spread:", {
//     currentSpreadIdx,
//     spreadsLength: spreads.length,
//     singlePageMode,
//     currentPageIdx,
//     pagesToRenderCount: pagesToRender.length,
//     pagesToRender: pagesToRender.map((p) => ({
//       id: p.id,
//       isCover: p.isCover,
//       isBackCover: p.isBackCover,
//     })),
//     isValidIndex: currentSpreadIdx < spreads.length,
//   });

//   const spreadPx =
//     pagesToRender.length === 1
//       ? pageConfig.finalWidth
//       : pageConfig.finalWidth * 2 + 32;

//   // Debug container width calculation
//   console.log("📏 Container width:", {
//     pagesToRenderLength: pagesToRender.length,
//     spreadPx,
//     pageConfigFinalWidth: pageConfig.finalWidth,
//     calculatedWidth:
//       pagesToRender.length * pageConfig.finalWidth +
//       (pagesToRender.length > 1 ? 32 : 0),
//   });

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       <Header />
//       <main className="flex-grow mx-auto px-4 py-8 w-full max-w-full overflow-hidden">
//         <h1 className="text-2xl font-bold mb-4 text-center">
//           {" "}
//           {book ? book.title : ""}
//         </h1>

//         {loading ? (
//           // ← only *this* block shows while loading
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
//                           : prog.message,
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
//                 <div className="flex gap-0.5 justify-center w-full">
//                   {pagesToRender.map((fp) => {
//                     // ── Log 4: show every frame's key props before rendering
//                     console.log("🖼️ Render FP", {
//                       id: fp.id,
//                       x: fp.x,
//                       y: fp.y,
//                       width: fp.width,
//                       height: fp.height,
//                       scale: currentScale,
//                     });

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
//                           {console.log(
//                             "🎨 Image slice",
//                             fp.id,
//                             fp.side,
//                             fp.side ?? (fp.id % 2 ? "right" : "left"),
//                           )}
//                           <PageImage
//                             url={fp.imageUrl}
//                             side={fp.side ?? (fp.id % 2 ? "right" : "left")}
//                           />
//                           <ResizableTextBox
//                             x={fp.x ?? 50}
//                             y={fp.y ?? 50}
//                             width={fp.width ?? 200}
//                             height={fp.height ?? 50}
//                             fontSize={fp.fontSize ?? DEFAULT_FONT_SIZE}
//                             color={fp.color ?? "#000000"}
//                             fontFamily={fp.fontFamily ?? DEFAULT_FONT_FAMILY}
//                             lines={fp.content}
//                             scale={currentScale}
//                             initialSide={fp.id % 1000 === 0 ? "left" : "right"}
//                             onUpdate={(newLayout) =>
//                               updatePageLayout(fp, newLayout)
//                             }
//                             onTextChange={(newValue) =>
//                               updatePageText(fp, newValue)
//                             }
//                             setGlobalIsEditing={setIsEditing}
//                           />
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
//                 {/* <div className="w-full space-y-3">
//                   <div className="mx-auto h-1.5 w-12 bg-gray-300 rounded-full mb-3" />

//                   <div className="grid grid-cols-3 gap-2 items-center">
//                     <span className="font-medium text-sm">Font size</span>
//                     <input
//                       type="range"
//                       min={8}
//                       max={72}
//                       value={editingFontSize}
//                       onChange={(e) => {
//                         const v = +e.target.value;
//                         setEditingFontSize(v);
//                         handleUpdateStyle(v, editingColor, editingFontFamily);
//                       }}
//                       className="w-full"
//                     />
//                     <span className="text-right text-sm font-mono">
//                       {editingFontSize}
//                     </span>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4 items-center">
//                     <div className="flex items-center justify-between">
//                       <span className="font-medium text-sm">Color</span>
//                       <input
//                         type="color"
//                         value={editingColor}
//                         onChange={(e) => {
//                           setEditingColor(e.target.value);
//                           handleUpdateStyle(
//                             editingFontSize,
//                             e.target.value,
//                             editingFontFamily,
//                           );
//                         }}
//                         className="w-8 h-8 rounded border"
//                       />
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <span className="font-medium text-sm">Font</span>
//                       <select
//                         value={editingFontFamily}
//                         onChange={(e) => {
//                           setEditingFontFamily(e.target.value);
//                           handleUpdateStyle(
//                             editingFontSize,
//                             editingColor,
//                             e.target.value,
//                           );
//                         }}
//                         className="border rounded p-1 text-sm min-w-0 flex-1 ml-2"
//                       >
//                         <option value="Nunito">Nunito</option>
//                         <option value="Baloo 2">Baloo 2</option>
//                         <option value="Chewy">Chewy</option>
//                       </select>
//                     </div>
//                   </div>
//                 </div> */}
//               </div>
//             ) : (
//               /* ORIGINAL inline controls for desktop */
//               <div
//                 className="mt-6 flex items-center justify-center space-x-8 mx-auto"
//                 style={{ width: `${spreadPx}px`, maxWidth: "100%" }}
//               >
//                 {/* <label className="flex items-center space-x-2">
//                   <span className="font-medium">Font size:</span>
//                   <input
//                     type="number"
//                     min={8}
//                     max={72}
//                     value={editingFontSize}
//                     onChange={(e) => {
//                       const v = +e.target.value;
//                       setEditingFontSize(v);
//                       handleUpdateStyle(v, editingColor, editingFontFamily);
//                     }}
//                     className="w-16 border border-gray-300 rounded p-1"
//                   />
//                 </label>
//                 <label className="flex items-center space-x-3">
//                   <span className="font-medium">Color:</span>
//                   <input
//                     type="color"
//                     value={editingColor}
//                     onChange={(e) => {
//                       setEditingColor(e.target.value);
//                       handleUpdateStyle(
//                         editingFontSize,
//                         e.target.value,
//                         editingFontFamily,
//                       );
//                     }}
//                   />
//                 </label>
//                 <label className="flex items-center space-x-3">
//                   <span className="font-medium">Font Family:</span>
//                   <select
//                     value={editingFontFamily}
//                     onChange={(e) => {
//                       setEditingFontFamily(e.target.value);
//                       handleUpdateStyle(
//                         editingFontSize,
//                         editingColor,
//                         e.target.value,
//                       );
//                     }}
//                     className="border border-gray-300 rounded p-1"
//                   >
//                     <option value="Nunito">Nunito</option>
//                     <option value="Baloo 2">Baloo 2</option>
//                     <option value="Chewy">Chewy</option>
//                   </select>
//                 </label> */}

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

//             {/* PDF & Print Buttons - Yellow themed and mobile optimized */}
//             <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-6 md:mt-12">
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

//             {showShippingForm && !orderCompleted && (
//               <ShippingForm onSubmit={handleShippingSubmit} />
//             )}
//             {orderCompleted && (
//               <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
//                 <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
//                 <span>
//                   Order successfully placed! Your book will be delivered soon.
//                 </span>
//               </div>
//             )}
//           </>
//         )}
//       </main>
//       <Footer />
//     </div>
//   );
// }
// import React, { useState, useEffect, useRef } from "react";
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

// const FULL_W = 2048;
// const FULL_H = 1024;
// const HALF_W = FULL_W / 2;
// const LOGICAL_W = 600;
// const LOGICAL_H = Math.round((FULL_H * LOGICAL_W) / HALF_W);
// const DEFAULT_FONT_SIZE = 22;
// const DEFAULT_FONT_FAMILY = "Kalam";

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
//         console.log("🎯 ScalablePreview:", {
//           available,
//           scaleFactor,
//           finalWidth: pageConfig.finalWidth,
//         });
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
//   lines,
//   scale,
//   onUpdate,
//   onTextChange,
//   setGlobalIsEditing,
//   initialSide, // "left" or "right" when mounted (based on page id)
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
//   const textBoxRef = useRef(null);

//   // Sync internal position and size if parent's values change.
//   useEffect(() => {
//     setLocalX(x);
//     setLocalY(y);
//     setLocalWidth(width);
//     setLocalHeight(height);
//     setCurrentSide(initialSide);
//   }, [x, y, width, height, initialSide]);

//   useEffect(() => {
//     const id = Math.random().toString(36).slice(2, 7);
//     setTimeout(() => {
//       const box = textBoxRef.current?.closest(".rnd");
//       if (box) {
//         const r = box.getBoundingClientRect();
//         console.log(`📦 Box[${id}] mount`, {
//           initX: x,
//           initY: y,
//           scaledX: r.left,
//           scaledY: r.top,
//           scale,
//         });
//       }
//     }, 0);
//   }, []);

//   return (
//     <Rnd
//       bounds="parent"
//       enableUserSelectHack={false}
//       disableDragging={isEditingMode}
//       size={{ width: localWidth, height: localHeight }}
//       position={{ x: localX, y: localY }}
//       onDrag={(e, d) => {
//         const newX = d.x / scale;
//         const newY = d.y / scale;

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
//         const finalX = d.x / scale;
//         const finalY = d.y / scale;
//         setLocalX(finalX);
//         setLocalY(finalY);
//         onUpdate({
//           x: finalX,
//           y: finalY,
//           width: localWidth,
//           height: localHeight,
//           side: currentSide,
//         });
//         console.log("📦 Box drag/resize", {
//           side: currentSide,
//           x: localX,
//           y: localY,
//           scale,
//         });
//       }}
//       onResize={(e, direction, ref, delta, position) => {
//         // Live-update size while resizing for smoother UX
//         const newW = ref.offsetWidth / scale;
//         const newH = ref.offsetHeight / scale;
//         setLocalWidth(newW);
//         setLocalHeight(newH);
//         const updatedX = position.x / scale;
//         const updatedY = position.y / scale;
//         setLocalX(updatedX);
//         setLocalY(updatedY);
//       }}
//       onResizeStop={(e, direction, ref, delta, position) => {
//         const updatedX = position.x / scale;
//         const updatedY = position.y / scale;
//         const newW = ref.offsetWidth / scale;
//         const newH = ref.offsetHeight / scale;
//         setLocalX(updatedX);
//         setLocalY(updatedY);
//         setLocalWidth(newW);
//         setLocalHeight(newH);
//         onUpdate({
//           x: updatedX,
//           y: updatedY,
//           width: newW,
//           height: newH,
//           side: currentSide,
//         });
//         console.log("📦 Box drag/resize", {
//           side: currentSide,
//           x: localX,
//           y: localY,
//           scale,
//         });
//       }}
//       onMouseDown={(e) => e.stopPropagation()}
//       style={{
//         border: isEditingMode
//           ? "2px solid #3b82f6"
//           : lines.join("").trim() === ""
//             ? "none"
//             : "1px dashed #ddd",
//         cursor: isEditingMode ? "text" : "move",
//         background: "transparent",
//         boxSizing: "border-box",
//       }}
//     >
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
//           onTextChange(newLines);
//           window.getSelection()?.removeAllRanges();
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

//   // NEW: Track which image URLs are loaded and when all are ready
//   const [loadedImageUrls, setLoadedImageUrls] = useState<Set<string>>(
//     new Set(),
//   );
//   const [imagesReady, setImagesReady] = useState(false);

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

//   // NEW: Preload all images once book is ready
//   useEffect(() => {
//     if (!book || !book.pages) return;
//     setLoadedImageUrls(new Set());
//     setImagesReady(false);

//     const urls = new Set<string>();
//     const coverUrls: string[] = book.cover?.final_cover_urls || [];
//     coverUrls.forEach((u: string) => u && urls.add(u));
//     book.pages.forEach((p: any) => {
//       if (p?.expanded_scene_url) urls.add(p.expanded_scene_url);
//     });
//     if (book.cover?.back_cover_url) urls.add(book.cover.back_cover_url);

//     const total = urls.size;
//     if (total === 0) {
//       setImagesReady(true);
//       return;
//     }

//     let loadedCount = 0;
//     let cancelled = false;

//     const markLoaded = (url: string) => {
//       setLoadedImageUrls((prev) => {
//         const next = new Set(prev);
//         next.add(url);
//         return next;
//       });
//       loadedCount += 1;
//       if (!cancelled && loadedCount >= total) {
//         setImagesReady(true);
//       }
//     };

//     urls.forEach((url) => {
//       const img = new Image();
//       img.onload = () => markLoaded(url);
//       img.onerror = () => markLoaded(url); // don't block on errors
//       img.src = url;
//     });

//     return () => {
//       cancelled = true;
//     };
//   }, [book]);

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
//       console.table({
//         viewport,
//         viewer_frame: viewer,
//         spreadContainer: spread,
//         scaledCanvas: scaled,
//         currentScale,
//       });
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
//       });
//     }
//     book.pages.forEach((p) => {
//       if (!p.isCover && !p.isBackCover) {
//         result.push({
//           id: p.current_scene_index * 1000,
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
//         });
//         result.push({
//           id: p.current_scene_index * 1000 + 1,
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
//   console.log("📚 Book structure:", {
//     flipPagesCount: flipPages.length,
//     spreadsCount: spreads.length,
//     flipPages: flipPages.map((fp) => ({
//       id: fp.id,
//       isCover: fp.isCover,
//       isBackCover: fp.isBackCover,
//     })),
//     spreads: spreads.map((spread, idx) => ({
//       spreadIdx: idx,
//       pages: spread.map((p) => ({
//         id: p.id,
//         isCover: p.isCover,
//         isBackCover: p.isBackCover,
//       })),
//     })),
//   });

//   const next = () => {
//     if (singlePageMode) {
//       setCurrentPageIdx((i) => Math.min(i + 1, flipPages.length - 1));
//     } else {
//       setCurrentSpreadIdx((i) => {
//         const newIdx = Math.min(i + 1, spreads.length - 1);
//         console.log("🔄 Next navigation:", {
//           from: i,
//           to: newIdx,
//           spreadsLength: spreads.length,
//         });
//         return newIdx;
//       });
//     }
//   };
//   const prev = () => {
//     if (singlePageMode) {
//       setCurrentPageIdx((i) => Math.max(i - 1, 0));
//     } else {
//       setCurrentSpreadIdx((i) => {
//         const newIdx = Math.max(i - 1, 0);
//         console.log("🔄 Prev navigation:", {
//           from: i,
//           to: newIdx,
//           spreadsLength: spreads.length,
//         });
//         return newIdx;
//       });
//     }
//   };

//   const swipeHandlers = useSwipeable({
//     onSwipedLeft: next,
//     onSwipedRight: prev,
//     disabled: !singlePageMode,
//     trackMouse: true,
//   });

//   function updatePageLayout(fp, newLayout) {
//     const origPageId = Math.floor(fp.id / 1000);
//     setBook((prev) => {
//       if (!prev) return prev;
//       const newPages = prev.pages.map((p) => {
//         if (p.id === origPageId) {
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
//   }

//   function updatePageText(fp, newValue) {
//     const origPageId = Math.floor(fp.id / 1000);
//     setBook((prev) => {
//       if (!prev) return prev;
//       const newPages = prev.pages.map((p) => {
//         if (p.id === origPageId) {
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
//   }

//   function handleSelectPage(pageIdx) {
//     if (isEditing) return;
//     setSelectedPageIdx(pageIdx);
//     if (!book) return;
//     let pageData;
//     book.pages.forEach((p) => {
//       if (p.isCover && pageIdx === -1) pageData = p;
//       if (p.isBackCover && pageIdx === -2) pageData = p;
//       if (p.id * 1000 === pageIdx || p.id * 1000 + 1 === pageIdx) {
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
//           p.id * 1000,
//           p.id * 1000 + 1,
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

//     console.log("🎯 handleUpdateColor targets (by url/side)", targetFlipPages);

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
//       console.log("✅ handleUpdateColor applied updates:", updates);
//       return { ...prev, pages: updated };
//     });
//   }

//   const handleColorClick = (hex: string) => {
//     setEditingColor(hex);
//     console.log("🎨 Color click", {
//       hex,
//       singlePageMode,
//       currentSpreadIdx,
//       currentPageIdx,
//     });
//     handleUpdateColor(hex);
//   };

//   const handlePrint = () => {
//     setShowShippingForm(true);
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
//   console.log("📖 Spread selection:", {
//     currentSpreadIdx,
//     spreadsLength: spreads.length,
//     selectedSpread: spreads[currentSpreadIdx]?.map((p) => ({
//       id: p.id,
//       isCover: p.isCover,
//       isBackCover: p.isBackCover,
//     })),
//     pagesToRenderCount: pagesToRender.length,
//   });

//   // Debug current spread
//   console.log("🎯 Current spread:", {
//     currentSpreadIdx,
//     spreadsLength: spreads.length,
//     singlePageMode,
//     currentPageIdx,
//     pagesToRenderCount: pagesToRender.length,
//     pagesToRender: pagesToRender.map((p) => ({
//       id: p.id,
//       isCover: p.isCover,
//       isBackCover: p.isBackCover,
//     })),
//     isValidIndex: currentSpreadIdx < spreads.length,
//   });

//   const spreadPx =
//     pagesToRender.length === 1
//       ? pageConfig.finalWidth
//       : pageConfig.finalWidth * 2 + 32;

//   // Debug container width calculation
//   console.log("📏 Container width:", {
//     pagesToRenderLength: pagesToRender.length,
//     spreadPx,
//     pageConfigFinalWidth: pageConfig.finalWidth,
//     calculatedWidth:
//       pagesToRender.length * pageConfig.finalWidth +
//       (pagesToRender.length > 1 ? 32 : 0),
//   });

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       <Header />
//       <main className="flex-grow mx-auto px-4 py-8 w-full max-w-full overflow-hidden">
//         <h1 className="text-2xl font-bold mb-4 text-center">
//           {" "}
//           {book ? book.title : ""}
//         </h1>

//         {loading || !imagesReady ? (
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
//                 <div className="flex gap-0.5 justify-center w-full">
//                   {pagesToRender.map((fp) => {
//                     // ── Log 4: show every frame's key props before rendering
//                     console.log("🖼️ Render FP", {
//                       id: fp.id,
//                       x: fp.x,
//                       y: fp.y,
//                       width: fp.width,
//                       height: fp.height,
//                       scale: currentScale,
//                     });

//                     // Resolve latest color from book state to reflect immediate updates
//                     let resolvedColor = fp.color ?? "#000000";
//                     if (book && typeof fp.id === "number" && fp.id >= 0) {
//                       const originalId = Math.floor(fp.id / 1000);
//                       const isLeft = fp.id % 1000 === 0;
//                       const page = book.pages?.find(
//                         (p: any) => p.id === originalId,
//                       );
//                       if (page) {
//                         resolvedColor = isLeft
//                           ? (page.leftTextColor ?? resolvedColor)
//                           : (page.rightTextColor ?? resolvedColor);
//                       }
//                     }
//                     console.log(
//                       "🖍️ Resolved color for FP",
//                       fp.id,
//                       resolvedColor,
//                     );

//                     const isImgLoaded = loadedImageUrls.has(fp.imageUrl);

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
//                           {console.log(
//                             "🎨 Image slice",
//                             fp.id,
//                             fp.side,
//                             fp.side ?? (fp.id % 2 ? "right" : "left"),
//                           )}
//                           {/* Image */}
//                           <PageImage
//                             url={fp.imageUrl}
//                             side={fp.side ?? (fp.id % 2 ? "right" : "left")}
//                             isLoaded={isImgLoaded}
//                             onLoad={() =>
//                               setLoadedImageUrls((prev) => {
//                                 const next = new Set(prev);
//                                 next.add(fp.imageUrl);
//                                 return next;
//                               })
//                             }
//                           />

//                           {/* Loading overlay to avoid showing previous image */}
//                           {!isImgLoaded && (
//                             <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
//                               <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-imaginory-yellow"></div>
//                             </div>
//                           )}

//                           {/* Text box - only show after image is fully loaded */}
//                           {isImgLoaded && (
//                             <ResizableTextBox
//                               x={fp.x ?? 50}
//                               y={fp.y ?? 50}
//                               width={fp.width ?? 200}
//                               height={fp.height ?? 50}
//                               fontSize={fp.fontSize ?? DEFAULT_FONT_SIZE}
//                               color={resolvedColor}
//                               fontFamily={fp.fontFamily ?? DEFAULT_FONT_FAMILY}
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

//             {/* PDF & Print Buttons - Yellow themed and mobile optimized */}
//             <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-6 md:mt-12">
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

//             {showShippingForm && !orderCompleted && (
//               <ShippingForm onSubmit={handleShippingSubmit} />
//             )}
//             {orderCompleted && (
//               <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
//                 <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
//                 <span>
//                   Order successfully placed! Your book will be delivered soon.
//                 </span>
//               </div>
//             )}
//           </>
//         )}
//       </main>
//       <Footer />
//     </div>
//   );
// }
import React, { useState, useEffect, useRef } from "react";
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

const FULL_W = 2048;
const FULL_H = 1024;
const HALF_W = FULL_W / 2;
const LOGICAL_W = 600;
const LOGICAL_H = Math.round((FULL_H * LOGICAL_W) / HALF_W);
const DEFAULT_FONT_SIZE = 22;
const DEFAULT_FONT_FAMILY = "Cormorant Garamond";
const DEFAULT_FONT_WEIGHT = 700;

// Configuration for the pages:
const MOBILE_BREAKPOINT = 768;
const pageConfig = {
  finalWidth: LOGICAL_W,
  finalHeight: LOGICAL_H,
  idealMinContainerWidth: 2 * LOGICAL_W + 32,
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
  React.useEffect(() => {
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
        console.log("🎯 ScalablePreview:", {
          available,
          scaleFactor,
          finalWidth: pageConfig.finalWidth,
        });
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
  initialSide, // "left" or "right" when mounted (based on page id)
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
  const textBoxRef = useRef(null);

  // Sync internal position and size if parent's values change.
  useEffect(() => {
    setLocalX(x);
    setLocalY(y);
    setLocalWidth(width);
    setLocalHeight(height);
    setCurrentSide(initialSide);
  }, [x, y, width, height, initialSide]);

  useEffect(() => {
    const id = Math.random().toString(36).slice(2, 7);
    setTimeout(() => {
      const box = textBoxRef.current?.closest(".rnd");
      if (box) {
        const r = box.getBoundingClientRect();
        console.log(`📦 Box[${id}] mount`, {
          initX: x,
          initY: y,
          scaledX: r.left,
          scaledY: r.top,
          scale,
        });
      }
    }, 0);
  }, []);

  return (
    <Rnd
      bounds="parent"
      enableUserSelectHack={false}
      disableDragging={isEditingMode}
      size={{ width: localWidth, height: localHeight }}
      position={{ x: localX, y: localY }}
      onDrag={(e, d) => {
        const newX = d.x / scale;
        const newY = d.y / scale;

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
        const finalX = d.x / scale;
        const finalY = d.y / scale;
        setLocalX(finalX);
        setLocalY(finalY);
        onUpdate({
          x: finalX,
          y: finalY,
          width: localWidth,
          height: localHeight,
          side: currentSide,
        });
        console.log("📦 Box drag/resize", {
          side: currentSide,
          x: localX,
          y: localY,
          scale,
        });
      }}
      onResize={(e, direction, ref, delta, position) => {
        // Live-update size while resizing for smoother UX
        const newW = ref.offsetWidth / scale;
        const newH = ref.offsetHeight / scale;
        setLocalWidth(newW);
        setLocalHeight(newH);
        const updatedX = position.x / scale;
        const updatedY = position.y / scale;
        setLocalX(updatedX);
        setLocalY(updatedY);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const updatedX = position.x / scale;
        const updatedY = position.y / scale;
        const newW = ref.offsetWidth / scale;
        const newH = ref.offsetHeight / scale;
        setLocalX(updatedX);
        setLocalY(updatedY);
        setLocalWidth(newW);
        setLocalHeight(newH);
        onUpdate({
          x: updatedX,
          y: updatedY,
          width: newW,
          height: newH,
          side: currentSide,
        });
        console.log("📦 Box drag/resize", {
          side: currentSide,
          x: localX,
          y: localY,
          scale,
        });
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        border: isEditingMode
          ? "2px solid #3b82f6"
          : lines.join("").trim() === ""
            ? "none"
            : "1px dashed #ddd",
        cursor: isEditingMode ? "text" : "move",
        background: "transparent",
        boxSizing: "border-box",
      }}
    >
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
          onTextChange(newLines);
          window.getSelection()?.removeAllRanges();
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
      console.table({
        viewport,
        viewer_frame: viewer,
        spreadContainer: spread,
        scaledCanvas: scaled,
        currentScale,
      });
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
    }
    book.pages.forEach((p) => {
      if (!p.isCover && !p.isBackCover) {
        result.push({
          id: p.current_scene_index * 1000,
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
          id: p.current_scene_index * 1000 + 1,
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
  console.log("📚 Book structure:", {
    flipPagesCount: flipPages.length,
    spreadsCount: spreads.length,
    flipPages: flipPages.map((fp) => ({
      id: fp.id,
      isCover: fp.isCover,
      isBackCover: fp.isBackCover,
    })),
    spreads: spreads.map((spread, idx) => ({
      spreadIdx: idx,
      pages: spread.map((p) => ({
        id: p.id,
        isCover: p.isCover,
        isBackCover: p.isBackCover,
      })),
    })),
  });

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
    disabled: !singlePageMode,
    trackMouse: true,
  });

  function updatePageLayout(fp, newLayout) {
    const origPageId = Math.floor(fp.id / 1000);
    setBook((prev) => {
      if (!prev) return prev;
      const newPages = prev.pages.map((p) => {
        if (p.id === origPageId) {
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
  }

  function updatePageText(fp, newValue) {
    const origPageId = Math.floor(fp.id / 1000);
    setBook((prev) => {
      if (!prev) return prev;
      const newPages = prev.pages.map((p) => {
        if (p.id === origPageId) {
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
  }

  function handleSelectPage(pageIdx) {
    if (isEditing) return;
    setSelectedPageIdx(pageIdx);
    if (!book) return;
    let pageData;
    book.pages.forEach((p) => {
      if (p.isCover && pageIdx === -1) pageData = p;
      if (p.isBackCover && pageIdx === -2) pageData = p;
      if (p.id * 1000 === pageIdx || p.id * 1000 + 1 === pageIdx) {
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
          p.id * 1000,
          p.id * 1000 + 1,
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

    console.log("🎯 handleUpdateColor targets (by url/side)", targetFlipPages);

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
      console.log("✅ handleUpdateColor applied updates:", updates);
      return { ...prev, pages: updated };
    });
  }

  const handleColorClick = (hex: string) => {
    setEditingColor(hex);
    console.log("🎨 Color click", {
      hex,
      singlePageMode,
      currentSpreadIdx,
      currentPageIdx,
    });
    handleUpdateColor(hex);
  };

  const handlePrint = () => {
    setShowShippingForm(true);
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
  console.log("📖 Spread selection:", {
    currentSpreadIdx,
    spreadsLength: spreads.length,
    selectedSpread: spreads[currentSpreadIdx]?.map((p) => ({
      id: p.id,
      isCover: p.isCover,
      isBackCover: p.isBackCover,
    })),
    pagesToRenderCount: pagesToRender.length,
  });

  // Debug current spread
  console.log("🎯 Current spread:", {
    currentSpreadIdx,
    spreadsLength: spreads.length,
    singlePageMode,
    currentPageIdx,
    pagesToRenderCount: pagesToRender.length,
    pagesToRender: pagesToRender.map((p) => ({
      id: p.id,
      isCover: p.isCover,
      isBackCover: p.isBackCover,
    })),
    isValidIndex: currentSpreadIdx < spreads.length,
  });

  const spreadPx =
    pagesToRender.length === 1
      ? pageConfig.finalWidth
      : pageConfig.finalWidth * 2 + 32;

  // Debug container width calculation
  console.log("📏 Container width:", {
    pagesToRenderLength: pagesToRender.length,
    spreadPx,
    pageConfigFinalWidth: pageConfig.finalWidth,
    calculatedWidth:
      pagesToRender.length * pageConfig.finalWidth +
      (pagesToRender.length > 1 ? 32 : 0),
  });

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
                    const isPreloaded = readyUrls.has(fp.imageUrl);
                    const isImageLoaded = loadedImages.has(fp.imageUrl);
                    const isFullyReady = isPreloaded && isImageLoaded;

                    // ── Log 4: show every frame's key props before rendering
                    console.log("🖼️ Render FP", {
                      id: fp.id,
                      x: fp.x,
                      y: fp.y,
                      width: fp.width,
                      height: fp.height,
                      scale: currentScale,
                      isPreloaded,
                      isImageLoaded,
                      isFullyReady,
                    });

                    // Resolve latest color from book state to reflect immediate updates
                    let resolvedColor = fp.color ?? "#000000";
                    if (book && typeof fp.id === "number" && fp.id >= 0) {
                      const originalId = Math.floor(fp.id / 1000);
                      const isLeft = fp.id % 1000 === 0;
                      const page = book.pages?.find(
                        (p: any) => p.id === originalId,
                      );
                      if (page) {
                        resolvedColor = isLeft
                          ? (page.leftTextColor ?? resolvedColor)
                          : (page.rightTextColor ?? resolvedColor);
                      }
                    }
                    console.log(
                      "🖍️ Resolved color for FP",
                      fp.id,
                      resolvedColor,
                    );

                    return (
                      <div
                        key={fp.id}
                        className="relative bg-white overflow-hidden flex-shrink-0"
                        style={{
                          width: singlePageMode
                            ? "100%"
                            : pageConfig.finalWidth,
                          height: singlePageMode
                            ? pageConfig.finalHeight / 2
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
                        <ScalablePreview onScaleChange={setCurrentScale}>
                          {console.log(
                            "🎨 Image slice",
                            fp.id,
                            fp.side,
                            fp.side ?? (fp.id % 2 ? "right" : "left"),
                          )}

                          {/* Always show spinner until image is fully ready */}
                          {!isFullyReady && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
                              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-imaginory-yellow"></div>
                            </div>
                          )}

                          {/* Image - render as soon as preloaded, but may still be loading visually */}
                          {isPreloaded && (
                            <PageImage
                              url={fp.imageUrl}
                              side={fp.side ?? (fp.id % 2 ? "right" : "left")}
                              isLoaded={isImageLoaded}
                              onLoad={() => handleImageLoad(fp.imageUrl)}
                            />
                          )}

                          {/* Text box - only show after image is completely loaded */}
                          {isFullyReady && (
                            <ResizableTextBox
                              x={fp.x ?? 50}
                              y={fp.y ?? 50}
                              width={fp.width ?? 200}
                              height={fp.height ?? 50}
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

            {/* PDF & Print Buttons - Yellow themed and mobile optimized */}
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-6 md:mt-12">
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

            {showShippingForm && !orderCompleted && (
              <ShippingForm onSubmit={handleShippingSubmit} />
            )}
            {orderCompleted && (
              <div className="flex items-center justify-center bg-green-100 text-green-800 p-4 rounded-lg mb-8 max-w-md mx-auto mt-8">
                <i className="fas fa-check-circle text-green-500 mr-2 text-xl"></i>
                <span>
                  Order successfully placed! Your book will be delivered soon.
                </span>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
