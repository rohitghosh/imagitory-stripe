import { fal } from "@fal-ai/client";
import fs from "fs";
import OpenAI from "openai";
import tmp from "tmp-promise";
import fetch from "node-fetch";
import { uploadBase64ToFirebase } from "../../../uploadImage";
import { toFile } from "openai";
import { storage } from "../../../../storage"; // already exported in storage.ts

import {
  Scene,
  Scenewochar,
  SceneDescriptreion,
  ScenewocharDescription,
  FrontCover,
  FrontCoverWoChar,
  ProgressCallback,
  CharacterVariables,
  SceneRegenerationInput,
  FinalCoverRegenerationInput,
  BaseCoverRegenerationInput,
} from "../types";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

const quality = "low";
const input_fidelity = "low";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function urlToReadableStream(url: string) {
  const res = await fetch(url);
  const { path } = await tmp.file({ postfix: ".png" });
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(path, buf);
  return fs.createReadStream(path);
}

/**
 * Removes *adjacent* duplicate words (e.g. "looking looking" → "looking"),
 * but will *not* collapse across punctuation (e.g. "looking. looking" stays).
 */
function removeDuplicateAdjacentWords(text: string): string {
  const regex = /\b(\w+)\s+\1\b/gi;
  let result = text;
  // repeat until no more adjacent duplicates
  while (regex.test(result)) {
    result = result.replace(regex, "$1");
  }
  return result;
}

/**
 * Replaces every occurrence of the real character names with short aliases,
 * saves the mapping in Firestore under
 * `books/{bookId}/characterAliases`, and returns the substituted prompt.
 * @returns the prompt with character names replaced by their aliases
 */
// export async function replaceCharacterNames(
//   prompt: string,
//   presentChars: string[],
//   aliasPool: string[],
//   bookId: string,
// ): Promise<string> {
//   /* 1️⃣  Build the replacement map */
//   const aliasMap: Record<string, string> = Object.fromEntries(
//     presentChars.map((name, i) => [name, aliasPool[i % aliasPool.length]]),
//   );

//   /* 2️⃣  Persist to Firestore (books/{bookId}/characterAliases) */
//   await storage.updateBook(bookId, { characterAliases: aliasMap });

//   /* 3️⃣  Perform the substitutions */
//   const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//   let out = prompt;

//   for (const [real, alias] of Object.entries(aliasMap)) {
//     const rx = new RegExp(`\\b${esc(real)}\\b`, "gi");
//     out = out.replace(rx, alias);
//   }

//   return out;
// }

/**
 * Creates a { realName: alias } map and stores it at
 * books/{bookId}/characterAliases.
 */
export async function createAndSaveAliasMap(
  presentChars: string[],
  aliasPool: string[],
  bookId: string,
): Promise<Record<string, string>> {
  const aliasMap = Object.fromEntries(
    presentChars.map((name, i) => [name, aliasPool[i % aliasPool.length]]),
  );

  await storage.updateBook(bookId, { characterAliases: aliasMap });
  return aliasMap;
}

/**
 * Replaces every real character name in `prompt` with its alias.
 * Pure function – no I/O or side-effects.
 */
export function applyCharacterAliases(
  prompt: string,
  aliasMap: Record<string, string>,
): string {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let out = prompt;

  for (const [real, alias] of Object.entries(aliasMap)) {
    const rx = new RegExp(`\\b${esc(real)}\\b`, "gi");
    out = out.replace(rx, alias);
  }
  return out;
}

/**
 * Generate image prompt for scenes WITH characters
 */
