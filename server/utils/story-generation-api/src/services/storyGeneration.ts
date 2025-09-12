// import OpenAI from "openai";
// import { zodTextFormat } from "openai/helpers/zod";
// import {
//   UnifiedStoryResponse,
//   unifiedStoryResponseSchema,
//   ProgressCallback,
//   CharacterVariables,
// } from "../types";
// import { UNIFIED_STORY_SYSTEM_PROMPT } from "../utils/prompts";
// import {
//   createStoryInputs,
//   validateCharacterLimit,
//   injectVariables,
// } from "../utils/helpers";
// import {
//   generateImageForScene,
//   generateImageForFrontCover,
//   generateFinalCoverWithTitle,
// } from "./imageGeneration";
// import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

// const openai = new OpenAI();

// // Types for the complete story generation
// export interface SceneOutput {
//   scene_number: number;
//   imageUrl: string;
//   imageUrls: string[];
//   sceneResponseIds: string[];
//   current_scene_index: number;
//   content: string[];
//   side: "left" | "right";
//   scene_inputs: {
//     scene_description: any;
//     characterImageMap: Record<string, CharacterVariables>;
//     previousImageUrl: string | null;
//     seed: number;
//   };
// }

// export interface StoryPackage {
//   scenes: SceneOutput[];
//   cover: {
//     base_cover_url: string;
//     base_cover_urls: string[];
//     base_cover_response_id: string;
//     base_cover_response_ids: string[];
//     current_base_cover_index: number;
//     story_title: string;
//     base_cover_inputs: {
//       front_cover: any;
//       characterImageMap: Record<string, CharacterVariables>;
//       seed: number;
//     };
//     final_cover_url: string;
//     final_cover_urls: string[];
//     current_final_cover_index: number;
//     final_cover_inputs: {
//       base_cover_url: string;
//       story_title: string;
//       seed: number;
//     };
//   };
// }

// export async function generateStoryScenesFromInputs(
//   input: {
//     kidName: string;
//     pronoun: string;
//     age: number;
//     moral: string;
//     kidInterests: string[];
//     storyThemes: string[];
//     storyRhyming: boolean;
//     characters?: string[];
//     characterDescriptions?: string[];
//   },
//   onProgress?: ProgressCallback,
//   onToken?: (chunk: string) => void,
// ): Promise<UnifiedStoryResponse> {
//   // Validate character limit
//   if (!validateCharacterLimit(input.characters, 3)) {
//     throw new Error("Too many additional characters. Maximum allowed is 3.");
//   }

//   onProgress?.("prompting", 5, "Building LLM prompt…");

//   // Create story inputs for the prompt
//   const storyInputs = createStoryInputs(input);

//   // Inject variables into the system prompt
//   const systemPrompt = injectVariables(
//     UNIFIED_STORY_SYSTEM_PROMPT,
//     storyInputs,
//   );

//   onProgress?.("prompting", 15, "System prompt assembled…");

//   // Build user prompt dynamically
//   let userPrompt = `\nYou are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a 9-scene story blueprint`;

//   // Add character information if present
//   if (input.characters && input.characters.length > 0) {
//     const charCount = input.characters.length;
//     if (charCount === 1) {
//       userPrompt += ` featuring a main character and a side character`;
//     } else {
//       userPrompt += ` featuring a main character and ${charCount} additional characters`;
//     }
//   } else {
//     userPrompt += ` featuring only the main character`;
//   }

//   userPrompt += `.\n\n**INPUTS FOR THIS STORY:**
// * **kidName:** "\`${input.kidName}\`"
// * **pronoun:** "\`${input.pronoun}\`"
// * **age:** \`${input.age}\`
// * **moral:** "\`${input.moral}\`"
// * **kidInterest:** "\`${input.kidInterests[0]}\`"
// * **storyTheme:** "\`${input.storyThemes[0]}\`"`;

//   // Add character variables dynamically
//   if (input.characters && input.characters.length > 0) {
//     const charCount = input.characters.length;
//     for (let i = 0; i < charCount; i++) {
//       const charIndex = i + 1;
//       userPrompt += `
// * **character${charIndex} (Additional Character ${charIndex} Name):** "\`${input.characters[i]}\`"
// * **character${charIndex}_description (Additional Character ${charIndex} Description):** "\`${input.characterDescriptions?.[i] || ""}\`"`;
//     }
//   }

//   userPrompt += `
// * **storyRhyming:** \`${input.storyRhyming}\`

