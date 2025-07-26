import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/** ───────── Types ───────── */
export interface Page {
  id: number;
  imageUrl: string;
  content: string;
  prompt: string;
  isCover?: boolean;
  regenerating?: boolean;
  sceneInputs?: unknown;
  coverInputs?: unknown;
  sceneResponseId?: string;
  coverResponseId?: string;
  original_url?: string;
  regenerated_url?: string;
  regenerated_count?: number;
  is_regenerated?: boolean;
  regenerated_prompt?: string;
}

interface CharacterData {
  modelId?: string;
  name?: string;
  age?: number;
  gender?: "male" | "female" | "other";
}

interface UseBookEditorOptions {
  bookId: string;
  initialPages: Page[];
  title: string;
  stylePreference?: string;
  characterId?: string;
  storyId?: string;
  characterData?: CharacterData | null;
  initialAvatarUrl?: string;
  initialAvatarLora?: number;
  avatarFinalizedInitial?: boolean;
}

/** ───────── Hook ───────── */
export function useBookEditor({
  bookId,
  initialPages,
  title,
  stylePreference,
  characterId,
  storyId,
  characterData,
  initialAvatarUrl,
  initialAvatarLora,
  avatarFinalizedInitial,
}: UseBookEditorOptions) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [isDirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialAvatarUrl ?? null,
  );
  const [avatarLora, setAvatarLora] = useState<number>(initialAvatarLora ?? 1);
  const initialAvatarUrlRef = useRef<string | null>(initialAvatarUrl ?? null);
  const initialAvatarLoraRef = useRef<number>(initialAvatarLora ?? 1);

  const [avatarRegenerating, setAvatarRegenerating] = useState<boolean>(false);
  const [avatarFinalized, setAvatarFinalized] = useState<boolean>(
    avatarFinalizedInitial,
  );

  const { toast } = useToast();

  useEffect(() => {
    if (initialPages.length && initialPages !== pages) {
      setPages(initialPages);
      setDirty(false);
    }
  }, [initialPages]);

  useEffect(() => {
    if (initialAvatarUrl) setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  useEffect(() => {
    if (typeof initialAvatarLora === "number") setAvatarLora(initialAvatarLora);
  }, [initialAvatarLora]);

  useEffect(() => {
    if (typeof avatarFinalizedInitial === "boolean") {
      setAvatarFinalized(avatarFinalizedInitial);
    }
  }, [avatarFinalizedInitial]);

  /** ---------- Page text updates ---------- */
  const updatePage = async (pageId: number, newContent: string) => {
    // 1️⃣ keep a copy in case we must roll back
    const oldContent = pages.find((p) => p.id === pageId)?.content ?? "";

    // 2️⃣ optimistic UI
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, content: newContent } : p)),
    );
    // setDirty(true);

    try {
      // 3️⃣ PATCH the minimal payload
      await apiRequest("PATCH", `/api/books/${bookId}`, {
        pages: [{ id: pageId, content: newContent }],
      });

      // 4️⃣ success feedback ↑ back to the caller
      return { ok: true } as const;
    } catch (err) {
      console.error("[updatePage] server patch failed →", err);

      // 5️⃣ *optional* rollback
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, content: oldContent } : p)),
      );

      return { ok: false, error: err } as const;
    }
  };

  type RegenMode = "coverTitle" | "vanilla";
  const DELTA = 0.05;

  /* ───────────────── regenerate one page ───────────────── */
  // async function regeneratePage(
  //   pageId: number,
  //   mode?: string,
  //   titleOverride?: string,
  //   revisedPrompt?: string,
  // ) {
  //   console.log(`regenPage start id ${pageId} mode ${mode ?? "none"}`);

  //   const page = pages.find((p) => p.id === pageId);
  //   if (!page) {
  //     console.log(`regenPage abort id-not-found ${pageId}`);
  //     return;
  //   }

  //   /* optimistic spinner */
  //   setPages((prev) =>
  //     prev.map((p) => (p.id === pageId ? { ...p, regenerating: true } : p)),
  //   );
  //   console.log(`spinner on id ${pageId}`);

  //   /* choose endpoint + payload */
  //   let endpoint: string;
  //   if (mode === "coverTitle") {
  //     endpoint = "/api/regenerateCoverTitle";
  //   } else if (mode === "cover") {
  //     endpoint = "/api/regenerateCover";
  //   } else {
  //     endpoint = "/api/regenerateImage";
  //   }
  //   console.log(`endpoint ${endpoint}`);

  //   const payload = {
  //     bookId,
  //     ...(mode === "coverTitle"
  //       ? {
  //           baseCoverUrl: page.coverInputs.base_cover_url,
  //           title: titleOverride ?? page.content,
  //           randomSeed: false,
  //         }
  //       : mode === "cover"
  //         ? {
  //             title: title,
  //             coverResponseId: page.coverResponseId,
  //             revisedPrompt,
  //           }
  //         : {
  //             pageId: page.sceneNumber ?? page.id - 1,
  //             sceneResponseId: page.sceneResponseId,
  //             revisedPrompt,
  //           }),
  //   };

  //   console.log(
  //     `payload keys ${Object.keys(payload).length} sending to ${endpoint}`,
  //   );

  //   try {
  //     const res = await fetch(endpoint, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });
  //     console.log(`POST ${endpoint} status ${res.status}`);

  //     if (!res.ok) throw new Error(`API ${res.status}`);

  //     const { newUrl } = await res.json();
  //     console.log(`newUrl length ${newUrl.length}`);

  //     setPages((prev) =>
  //       prev.map((p) =>
  //         p.id === pageId ? { ...p, regenerating: false, imageUrl: newUrl } : p,
  //       ),
  //     );
  //     // setDirty(true);
  //     console.log(`regenPage success id ${pageId}`);
  //   } catch (err: any) {
  //     console.error(`regenPage error id ${pageId} msg ${err.message}`);

  //     setPages((prev) =>
  //       prev.map((p) => (p.id === pageId ? { ...p, regenerating: false } : p)),
  //     );
  //     toast({
  //       title: "Regeneration error",
  //       description: `Couldn't regenerate page ${pageId}.`,
  //       variant: "destructive",
  //     });
  //   }
  // }

  async function regeneratePage(
    pageId: number,
    mode?: string,
    titleOverride?: string,
    revisedPrompt?: string,
  ) {
    console.log(`regenPage start id ${pageId} mode ${mode ?? "none"}`);

    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      console.log(`regenPage abort id-not-found ${pageId}`);
      return;
    }

    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, regenerating: true } : p)),
    );
    console.log(`spinner on id ${pageId}`);

    let endpoint: string;
    if (mode === "coverTitle") {
      endpoint = "/api/regenerateCoverTitle";
    } else if (mode === "cover") {
      endpoint = "/api/regenerateCover";
    } else {
      endpoint = "/api/regenerateImage";
    }
    console.log(`endpoint ${endpoint}`);

    const payload = {
      bookId,
      ...(mode === "coverTitle"
        ? {
            baseCoverUrl:
              page.coverInputs.base_cover_url ||
              (page.coverInputs.base_cover_urls &&
                page.coverInputs.base_cover_urls[page.currentImageIndex || 0]),
            title: titleOverride ?? page.content,
            randomSeed: false,
          }
        : mode === "cover"
          ? {
              title: title,
              coverResponseId:
                page.coverResponseId ||
                (page.coverResponseIds &&
                  page.coverResponseIds[page.currentImageIndex || 0]),
              revisedPrompt,
            }
          : {
              pageId: page.sceneNumber ?? page.id - 1,
              sceneResponseId:
                page.sceneResponseId ||
                (page.sceneResponseIds &&
                  page.sceneResponseIds[page.currentImageIndex || 0]),
              revisedPrompt,
            }),
    };

    console.log(
      `payload keys ${Object.keys(payload).length} sending to ${endpoint}`,
    );

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`POST ${endpoint} status ${res.status}`);

      if (!res.ok) throw new Error(`API ${res.status}`);

      const { newUrl, newIndex } = await res.json();
      console.log(`newUrl length ${newUrl.length}, newIndex ${newIndex}`);

      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? {
                ...p,
                regenerating: false,
                imageUrl: newUrl,
                currentImageIndex:
                  newIndex !== undefined
                    ? newIndex
                    : (p.currentImageIndex || 0) + 1,
              }
            : p,
        ),
      );
      console.log(`regenPage success id ${pageId}`);
    } catch (err: any) {
      console.error(`regenPage error id ${pageId} msg ${err.message}`);

      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, regenerating: false } : p)),
      );
      toast({
        title: "Regeneration error",
        description: `Couldn't regenerate page ${pageId}.`,
        variant: "destructive",
      });
    }
  }

  async function togglePageVersion(pageId: number, direction: "prev" | "next") {
    console.log(`togglePageVersion start id ${pageId} dir ${direction}`);

    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      console.log(`togglePageVersion abort id-not-found ${pageId}`);
      return;
    }

    const currentIndex = page.currentImageIndex || 0;
    const imageUrls = page.imageUrls || [page.imageUrl];
    console.log(`currentIndex ${currentIndex} totalImages ${imageUrls.length}`);

    let targetIndex: number;
    if (direction === "prev") {
      targetIndex = Math.max(0, currentIndex - 1);
    } else {
      targetIndex = Math.min(imageUrls.length - 1, currentIndex + 1);
    }
    console.log(`calculated targetIndex ${targetIndex}`);

    if (targetIndex === currentIndex) {
      console.log(`togglePageVersion abort no-change-needed id ${pageId}`);
      return;
    }

    try {
      const res = await fetch("/api/toggleImageVersion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          pageId: page.isCover ? 0 : (page.sceneNumber ?? page.id - 1),
          targetIndex,
        }),
      });
      console.log(`POST /api/toggleImageVersion status ${res.status}`);

      if (!res.ok) throw new Error(`API ${res.status}`);

      const { newUrl, newIndex } = await res.json();
      console.log(
        `toggle success newIndex ${newIndex} urlLen ${newUrl.length}`,
      );

      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...p, imageUrl: newUrl, currentImageIndex: newIndex }
            : p,
        ),
      );
    } catch (err: any) {
      console.error(`togglePageVersion error id ${pageId} msg ${err.message}`);
      toast({
        title: "Toggle error",
        description: "Couldn't switch image version.",
        variant: "destructive",
      });
    }
  }

  /* ───────────────── regenerate all pages ───────────────── */
  const regenerateAll = async () => {
    console.log(`regenAll start pages ${pages.length}`);
    if (!avatarFinalized) {
      console.log(`regenAll abort avatar-not-finalized`);
      return;
    }
    try {
      await Promise.all(pages.map((p) => regeneratePage(p.id)));
      console.log(`regenAll done`);
      toast({
        title: "All pages regenerated!",
        description: "You can review the fresh images now.",
      });
    } catch {
      /* individual errors already logged inside regeneratePage */
      console.log(`regenAll finished with individual errors`);
    }
  };

  /** Regenerate every non-cover page in parallel */
  // const regenerateAll = async () => {
  //   if (!avatarFinalized) return;
  //   try {
  //     await Promise.all(pages.map((p) => regeneratePage(p.id)));
  //     toast({
  //       title: "All pages regenerated!",
  //       description: "You can review the fresh images now.",
  //     });
  //   } catch {
  //     /* individual page errors are handled inside regeneratePage */
  //   }
  // };

  const regenerateAllSyncWithAvatar = async () => {
    try {
      await Promise.all(
        pages
          .filter((p) => !p.isBackCover)
          .map((p) => regeneratePage(p.id, "syncAvatar")),
      );
      toast({
        title: "Pages refreshed",
        description: "All pages now match the final avatar.",
      });
    } catch {
      /* per-page errors already handled */
    }
  };

  type AvatarMode = "cartoon" | "hyper";

  async function regenerateAvatar(mode: AvatarMode) {
    if (avatarFinalized) return;
    setAvatarRegenerating(true);
    try {
      let lora = initialAvatarLora;

      lora =
        mode === "cartoon"
          ? Math.max(0, avatarLora - DELTA)
          : Math.min(1, avatarLora + DELTA);
      const avatarPrompt = `closeup photo of ${characterData?.age} year old ${characterData?.gender} kid <${characterData?.name}kidName>,  imagined as pixar cartoon character,  clearly visible against a white background`;
      const payload = {
        bookId,
        modelId: characterData?.modelId ?? "defaultModelId",
        prompt: avatarPrompt,
        loraScale: lora,
      };
      const res = await fetch("/api/regenerateAvatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const { avatarUrl: url } = await res.json();
      setAvatarUrl(url);
      setAvatarRegenerating(false);
      setDirty(true);
      setAvatarLora(lora); // avatar change = dirty state
      toast({ title: "Avatar updated!" });
    } catch (err) {
      setAvatarRegenerating(false);
      console.error("Avatar regen failed:", err);
      toast({
        title: "Avatar error",
        description: "Couldn’t regenerate avatar.",
        variant: "destructive",
      });
    }
  }

  const finalizeAvatar = async () => {
    setAvatarFinalized(true); // optimistic UI
    setDirty(true); // so Save button lights up (optional)

    try {
      await apiRequest("PATCH", `/api/books/${bookId}`, {
        avatarFinalized: true,
      });
      const hadOriginal =
        initialAvatarUrlRef.current !== null &&
        initialAvatarLoraRef.current !== undefined;

      if (hadOriginal) {
        const urlChanged = avatarUrl !== initialAvatarUrlRef.current;
        const loraChanged = avatarLora !== initialAvatarLoraRef.current;
        if (urlChanged || loraChanged) {
          await regenerateAllSyncWithAvatar();
          toast({
            title: "Avatar locked in!",
            description: "All pages have been updated to match your avatar.",
          });
        } else {
          toast({ title: "Avatar locked in!" });
        }
      } else {
        // no original avatar existed, so nothing to refresh
        toast({ title: "Avatar locked in!" });
      }
    } catch (err) {
      console.error("Failed to persist avatarFinalized:", err);
      toast({
        title: "Save error",
        description: "Couldn’t finalize avatar on server.",
        variant: "destructive",
      });
      setAvatarFinalized(false); // rollback on failure
    }
  };
  /** ---------- Persist book to backend ---------- */
  const saveBook = async () => {
    if (!bookId) {
      toast({
        title: "Save error",
        description: "Missing book ID.",
        variant: "destructive",
      });
      return;
    }

    const pagesToSave = pages.filter((p) => !p.isCover && !p.isBackCover);

    const payload = {
      title: pages[0]?.content ?? title,
      pages: pagesToSave,
      coverUrl: pages.find((p) => p.isCover)?.imageUrl ?? null,
      backCoverUrl: pages.find((p) => p.isBackCover)?.imageUrl ?? null,
      characterId,
      storyId,
    };
    console.log("Saving book with payload: ", payload);

    try {
      setLoading(true);
      await apiRequest("PUT", `/api/books/${bookId}`, payload);
      setDirty(false);
      toast({ title: "Saved!", description: "Your updates are live." });
    } catch (err) {
      console.error("Save failed:", err);
      toast({
        title: "Save error",
        description: "Couldn’t update your book.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPageRegenerationCount = useCallback(
    (pageIndex: number): number => {
      if (!pages?.[pageIndex]) return 0;
      return pages[pageIndex].regenerated_count || 0;
    },
    [pages],
  );

  // ADD: Helper function to check if page has regenerated version
  const hasRegeneratedVersion = useCallback(
    (pageIndex: number): boolean => {
      if (!pages?.[pageIndex]) return false;
      const page = pages[pageIndex];
      return !!page.regenerated_url;
    },
    [pages],
  );

  // ADD: Helper function to get current image URL
  const getCurrentImageUrl = useCallback(
    (pageIndex: number): string => {
      if (!pages?.[pageIndex]) return "";
      const page = pages[pageIndex];
      // scene_image_url should always point to the current choice
      return page.scene_image_url || page.url || "";
    },
    [pages],
  );

  // ADD: Helper function to check if cover has regenerated version
  const coverHasRegeneratedVersion = useCallback((): boolean => {
    // return !!book?.cover?.regenerated_url;
    return !!pages?.[0]?.regenerated_url;
  }, [pages]);

  // // ADD: Helper function to get cover regeneration count
  const getCoverRegenerationCount = useCallback((): number => {
    // return book?.cover?.regenerated_count || 0;
    return pages?.[0]?.regenerated_count || 0;
  }, [pages]);

  /** ---------- Exposed API ---------- */
  return {
    pages,
    isDirty,
    loading,
    avatarUrl,
    avatarLora,
    avatarRegenerating,
    avatarFinalized,
    finalizeAvatar,
    /* actions */
    updatePage,
    regeneratePage,
    togglePageVersion, // NEW
    regenerateAll,
    regenerateAvatar,
    saveBook,
    getPageRegenerationCount,
    hasRegeneratedVersion,
    getCurrentImageUrl,
    coverHasRegeneratedVersion,
    getCoverRegenerationCount,
  };
}
