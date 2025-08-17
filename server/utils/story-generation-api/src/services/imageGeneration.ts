// import { fal } from "@fal-ai/client";
// import fs from "fs";
// import OpenAI from "openai";
// import tmp from "tmp-promise";
// import fetch from "node-fetch";
// import { uploadBase64ToFirebase } from "../../../uploadImage";
// import { toFile } from "openai";
// import { storage } from "../../../../storage"; // already exported in storage.ts

// import {
//   UnifiedSceneDescription,
//   UnifiedFrontCover,
//   ProgressCallback,
//   CharacterVariables,
//   SceneRegenerationInput,
//   FinalCoverRegenerationInput,
//   BaseCoverRegenerationInput,
// } from "../types";
// import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

// const quality = "low";
// const input_fidelity = "low";
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// const endpoint = process.env.AZURE_OPENAI_ENDPOINT; // ends with /openai/v1/
// const apiKey = process.env.AZURE_OPENAI_API_KEY;
// const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-04-01-preview";
// const imageDeployment = process.env.AZURE_IMAGE_DEPLOYMENT; // your gpt-image-1 deployment name

// // Create OpenAI client for Azure endpoint with API key
// const azureopenai = new OpenAI({
//   baseURL: endpoint,
//   apiKey,
//   defaultHeaders: {
//     // CRITICAL: Route the image tool to your gpt-image-1 deployment
//     "x-ms-oai-image-generation-deployment": imageDeployment,
//   },
//   defaultQuery: { "api-version": "preview" }, // <-- correct key & value
// });

// async function urlToReadableStream(url: string) {
//   const res = await fetch(url);
//   const { path } = await tmp.file({ postfix: ".png" });
//   const buf = Buffer.from(await res.arrayBuffer());
//   await fs.promises.writeFile(path, buf);
//   return fs.createReadStream(path);
// }

// async function toDataUrl(url: string) {
//   const r = await fetch(url);
//   if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
//   const ct = r.headers.get("content-type") || "image/jpeg";
//   const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
//   return `data:${ct};base64,${b64}`;
// }

// /**
//  * Removes *adjacent* duplicate words (e.g. "looking looking" → "looking"),
//  * but will *not* collapse across punctuation (e.g. "looking. looking" stays).
//  */
// function removeDuplicateAdjacentWords(text: string): string {
//   const regex = /\b(\w+)\s+\1\b/gi;
//   let result = text;
//   // repeat until no more adjacent duplicates
//   while (regex.test(result)) {
//     result = result.replace(regex, "$1");
//   }
//   return result;
// }

// /**
//  * Replaces every occurrence of the real character names with short aliases,
//  * saves the mapping in Firestore under
//  * `books/{bookId}/characterAliases`, and returns the substituted prompt.
//  * @returns the prompt with character names replaced by their aliases
//  */
// export async function createAndSaveAliasMap(
//   presentChars: string[],
//   aliasPool: string[],
//   bookId: string,
// ): Promise<Record<string, string>> {
//   /* 1️⃣  Build the replacement map */
//   const aliasMap: Record<string, string> = Object.fromEntries(
//     presentChars.map((name, i) => [name, aliasPool[i % aliasPool.length]]),
//   );

//   /* 2️⃣  Persist to Firestore (books/{bookId}/characterAliases) */
//   await storage.updateBook(bookId, { characterAliases: aliasMap });

//   return aliasMap;
// }

// export function applyCharacterAliases(
//   prompt: string,
//   aliasMap: Record<string, string>,
// ): string {
//   const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//   let out = prompt;
//   for (const [realName, alias] of Object.entries(aliasMap)) {
//     out = out.replace(new RegExp(esc(realName), "gi"), alias);
//   }
//   return out;
// }

// /**
//  * Generate unified image prompt for scenes with characters (unified schema)
//  */
// function generateUnifiedImagePrompt(input: any): string {
//   const promptParts: string[] = [];

//   const addPart = (content: string | null | undefined) => {
//     if (content && content.trim()) {
//       promptParts.push(content.trim().replace(/\.$/, "") + ".");
//     }
//   };

//   // Time of Day and Atmosphere (High Priority)
//   if (
//     input.Time_of_Day_and_Atmosphere &&
//     input.Time_of_Day_and_Atmosphere.trim()
//   ) {
//     addPart(
//       `The scene is set during ${input.Time_of_Day_and_Atmosphere.toLowerCase()}`,
//     );
//   }

//   // Present Characters - only if the array is not empty
//   if (input.Present_Characters && input.Present_Characters.length > 0) {
//     addPart(
//       `The scene features: ${input.Present_Characters.join(", ").toLowerCase()}`,
//     );
//   }

//   // Character Interaction Summary - only if it's a non-empty string
//   if (
//     input.Character_Interaction_Summary &&
//     input.Character_Interaction_Summary.trim()
//   ) {
//     addPart(input.Character_Interaction_Summary);
//   }

//   // Character Details - only if the array is not empty
//   if (input.Character_Details && input.Character_Details.length > 0) {
//     input.Character_Details.forEach((char: any) => {
//       const nameDesc = char.Character_Name.split(" (")[0];
//       const desc = char.Character_Name.match(/\((.*)\)/)?.[1] || "";
//       const charDescription = `${nameDesc}${desc ? ` (${desc})` : ""} is ${char.Pose_and_Action.toLowerCase()}, looking ${char.Gaze_Direction.toLowerCase()} with an expression of ${char.Expression.toLowerCase()}`;
//       addPart(charDescription);
//     });
//   }

//   // Setting and Environment
//   addPart(`It unfolds in ${input.Setting_and_Environment.toLowerCase()}`);