function generateImagePrompt(input: SceneDescription): string {
  const promptParts: string[] = [];

  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      promptParts.push(content.trim().replace(/\.$/, "") + ".");
    }
  };

  // Time of Day and Atmosphere (High Priority)
  if (
    input.Time_of_Day_and_Atmosphere &&
    input.Time_of_Day_and_Atmosphere.trim()
  ) {
    addPart(
      `The scene is set during ${input.Time_of_Day_and_Atmosphere.toLowerCase()}`,
    );
  }

  // Present Characters - only if the array is not empty
  if (input.Present_Characters && input.Present_Characters.length > 0) {
    addPart(
      `The scene features: ${input.Present_Characters.join(", ").toLowerCase()}`,
    );
  }

  // Character Interaction Summary - only if it's a non-empty string
  if (
    input.Character_Interaction_Summary &&
    input.Character_Interaction_Summary.trim()
  ) {
    addPart(input.Character_Interaction_Summary);
  }

  // Character Details - only if the array is not empty
  if (input.Character_Details && input.Character_Details.length > 0) {
    input.Character_Details.forEach((char) => {
      const nameDesc = char.Character_Name.split(" (")[0];
      const desc = char.Character_Name.match(/\((.*)\)/)?.[1] || "";
      const charDescription = `${nameDesc}${desc ? ` (${desc})` : ""} is ${char.Pose_and_Action.toLowerCase()}, looking ${char.Gaze_Direction.toLowerCase()} with an expression of ${char.Expression.toLowerCase()}`;
      addPart(charDescription);
    });
  }

  // Setting and Environment
  addPart(`It unfolds in ${input.Setting_and_Environment.toLowerCase()}`);

  // Focal Action
  addPart(`The focal action is ${input.Focal_Action.toLowerCase()}`);

  // Lighting
  addPart(input.Lighting_Description);

  // Key Storytelling Props
  addPart(input.Key_Storytelling_Props);

  // Background Elements
  addPart(input.Background_Elements);

  // Color Palette
  if (input.Dominant_Color_Palette && input.Dominant_Color_Palette.trim()) {
    addPart(
      `The dominant color palette includes ${input.Dominant_Color_Palette.toLowerCase()}`,
    );
  }

  // Camera and Composition
  if (input.Camera_Shot && input.Camera_Shot.trim()) {
    const composition =
      input.Composition_and_Blocking && input.Composition_and_Blocking.trim()
        ? ` with ${input.Composition_and_Blocking.toLowerCase()}`
        : "";
    addPart(
      `The camera shot is a ${input.Camera_Shot.toLowerCase()}${composition}`,
    );
  }

  // Hidden Object
  addPart(input.Hidden_Object);

  return promptParts.join(" ");
}

/**
 * Generate image prompt for scenes WITHOUT characters
 */
function generateImagePromptWoChar(input: ScenewocharDescription): string {
  const promptParts: string[] = [];

  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      promptParts.push(content.trim().replace(/\.$/, "") + ".");
    }
  };

  // Start with the overall atmosphere and time of day
  addPart(
    `The scene is set during ${input.Time_of_Day_and_Atmosphere.toLowerCase()}`,
  );

  // Describe the primary setting
  addPart(`It unfolds in ${input.Setting_and_Environment.toLowerCase()}`);

  // Add character details (designed to be full sentences)
  addPart(input.Character_Gaze);
  addPart(input.Character_Expression_and_Pose);

  // Specify the main action of the scene
  addPart(`The focal action is ${input.Focal_Action.toLowerCase()}`);

  // Detail the important objects and background elements
  addPart(input.Key_Storytelling_Props);
  addPart(input.Background_Elements);
  addPart(input.Hidden_Object);

  // Define the artistic and cinematic direction
  addPart(
    `The dominant color palette includes ${input.Dominant_Color_Palette.toLowerCase()}`,
  );
  addPart(`The camera shot is a ${input.Camera_Shot.toLowerCase()}`);

  return promptParts.join(" ");
}

/**
 * Generate front cover prompt for covers WITH characters
 */
function generateFrontCoverPrompt(input: FrontCover): string {
  const promptParts: string[] = [];

  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      promptParts.push(content.trim().replace(/\.$/, "") + ".");
    }
  };

  addPart(input.Cover_Concept);
  addPart(input.Focal_Point);
  addPart(input.Character_Placement);

  if (input.Character_Details && input.Character_Details.length > 0) {
    input.Character_Details.forEach((char) => {
      const charDescription = `${char.Character_Name} is ${char.Pose_and_Action.toLowerCase()}, looking ${char.Gaze_Direction.toLowerCase()} with an expression of ${char.Expression.toLowerCase()}`;
      addPart(charDescription);
    });
  }

  addPart(`The background shows ${input.Background_Setting.toLowerCase()}`);

  if (input.Key_Visual_Elements && input.Key_Visual_Elements.length > 0) {
    addPart(
      `Key visual elements include: ${input.Key_Visual_Elements.join(", ").toLowerCase()}`,
    );
  }

  addPart(input.Lighting_and_Mood);
  addPart(
    `The dominant color palette includes ${input.Color_Palette.toLowerCase()}`,
  );

  return promptParts.join(" ");
}

