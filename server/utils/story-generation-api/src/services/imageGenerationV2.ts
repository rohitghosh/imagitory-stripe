/**
 * Image Generation V2 - New Orchestrator-Based Implementation
 *
 * This module provides the new image generation functions that use the
 * flexible orchestrator system while maintaining compatibility with the
 * existing story generation API.
 */

import { generateImage, regenerateImage } from "../core/orchestrator";
import {
  UnifiedSceneDescription,
  UnifiedFrontCover,
  ProgressCallback,
  CharacterVariables,
} from "../types";
import { Part } from "../core/types";
import {
  generateUnifiedImagePrompt,
  generateUnifiedFrontCoverPrompt,
  createAndSaveAliasMap,
  applyCharacterAliases,
  removeDuplicateAdjacentWords,
} from "./imageGeneration";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";
import { getCurrentProvider } from "../config/imageGenConfig";

/**
 * Generate image for a story scene using the new orchestrator
 */
export async function generateImageForScene(
  bookId: string,
  scene: { scene_description: any; scene_text: string[] },
  previousImageUrl: string | null,
  characterImageMap: Record<
    string,
    CharacterVariables
  > = DEFAULT_CHARACTER_IMAGES,
  animationStyle: string = "pixar",
  onProgress?: ProgressCallback,
  seed = 3,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("generating", 0, "Building image prompt…");

  const sceneDesc = scene.scene_description;
  const present = sceneDesc.Present_Characters ?? [];

  // Generate the base prompt from scene description using unified schema
  let prompt = generateUnifiedImagePrompt(
    sceneDesc,
    present,
    characterImageMap,
    animationStyle,
  );

  // Apply character aliases if needed
  if (scene.scene_description.Present_Characters?.length > 0) {
    const aliasPool = ["Reet", "Jeet", "Meet", "Heet"];
    const aliasMap = await createAndSaveAliasMap(
      scene.scene_description.Present_Characters,
      aliasPool,
      bookId,
    );
    prompt = applyCharacterAliases(prompt, aliasMap);
  }

  // Remove duplicate adjacent words
  prompt = removeDuplicateAdjacentWords(prompt);

  onProgress?.("generating", 10, "Extracting character images…");

  // Extract character images (same logic as original imageGeneration.ts)
  const characterImageParts: Part[] = [];
  if (present.length > 0) {
    for (const charName of present) {
      const charVars = characterImageMap[charName];
      if (charVars && charVars.image_url) {
        characterImageParts.push({
          type: "image_url",
          url: charVars.image_url,
        });
      }
    }
  }

  // Add previous image if visual overlap is needed
  if (
    scene.scene_description.Visual_Overlap_With_Previous &&
    previousImageUrl
  ) {
    characterImageParts.push({
      type: "image_url",
      url: previousImageUrl,
    });
  }

  onProgress?.("generating", 15, "Prompt ready, calling image generation…");

  try {
    // Use the new orchestrator to generate the image with BOTH text AND images
    const result = await generateImage({
      conversationId: bookId,
      provider: getCurrentProvider(),
      prompt_parts: [
        { type: "text", text: prompt },
        ...characterImageParts, // ✅ Include character images!
      ],
      onProgress: (phase, pct, message) => {
        // Map orchestrator progress to expected progress range (15-90%)
        const adjustedPct = 15 + (pct / 100) * 75;
        onProgress?.(phase, adjustedPct, message);
      },
    });

    onProgress?.("generating", 90, "Processing result…");

    // Extract the first image from the result
    if (result.images && result.images.length > 0) {
      const image = result.images[0];

      onProgress?.("generating", 100, "Image generation complete");

      return {
        firebaseUrl: image.url,
        responseId: result.jobId,
      };
    } else {
      throw new Error("No images generated");
    }
  } catch (error) {
    console.error("Scene image generation failed:", error);
    throw error;
  }
}

/**
 * Generate front cover image using the new orchestrator
 */
export async function generateImageForFrontCover(
  bookId: string,
  frontCover: UnifiedFrontCover,
  characterImageMap: Record<
    string,
    CharacterVariables
  > = DEFAULT_CHARACTER_IMAGES,
  animationStyle: string = "pixar",
  onProgress?: ProgressCallback,
  seed = 3,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("generating_cover", 0, "Building front cover prompt…");

  // Generate the front cover prompt
  const coverPresent = frontCover.Present_Characters ?? [];
  const prompt = generateUnifiedFrontCoverPrompt(
    frontCover,
    coverPresent,
    characterImageMap,
    animationStyle,
  );

  onProgress?.("generating_cover", 10, "Extracting character images…");

  // Extract character images for front cover (same logic as original)
  const characterImageParts: Part[] = [];
  if (coverPresent.length > 0) {
    for (const charName of coverPresent) {
      const charVars = characterImageMap[charName];
      if (charVars && charVars.image_url) {
        characterImageParts.push({
          type: "image_url",
          url: charVars.image_url,
        });
      }
    }
  }

  onProgress?.(
    "generating_cover",
    15,
    "Prompt ready, calling image generation…",
  );

  try {
    // Use the new orchestrator to generate the front cover with BOTH text AND images
    const result = await generateImage({
      conversationId: bookId,
      provider: getCurrentProvider(),
      model: "cover", // Hint for engines to use cover config
      prompt_parts: [
        { type: "text", text: prompt },
        ...characterImageParts, // ✅ Include character images!
      ],
      onProgress: (phase, pct, message) => {
        // Map orchestrator progress to expected progress range (15-90%)
        const adjustedPct = 15 + (pct / 100) * 75;
        onProgress?.(phase, adjustedPct, message);
      },
    });

    onProgress?.("generating_cover", 90, "Processing result…");

    // Extract the first image from the result
    if (result.images && result.images.length > 0) {
      const image = result.images[0];

      onProgress?.("generating_cover", 100, "Front cover generation complete");

      return {
        firebaseUrl: image.url,
        responseId: result.jobId,
      };
    } else {
      throw new Error("No front cover image generated");
    }
  } catch (error) {
    console.error("Front cover generation failed:", error);
    throw error;
  }
}