//   // Focal Action
//   addPart(`The focal action is ${input.Focal_Action.toLowerCase()}`);

//   // Lighting
//   addPart(input.Lighting_Description);

//   // Key Storytelling Props
//   addPart(input.Key_Storytelling_Props);

//   // Background Elements
//   addPart(input.Background_Elements);

//   // Color Palette
//   if (input.Dominant_Color_Palette && input.Dominant_Color_Palette.trim()) {
//     addPart(
//       `The dominant color palette includes ${input.Dominant_Color_Palette.toLowerCase()}`,
//     );
//   }

//   // Camera and Composition
//   if (input.Camera_Shot && input.Camera_Shot.trim()) {
//     const composition =
//       input.Composition_and_Blocking && input.Composition_and_Blocking.trim()
//         ? ` with ${input.Composition_and_Blocking.toLowerCase()}`
//         : "";
//     addPart(
//       `The camera shot is a ${input.Camera_Shot.toLowerCase()}${composition}`,
//     );
//   }

//   // Hidden Object
//   addPart(input.Hidden_Object);

//   return promptParts.join(" ");
// }

// /**
//  * Generate unified front cover prompt for covers with characters (unified schema)
//  */
// function generateUnifiedFrontCoverPrompt(input: any): string {
//   const promptParts: string[] = [];

//   const addPart = (content: string | null | undefined) => {
//     if (content && content.trim()) {
//       promptParts.push(content.trim().replace(/\.$/, "") + ".");
//     }
//   };

//   addPart(input.Cover_Concept);
//   addPart(input.Focal_Point);
//   addPart(input.Character_Placement);

//   if (input.Character_Details && input.Character_Details.length > 0) {
//     input.Character_Details.forEach((char: any) => {
//       const charDescription = `${char.Character_Name} is ${char.Pose_and_Action.toLowerCase()}, looking ${char.Gaze_Direction.toLowerCase()} with an expression of ${char.Expression.toLowerCase()}`;
//       addPart(charDescription);
//     });
//   }

//   addPart(`The background shows ${input.Background_Setting.toLowerCase()}`);

//   if (input.Key_Visual_Elements && input.Key_Visual_Elements.length > 0) {
//     addPart(
//       `Key visual elements include: ${input.Key_Visual_Elements.join(", ").toLowerCase()}`,
//     );
//   }

//   addPart(input.Lighting_and_Mood);
//   addPart(
//     `The dominant color palette includes ${input.Color_Palette.toLowerCase()}`,
//   );

//   return promptParts.join(" ");
// }

// /**
//  * Generate image for a scene (supports both with and without characters)
//  */
// function buildImageGenTool(
//   opts: {
//     hasInputImage: boolean;
//   } = { hasInputImage: false },
// ) {
//   return {
//     type: "image_generation" as const,
//     model: "gpt-image-1",
//     size: "1024x1024",
//     quality,
//     output_format: "png",
//     ...(opts.hasInputImage && {
//       input_fidelity,
//     }),
//   };
// }

// export async function generateImageForScene(
//   bookId: string,
//   scene: { scene_description: any; scene_text: string[] },
//   previousImageUrl: string | null,
//   characterImageMap: Record<
//     string,
//     CharacterVariables
//   > = DEFAULT_CHARACTER_IMAGES,
//   onProgress?: ProgressCallback,
//   seed = 3,
// ): Promise<{ firebaseUrl: string; responseId: string }> {
//   onProgress?.("generating", 0, "Building image prompt…");

//   // Generate the base prompt from scene description using unified schema
//   let prompt = generateUnifiedImagePrompt(scene.scene_description);

//   // Apply character aliases if needed
//   if (scene.scene_description.Present_Characters.length > 0) {
//     const aliasPool = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
//     const aliasMap = await createAndSaveAliasMap(
//       scene.scene_description.Present_Characters,
//       aliasPool,
//       bookId,
//     );
//     prompt = applyCharacterAliases(prompt, aliasMap);
//   }

//   // Remove duplicate adjacent words
//   prompt = removeDuplicateAdjacentWords(prompt);

//   onProgress?.("generating", 10, "Prompt ready, calling image generation…");

//   /* ---------- Build Responses-API input array ---------- */
//   // Build the character image inputs using toDataUrl method
//   const characterImages: any[] = [];
//   if (scene.scene_description.Present_Characters.length > 0) {
//     for (const charName of scene.scene_description.Present_Characters) {
//       const charVars = characterImageMap[charName];
//       if (charVars && charVars.image_url) {
//         try {
//           characterImages.push({
//             type: "input_image" as const,
//             image_url: await toDataUrl(charVars.image_url),
//           });
//         } catch (error) {
//           console.warn(
//             `Failed to load image for character ${charName}:`,
//             error,
//           );
//         }
//       }
//     }
//   }

//   // Add previous image if visual overlap is needed
//   if (
//     scene.scene_description.Visual_Overlap_With_Previous &&
//     previousImageUrl
//   ) {
//     try {
//       characterImages.push({
//         type: "input_image" as const,
//         image_url: await toDataUrl(previousImageUrl),
//       });
//     } catch (error) {
//       console.warn(`Failed to load previous scene image:`, error);
//     }
//   }

//   // Build the tool configuration
//   const tools = [
//     buildImageGenTool({ hasInputImage: characterImages.length > 0 }),
//   ];

//   const inputs = [
//     {
//       role: "user" as const,
//       content: [
//         { type: "input_text" as const, text: prompt },
//         ...characterImages,
//       ],
//     },
//   ];