/**
 * Generate front cover prompt for covers WITHOUT characters
 */
function generateFrontCoverPromptWoChar(input: FrontCoverWoChar): string {
  const promptParts: string[] = [];

  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      promptParts.push(content.trim().replace(/\.$/, "") + ".");
    }
  };

  addPart(input.Cover_Concept);
  addPart(input.Focal_Point);
  addPart(input.Character_Placement_and_Pose);
  addPart(input.Character_Gaze_and_Expression);

  addPart(`The background shows ${input.Background_Setting.toLowerCase()}`);

  if (input.Key_Visual_Elements && input.Key_Visual_Elements.length > 0) {
    addPart(
      `Key visual elements include: ${input.Key_Visual_Elements.join(", ").toLowerCase()}`,
    );
  }

  addPart(input.Lighting_and_Mood);
  addPart(
    `The dominant color palette includes ${input.Color_Palette.toLowerCase()}`,
  );

  return promptParts.join(" ");
}

/**
 * Generate image for a scene (supports both with and without characters)
 */
// export async function generateImageForScene(
//   bookId: string,
//   scene: Scene | Scenewochar,
//   previousImageUrl: string | null,
//   characterImageMap: Record<
//     string,
//     CharacterVariables
//   > = DEFAULT_CHARACTER_IMAGES,
//   onProgress?: ProgressCallback,
//   seed: number = 3, // NEW PARAMETER
// ): Promise<string> {
//   onProgress?.(
//     "generating",
//     0,
//     `Preparing scene ${scene.scene_description.Scene_Number}`,
//   );

//   // Determine if this is a scene with characters or without
//   const hasCharacters = "Character_Details" in scene.scene_description;

//   let Present_Characters: string[] = [];
//   let Visual_Overlap_With_Previous: boolean = false;
//   let basePrompt: string;

//   if (hasCharacters) {
//     const sceneWithChar = scene as Scene;
//     Present_Characters = sceneWithChar.scene_description.Present_Characters;
//     Visual_Overlap_With_Previous =
//       sceneWithChar.scene_description.Visual_Overlap_With_Previous;
//     basePrompt = generateImagePrompt(sceneWithChar.scene_description);
//   } else {
//     const sceneWoChar = scene as Scenewochar;
//     Present_Characters = sceneWoChar.scene_description.Present_Characters;
//     Visual_Overlap_With_Previous =
//       sceneWoChar.scene_description.Visual_Overlap_With_Previous;
//     basePrompt = generateImagePromptWoChar(sceneWoChar.scene_description);
//   }

//   basePrompt = removeDuplicateAdjacentWords(basePrompt);

//   const imageUrls: string[] = [];
//   const characterDataForPrompt: Array<{ name: string; description: string }> =
//     [];

//   Present_Characters.forEach((name) => {
//     const characterData = characterImageMap[name];
//     if (characterData && characterData.image_url) {
//       imageUrls.push(characterData.image_url);
//       characterDataForPrompt.push({
//         name: name,
//         description: characterData.description,
//       });
//     }
//   });

//   let attachmentText = "";
//   if (characterDataForPrompt.length > 0) {
//     attachmentText = characterDataForPrompt
//       .map((char, idx) => {
//         const ordinal =
//           idx === 0
//             ? "1st"
//             : idx === 1
//               ? "2nd"
//               : idx === 2
//                 ? "3rd"
//                 : `${idx + 1}th`;
//         return `${char.name}(${char.description} as shown in ${ordinal} image)`;
//       })
//       .join(" and ");
//   }

//   // Check if the previous image should be used for continuity
//   const usePreviousImage = Visual_Overlap_With_Previous && previousImageUrl;

//   if (usePreviousImage) {
//     imageUrls.push(previousImageUrl!);
//     const prevSceneImageIndex = imageUrls.length;
//     const suffix = prevSceneImageIndex === 3 ? "rd" : "th";
//     attachmentText += ` and the image from the previous scene (${prevSceneImageIndex}${suffix} image)`;
//   }

//   const onQueueUpdate = (update: any) => {
//     if (update.status === "IN_PROGRESS") {
//       update.logs.map((log: any) => log.message).forEach(console.log);
//     }
//   };

//   let response = null;

