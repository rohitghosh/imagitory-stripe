import { fal } from "@fal-ai/client";
import { storage } from "../../../../storage";
import {
  getStylePrompt,
  DEFAULT_ANIMATION_STYLE,
} from "../config/animationStyles";
import { uploadBase64ToFirebase } from "../../../uploadImage";

const TEST_MODE = process.env.TEST_MODE;

interface CartoonifyResult {
  toonUrl: string;
  cached: boolean;
}

/**
 * Get or generate a cartoonified image for a character with a specific animation style
 */
export async function getOrGenerateCartoonifiedImage(
  characterId: string,
  animationStyle: string = DEFAULT_ANIMATION_STYLE,
  originalImageUrl?: string,
): Promise<CartoonifyResult> {
  // Get character from database
  const character = await storage.getCharacterById(characterId);
  if (!character) {
    throw new Error(`Character with ID ${characterId} not found`);
  }

  // Check if we have a cached toonUrl for this animation style
  const cachedToonUrl = getCachedToonUrl(character, animationStyle);
  if (cachedToonUrl) {
    return { toonUrl: cachedToonUrl, cached: true };
  }

  // If no original image URL provided, use the first image from character
  const sourceImageUrl = originalImageUrl || character.imageUrls?.[0];
  if (!sourceImageUrl) {
    throw new Error(`No source image available for character ${characterId}`);
  }

  // Generate new cartoonified image
  const toonUrl = await generateCartoonifiedImage(
    sourceImageUrl,
    animationStyle,
  );

  // Cache the result
  await cacheCartoonifiedImage(characterId, animationStyle, toonUrl);

  return { toonUrl, cached: false };
}

/**
 * Generate cartoonified images for multiple characters
 */
export async function getOrGenerateMultipleCartoonifiedImages(
  characterIds: string[],
  animationStyle: string = DEFAULT_ANIMATION_STYLE,
): Promise<Record<string, CartoonifyResult>> {
  const results: Record<string, CartoonifyResult> = {};

  // Process characters in parallel
  const promises = characterIds.map(async (characterId) => {
    try {
      const result = await getOrGenerateCartoonifiedImage(
        characterId,
        animationStyle,
      );
      results[characterId] = result;
    } catch (error) {
      console.error(`Failed to cartoonify character ${characterId}:`, error);
      // Don't throw, just skip this character
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Get cached toonUrl for a specific animation style
 */
function getCachedToonUrl(
  character: any,
  animationStyle: string,
): string | null {
  // Check new toonUrls structure first
  if (character.toonUrls && character.toonUrls[animationStyle]) {
    return character.toonUrls[animationStyle];
  }

  // For backwards compatibility with pixar style, check legacy toonUrl field
  if (animationStyle === "pixar" && character.toonUrl) {
    return character.toonUrl;
  }

  return null;
}

/**
 * Cache a cartoonified image for a specific animation style
 */
async function cacheCartoonifiedImage(
  characterId: string,
  animationStyle: string,
  toonUrl: string,
): Promise<void> {
  const character = await storage.getCharacterById(characterId);
  if (!character) return;

  // Update toonUrls structure
  const updatedToonUrls = {
    ...(character.toonUrls || {}),
    [animationStyle]: toonUrl,
  };

  const updateData: any = {
    toonUrls: updatedToonUrls,
  };

  // For backwards compatibility, also update legacy toonUrl field for pixar
  if (animationStyle === "pixar") {
    updateData.toonUrl = toonUrl;
  }

  await storage.updateCharacter(characterId, updateData);
}

/**
 * Generate a cartoonified image using Fal AI
 */
async function generateCartoonifiedImage(
  sourceImageUrl: string,
  animationStyle: string,
): Promise<string> {
  if (TEST_MODE) {
    // Return dummy URL in test mode
    return "https://v3.fal.media/files/penguin/D9g2chjiCZrFkDps_y9Zd.png";
  }

  const stylePrompt = getStylePrompt(animationStyle);

  const prompt = `Convert this photo into a cartoon character. ${stylePrompt || `Render in ${animationStyle} animation style.`} The character should be friendly, child-appropriate, and maintain the key facial features and characteristics of the person in the photo. Focus on creating a clean, appealing cartoon representation suitable for children's books.`;

  try {
    const result = await fal.subscribe("fal-ai/flux-pro", {
      input: {
        prompt,
        image_url: sourceImageUrl,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
        safety_tolerance: "2",
        format: "png",
      },
      pollInterval: 1000,
      timeout: 60000,
    });

    const imageUrl = result?.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from Fal AI");
    }

    return imageUrl;
  } catch (error) {
    console.error("Error generating cartoonified image:", error);
    throw new Error("Failed to generate cartoonified image");
  }
}