//   onProgress?.("generating", 30, "Calling image generation API…");

//   // Make the API call using the original responses API
//   const response = await openai.responses.create({
//     model: "gpt-4o-mini",
//     input: inputs,
//     tools,
//   });

//   onProgress?.("generating", 70, "Image generated, processing…");

//   const responseId = response.id;
//   const imageBase64 = response.output.find(
//     (o) => o.type === "image_generation_call",
//   )?.result;

//   if (!imageBase64) {
//     throw new Error("No image returned from OpenAI");
//   }

//   /* ---------- Persist to Firebase ---------- */
//   const firebaseUrl = await uploadBase64ToFirebase(
//     imageBase64,
//     `books/${bookId}/scene_${scene.scene_description.Scene_Number}.png`,
//   );

//   onProgress?.(
//     "generating",
//     100,
//     `Scene ${scene.scene_description.Scene_Number} ready`,
//   );
//   return { firebaseUrl, responseId };
// }

// export async function generateImageForFrontCover(
//   bookId: string,
//   frontCover: any,
//   characterImageMap: Record<
//     string,
//     CharacterVariables
//   > = DEFAULT_CHARACTER_IMAGES,
//   onProgress?: ProgressCallback,
//   seed = 3,
// ): Promise<{ firebaseUrl: string; responseId: string }> {
//   onProgress?.("generating_cover", 0, "Building cover prompt…");

//   // Generate the base prompt from front cover description using unified schema
//   let prompt = generateUnifiedFrontCoverPrompt(frontCover);

//   // Apply character aliases if needed
//   if (frontCover.Present_Characters.length > 0) {
//     const aliasPool = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
//     const aliasMap = await createAndSaveAliasMap(
//       frontCover.Present_Characters,
//       aliasPool,
//       bookId,
//     );
//     prompt = applyCharacterAliases(prompt, aliasMap);
//   }

//   // Remove duplicate adjacent words
//   prompt = removeDuplicateAdjacentWords(prompt);

//   onProgress?.(
//     "generating_cover",
//     10,
//     "Prompt ready, calling image generation…",
//   );

//   /* ---------- Build Responses-API input array ---------- */
//   // Build the character image inputs using toDataUrl method
//   const characterImages: any[] = [];
//   if (frontCover.Present_Characters.length > 0) {
//     for (const charName of frontCover.Present_Characters) {
//       const charVars = characterImageMap[charName];
//       if (charVars && charVars.image_url) {
//         try {
//           characterImages.push({
//             type: "input_image" as const,
//             image_url: await toDataUrl(charVars.image_url),
//           });
//         } catch (error) {
//           console.warn(
//             `Failed to load image for character ${charName}:`,
//             error,
//           );
//         }
//       }
//     }
//   }

//   // Build the tool configuration
//   const tools = [
//     buildImageGenTool({ hasInputImage: characterImages.length > 0 }),
//   ];

//   const inputs = [
//     {
//       role: "user" as const,
//       content: [
//         { type: "input_text" as const, text: prompt },
//         ...characterImages,
//       ],
//     },
//   ];

//   onProgress?.("generating_cover", 30, "Calling image generation API…");

//   // Make the API call using the original responses API
//   const response = await openai.responses.create({
//     model: "gpt-4o-mini",
//     input: inputs,
//     tools,
//   });

//   onProgress?.("generating_cover", 70, "Image generated, processing…");

//   const responseId = response.id;
//   const imageBase64 = response.output.find(
//     (o) => o.type === "image_generation_call",
//   )?.result;

//   if (!imageBase64) {
//     throw new Error("No image returned from OpenAI");
//   }

//   /* ---------- Persist to Firebase ---------- */
//   const firebaseUrl = await uploadBase64ToFirebase(
//     imageBase64,
//     `books/${bookId}/frontcoverimage.png`,
//   );

//   onProgress?.("generating_cover", 100, "Front-cover image ready");
//   return { firebaseUrl, responseId };
// }

// export async function generateFinalCoverWithTitle(
//   bookId: string,
//   baseCoverUrl: string,
//   storyTitle: string,
//   seed: number = 3,
//   onProgress?: ProgressCallback,
// ): Promise<string> {
//   onProgress?.("generating_cover", 0, "Adding title to cover…");

//   const onQueueUpdate = (update: any) => {
//     if (update.status === "completed") {
//       onProgress?.("generating_cover", 100, "Title added successfully");
//     } else if (update.status === "failed") {
//       throw new Error("Failed to add title to cover");
//     } else {
//       onProgress?.("generating_cover", 50, "Processing title overlay…");
//     }
//   };

//   const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
//     input: {
//       prompt: createTitleOverlayPrompt(storyTitle),
//       image_url: baseCoverUrl,
//       sync_mode: true,
//       enable_safety_checker: false,
//     },
//     pollInterval: 1000,
//     onQueueUpdate,
//   });

//   if (!result.images || result.images.length === 0) {
//     throw new Error("No image generated for final cover");
//   }

//   const finalImageUrl = result.images[0].url;
//   const dataUrl = await toDataUrl(finalImageUrl);
//   const firebaseUrl = await uploadBase64ToFirebase(
//     dataUrl,
//     `books/${bookId}/covers`,
//   );

//   return firebaseUrl;
// }

// function createTitleOverlayPrompt(storyTitle: string): string {
//   return `Add a beautiful, child-friendly book title "${storyTitle}" to the center-top of this image. The title should be:
// - Large, clear, and easy to read
// - In a playful, colorful font suitable for children
// - Positioned in the top third of the image
// - With a subtle background or shadow to ensure readability
// - In colors that complement the existing image palette
// - Stylized to look like a professional children's book cover`;
// }

