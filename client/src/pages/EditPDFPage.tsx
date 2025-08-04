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

function PageImage({
  url,
  side,
}: {
  url: string;
  side: "left" | "right" | "full";
}) {
  if (side === "full") {
    // cover: fill the whole canvas
    return (
      <img
        src={url}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
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
      }}
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
  // Track which page the box is on
  const [currentSide, setCurrentSide] = useState(initialSide);
  // Track editing mode for styling.
  const [isEditingMode, setIsEditingMode] = useState(false);
  const textBoxRef = useRef(null);

  // Sync internal position if parent's values change.
  useEffect(() => {
    setLocalX(x);
    setLocalY(y);
    setCurrentSide(initialSide);
  }, [x, y, initialSide]);

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
      size={{ width: width, height: height }}
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
          onUpdate({ x: excess, y: newY, width, height, side: "right" });
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
          onUpdate({ x: newXForLeft, y: newY, width, height, side: "left" });
          return;
        }
        // Otherwise update the position normally.
        setLocalX(newX);
        setLocalY(newY);
        onUpdate({ x: newX, y: newY, width, height, side: currentSide });
      }}
      onDragStop={(e, d) => {
        const finalX = d.x / scale;
        const finalY = d.y / scale;
        setLocalX(finalX);
        setLocalY(finalY);
        onUpdate({ x: finalX, y: finalY, width, height, side: currentSide });
        console.log("📦 Box drag/resize", {
          side: currentSide,
          x: localX,
          y: localY,
          scale,
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const updatedX = position.x / scale;
        const updatedY = position.y / scale;
        setLocalX(updatedX);
        setLocalY(updatedY);
        onUpdate({
          x: updatedX,
          y: updatedY,
          width: ref.offsetWidth / scale,
          height: ref.offsetHeight / scale,
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
          padding: "10px",
          outline: "none",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
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

  // Editing controls for selected text box
  const [selectedPageIdx, setSelectedPageIdx] = useState(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [editingFontSize, setEditingFontSize] = useState(16);
  const [editingColor, setEditingColor] = useState("#000000");
  const [editingFontFamily, setEditingFontFamily] = useState("Nunito");

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
        fontSize: p.fontSize ?? 16,
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

    const coverUrl = book.cover?.final_cover_url;
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
        fontSize: 20,
        color: "#ffffff",
      });
    }
    book.pages.forEach((p) => {
      if (!p.isCover && !p.isBackCover) {
        result.push({
          id: p.id * 1000,
          side: "left",
          imageUrl: p.expanded_scene_url,
          content: p.leftText || [],
          x: p.leftX ?? pageConfig.finalWidth / 2 - 100,
          y: p.leftY ?? pageConfig.finalHeight / 2 - 25,
          width: p.width,
          height: p.height ?? 100,
          fontSize: p.fontSize ?? 16,
          color: p.leftTextColor ?? "#000000",
          fontFamily: p.leftFontFamily ?? "Nunito",
        });
        result.push({
          id: p.id * 1000 + 1,
          side: "right",
          imageUrl: p.expanded_scene_url,
          content: p.rightText || [],
          x: p.rightX ?? pageConfig.finalWidth / 2 - 100,
          y: p.rightY ?? pageConfig.finalHeight / 2 - 25,
          width: p.width,
          height: p.height ?? 100,
          fontSize: p.fontSize ?? 16,
          color: p.rightTextColor ?? "#000000",
          fontFamily: p.rightFontFamily ?? "Nunito",
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
    while (idx < pages.length) {
      if (idx === pages.length - 1) {
        spreads.push([pages[idx]]);
        idx++;
      } else {
        spreads.push([pages[idx], pages[idx + 1]]);
        idx += 2;
      }
    }
    return spreads;
  }

  const flipPages = buildFlipPages();
  const spreads = buildSpreads(flipPages);

  const next = () => {
    if (singlePageMode) {
      setCurrentPageIdx((i) => Math.min(i + 1, flipPages.length - 1));
    } else {
      setCurrentSpreadIdx((i) => Math.min(i + 1, spreads.length - 1));
    }
  };
  const prev = () => {
    if (singlePageMode) {
      setCurrentPageIdx((i) => Math.max(i - 1, 0));
    } else {
      setCurrentSpreadIdx((i) => Math.max(i - 1, 0));
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
      setEditingFontSize(pageData.fontSize ?? 16);
      setEditingColor(pageData.color ?? "#000000");
      setEditingFontFamily(pageData.fontFamily ?? "Nunito");
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

  const spreadPx =
    pagesToRender.length === 1
      ? pageConfig.finalWidth
      : pageConfig.finalWidth * 2 + 32;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow mx-auto px-4 py-8 w-full max-w-full overflow-hidden">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {" "}
          {book ? book.title : ""}
        </h1>

        {loading ? (
          // ← only *this* block shows while loading
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
                          : prog.message,
                  }}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-red-600" />
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
                <div className="flex gap-0.5 justify-center w-full">
                  {pagesToRender.map((fp) => {
                    // ── Log 4: show every frame's key props before rendering
                    console.log("🖼️ Render FP", {
                      id: fp.id,
                      x: fp.x,
                      y: fp.y,
                      width: fp.width,
                      height: fp.height,
                      scale: currentScale,
                    });

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
                          <PageImage
                            url={fp.imageUrl}
                            side={fp.side ?? (fp.id % 2 ? "right" : "left")}
                          />
                          <ResizableTextBox
                            x={fp.x ?? 50}
                            y={fp.y ?? 50}
                            width={fp.width ?? 200}
                            height={fp.height ?? 50}
                            fontSize={fp.fontSize ?? 16}
                            color={fp.color ?? "#000000"}
                            fontFamily={fp.fontFamily ?? "Nunito"}
                            lines={fp.content}
                            scale={currentScale}
                            initialSide={fp.id % 1000 === 0 ? "left" : "right"}
                            onUpdate={(newLayout) =>
                              updatePageLayout(fp, newLayout)
                            }
                            onTextChange={(newValue) =>
                              updatePageText(fp, newValue)
                            }
                            setGlobalIsEditing={setIsEditing}
                          />
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
                <div className="w-full space-y-3">
                  <div className="mx-auto h-1.5 w-12 bg-gray-300 rounded-full mb-3" />

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="font-medium text-sm">Font size</span>
                    <input
                      type="range"
                      min={8}
                      max={72}
                      value={editingFontSize}
                      onChange={(e) => {
                        const v = +e.target.value;
                        setEditingFontSize(v);
                        handleUpdateStyle(v, editingColor, editingFontFamily);
                      }}
                      className="w-full"
                    />
                    <span className="text-right text-sm font-mono">
                      {editingFontSize}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Color</span>
                      <input
                        type="color"
                        value={editingColor}
                        onChange={(e) => {
                          setEditingColor(e.target.value);
                          handleUpdateStyle(
                            editingFontSize,
                            e.target.value,
                            editingFontFamily,
                          );
                        }}
                        className="w-8 h-8 rounded border"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Font</span>
                      <select
                        value={editingFontFamily}
                        onChange={(e) => {
                          setEditingFontFamily(e.target.value);
                          handleUpdateStyle(
                            editingFontSize,
                            editingColor,
                            e.target.value,
                          );
                        }}
                        className="border rounded p-1 text-sm min-w-0 flex-1 ml-2"
                      >
                        <option value="Nunito">Nunito</option>
                        <option value="Baloo 2">Baloo 2</option>
                        <option value="Chewy">Chewy</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ORIGINAL inline controls for desktop */
              <div
                className="mt-6 flex items-center justify-center space-x-8 mx-auto"
                style={{ width: `${spreadPx}px`, maxWidth: "100%" }}
              >
                <label className="flex items-center space-x-2">
                  <span className="font-medium">Font size:</span>
                  <input
                    type="number"
                    min={8}
                    max={72}
                    value={editingFontSize}
                    onChange={(e) => {
                      const v = +e.target.value;
                      setEditingFontSize(v);
                      handleUpdateStyle(v, editingColor, editingFontFamily);
                    }}
                    className="w-16 border border-gray-300 rounded p-1"
                  />
                </label>
                <label className="flex items-center space-x-3">
                  <span className="font-medium">Color:</span>
                  <input
                    type="color"
                    value={editingColor}
                    onChange={(e) => {
                      setEditingColor(e.target.value);
                      handleUpdateStyle(
                        editingFontSize,
                        e.target.value,
                        editingFontFamily,
                      );
                    }}
                  />
                </label>
                <label className="flex items-center space-x-3">
                  <span className="font-medium">Font Family:</span>
                  <select
                    value={editingFontFamily}
                    onChange={(e) => {
                      setEditingFontFamily(e.target.value);
                      handleUpdateStyle(
                        editingFontSize,
                        editingColor,
                        e.target.value,
                      );
                    }}
                    className="border border-gray-300 rounded p-1"
                  >
                    <option value="Nunito">Nunito</option>
                    <option value="Baloo 2">Baloo 2</option>
                    <option value="Chewy">Chewy</option>
                  </select>
                </label>

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

            {/* PDF & Print Buttons - Red colored and mobile optimized */}
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mt-6 md:mt-12">
              <Button
                variant="default"
                size="lg"
                className="w-full md:w-auto flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold"
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
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto flex items-center justify-center border-2 border-red-600 text-red-600 hover:bg-red-50"
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