// **TASK:**
// Produce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each scene, strictly following the unified \`scene_description\` structure and the \`scene_text\` guidelines outlined in the System Prompt.

// Do not write any other text, explanation, or introduction. Your entire output must be only the raw JSON array.`;

//   onProgress?.("prompting", 25, "Calling AI servers…");

//   const stream = await openai.responses.create({
//     model: "o4-mini",
//     stream: true,
//     input: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: userPrompt },
//     ],
//     text: {
//       format: zodTextFormat(unifiedStoryResponseSchema, "story_response"),
//     },
//     reasoning: { effort: "low", summary: "detailed" },
//   });

//   let jsonBuf = "";

//   for await (const ev of stream) {
//     if (ev.type === "response.reasoning_summary_text.delta") {
//       onToken?.(ev.delta); // ← push to jobTracker
//     }
//     if (ev.type === "response.output_text.delta") {
//       jsonBuf += ev.delta;
//     }
//   }

//   onProgress?.("prompting", 35, "Parsing AI response…");
//   let story: UnifiedStoryResponse;

//   try {
//     story = unifiedStoryResponseSchema.parse(JSON.parse(jsonBuf));
//   } catch (e) {
//     console.error("Failed to parse story JSON", e);
//     throw new Error("Structured output was invalid JSON or wrong shape");
//   }

//   // Sanity-check scene count
//   if (!Array.isArray(story.scenes) || story.scenes.length !== 9) {
//     throw new Error("Structured output did not contain exactly 9 scenes");
//   }

//   onProgress?.("prompting", 50, "Story outline ready");
//   return story;
// }

// /**
//  * Creates an entire illustrated story and returns the `responseId` coming from every scene image and the front-cover image.
//  */
// export async function generateCompleteStory(
//   input: {
//     kidName: string;
//     pronoun: string;
//     age: number;
//     moral: string;
//     storyRhyming: boolean;
//     kidInterests: string[];
//     storyThemes: string[];
//     characters?: string[];
//     characterDescriptions?: string[];
//   },
//   characterImageMap: Record<
//     string,
//     CharacterVariables
//   > = DEFAULT_CHARACTER_IMAGES,
//   onProgress?: ProgressCallback,
//   bookId?: string,
//   seed = 3,
// ): Promise<StoryPackage> {
//   // Use provided bookId or generate a unique one if not provided
//   const finalBookId = bookId || `book_${Date.now()}`;

//   /* ── 1. Story outline ─────────────────────────────────────────────── */
//   onProgress?.("prompting", 0, "Generating story outline…");
//   const story = await generateStoryScenesFromInputs(
//     input,
//     (phase, pct, msg) => onProgress?.(phase, pct * 0.4, msg),
//     (chunk) => onProgress?.("reasoning", 0, chunk),
//   );
//   onProgress?.("prompting", 40, "Story outline ready");

//   /* ── 2. Scene images (40 → 90 %) ──────────────────────────────────── */
//   const total = story.scenes.length;
//   const sides: ("left" | "right")[] = Array.from({ length: total }, () =>
//     Math.random() < 0.5 ? "left" : "right",
//   );
//   const share = 50 / total;

//   onProgress?.("generating", 40, "Starting scene images…");

//   const scenePromises = story.scenes.map((scene: any, index: number) =>
//     generateImageForScene(
//       finalBookId, // Use the consistent bookId
//       scene,
//       null,
//       characterImageMap,
//       (phase, pct, msg) => {
//         const overall = 40 + index * share + (pct / 100) * share;
//         onProgress?.(phase, overall, msg);
//       },
//       seed,
//     ),
//   );

//   const generatedScenes = await Promise.all(scenePromises);
//   onProgress?.("generating", 90, "All scene images generated");

//   /* ── 3. Front cover without title (92 → 96 %) ─────────────────────── */
//   onProgress?.("generating_cover", 92, "Generating base front-cover image…");

//   const { firebaseUrl: baseCoverUrl, responseId: baseCoverResponseId } =
//     await generateImageForFrontCover(
//       finalBookId, // Use the consistent bookId
//       story.front_cover,
//       characterImageMap,
//       (phase, pct, msg) =>
//         onProgress?.("generating_cover", 92 + (pct / 100) * 4, msg),
//       seed,
//     );

//   onProgress?.("generating_cover", 96, "Base cover generated");

//   /* ── 4. Final cover with title (96 → 100 %) ───────────────────────── */
//   onProgress?.("generating_cover", 96, "Adding title to cover…");