// export async function regenerateBaseCoverImage(
//   bookId: string,
//   coverResponseId: string,
//   revisedPrompt: string,
//   onProgress?: ProgressCallback,
// ): Promise<{ firebaseUrl: string; responseId: string }> {
//   onProgress?.("regenerating", 0, "Regenerating base cover…");

//   // Build the tool configuration
//   const tools = [buildImageGenTool()];

//   // Build the input structure for responses API
//   const inputs = [
//     {
//       role: "user" as const,
//       content: [
//         {
//           type: "input_text" as const,
//           text: `Regenerate this cover image with the following changes: ${revisedPrompt}`,
//         },
//       ],
//     },
//   ];

//   onProgress?.("regenerating", 30, "Calling image generation API…");

//   // Make the API call using the original responses API
//   const response = await openai.responses.create({
//     model: "gpt-4o-mini",
//     input: inputs,
//     tools,
//   });

//   onProgress?.("regenerating", 70, "Image generated, processing…");

//   const responseId = response.id;
//   const imageBase64 = response.output.find(
//     (o) => o.type === "image_generation_call",
//   )?.result;

//   if (!imageBase64) {
//     throw new Error("No image returned from OpenAI");
//   }

//   /* ---------- Persist to Firebase ---------- */
//   const firebaseUrl = await uploadBase64ToFirebase(
//     imageBase64,
//     `books/${bookId}/revisedbasecover_${responseId}.png`,
//   );

//   onProgress?.("regenerating", 100, "Cover regeneration complete");
//   return { firebaseUrl, responseId };
// }

// export async function regenerateSceneImage(
//   bookId: string,
//   sceneResponseId: string,
//   revisedPrompt: string,
//   onProgress?: ProgressCallback,
// ): Promise<{ firebaseUrl: string; responseId: string }> {
//   onProgress?.("regenerating", 0, "Regenerating scene image…");

//   // Build the tool configuration
//   const tools = [buildImageGenTool()];

//   // Build the input structure for responses API
//   const inputs = [
//     {
//       role: "user" as const,
//       content: [
//         {
//           type: "input_text" as const,
//           text: `Regenerate this scene image with the following changes: ${revisedPrompt}`,
//         },
//       ],
//     },
//   ];

//   onProgress?.("regenerating", 30, "Calling image generation API…");

//   // Make the API call using the original responses API
//   const response = await openai.responses.create({
//     model: "gpt-4o-mini",
//     input: inputs,
//     tools,
//   });

//   onProgress?.("regenerating", 70, "Image generated, processing…");

//   const responseId = response.id;
//   const imageBase64 = response.output.find(
//     (o) => o.type === "image_generation_call",
//   )?.result;

//   if (!imageBase64) {
//     throw new Error("No image returned from OpenAI");
//   }

//   /* ---------- Persist to Firebase ---------- */
//   const firebaseUrl = await uploadBase64ToFirebase(
//     imageBase64,
//     `books/${bookId}/revisedscene_${responseId}.png`,
//   );

//   onProgress?.("regenerating", 100, "Scene regeneration complete");
//   return { firebaseUrl, responseId };
// }
import { fal } from "@fal-ai/client";
import fs from "fs";
import OpenAI from "openai";
import tmp from "tmp-promise";
import fetch from "node-fetch";
import { uploadBase64ToFirebase } from "../../../uploadImage";
import { toFile } from "openai";
import { storage } from "../../../../storage"; // already exported in storage.ts

import {
  UnifiedSceneDescription,
  UnifiedFrontCover,
  ProgressCallback,
  CharacterVariables,
  SceneRegenerationInput,
  FinalCoverRegenerationInput,
  BaseCoverRegenerationInput,
} from "../types";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

type CharacterImageMap = Record<string, CharacterVariables>;

const quality = "medium";
const input_fidelity = "high";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const endpoint = process.env.AZURE_OPENAI_ENDPOINT; // ends with /openai/v1/
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-04-01-preview";
const imageDeployment = process.env.AZURE_IMAGE_DEPLOYMENT; // your gpt-image-1 deployment name

// Create OpenAI client for Azure endpoint with API key
const azureopenai = new OpenAI({
  baseURL: endpoint,
  apiKey,
  defaultHeaders: {
    // CRITICAL: Route the image tool to your gpt-image-1 deployment
    "x-ms-oai-image-generation-deployment": imageDeployment,
  },
  defaultQuery: { "api-version": "preview" }, // <-- correct key & value
});

async function urlToReadableStream(url: string) {
  const res = await fetch(url);
  const { path } = await tmp.file({ postfix: ".png" });
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(path, buf);
  return fs.createReadStream(path);
}

async function toDataUrl(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
  const ct = r.headers.get("content-type") || "image/jpeg";
  const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
  return `data:${ct};base64,${b64}`;
}

/**
 * Removes *adjacent* duplicate words (e.g. "looking looking" → "looking"),
 * but will *not* collapse across punctuation (e.g. "looking. looking" stays).
 */
/* --------------------------------- Utils --------------------------------- */
function removeDuplicateAdjacentWords(text: string): string {
  const regex = /\b(\w+)\s+\1\b/gi;
  let result = text;
  while (regex.test(result)) result = result.replace(regex, "$1");
  return result;
}

function finalizePrompt(text: string): string {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/\s*\.\s*/g, ". ")
    .trim()
    .replace(/([^.!?])$/u, "$1.");
  return removeDuplicateAdjacentWords(cleaned);
}