/**
 * Generate final cover with title using Fal AI title overlay
 */
export async function generateFinalCoverWithTitle(
  bookId: string,
  baseCoverUrl: string,
  storyTitle: string,
  seed = 3,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.("generating_cover", 0, "Adding title to cover…");

  // Import fal and other dependencies needed for title overlay
  const { fal } = await import("@fal-ai/client");
  const { toDataUrl } = await import("../core/storage");
  const { uploadBase64ToFirebase } = await import("../../../uploadImage");

  const TEST_MODE = process.env.TEST_MODE;

  const onQueueUpdate = (update: any) => {
    if (update.status === "completed") {
      onProgress?.("generating_cover", 100, "Title added successfully");
    } else if (update.status === "failed") {
      throw new Error("Failed to add title to cover");
    } else {
      onProgress?.("generating_cover", 50, "Processing title overlay…");
    }
  };

  let finalImageUrl = null;

  if (TEST_MODE === "true") {
    // Use test image in test mode
    finalImageUrl =
      "https://fal.media/files/zebra/gmaYiChEr3BYD11bv22pq_cb45651b96c04d7fb9f7aa5982ceb756.jpg";
  } else {
    // Use Fal AI to add title overlay to the base cover
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt: createTitleOverlayPrompt(storyTitle),
        image_url: baseCoverUrl,
        enable_safety_checker: false,
      },
      pollInterval: 1000,
      onQueueUpdate,
    });

    finalImageUrl = result?.data?.images?.[0]?.url;
  }

  if (!finalImageUrl) {
    throw new Error("No final cover URL returned from Fal AI title overlay");
  }

  // Convert the final image to base64 and upload to Firebase
  const dataUrl = await toDataUrl(finalImageUrl);
  const firebaseUrl = await uploadBase64ToFirebase(
    dataUrl,
    `books/${bookId}/covers`,
  );

  return firebaseUrl;
}

/**
 * Creates the prompt for Fal AI title overlay
 */
function createTitleOverlayPrompt(storyTitle: string): string {
  return `Add a beautiful, child-friendly book title "${storyTitle}" to the center-top of this image. The title should be:
- Large, clear, and easy to read
- In a playful, colorful font suitable for children
- Positioned in the top third of the image
- With a subtle background or shadow to ensure readability
- In colors that complement the existing image palette
- Stylized to look like a professional children's book cover`;
}

/**
 * Regenerate base cover image (matches original signature)
 */
export async function regenerateBaseCoverImage(
  bookId: string,
  coverResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating base cover…");

  try {
    // Use the new orchestrator's regenerate function
    const result = await regenerateImage({
      conversationId: bookId,
      jobId: coverResponseId,
      revisedPrompt,
      onProgress: (phase, pct, message) => {
        onProgress?.(phase, pct, message);
      },
    });

    onProgress?.("regenerating", 100, "Cover regeneration complete");

    // Extract the first image from the result
    if (result.images && result.images.length > 0) {
      const image = result.images[0];
      return {
        firebaseUrl: image.url,
        responseId: result.jobId,
      };
    } else {
      throw new Error("No cover image regenerated");
    }
  } catch (error) {
    console.error("Cover regeneration failed:", error);
    throw error;
  }
}

/**
 * Regenerate scene image (matches original signature)
 */
export async function regenerateSceneImage(
  bookId: string,
  sceneResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating scene image…");

  try {
    // Use the new orchestrator's regenerate function
    const result = await regenerateImage({
      conversationId: bookId,
      jobId: sceneResponseId,
      revisedPrompt,
      onProgress: (phase, pct, message) => {
        onProgress?.(phase, pct, message);
      },
    });

    onProgress?.("regenerating", 100, "Scene regeneration complete");

    // Extract the first image from the result
    if (result.images && result.images.length > 0) {
      const image = result.images[0];
      return {
        firebaseUrl: image.url,
        responseId: result.jobId,
      };
    } else {
      throw new Error("No scene image regenerated");
    }
  } catch (error) {
    console.error("Scene regeneration failed:", error);
    throw error;
  }
}