//   const finalCoverUrl = await generateFinalCoverWithTitle(
//     finalBookId, // Use the consistent bookId
//     baseCoverUrl,
//     story.story_title,
//     seed,
//     (phase, pct, msg) =>
//       onProgress?.("generating_cover", 96 + (pct / 100) * 4, msg),
//   );

//   onProgress?.("complete", 100, "Story generation complete");

//   /* ── 5. Assemble output ───────────────────────────────────────────── */
//   const scenes: SceneOutput[] = story.scenes.map((scene: any, i: number) => ({
//     scene_number: i + 1,
//     imageUrl: generatedScenes[i].firebaseUrl,
//     imageUrls: [generatedScenes[i].firebaseUrl], // Array with single element
//     sceneResponseIds: [generatedScenes[i].responseId], // Array with single element
//     current_scene_index: 0, // Start at index 0
//     content: scene.scene_text,
//     side: sides[i],
//     scene_inputs: {
//       scene_description: scene.scene_description,
//       characterImageMap,
//       previousImageUrl: i > 0 ? generatedScenes[i - 1].firebaseUrl : null,
//       seed,
//     },
//   }));

//   return {
//     scenes,
//     cover: {
//       base_cover_url: baseCoverUrl,
//       base_cover_urls: [baseCoverUrl], // Array with single element
//       base_cover_response_id: baseCoverResponseId,
//       base_cover_response_ids: [baseCoverResponseId], // Array with single element
//       current_base_cover_index: 0, // Start at index 0
//       story_title: story.story_title,
//       base_cover_inputs: {
//         front_cover: story.front_cover,
//         characterImageMap,
//         seed,
//       },
//       final_cover_url: finalCoverUrl,
//       final_cover_urls: [finalCoverUrl], // Array with single element
//       current_final_cover_index: 0, // Start at index 0
//       final_cover_inputs: {
//         base_cover_url: baseCoverUrl,
//         story_title: story.story_title,
//         seed,
//       },
//     },
//   };
// }

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  UnifiedStoryResponse,
  unifiedStoryResponseSchema,
  createStoryResponseSchema,
  hasMultipleCharacters,
  ProgressCallback,
  CharacterVariables,
} from "../types";
import { createDynamicStoryPrompt, StoryInputs } from "../utils/prompts";
import { validateCharacterLimit } from "../utils/helpers";
import {
  generateImageForScene,
  generateImageForFrontCover,
  generateFinalCoverWithTitle,
} from "./imageGenerationV2";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

const openai = new OpenAI();

// Types for the complete story generation
export interface SceneOutput {
  scene_number: number;
  imageUrl: string;
  imageUrls: string[];
  sceneResponseIds: string[];
  current_scene_index: number;
  content: string[];
  side: "left" | "right";
  scene_inputs: {
    scene_description: any;
    characterImageMap: Record<string, CharacterVariables>;
    previousImageUrl: string | null;
    seed: number;
  };
}

export interface StoryPackage {
  scenes: SceneOutput[];
  cover: {
    base_cover_url: string;
    base_cover_urls: string[];
    base_cover_response_id: string;
    base_cover_response_ids: string[];
    current_base_cover_index: number;
    story_title: string;
    base_cover_inputs: {
      front_cover: any;
      characterImageMap: Record<string, CharacterVariables>;
      seed: number;
    };
    final_cover_url: string;
    final_cover_urls: string[];
    current_final_cover_index: number;
    final_cover_inputs: {
      base_cover_url: string;
      story_title: string;
      seed: number;
    };
  };
}

