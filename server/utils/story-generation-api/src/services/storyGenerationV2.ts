/**
 * Story Generation V2 with flexible image generation backends
 *
 * This file provides a drop-in replacement for the story generation system
 * that uses the new flexible image generation architecture while maintaining
 * full compatibility with the existing API.
 */

import { generateCompleteStory as originalGenerateCompleteStory } from "./storyGeneration";
import {
  generateImageForScene,
  generateImageForFrontCover,
  generateFinalCoverWithTitle,
  regenerateBaseCoverImage,
  regenerateSceneImage,
} from "./imageGenerationV2";

// Re-export the image generation functions with the new backend
export {
  generateImageForScene,
  generateImageForFrontCover,
  generateFinalCoverWithTitle,
  regenerateBaseCoverImage,
  regenerateSceneImage,
} from "./imageGenerationV2";

// Re-export other unchanged functions
export { generateCompleteStory } from "./storyGeneration";

/**
 * Generate a complete story with the new image generation backend
 * This function can be used as a drop-in replacement for the original
 */
export async function generateCompleteStoryV2(
  storyParams: any,
  characterImageMap: any,
  onProgress?: (phase: string, pct: number, message: string) => void,
) {
  // For now, this just delegates to the original implementation
  // The V2 image generation functions are automatically used via imageGenerationV2.ts
  // when imported by the story generation system
  return originalGenerateCompleteStory(
    storyParams,
    characterImageMap,
    onProgress,
  );
}

/**
 * Configuration for switching image generation providers
 */
export const IMAGE_GENERATION_CONFIG = {
  provider: (process.env.IMAGE_PROVIDER || "openai") as "openai" | "gemini",
  fallbackProvider: "openai" as "openai" | "gemini",
};

/**
 * Get the current image generation provider
 */
export function getCurrentImageProvider(): "openai" | "gemini" {
  return IMAGE_GENERATION_CONFIG.provider;
}

/**
 * Set the image generation provider (useful for testing)
 */
export function setImageProvider(provider: "openai" | "gemini"): void {
  process.env.IMAGE_PROVIDER = provider;
  IMAGE_GENERATION_CONFIG.provider = provider;
}
