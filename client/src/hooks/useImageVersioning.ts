// import { useCallback } from "react";
// import { updateDoc, doc } from "firebase/firestore";
// import { db } from "@/lib/firebase"; // Adjust import path as needed

// interface RegenerateImageParams {
//   bookId: string;
//   pageIndex?: number;
//   revisedPrompt: string;
//   isCover?: boolean;
//   newTitle?: string; // For cover title changes
// }

// interface UseImageVersioningReturn {
//   regenerateImage: (params: RegenerateImageParams) => Promise<void>;
//   toggleImageVersion: (
//     bookId: string,
//     pageIndex?: number,
//     isCover?: boolean,
//   ) => Promise<void>;
//   canRegenerate: (page: any) => boolean;
//   getCurrentImageUrl: (page: any) => string;
// }

// export const useImageVersioning = (): UseImageVersioningReturn => {
//   const regenerateImage = useCallback(
//     async ({
//       bookId,
//       pageIndex,
//       revisedPrompt,
//       isCover = false,
//       newTitle,
//     }: RegenerateImageParams) => {
//       try {
//         // Get current book data
//         const bookRef = doc(db, "books", bookId);

//         if (isCover) {
//           // Handle cover regeneration
//           const endpoint = newTitle
//             ? "/api/regenerateCoverTitle"
//             : "/api/regenerateCover";

//           const response = await fetch(endpoint, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               bookId,
//               ...(newTitle
//                 ? {
//                     title: newTitle,
//                     randomSeed: false,
//                   }
//                 : {
//                     revisedPrompt,
//                   }),
//             }),
//           });

//           if (!response.ok) throw new Error("Failed to regenerate cover");

//           const result = await response.json();

//           // Update cover in Firebase with versioning
//           await updateDoc(bookRef, {
//             "cover.original_url": result.originalUrl || undefined,
//             "cover.regenerated_url": result.newImageUrl,
//             "cover.regenerated_count": 1,
//             "cover.is_regenerated": true,
//             "cover.scene_image_url": result.newImageUrl,
//             "cover.regenerated_prompt": revisedPrompt || undefined,
//             ...(newTitle && { "cover.original_title": result.originalTitle }),
//           });
//         } else if (pageIndex !== undefined) {
//           // Handle page regeneration
//           const response = await fetch("/api/regenerateImage", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               bookId,
//               pageIndex,
//               revisedPrompt,
//             }),
//           });

//           if (!response.ok) throw new Error("Failed to regenerate image");

//           const result = await response.json();

//           // Update page in Firebase with versioning
//           await updateDoc(bookRef, {
//             [`pages.${pageIndex}.original_url`]:
//               result.originalUrl || undefined,
//             [`pages.${pageIndex}.regenerated_url`]: result.newImageUrl,
//             [`pages.${pageIndex}.regenerated_count`]: 1,
//             [`pages.${pageIndex}.is_regenerated`]: true,
//             [`pages.${pageIndex}.scene_image_url`]: result.newImageUrl,
//             [`pages.${pageIndex}.regenerated_prompt`]: revisedPrompt,
//           });
//         }
//       } catch (error) {
//         console.error("Error regenerating image:", error);
//         throw error;
//       }
//     },
//     [],
//   );

//   const toggleImageVersion = useCallback(
//     async (bookId: string, pageIndex?: number, isCover: boolean = false) => {
//       try {
//         const bookRef = doc(db, "books", bookId);

//         if (isCover) {
//           // Get current cover state
//           const updates: any = {};
//           // Toggle cover version
//           // Note: You'll need to fetch current state or pass it in
//           updates["cover.is_regenerated"] = false; // This should be toggled based on current state
//           updates["cover.scene_image_url"] = ""; // Set to original_url or regenerated_url

//           await updateDoc(bookRef, updates);
//         } else if (pageIndex !== undefined) {
//           // Toggle page version
//           const updates: any = {};
//           updates[`pages.${pageIndex}.is_regenerated`] = false; // Toggle based on current
//           updates[`pages.${pageIndex}.scene_image_url`] = ""; // Set appropriately

//           await updateDoc(bookRef, updates);
//         }
//       } catch (error) {
//         console.error("Error toggling image version:", error);
//         throw error;
//       }
//     },
//     [],
//   );

//   const canRegenerate = useCallback((page: any) => {
//     return !page.regenerated_count || page.regenerated_count < 1;
//   }, []);

//   const getCurrentImageUrl = useCallback((page: any) => {
//     // Always return scene_image_url as it should point to the current choice
//     return page.scene_image_url || page.url || "";
//   }, []);

//   return {
//     regenerateImage,
//     toggleImageVersion,
//     canRegenerate,
//     getCurrentImageUrl,
//   };
// };