function ordinal(idx: number): string {
  return ["1st", "2nd", "3rd"][idx] || `${idx + 1}th`;
}

function styleLine(animationStyle?: string): string | null {
  if (!animationStyle) return null;
  const s = animationStyle.toLowerCase();
  if (s === "pixar") {
    return "Render in a **Pixar-style**: cinematic 3D look, soft global illumination, friendly proportions, expressive eyes, clean surfaces. Avoid studio logos or any text.";
  }
  if (s === "storybook-watercolor") {
    return "Render in a **storybook watercolor** style: soft edges, gentle washes, visible paper texture, cozy palette, no outlines on backgrounds.";
  }
  if (s === "flat-vector") {
    return "Render in a **flat vector** style: clean geometric shapes, minimal gradients, crisp edges, solid colors.";
  }
  if (s === "ghibli") {
    return "Render with a **Ghibli-like** warmth: painterly backgrounds, natural light, gentle expressions, subtle texture.";
  }
  // default catch-all
  return `Render in **${animationStyle}** style.`;
}

function fmtCharacterLine(c: any): string {
  const attire = c?.Clothing_Details ? ` (${c.Clothing_Details})` : "";
  const pose = c?.Pose_and_Action ? `; pose: ${c.Pose_and_Action}` : "";
  const gaze = c?.Gaze_Direction ? `; gaze: ${c.Gaze_Direction}` : "";
  const expr = c?.Expression ? `; expression: ${c.Expression}` : "";
  return `${c?.Character_Name || "Character"}${attire}${pose}${gaze}${expr}.`;
}

function fmtKeyProps(
  arr?: Array<{ Object: string; Description: string }>,
): string | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const items = arr.map((p) => `${p.Object} (${p.Description})`).join("; ");
  return `Include these objects exactly as described: ${items}.`;
}

function fmtKeyVisuals(
  arr?: Array<{ Object: string; Description: string }>,
): string | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const items = arr.map((p) => `${p.Object} (${p.Description})`).join("; ");
  return `Feature these iconic elements exactly as described: ${items}.`;
}

function buildReferenceBlock(
  presentCharacters: string[],
  characterImageMap: CharacterImageMap,
): { intro: string; urls: string[] } {
  const urls: string[] = [];
  const snippets: string[] = [];

  presentCharacters.forEach((name, idx) => {
    const char = characterImageMap?.[name];
    if (char?.image_url) {
      urls.push(char.image_url);
      const ord = ordinal(idx);
      const desc = char?.description
        ? ` (${char.description} in the ${ord} image)`
        : ` (in the ${ord} image)`;
      snippets.push(`${name}${desc}`);
    }
  });

  const intro =
    urls.length > 0
      ? `Attached reference image${urls.length > 1 ? "s" : ""} show ${snippets.join(" and ")}. Use them strictly for identity, hair, body shape and skin tone consistency. Do not copy backgrounds from the references.`
      : "";

  return { intro, urls };
}
/**
 * Replaces every occurrence of the real character names with short aliases,
 * saves the mapping in Firestore under
 * `books/{bookId}/characterAliases`, and returns the substituted prompt.
 * @returns the prompt with character names replaced by their aliases
 */
export async function createAndSaveAliasMap(
  presentChars: string[],
  aliasPool: string[],
  bookId: string,
): Promise<Record<string, string>> {
  /* 1️⃣  Build the replacement map */
  const aliasMap: Record<string, string> = Object.fromEntries(
    presentChars.map((name, i) => [name, aliasPool[i % aliasPool.length]]),
  );

  /* 2️⃣  Persist to Firestore (books/{bookId}/characterAliases) */
  await storage.updateBook(bookId, { characterAliases: aliasMap });

  return aliasMap;
}

export function applyCharacterAliases(
  prompt: string,
  aliasMap: Record<string, string>,
): string {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let out = prompt;
  for (const [realName, alias] of Object.entries(aliasMap)) {
    out = out.replace(new RegExp(esc(realName), "gi"), alias);
  }
  return out;
}

/**
 * Generate unified image prompt for scenes with characters (unified schema)
 */
// function generateUnifiedImagePrompt(input: any): string {
//   const promptParts: string[] = [];

//   const addPart = (content: string | null | undefined) => {
//     if (content && content.trim()) {
//       promptParts.push(content.trim().replace(/\.$/, "") + ".");
//     }
//   };

//   // Time of Day and Atmosphere (High Priority)
//   if (
//     input.Time_of_Day_and_Atmosphere &&
//     input.Time_of_Day_and_Atmosphere.trim()
//   ) {
//     addPart(
//       `The scene is set during ${input.Time_of_Day_and_Atmosphere.toLowerCase()}`,
//     );
//   }

//   // Present Characters - only if the array is not empty
//   if (input.Present_Characters && input.Present_Characters.length > 0) {
//     addPart(
//       `The scene features: ${input.Present_Characters.join(", ").toLowerCase()}`,
//     );
//   }

//   // Character Interaction Summary - only if it exists and is a non-empty string
//   // This field is only present in multiple character scenes
//   if (
//     'Character_Interaction_Summary' in input &&
//     input.Character_Interaction_Summary &&
//     input.Character_Interaction_Summary.trim()
//   ) {
//     addPart(input.Character_Interaction_Summary);
//   }

//   // Character Details - only if the array is not empty
//   if (input.Character_Details && input.Character_Details.length > 0) {
//     input.Character_Details.forEach((char: any) => {
//       const nameDesc = char.Character_Name.split(" (")[0];
//       const desc = char.Character_Name.match(/\((.*)\)/)?.[1] || "";
//       const charDescription = `${nameDesc}${desc ? ` (${desc})` : ""} is ${char.Pose_and_Action.toLowerCase()}, looking ${char.Gaze_Direction.toLowerCase()} with an expression of ${char.Expression.toLowerCase()}`;
//       addPart(charDescription);
//     });
//   }

