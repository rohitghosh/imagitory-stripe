/**
 * Image Generation V2 - New Orchestrator-Based Implementation
 *
 * This module provides the new image generation functions that use the
 * flexible orchestrator system while maintaining compatibility with the
 * existing story generation API.
 */

import { generateImage } from "../core/orchestrator";
import {
  UnifiedSceneDescription,
  UnifiedFrontCover,
  ProgressCallback,
  CharacterVariables,
} from "../types";
import {
  generateUnifiedImagePrompt,
  generateUnifiedFrontCoverPrompt,
  createAndSaveAliasMap,
  applyCharacterAliases,
  removeDuplicateAdjacentWords,
} from "./imageGeneration";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

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
    "pixar",
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

  onProgress?.("generating", 10, "Prompt ready, calling image generation…");

  try {
    // Use the new orchestrator to generate the image
    const result = await generateImage({
      conversationId: bookId,
      provider: process.env.IMAGE_PROVIDER === "gemini" ? "gemini" : "openai",
      prompt_parts: [{ type: "text", text: prompt }],
      onProgress: (phase, pct, message) => {
        // Map orchestrator progress to expected progress range (10-90%)
        const adjustedPct = 10 + (pct / 100) * 80;
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
    "pixar",
  );

  onProgress?.(
    "generating_cover",
    10,
    "Prompt ready, calling image generation…",
  );

  try {
    // Use the new orchestrator to generate the front cover
    const result = await generateImage({
      conversationId: bookId,
      provider: process.env.IMAGE_PROVIDER === "gemini" ? "gemini" : "openai",
      prompt_parts: [{ type: "text", text: prompt }],
      onProgress: (phase, pct, message) => {
        // Map orchestrator progress to expected progress range (10-90%)
        const adjustedPct = 10 + (pct / 100) * 80;
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
 * Generate final cover with title (placeholder - need to implement title overlay)
 */
export async function generateFinalCoverWithTitle(
  bookId: string,
  baseCoverUrl: string,
  storyTitle: string,
  seed = 3,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.("generating_cover", 0, "Adding title to cover…");

  // For now, this is a placeholder that returns the base cover
  // In a full implementation, this would overlay the title on the base cover
  // using image processing or a specialized title overlay service

  onProgress?.("generating_cover", 50, "Processing title overlay…");

  // TODO: Implement actual title overlay functionality
  // This might involve:
  // 1. Loading the base cover image
  // 2. Adding text overlay with the story title
  // 3. Saving the result to storage

  onProgress?.("generating_cover", 100, "Title overlay complete");

  return baseCoverUrl; // Return base cover for now
}

/**
 * Regenerate base cover image
 */
export async function regenerateBaseCoverImage(
  bookId: string,
  baseCoverInputs: {
    front_cover: UnifiedFrontCover;
    characterImageMap: Record<string, CharacterVariables>;
    seed: number;
  },
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating base cover…");

  return generateImageForFrontCover(
    bookId,
    baseCoverInputs.front_cover,
    baseCoverInputs.characterImageMap,
    onProgress,
    baseCoverInputs.seed,
  );
}

/**
 * Regenerate scene image
 */
export async function regenerateSceneImage(
  bookId: string,
  sceneInputs: {
    scene_description: any;
    characterImageMap: Record<string, CharacterVariables>;
    previousImageUrl: string | null;
    seed: number;
  },
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating scene image…");

  const scene = {
    scene_description: sceneInputs.scene_description,
    scene_text: [], // Not needed for regeneration
  };

  return generateImageForScene(
    bookId,
    scene,
    sceneInputs.previousImageUrl,
    sceneInputs.characterImageMap,
    onProgress,
    sceneInputs.seed,
  );
}