export async function generateStoryScenesFromInputs(
  input: {
    kidName: string;
    pronoun: string;
    age: number;
    theme: string;
    subject: string;
    storyRhyming: boolean;
    characters?: string[];
    characterDescriptions?: string[];
  },
  onProgress?: ProgressCallback,
  onToken?: (chunk: string) => void,
): Promise<UnifiedStoryResponse> {
  // Validate character limit
  if (!validateCharacterLimit(input.characters, 3)) {
    throw new Error("Too many additional characters. Maximum allowed is 3.");
  }

  onProgress?.("prompting", 5, "Building LLM prompt…");

  // Create dynamic story prompt based on input parameters
  const storyInputsForPrompt: StoryInputs = {
    kidName: input.kidName,
    pronoun: input.pronoun,
    age: input.age,
    theme: input.theme,
    subject: input.subject,
    storyRhyming: input.storyRhyming,
    characters: input.characters || [],
    characterDescriptions: input.characterDescriptions || [],
  };

  // Generate dynamic system prompt
  const systemPrompt = createDynamicStoryPrompt(storyInputsForPrompt);

  onProgress?.("prompting", 15, "System prompt assembled…");

  // Build user prompt dynamically
  let userPrompt = `\nYou are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a story blueprint`;

  // Add character information if present
  if (input.characters && input.characters.length > 0) {
    const charCount = input.characters.length;
    if (charCount === 1) {
      userPrompt += ` featuring a main character and a side character`;
    } else {
      userPrompt += ` featuring a main character and ${charCount} additional characters`;
    }
  } else {
    userPrompt += ` featuring only the main character`;
  }

  userPrompt += `.\n\n**INPUTS FOR THIS STORY:**
* **kidName:** "\`${input.kidName}\`"
* **pronoun:** "\`${input.pronoun}\`"
* **age:** \`${input.age}\`
* **theme:** "\`${input.theme}\`"
* **subject:** "\`${input.subject}\`"`;

  // Add character variables dynamically
  if (input.characters && input.characters.length > 0) {
    const charCount = input.characters.length;
    for (let i = 0; i < charCount; i++) {
      const charIndex = i + 1;
      userPrompt += `
* **character${charIndex} (Additional Character ${charIndex} Name):** "\`${input.characters[i]}\`"
* **character${charIndex}_description (Additional Character ${charIndex} Description):** "\`${input.characterDescriptions?.[i] || ""}\`"`;
    }
  }

  // Create dynamic schema based on whether there are additional characters
  const hasAdditionalCharacters = hasMultipleCharacters(input.characters);

  userPrompt += `
* **storyRhyming:** \`${input.storyRhyming}\`

**TASK:**
Produce a single, valid JSON object as your entire output. The object must contain:
- story_title: A catchy, age-appropriate title
- front_cover: Detailed cover description following the schema
- scenes: Array of exactly given number of scene objects

${
  hasAdditionalCharacters
    ? `IMPORTANT: Since this story has multiple characters, each scene with multiple characters MUST include the "Character_Interaction_Summary" field describing how characters interact. Single character scenes should NOT include this field.`
    : `IMPORTANT: Since this is a single character story, scenes should NOT include the "Character_Interaction_Summary" field.`
}

Do not write any other text, explanation, or introduction. Your entire output must be only the raw JSON object.`;

  onProgress?.("prompting", 25, "Calling AI servers…");
  const dynamicSchema = createStoryResponseSchema(hasAdditionalCharacters);

  const stream = await openai.responses.create({
    model: "gpt-5-mini",
    stream: true,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: { format: zodTextFormat(dynamicSchema, "story_response") },
    reasoning: { effort: "low", summary: "detailed" },
  });

  let jsonBuf = "";

  for await (const ev of stream) {
    if (ev.type === "response.reasoning_summary_text.delta") {
      onToken?.(ev.delta); // ← push to jobTracker
    }
    if (ev.type === "response.output_text.delta") {
      jsonBuf += ev.delta;
    }
  }

  onProgress?.("prompting", 35, "Parsing AI response…");
  let story: UnifiedStoryResponse;

  try {
    story = dynamicSchema.parse(JSON.parse(jsonBuf));
  } catch (e) {
    console.error("Failed to parse story JSON", e);
    throw new Error("Structured output was invalid JSON or wrong shape");
  }

  // Sanity-check scene count
  if (!Array.isArray(story.scenes)) {
    throw new Error("Structured output did not contain scenes");
  }

  onProgress?.("prompting", 50, "Story outline ready");
  return story;
}

/**
 * Creates an entire illustrated story and returns the `responseId` coming from every scene image and the front-cover image.
 */