//   // Setting and Environment
//   addPart(`It unfolds in ${input.Setting_and_Environment.toLowerCase()}`);

//   // Focal Action
//   addPart(`The focal action is ${input.Focal_Action.toLowerCase()}`);

//   // Lighting
//   addPart(input.Lighting_Description);

//   // Key Storytelling Props
//   addPart(input.Key_Storytelling_Props);

//   // Background Elements
//   addPart(input.Background_Elements);

//   // Color Palette
//   if (input.Dominant_Color_Palette && input.Dominant_Color_Palette.trim()) {
//     addPart(
//       `The dominant color palette includes ${input.Dominant_Color_Palette.toLowerCase()}`,
//     );
//   }

//   // Camera and Composition
//   if (input.Camera_Shot && input.Camera_Shot.trim()) {
//     const composition =
//       input.Composition_and_Blocking && input.Composition_and_Blocking.trim()
//         ? ` with ${input.Composition_and_Blocking.toLowerCase()}`
//         : "";
//     addPart(
//       `The camera shot is a ${input.Camera_Shot.toLowerCase()}${composition}`,
//     );
//   }

//   // Hidden Object
//   addPart(input.Hidden_Object);

//   return promptParts.join(" ");
// }

export function generateUnifiedImagePrompt(
  input: any,
  presentCharacters: string[],
  characterImageMap: CharacterImageMap,
  animationStyle?: string,
): string {
  const out: string[] = [];

  // 0) Rendering contract + style
  out.push(
    "Illustration brief for a single storybook page. No UI, no borders, no captions, no embedded text of any kind.",
  );
  const style = styleLine(animationStyle);
  if (style) out.push(style);

  // 1) Reference images (character identity & attire locking)
  const { intro } = buildReferenceBlock(
    presentCharacters || [],
    characterImageMap,
  );
  if (intro) out.push(intro);

  // 2) Primary moment (highest priority)
  if (input?.Focal_Action) out.push(`Main moment: ${input.Focal_Action}`);

  // 3) Subjects & exact attire (consistency anchor)
  if (Array.isArray(presentCharacters) && presentCharacters.length > 0) {
    out.push(`Subjects present: ${presentCharacters.join(", ")}.`);
  } else {
    out.push(
      "No characters present in this scene (environmental or prop-focused shot).",
    );
  }

  const charDetails = Array.isArray(input?.Character_Details)
    ? input.Character_Details
    : [];
  if (charDetails.length > 0) {
    out.push("Render characters with exact, consistent attire and attributes:");
    charDetails.forEach((c: any) => out.push(fmtCharacterLine(c)));
  }

  // 4) Interaction (only when multi-character and provided)
  if (
    Array.isArray(presentCharacters) &&
    presentCharacters.length >= 2 &&
    typeof input?.Character_Interaction_Summary === "string" &&
    input.Character_Interaction_Summary.trim()
  ) {
    out.push(`Interaction: ${input.Character_Interaction_Summary}`);
  }

  // 5) Key storytelling props (exact descriptions)
  const propsLine = fmtKeyProps(input?.Key_Storytelling_Props);
  if (propsLine) out.push(propsLine);

  // 6) Environment → 7) Time & atmosphere → 8) Lighting
  if (input?.Setting_and_Environment)
    out.push(`Environment: ${input.Setting_and_Environment}`);
  if (input?.Time_of_Day_and_Atmosphere)
    out.push(`Time & atmosphere: ${input.Time_of_Day_and_Atmosphere}`);
  if (input?.Lighting_Description)
    out.push(`Lighting: ${input.Lighting_Description}`);

  // 9) Framing: shot + composition
  if (input?.Camera_Shot) out.push(`Shot: ${input.Camera_Shot}.`);
  if (input?.Composition_and_Blocking)
    out.push(`Composition: ${input.Composition_and_Blocking}.`);

  // 10) Palette (lower priority)
  if (input?.Dominant_Color_Palette)
    out.push(`Dominant color palette: ${input.Dominant_Color_Palette}`);

  // 11) Background (low priority)
  if (input?.Background_Elements)
    out.push(`Background elements: ${input.Background_Elements}`);

  // 12) Hidden detail (lowest)
  if (input?.Hidden_Object) out.push(`Hidden detail: ${input.Hidden_Object}`);

  // 13) Hard guard (scenes usually shouldn’t render text either)
  out.push(
    "Do not render any text, letters, numbers, or labels inside the image.",
  );

  return finalizePrompt(out.join(" "));
}

/**
 * Generate unified front cover prompt for covers with characters (unified schema)
 */
// function generateUnifiedFrontCoverPrompt(input: any): string {
//   const promptParts: string[] = [];

//   const addPart = (content: string | null | undefined) => {
//     if (content && content.trim()) {
//       promptParts.push(content.trim().replace(/\.$/, "") + ".");
//     }
//   };

//   addPart(input.Cover_Concept);
//   addPart(input.Focal_Point);
//   addPart(input.Character_Placement);

//   if (input.Character_Details && input.Character_Details.length > 0) {
//     input.Character_Details.forEach((char: any) => {
//       const charDescription = `${char.Character_Name} is ${char.Pose_and_Action.toLowerCase()}, looking ${char.Gaze_Direction.toLowerCase()} with an expression of ${char.Expression.toLowerCase()}`;
//       addPart(charDescription);
//     });
//   }
//   addPart(`The camera shot is a ${input.Camera_Shot.toLowerCase()}`);