//   if (imageUrls.length > 0) {
//     // Case 1: Images are present. Use the 'multi' endpoint.
//     let prompt = `Attached are the images of ${attachmentText}. DO NOT WRITE ANY OF THE CHARACTER NAMES ANYWHERE ON THE IMAGE. Make the image pixar-Style animation. Create a scene as described below:\n${basePrompt}`;

//     if (usePreviousImage) {
//       prompt += `\n\n**Visual Consistency Note:** The last image attached is from the previous scene. Use it as a reference to maintain visual consistency in the setting, props, and overall environment. The character poses and actions should still follow the new scene description.`;
//     }
//     console.log("Final Prompt:", prompt);
//     console.log("Image URLs sent to AI:", imageUrls);

//     const replacementNames = ["Reet", "Jeet", "Meet", "Heet"];
//     prompt = replaceCharacterNames(
//       prompt,
//       Present_Characters,
//       replacementNames,
//     );

//     // const attachments = await Promise.all(imageUrls.map(urlToReadableStream));
//     const attachments = await Promise.all(
//       imageUrls.map(async (url) => {
//         // fetch the remote image into a Buffer
//         const res = await fetch(url);
//         const arrayBuffer = await res.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
//         // wrap it as a PNG file for OpenAI
//         return toFile(buffer, "image.png", { type: "image/png" });
//       }),
//     );
//     const openAiBase = {
//       model: "gpt-image-1",
//       n: 1,
//       input_fidelity,
//       quality,
//       background: "auto",
//       output_format: "png" as const,
//       size: "1024x1024",
//     };

//     response = await openai.images.edit({
//       ...openAiBase,
//       prompt,
//       image: attachments,
//     });
//   } else {
//     // Case 2: No images. Use the 'text-to-image' endpoint.
//     console.log("Calling text-to-image endpoint");
//     console.log("Final Prompt:", basePrompt);
//     const openAiBasenochar = {
//       model: "gpt-image-1",
//       n: 1,
//       quality,
//       background: "auto",
//       output_format: "png" as const,
//       size: "1024x1024",
//     };

//     onProgress?.("generating", 20, "Calling image API…");
//     response = await openai.images.generate({
//       ...openAiBasenochar,
//       prompt: basePrompt,
//     });
//   }

//   const base64 = response.data[0].b64_json!;
//   const firebaseUrl = await uploadBase64ToFirebase(
//     base64,
//     `books/${bookId}/scene_${scene.scene_description.Scene_Number}.png`,
//   );

//   onProgress?.(
//     "generating",
//     100,
//     `Scene ${scene.scene_description.Scene_Number} ready`,
//   );
//   // return imageUrl;
//   console.log(`FirebaseUrl generated for scene: ${firebaseUrl}`);
//   return firebaseUrl;
// }

/* ---------- helper: builds the flattened tool object ---------- */
function buildImageGenTool(
  opts: {
    hasInputImage: boolean;
  } = { hasInputImage: false },
) {
  const tool: Record<string, any> = {
    type: "image_generation",
    /* mandatory knobs */
    model: "gpt-image-1",
    size: "1024x1024",
    quality: quality,
    output_format: "png",
  };

  if (opts.hasInputImage) {
    tool.input_fidelity = input_fidelity; // only when reference images exist
  }

  return tool;
}

/**
 * Generates (or edits) a scene illustration by calling the OpenAI *Responses* API.
 * – Uses every parameter that the old implementation had.
 * – Works with / without reference images.
 * – Returns { responseId, firebaseUrl } so the caller can chain the next turn.
 */
/**
 * Generates (or edits) a scene illustration.
 * Returns { firebaseUrl, responseId }.
 */