export async function generateCompleteStory(
  input: {
    kidName: string;
    pronoun: string;
    age: number;
    theme: string;
    subject: string;
    storyRhyming: boolean;
    characters?: string[];
    characterDescriptions?: string[];
  },
  characterImageMap: Record<
    string,
    CharacterVariables
  > = DEFAULT_CHARACTER_IMAGES,
  animationStyle: string = "pixar",
  onProgress?: ProgressCallback,
  bookId?: string,
  seed = 3,
): Promise<StoryPackage> {
  // Use provided bookId or generate a unique one if not provided
  const finalBookId = bookId || `book_${Date.now()}`;

  /* ── 1. Story outline ─────────────────────────────────────────────── */
  onProgress?.("prompting", 0, "Generating story outline…");
  const story = await generateStoryScenesFromInputs(
    input,
    (phase, pct, msg) => onProgress?.(phase, pct * 0.4, msg),
    (chunk) => onProgress?.("reasoning", 0, chunk),
  );
  onProgress?.("prompting", 40, "Story outline ready");

  /* ── 2. Scene images (40 → 90 %) ──────────────────────────────────── */
  const total = story.scenes.length;
  const sides: ("left" | "right")[] = Array.from({ length: total }, () =>
    Math.random() < 0.5 ? "left" : "right",
  );
  const share = 50 / total;

  onProgress?.("generating", 40, "Starting scene images…");

  const scenePromises = story.scenes.map((scene: any, index: number) =>
    generateImageForScene(
      finalBookId, // Use the consistent bookId
      scene,
      null,
      characterImageMap,
      animationStyle,
      (phase, pct, msg) => {
        const overall = 40 + index * share + (pct / 100) * share;
        onProgress?.(phase, overall, msg);
      },
      seed,
    ),
  );

  const generatedScenes = await Promise.all(scenePromises);
  onProgress?.("generating", 90, "All scene images generated");

  /* ── 3. Front cover without title (92 → 96 %) ─────────────────────── */
  onProgress?.("generating_cover", 92, "Generating base front-cover image…");

  const { firebaseUrl: baseCoverUrl, responseId: baseCoverResponseId } =
    await generateImageForFrontCover(
      finalBookId, // Use the consistent bookId
      story.front_cover,
      characterImageMap,
      animationStyle,
      (phase, pct, msg) =>
        onProgress?.("generating_cover", 92 + (pct / 100) * 4, msg),
      seed,
    );

  onProgress?.("generating_cover", 96, "Base cover generated");

  /* ── 4. Final cover with title (96 → 100 %) ───────────────────────── */
  // onProgress?.("generating_cover", 96, "Adding title to cover…");

  const finalCoverUrl = await generateFinalCoverWithTitle(
    finalBookId, // Use the consistent bookId
    baseCoverUrl,
    story.story_title,
    seed,
    (phase, pct, msg) =>
      onProgress?.("generating_cover", 96 + (pct / 100) * 4, msg),
  );

  onProgress?.("complete", 100, "Story generation complete");

  /* ── 5. Assemble output ───────────────────────────────────────────── */
  const scenes: SceneOutput[] = story.scenes.map((scene: any, i: number) => ({
    scene_number: i + 1,
    imageUrl: generatedScenes[i].firebaseUrl,
    imageUrls: [generatedScenes[i].firebaseUrl], // Array with single element
    sceneResponseIds: [generatedScenes[i].responseId], // Array with single element
    current_scene_index: 0, // Start at index 0
    content: scene.scene_text,
    side: sides[i],
    scene_inputs: {
      scene_description: scene.scene_description,
      characterImageMap,
      previousImageUrl: i > 0 ? generatedScenes[i - 1].firebaseUrl : null,
      seed,
    },
  }));

  // const scenes: SceneOutput[] = [story.scenes[0]].map(
  //   (scene: any, i: number) => ({
  //     scene_number: 1,
  //     imageUrl: generatedScenes[i].firebaseUrl,
  //     imageUrls: [generatedScenes[i].firebaseUrl], // Array with single element
  //     sceneResponseIds: [generatedScenes[i].responseId], // Array with single element
  //     current_scene_index: 0, // Start at index 0
  //     content: scene.scene_text,
  //     side: sides[i],
  //     scene_inputs: {
  //       scene_description: scene.scene_description,
  //       characterImageMap,
  //       previousImageUrl: null, // No previous image for the first scene
  //       seed,
  //     },
  //   }),
  // );

  return {
    scenes,
    cover: {
      base_cover_url: baseCoverUrl,
      base_cover_urls: [baseCoverUrl], // Array with single element
      base_cover_response_id: baseCoverResponseId,
      base_cover_response_ids: [baseCoverResponseId], // Array with single element
      current_base_cover_index: 0, // Start at index 0
      story_title: story.story_title,
      base_cover_inputs: {
        front_cover: story.front_cover,
        characterImageMap,
        seed,
      },
      final_cover_url: finalCoverUrl,
      final_cover_urls: [finalCoverUrl], // Array with single element
      current_final_cover_index: 0, // Start at index 0
      final_cover_inputs: {
        base_cover_url: baseCoverUrl,
        story_title: story.story_title,
        seed,
      },
    },
  };
}