//   addPart(`The background shows ${input.Background_Setting.toLowerCase()}`);

//   if (input.Key_Visual_Elements && input.Key_Visual_Elements.length > 0) {
//     addPart(
//       `Key visual elements include: ${input.Key_Visual_Elements.join(", ").toLowerCase()}`,
//     );
//   }

//   addPart(input.Lighting_and_Mood);
//   addPart(
//     `The dominant color palette includes ${input.Color_Palette.toLowerCase()}`,
//   );

//   return promptParts.join(" ");
// }
export function generateUnifiedFrontCoverPrompt(
  input: any,
  presentCharacters: string[],
  characterImageMap: CharacterImageMap,
  animationStyle?: string,
): string {
  const out: string[] = [];

  // 0) Rendering contract + style + anti-text (repeat variations)
  out.push("Front cover illustration brief. No UI, no borders.");
  const style = styleLine(animationStyle);
  if (style) out.push(style);
  out.push(
    "ABSOLUTELY NO TEXT ON THE IMAGE: do not render any words, letters, numbers, title, author name, labels, or typography of any kind.",
  );
  out.push(
    "NO TITLE, NO LETTERING, NO SIGNAGE: keep the composition clean of all written characters.",
  );
  out.push(
    "Leave visual space where a title could go if needed, but DO NOT draw any text or glyphs.",
  );

  // 1) References
  const { intro } = buildReferenceBlock(
    presentCharacters || [],
    characterImageMap,
  );
  if (intro) out.push(intro);

  // 2) Core concept & focal
  if (input?.Cover_Concept) out.push(`Cover concept: ${input.Cover_Concept}`);
  if (input?.Focal_Point) out.push(`Focal point: ${input.Focal_Point}`);

  // 3) Characters & attire
  if (Array.isArray(presentCharacters) && presentCharacters.length > 0) {
    out.push(`Characters on cover: ${presentCharacters.join(", ")}.`);
  }
  const charDetails = Array.isArray(input?.Character_Details)
    ? input.Character_Details
    : [];
  if (charDetails.length > 0) {
    out.push("Render characters with exact, consistent attire and attributes:");
    charDetails.forEach((c: any) => out.push(fmtCharacterLine(c)));
  }

  // 4) Iconic elements
  const visuals = fmtKeyVisuals(input?.Key_Visual_Elements);
  if (visuals) out.push(visuals);

  // 5) Placement & composition
  if (input?.Character_Placement)
    out.push(`Character placement & composition: ${input.Character_Placement}`);

  // 6) Shot
  if (input?.Camera_Shot) out.push(`Shot: ${input.Camera_Shot}.`);

  // 7) Background
  if (input?.Background_Setting)
    out.push(`Background: ${input.Background_Setting}`);

  // 8) Lighting & mood
  if (input?.Lighting_and_Mood)
    out.push(`Lighting & mood: ${input.Lighting_and_Mood}`);

  // 9) Palette
  if (input?.Color_Palette) out.push(`Color palette: ${input.Color_Palette}`);

  // 10) Repeat anti-text guard at the end to reinforce
  out.push("Do not render any title or text anywhere in the artwork.");
  out.push("If you are unsure, omit text entirely.");

  return finalizePrompt(out.join(" "));
}
/**
 * Generate image for a scene (supports both with and without characters)
 */
function buildImageGenTool(
  opts: {
    hasInputImage: boolean;
  } = { hasInputImage: false },
) {
  return {
    type: "image_generation" as const,
    size: "1024x1024",
    quality,
    output_format: "png",
    ...(opts.hasInputImage && {
      input_fidelity,
    }),
  };
}

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

  /* ---------- Build Responses-API input array ---------- */
  // Build the character image inputs using toDataUrl method
  const characterImages: any[] = [];
  if (present.length > 0) {
    for (const charName of present) {
      const charVars = characterImageMap[charName];
      if (charVars && charVars.image_url) {
        try {
          characterImages.push({
            type: "input_image" as const,
            image_url: await toDataUrl(charVars.image_url),
          });
        } catch (error) {
          console.warn(
            `Failed to load image for character ${charName}:`,
            error,
          );
        }
      }
    }
  }

  // Add previous image if visual overlap is needed
  // if (scene.scene_description.Visual_Overlap_With_Previous && previousImageUrl) {
  //   try {
  //     characterImages.push({
  //       type: "input_image" as const,
  //       image_url: await toDataUrl(previousImageUrl),
  //     });
  //   } catch (error) {
  //     console.warn(`Failed to load previous scene image:`, error);
  //   }
  // }

  // Build the tool configuration
  const tools = [
    buildImageGenTool({ hasInputImage: characterImages.length > 0 }),
  ];

  const inputs = [
    {
      role: "user" as const,
      content: [
        { type: "input_text" as const, text: prompt },
        ...characterImages,
      ],
    },
  ];

  onProgress?.("generating", 30, "Calling image generation API…");

  // Make the API call using the original responses API
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: inputs,
    tools,
  });

  onProgress?.("generating", 70, "Image generated, processing…");

  const responseId = response.id;
  const imageBase64 = response.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;

  if (!imageBase64) {
    throw new Error("No image returned from OpenAI");
  }

  /* ---------- Persist to Firebase ---------- */
  const firebaseUrl = await uploadBase64ToFirebase(
    imageBase64,
    `books/${bookId}/scene_${scene.scene_description.Scene_Number}.png`,
  );

  onProgress?.(
    "generating",
    100,
    `Scene ${scene.scene_description.Scene_Number} ready`,
  );
  return { firebaseUrl, responseId };
}