export async function generateImageForScene(
  bookId: string,
  scene: Scene | Scenewochar,
  previousImageUrl: string | null,
  characterImageMap: Record<
    string,
    CharacterVariables
  > = DEFAULT_CHARACTER_IMAGES,
  onProgress?: ProgressCallback,
  seed = 3,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.(
    "generating",
    0,
    `Preparing scene ${scene.scene_description.Scene_Number}`,
  );

  /* ---------- Gather scene facts ---------- */
  const hasChars = "Character_Details" in scene.scene_description;
  const { Present_Characters, Visual_Overlap_With_Previous } =
    scene.scene_description as any;

  const basePrompt = hasChars
    ? generateImagePrompt(scene.scene_description as any)
    : generateImagePromptWoChar(scene.scene_description as any);

  /* ---------- Collect reference image URLs ---------- */
  const imageUrls: string[] = [];
  const refSnippets: string[] = [];

  Present_Characters.forEach((name: string, idx: number) => {
    const char = characterImageMap[name];
    if (char?.image_url) {
      imageUrls.push(char.image_url);
      const ord = ["1st", "2nd", "3rd"][idx] || `${idx + 1}th`;
      refSnippets.push(`${name} (${char.description} in the ${ord} image)`);
    }
  });

  if (Visual_Overlap_With_Previous && previousImageUrl) {
    imageUrls.push(previousImageUrl);
    const idx = imageUrls.length;
    const suffix = idx === 3 ? "rd" : "th";
    refSnippets.push(`previous-scene reference (${idx}${suffix} image)`);
  }

  /* ---------- Build the final natural-language prompt ---------- */
  const intro =
    imageUrls.length > 0
      ? `Attached image${imageUrls.length > 1 ? "s" : ""} show ${refSnippets.join(" and ")}.\n`
      : "";

  let prompt =
    intro +
    "Create a Pixar-style illustration of the scene described below. " +
    "Do NOT write any character names anywhere in the artwork.\n\n" +
    removeDuplicateAdjacentWords(basePrompt);

  if (Visual_Overlap_With_Previous && previousImageUrl) {
    prompt +=
      "\n\nVisual consistency: the last attached image is the previous scene—match setting, props and palette.";
  }

  const aliasPool = ["Reet", "Jeet", "Meet", "Heet"];

  const aliasMap = await createAndSaveAliasMap(
    Present_Characters,
    aliasPool,
    bookId,
  );

  // 2️⃣  Inject aliases into any prompt
  const safePrompt = applyCharacterAliases(prompt, aliasMap);

  console.log("Prompt sent to model:\n", safePrompt);
  console.log("Reference images:", imageUrls);

  /* ---------- Build Responses-API input array ---------- */
  // const inputs = [
  //   { type: "input_text", text: prompt },
  //   ...imageUrls.map((url) => ({ type: "input_image", image_url: { url } })),
  // ];

  const inputs = [
    {
      role: "user",
      content: [
        { type: "input_text", text: safePrompt },
        ...imageUrls.map((url) => ({
          type: "input_image",
          image_url: url,
        })),
      ],
    },
  ];

  const tool = buildImageGenTool({ hasInputImage: imageUrls.length > 0 });

  /* ---------- Call OpenAI Responses API ---------- */
  onProgress?.("generating", 25, "Contacting OpenAI…");

  const resp = await openai.responses.create({
    model: "gpt-4o-mini",
    input: inputs,
    tools: [tool], // ← single, well-formed tool object
  });
  // const resp = await openai.responses.retrieve(
  //   "resp_6880d4746124819f85bac69f0055c03700d1ab5d60bfc8c6",
  // );

  const responseId = resp.id;
  const imageBase64 = resp.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;

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

/**
 * Generates (or edits) a book **front-cover** illustration via the OpenAI
 * Responses API and returns both the image URL (Firebase) and the response-ID
 * for future chained edits.
 *
 * Relies on `buildImageGenTool()` that already exists in the same file.
 */
export async function generateImageForFrontCover(
  bookId: string,
  frontCover: FrontCover | FrontCoverWoChar,
  characterImageMap: Record<
    string,
    CharacterVariables
  > = DEFAULT_CHARACTER_IMAGES,
  onProgress?: ProgressCallback,
  seed = 3,
): Promise<{ firebaseUrl: string; responseId: string }> {
  onProgress?.("generating_cover", 0, "Preparing front-cover image…");

  /* ────────────── 1. Derive prompt & character context ────────────── */
  const hasCharacters = "Character_Details" in frontCover;
  const { Present_Characters } = frontCover as FrontCover | FrontCoverWoChar;

  const basePrompt = hasCharacters
    ? generateFrontCoverPrompt(frontCover as FrontCover)
    : generateFrontCoverPromptWoChar(frontCover as FrontCoverWoChar);

  /* ────────────── 2. Collect reference-image URLs ─────────────────── */
  const imageUrls: string[] = [];
  const refSnippets: string[] = [];

  Present_Characters.forEach((name, idx) => {
    const char = characterImageMap[name];
    if (char?.image_url) {
      imageUrls.push(char.image_url);
      const ord = ["1st", "2nd", "3rd"][idx] || `${idx + 1}th`;
      refSnippets.push(`${name} (${char.description} in the ${ord} image)`);
    }
  });

  /* ────────────── 3. Build the natural-language prompt ────────────── */
  const intro =
    imageUrls.length > 0
      ? `Attached image${imageUrls.length > 1 ? "s" : ""} show ${refSnippets.join(" and ")}.\n`
      : "";

  let prompt =
    intro +
    "Create a vibrant Pixar-style front cover illustration as described below. " +
    "Do NOT write any title or character names on the artwork.\n\n" +
    removeDuplicateAdjacentWords(basePrompt);

  const aliasPool = ["Reet", "Jeet", "Meet", "Heet"];
  const aliasMap = await createAndSaveAliasMap(
    Present_Characters,
    aliasPool,
    bookId,
  );

  // 2️⃣  Inject aliases into any prompt
  const safePrompt = applyCharacterAliases(prompt, aliasMap);

  console.log("Front-cover prompt:\n", safePrompt);
  console.log("Reference images:", imageUrls);

  /* ────────────── 4. Assemble the Responses-API payload ───────────── */
  const inputs = [
    {
      role: "user",
      content: [
        { type: "input_text", text: safePrompt },
        ...imageUrls.map((url) => ({ type: "input_image", image_url: url })),
      ],
    },
  ];

  const tool = buildImageGenTool({
    hasInputImage: imageUrls.length > 0,
  });

  /* ────────────── 5. Call OpenAI Responses API ────────────────────── */
  onProgress?.("generating_cover", 25, "Contacting OpenAI…");

  const resp = await openai.responses.create({
    model: "gpt-4o-mini", // chat wrapper; tool invokes GPT-Image-1
    input: inputs,
    tools: [tool],
  });

  // const resp = await openai.responses.retrieve(
  //   "resp_6880d4746124819f85bac69f0055c03700d1ab5d60bfc8c6",
  // );

  /* ────────────── 6. Extract image & persist to Firebase ───────────── */
  const responseId = resp.id;
  const base64 = resp.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;
  if (!base64) throw new Error("No image returned from OpenAI.");

  const firebaseUrl = await uploadBase64ToFirebase(
    base64,
    `books/${bookId}/frontcoverimage.png`,
  );

  onProgress?.("generating_cover", 100, "Front-cover image ready");
  console.log("Firebase URL for front cover:", firebaseUrl);

  return { firebaseUrl, responseId };
}

// /**
//  * Generate image for front cover (supports both with and without characters)
//  */
// export async function generateImageForFrontCover(
//   bookId: string,
//   frontCover: FrontCover | FrontCoverWoChar,
//   characterImageMap: Record<
//     string,
//     CharacterVariables
//   > = DEFAULT_CHARACTER_IMAGES,
//   onProgress?: ProgressCallback,
//   seed: number = 3, // NEW PARAMETER
// ): Promise<string> {
//   onProgress?.("generating_cover", 0, "Preparing front cover image...");

//   // Determine if this is a cover with characters or without
//   const hasCharacters = "Character_Details" in frontCover;

//   let basePrompt: string;
//   let Present_Characters: string[] = [];

//   if (hasCharacters) {
//     const coverWithChar = frontCover as FrontCover;
//     Present_Characters = coverWithChar.Present_Characters;
//     basePrompt = generateFrontCoverPrompt(coverWithChar);
//   } else {
//     const coverWoChar = frontCover as FrontCoverWoChar;
//     Present_Characters = coverWoChar.Present_Characters;
//     basePrompt = generateFrontCoverPromptWoChar(coverWoChar);
//   }

//   // const imageUrls: string[] = [];
//   // const characterNamesForPrompt: string[] = [];
//   const imageUrls: string[] = [];
//   const characterDataForPrompt: Array<{ name: string; description: string }> =
//     [];

//   Present_Characters.forEach((name) => {
//     const characterData = characterImageMap[name];
//     if (characterData && characterData.image_url) {
//       imageUrls.push(characterData.image_url);
//       characterDataForPrompt.push({
//         name: name,
//         description: characterData.description,
//       });
//     }
//   });

//   const onQueueUpdate = (update: any) => {
//     if (update.status === "IN_PROGRESS") {
//       update.logs.map((log: any) => log.message).forEach(console.log);
//     }
//   };

//   onProgress?.("generating_cover", 20, "Calling image API for cover...");

//   // let falRes;
//   let response = null;

//   if (imageUrls.length > 0) {
//     let prompt: string;
//     if (characterDataForPrompt.length > 0) {
//       const attachmentText = characterDataForPrompt
//         .map((char, idx) => {
//           const ordinal =
//             idx === 0
//               ? "1st"
//               : idx === 1
//                 ? "2nd"
//                 : idx === 2
//                   ? "3rd"
//                   : `${idx + 1}th`;
//           return `${char.name}(${char.description} as shown in ${ordinal} image)`;
//         })
//         .join(" and ");

//       prompt = `Attached are the images of ${attachmentText}. DO NOT WRITE ANY TITLE ON THE IMAGE. Make the image pixar-Style animation. Create a vibrant, beautiful book front cover as described below:\n${basePrompt}`;
//     } else {
//       prompt = basePrompt;
//     }

//     console.log("Calling multi-modal endpoint for front cover...");

//     const replacementNames = ["Reet", "Jeet", "Meet", "Heet"];
//     prompt = replaceCharacterNames(
//       prompt,
//       Present_Characters,
//       replacementNames,
//     );

//     const openAiBase = {
//       model: "gpt-image-1",
//       n: 1,
//       input_fidelity,
//       quality,
//       background: "auto",
//       output_format: "png" as const,
//       size: "1024x1024",
//     };

//     const attachments = await Promise.all(
//       imageUrls.map(async (url) => {
//         // fetch the remote image into a Buffer
//         const res = await fetch(url);
//         const arrayBuffer = await res.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
//         // wrap it as a PNG file for OpenAI
//         return toFile(buffer, "image.png", { type: "image/png" });
//       }),
//     );

//     response = await openai.images.edit({
//       ...openAiBase,
//       prompt,
//       image: attachments,
//     });
//   } else {
//     // No character images, use text-to-image
//     console.log("Calling text-to-image endpoint for front cover...");
//     const openAiBasenochar = {
//       model: "gpt-image-1",
//       n: 1,
//       quality,
//       background: "auto",
//       output_format: "png" as const,
//       size: "1024x1024",
//     };

//     response = await openai.images.generate({
//       ...openAiBasenochar,
//       prompt: basePrompt,
//     });
//   }

//   onProgress?.("generating_cover", 80, "Processing response for cover...");

//   const base64 = response.data[0].b64_json!;
//   const firebaseUrl = await uploadBase64ToFirebase(
//     base64,
//     `books/${bookId}/frontcoverimage.png`,
//   );

//   onProgress?.("generating_cover", 100, "Front cover image ready");
//   // return imageUrl;
//   console.log(`FirebaseUrl generated for front cover: ${firebaseUrl}`);
//   return firebaseUrl;
// }

/**
 * Generate final cover with title overlay using image-to-image generation
 */
export async function generateFinalCoverWithTitle(
  bookId: string,
  baseCoverUrl: string,
  storyTitle: string,
  seed: number = 3,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.("generating_final_cover", 0, "Adding title to cover...");

  // Optimized prompt for premium storybook title overlay
  const titlePrompt = createTitleOverlayPrompt(storyTitle);

  const onQueueUpdate = (update: any) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log: any) => log.message).forEach(console.log);
    }
  };

  onProgress?.("generating_final_cover", 20, "Calling title overlay API...");

  console.log("Adding title to cover using fal-ai/flux-pro/kontext");
  console.log(`Base cover URL: ${baseCoverUrl}`);
  console.log(`Title prompt: ${titlePrompt}`);

  const falRes = await fal.subscribe("fal-ai/flux-pro/kontext", {
    input: {
      prompt: titlePrompt,
      image_url: baseCoverUrl,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: "jpeg",
      safety_tolerance: "2",
      seed: seed,
    },
    logs: true,
    onQueueUpdate,
  });
  const finalCoverUrl = falRes?.data?.images?.[0]?.url;
  // const finalCoverUrl = baseCoverUrl;

  onProgress?.(
    "generating_final_cover",
    80,
    "Processing title overlay response...",
  );

  if (!finalCoverUrl) {
    throw new Error("No final cover URL returned from Fal AI title overlay");
  }

  onProgress?.("generating_final_cover", 100, "Final cover with title ready");
  return finalCoverUrl;
}

