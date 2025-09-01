import { 
  generateImage as orchestratorGenerateImage,
  regenerateImage as orchestratorRegenerateImage
} from "./core/orchestrator";
import { Part, ProgressCallback } from "./core/types";
import { DEFAULT_CHARACTER_IMAGES } from "./utils/constants";
import { 
  generateUnifiedImagePrompt,
  generateUnifiedFrontCoverPrompt,
  createAndSaveAliasMap,
  applyCharacterAliases
} from "./services/imageGeneration";
import { storage } from "../../../storage";
import { getCurrentProvider } from "./config/imageGenConfig";

/**
 * Removes *adjacent* duplicate words (e.g. "looking looking" → "looking"),
 * but will *not* collapse across punctuation (e.g. "looking. looking" stays).
 */
function removeDuplicateAdjacentWords(text: string): string {
  const regex = /\b(\w+)\s+\1\b/gi;
  let result = text;
  while (regex.test(result)) result = result.replace(regex, "$1");
  return result;
}

// Re-export types for compatibility
export {
  UnifiedSceneDescription,
  UnifiedFrontCover,
  CharacterVariables,
  SceneRegenerationInput,
  FinalCoverRegenerationInput,
  BaseCoverRegenerationInput,
} from "./types";

type CharacterImageMap = Record<string, any>;

// Get provider from configuration
const IMAGE_PROVIDER = getCurrentProvider();

/**
 * Generate image for a scene (supports both with and without characters)
 * This maintains the same interface as the original function
 */
export async function generateImageForScene(
  bookId: string,
  scene: { scene_description: any; scene_text: string[] },
  previousImageUrl: string | null,
  characterImageMap: Record<string, any> = DEFAULT_CHARACTER_IMAGES,
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
  if (scene.scene_description.Present_Characters.length > 0) {
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

  // Build prompt parts
  const prompt_parts: Part[] = [
    { type: "text", text: prompt }
  ];

  // Add character images
  if (present.length > 0) {
    for (const charName of present) {
      const charVars = characterImageMap[charName];
      if (charVars && charVars.image_url) {
        prompt_parts.push({
          type: "image_url",
          url: charVars.image_url
        });
      }
    }
  }

  // Add previous image if visual overlap is needed
  if (
    scene.scene_description.Visual_Overlap_With_Previous &&
    previousImageUrl
  ) {
    prompt_parts.push({
      type: "image_url",
      url: previousImageUrl
    });
  }

  // Generate using orchestrator (config handled by engines)
  const result = await orchestratorGenerateImage({
    conversationId: bookId,
    provider: IMAGE_PROVIDER,
    prompt_parts,
    onProgress
  });

  // Return in the expected format
  return {
    firebaseUrl: result.images[0]?.url || "",
    responseId: result.provider_meta.request_id || result.jobId
  };
}

/**
 * Generate image for front cover
 * This maintains the same interface as the original function
 */
export async function generateImageForFrontCover(
  bookId: string,
  frontCover: any,
  characterImageMap: Record<string, any> = DEFAULT_CHARACTER_IMAGES,
  onProgress?: ProgressCallback,
  seed = 3,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("generating_cover", 0, "Building cover prompt…");

  // Generate the base prompt from front cover description using unified schema
  const coverDesc = frontCover;
  const coverPresent = coverDesc.Present_Characters ?? [];
  let prompt = generateUnifiedFrontCoverPrompt(
    coverDesc,
    coverPresent,
    characterImageMap,
    "pixar",
  );

  // Apply character aliases if needed
  if (frontCover.Present_Characters.length > 0) {
    const aliasPool = ["Reet", "Jeet", "Meet", "Heet"];
    const aliasMap = await createAndSaveAliasMap(
      frontCover.Present_Characters,
      aliasPool,
      bookId,
    );
    prompt = applyCharacterAliases(prompt, aliasMap);
  }

  // Remove duplicate adjacent words
  prompt = removeDuplicateAdjacentWords(prompt);

  onProgress?.("generating_cover", 10, "Prompt ready, calling image generation…");

  // Build prompt parts
  const prompt_parts: Part[] = [
    { type: "text", text: prompt }
  ];

  // Add character images
  if (frontCover.Present_Characters.length > 0) {
    for (const charName of frontCover.Present_Characters) {
      const charVars = characterImageMap[charName];
      if (charVars && charVars.image_url) {
        prompt_parts.push({
          type: "image_url",
          url: charVars.image_url
        });
      }
    }
  }

  // Generate using orchestrator (config handled by engines)  
  const result = await orchestratorGenerateImage({
    conversationId: bookId,
    provider: IMAGE_PROVIDER,
    prompt_parts,
    model: "cover", // Hint for engines to use cover config
    onProgress
  });

  // Return in the expected format
  return {
    firebaseUrl: result.images[0]?.url || "",
    responseId: result.provider_meta.request_id || result.jobId
  };
}

/**
 * Regenerate base cover image
 * This maintains the same interface as the original function
 */
export async function regenerateBaseCoverImage(
  bookId: string,
  coverResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating base cover…");

  // Apply character aliases to revised prompt
  const bookDoc = await storage.getBook(bookId);
  const aliasMap = bookDoc?.characterAliases ?? {};
  const safePrompt = applyCharacterAliases(revisedPrompt, aliasMap);

  // Use orchestrator for regeneration
  const result = await orchestratorRegenerateImage({
    conversationId: bookId,
    jobId: coverResponseId,
    revisedPrompt: safePrompt,
    onProgress
  });

  return {
    firebaseUrl: result.images[0]?.url || "",
    responseId: result.provider_meta.request_id || result.jobId
  };
}

/**
 * Regenerate scene image
 * This maintains the same interface as the original function
 */
export async function regenerateSceneImage(
  bookId: string,
  sceneResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating scene image…");

  // Apply character aliases to revised prompt
  const bookDoc = await storage.getBook(bookId);
  const aliasMap = bookDoc?.characterAliases ?? {};
  const safePrompt = applyCharacterAliases(revisedPrompt, aliasMap);

  // Use orchestrator for regeneration
  const result = await orchestratorRegenerateImage({
    conversationId: bookId,
    jobId: sceneResponseId,
    revisedPrompt: safePrompt,
    onProgress
  });

  return {
    firebaseUrl: result.images[0]?.url || "",
    responseId: result.provider_meta.request_id || result.jobId
  };
}

// Re-export other functions that don't need changes
export {
  generateFinalCoverWithTitle,
  createAndSaveAliasMap,
  applyCharacterAliases
} from "./services/imageGeneration";