export async function generateImageForFrontCover(
  bookId: string,
  frontCover: any,
  characterImageMap: Record<
    string,
    CharacterVariables
  > = DEFAULT_CHARACTER_IMAGES,
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

  onProgress?.(
    "generating_cover",
    10,
    "Prompt ready, calling image generation…",
  );

  /* ---------- Build Responses-API input array ---------- */
  // Build the character image inputs using toDataUrl method
  const characterImages: any[] = [];
  if (frontCover.Present_Characters.length > 0) {
    for (const charName of frontCover.Present_Characters) {
      const charVars = characterImageMap[charName];
      if (charVars && charVars.image_url) {
        try {
          characterImages.push({
            type: "input_image" as const,
            image_url: await toDataUrl(charVars.image_url),
          });
        } catch (error) {
          console.warn(
            `Failed to load image for character ${charName}:`,
            error,
          );
        }
      }
    }
  }

  // Build the tool configuration
  const tools = [
    buildImageGenTool({ hasInputImage: characterImages.length > 0 }),
  ];

  const inputs = [
    {
      role: "user" as const,
      content: [
        { type: "input_text" as const, text: prompt },
        ...characterImages,
      ],
    },
  ];

  onProgress?.("generating_cover", 30, "Calling image generation API…");

  // Make the API call using the original responses API
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: inputs,
    tools,
  });

  onProgress?.("generating_cover", 70, "Image generated, processing…");

  const responseId = response.id;
  const imageBase64 = response.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;

  if (!imageBase64) {
    throw new Error("No image returned from OpenAI");
  }

  /* ---------- Persist to Firebase ---------- */
  const firebaseUrl = await uploadBase64ToFirebase(
    imageBase64,
    `books/${bookId}/frontcoverimage.png`,
  );

  onProgress?.("generating_cover", 100, "Front-cover image ready");
  return { firebaseUrl, responseId };
}

export async function generateFinalCoverWithTitle(
  bookId: string,
  baseCoverUrl: string,
  storyTitle: string,
  seed: number = 3,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.("generating_cover", 0, "Adding title to cover…");

  const onQueueUpdate = (update: any) => {
    if (update.status === "completed") {
      onProgress?.("generating_cover", 100, "Title added successfully");
    } else if (update.status === "failed") {
      throw new Error("Failed to add title to cover");
    } else {
      onProgress?.("generating_cover", 50, "Processing title overlay…");
    }
  };

  const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
    input: {
      prompt: createTitleOverlayPrompt(storyTitle),
      image_url: baseCoverUrl,
      sync_mode: true,
      enable_safety_checker: false,
    },
    pollInterval: 1000,
    onQueueUpdate,
  });

  if (!result.images || result.images.length === 0) {
    throw new Error("No image generated for final cover");
  }

  const finalImageUrl = result.images[0].url;
  const dataUrl = await toDataUrl(finalImageUrl);
  const firebaseUrl = await uploadBase64ToFirebase(
    dataUrl,
    `books/${bookId}/covers`,
  );

  return firebaseUrl;
}

function createTitleOverlayPrompt(storyTitle: string): string {
  return `Add a beautiful, child-friendly book title "${storyTitle}" to the center-top of this image. The title should be:
- Large, clear, and easy to read
- In a playful, colorful font suitable for children
- Positioned in the top third of the image
- With a subtle background or shadow to ensure readability
- In colors that complement the existing image palette
- Stylized to look like a professional children's book cover`;
}

export async function regenerateBaseCoverImage(
  bookId: string,
  coverResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating base cover…");

  // Build the tool configuration
  const tools = [buildImageGenTool()];

  // Build the input structure for responses API
  const inputs = [
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: `Regenerate this cover image with the following changes: ${revisedPrompt}`,
        },
      ],
    },
  ];

  onProgress?.("regenerating", 30, "Calling image generation API…");

  // Make the API call using the original responses API
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: inputs,
    tools,
  });

  onProgress?.("regenerating", 70, "Image generated, processing…");

  const responseId = response.id;
  const imageBase64 = response.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;

  if (!imageBase64) {
    throw new Error("No image returned from OpenAI");
  }

  /* ---------- Persist to Firebase ---------- */
  const firebaseUrl = await uploadBase64ToFirebase(
    imageBase64,
    `books/${bookId}/revisedbasecover_${responseId}.png`,
  );

  onProgress?.("regenerating", 100, "Cover regeneration complete");
  return { firebaseUrl, responseId };
}

export async function regenerateSceneImage(
  bookId: string,
  sceneResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("regenerating", 0, "Regenerating scene image…");

  // Build the tool configuration
  const tools = [buildImageGenTool()];

  // Build the input structure for responses API
  const inputs = [
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: `Regenerate this scene image with the following changes: ${revisedPrompt}`,
        },
      ],
    },
  ];

  onProgress?.("regenerating", 30, "Calling image generation API…");

  // Make the API call using the original responses API
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: inputs,
    tools,
  });

  onProgress?.("regenerating", 70, "Image generated, processing…");

  const responseId = response.id;
  const imageBase64 = response.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;

  if (!imageBase64) {
    throw new Error("No image returned from OpenAI");
  }

  /* ---------- Persist to Firebase ---------- */
  const firebaseUrl = await uploadBase64ToFirebase(
    imageBase64,
    `books/${bookId}/revisedscene_${responseId}.png`,
  );

  onProgress?.("regenerating", 100, "Scene regeneration complete");
  return { firebaseUrl, responseId };
}