/**
 * Create optimized prompt for adding title to storybook cover
 */
function createTitleOverlayPrompt(storyTitle: string): string {
  return `Add the title "${storyTitle}" to this children's storybook cover. Place the title text in large, bold, child-friendly typography at the top of the cover with excellent readability. Use vibrant, contrasting colors that stand out beautifully against the background. The text should have a subtle drop shadow or outline for clarity. Style the typography to match premium children's book design - playful yet elegant, with rounded, friendly letterforms. Ensure the title integrates harmoniously with the existing artwork while remaining the focal point. The text placement should leave the central imagery unobstructed and create a balanced, professional book cover layout.`;
}

/**
 * Regenerate final cover with new title or seed
 */
// export async function regenerateFinalCover(
//   finalCoverInputs: FinalCoverRegenerationInput,
//   newSeed?: number,
//   onProgress?: ProgressCallback,
// ): Promise<string> {
//   const seedToUse = newSeed ?? finalCoverInputs.seed ?? 3;

//   return generateFinalCoverWithTitle(
//     finalCoverInputs.base_cover_url,
//     finalCoverInputs.story_title,
//     seedToUse,
//     onProgress,
//   );
// }

// Update existing regenerateCoverImage to be more specific
export async function regenerateBaseCoverImage(
  bookId: string,
  coverResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  const tool = buildImageGenTool({ hasInputImage: true });

  const bookDoc = await storage.getBook(bookId);
  const aliasMap = bookDoc?.characterAliases ?? {};

  const safePrompt = applyCharacterAliases(revisedPrompt, aliasMap);

  const resp = await openai.responses.create({
    model: "gpt-4o-mini",
    previous_response_id: coverResponseId,
    input: safePrompt,
    tools: [tool],
  });
  // const resp = await openai.responses.retrieve(
  //   "resp_68829838fc8081a2bae1eaca792759180397c21e6f5837fd",
  // );

  const responseId = resp.id;
  const base64 = resp.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;
  if (!base64) throw new Error("No image returned from OpenAI.");

  const firebaseUrl = await uploadBase64ToFirebase(
    base64,
    `books/${bookId}/revisedbasecover_${responseId}.png`,
  );

  onProgress?.("generating_cover", 100, "Front-cover image ready");
  console.log("Firebase URL for front cover:", firebaseUrl);

  return { firebaseUrl, responseId };
}

// New function for regenerating individual scenes
export async function regenerateSceneImage(
  bookId: string,
  sceneResponseId: string,
  revisedPrompt: string,
  onProgress?: ProgressCallback,
): Promise<{ firebaseUrl: string; responseId: string }> {
  // Create a mock scene object for the existing function

  const tool = buildImageGenTool({ hasInputImage: true });

  const bookDoc = await storage.getBook(bookId);
  const aliasMap = bookDoc?.characterAliases ?? {};

  const safePrompt = applyCharacterAliases(revisedPrompt, aliasMap);

  const resp = await openai.responses.create({
    model: "gpt-4o-mini",
    previous_response_id: sceneResponseId,
    input: safePrompt,
    tools: [tool],
  });
  // const resp = await openai.responses.retrieve(
  //   "resp_68829838e654819f8b2fb24f421b7cd70a524d78cb442626",
  // );

  const responseId = resp.id;
  const base64 = resp.output.find(
    (o) => o.type === "image_generation_call",
  )?.result;
  if (!base64) throw new Error("No image returned from OpenAI.");

  const firebaseUrl = await uploadBase64ToFirebase(
    base64,
    `books/${bookId}/revisedscene_${responseId}.png`,
  );

  onProgress?.("generating_cover", 100, "Front-cover image ready");
  console.log("Firebase URL for front cover:", firebaseUrl);

  return { firebaseUrl, responseId };
}

// New function for regenerating cover
// export async function regenerateCoverImage(
//   coverInputs: BaseCoverRegenerationInput,
//   newSeed?: number,
//   onProgress?: ProgressCallback,
// ): Promise<string> {
//   const seedToUse = newSeed ?? coverInputs.seed ?? 3;

//   return generateImageForFrontCover(
//     coverInputs.front_cover,
//     coverInputs.characterImageMap,
//     onProgress,
//     seedToUse,
//   );
// }
