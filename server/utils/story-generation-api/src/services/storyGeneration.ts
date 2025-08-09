import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  StorySceneInput,
  StoryResponse,
  StorywocharResponse,
  Scene,
  Scenewochar,
  ProgressCallback,
  storyResponseSchema,
  storywocharResponseSchema,
  SceneOutput,
  StoryPackage,
  CharacterVariables,
  FrontCover,
  FrontCoverWoChar,
} from "../types";
import {
  STORY_SYSTEM_PROMPT,
  STORY_SYSTEM_PROMPT_WITH_CHARACTER,
} from "../utils/prompts";
import {
  hasCharacters,
  validateCharacterArrays,
  createStoryInputs,
  injectVariables,
} from "../utils/helpers";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";
import {
  generateImageForScene,
  generateImageForFrontCover,
  generateFinalCoverWithTitle,
} from "./imageGeneration";

const openai = new OpenAI();
export async function generateStoryScenesFromInputs(
  input: StorySceneInput,
  onProgress?: ProgressCallback,
  onToken?: (chunk: string) => void,
): Promise<StoryResponse | StorywocharResponse> {
  // Validate input
  if (!validateCharacterArrays(input.characters, input.characterDescriptions)) {
    throw new Error(
      "Characters and characterDescriptions arrays must have the same length",
    );
  }

  onProgress?.("prompting", 5, "Building LLM prompt…");

  const hasChars = hasCharacters(input.characters);
  const storyInputs = createStoryInputs(input);

  // Choose the appropriate system prompt
  const systemPrompt = hasChars
    ? injectVariables(STORY_SYSTEM_PROMPT_WITH_CHARACTER, storyInputs)
    : injectVariables(STORY_SYSTEM_PROMPT, storyInputs);

  onProgress?.("prompting", 15, "System prompt assembled…");

  // Build user prompt dynamically
  let userPrompt = `\nYou are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a 9-scene story blueprint`;

  if (hasChars) {
    userPrompt += ` featuring a main character and a side character`;
  } else {
    userPrompt += ` featuring only the main character`;
  }

  userPrompt += `.\n\n**INPUTS FOR THIS STORY:**
* **kidName:** "\`${input.kidName}\`"
* **pronoun:** "\`${input.pronoun}\`"
* **age:** \`${input.age}\`
* **moral:** "\`${input.moral}\`"
* **kidInterest:** "\`${input.kidInterests[0]}\`"
* **storyTheme:** "\`${input.storyThemes[0]}\`"`;

  if (hasChars) {
    userPrompt += `
* **character1 (Side Character Name):** "\`${input.characters![0]}\`"
* **character1_description (Side Character Description):** "\`${input.characterDescriptions![0]}\`"`;
  }

  userPrompt += `
* **storyRhyming:** \`${input.storyRhyming}\`

**TASK:**
Produce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each scene, strictly following the ${hasChars ? "15-field" : "12-field"} \`scene_description\` structure and the \`scene_text\` guidelines outlined in the System Prompt.

Do not write any other text, explanation, or introduction. Your entire output must be only the raw JSON array.`;

  onProgress?.("prompting", 25, "Calling AI servers…");

  // Choose the appropriate schema based on whether characters are present
  const schema = hasChars ? storyResponseSchema : storywocharResponseSchema;

  const stream = await openai.responses.create({
    model: "o4-mini",
    stream: true,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: { format: zodTextFormat(schema, "story_response") },
    reasoning: { effort: "high", summary: "detailed" },
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
  let story: StoryResponse | StorywocharResponse;

  try {
    story = schema.parse(JSON.parse(jsonBuf));
  } catch (e) {
    console.error("Failed to parse story JSON", e);
    throw new Error("Structured output was invalid JSON or wrong shape");
  }

  // 3 ▸ sanity-check scene count
  if (!Array.isArray(story.scenes) || story.scenes.length !== 9) {
    throw new Error("Structured output did not contain exactly 9 scenes");
  }

  onProgress?.("prompting", 50, "Story outline ready");
  return story;
}

// export async function generateCompleteStory(
//   input: StorySceneInput,
//   characterImageMap: Record<
//     string,
//     CharacterVariables
//   > = DEFAULT_CHARACTER_IMAGES,
//   bookId: string,
//   onProgress?: ProgressCallback,
//   seed: number = 3,
// ): Promise<StoryPackage> {
//   // 1) Story outline
//   onProgress?.("prompting", 0, "Generating story outline…");
//   const story = await generateStoryScenesFromInputs(
//     input,
//     (phase, pct, message) => onProgress?.(phase, pct * 0.4, message),
//     (chunk) => onProgress?.("reasoning", 0, chunk),
//   );
//   onProgress?.("prompting", 40, "Story outline ready");

//   // 2) Parallel scene‐image generation (40% → 90%)
//   const total = story.scenes.length;

//   // ▶️ generate left/right for each scene with 60% bias to left
//   const sides: ("left" | "right")[] = Array.from({ length: total }, () =>
//     Math.random() < 0.6 ? "left" : "right",
//   );
//   const share = 50 / total; // each scene gets `share` percent
//   onProgress?.("generating", 40, "Starting scene images…");

//   const scenePromises = story.scenes.map((scene, index) =>
//     generateImageForScene(
//       bookId,
//       scene as Scene | Scenewochar,
//       null, // visual overlap disabled
//       characterImageMap,
//       (phase, pct, message) => {
//         const overallPct = 40 + index * share + (pct / 100) * share;
//         onProgress?.(phase, overallPct, message);
//       },
//       seed,
//     ),
//   );
//   const generatedImageUrls = await Promise.all(scenePromises);
//   onProgress?.("generating", 90, "All scene images generated");

//   // 3) Base cover (92% → 96%)
//   onProgress?.("generating_cover", 92, "Generating base front cover image…");
//   const baseCoverImageUrl = await generateImageForFrontCover(
//     bookId,
//     story.front_cover as FrontCover | FrontCoverWoChar,
//     characterImageMap,
//     (phase, pct, message) => {
//       onProgress?.("generating_cover", 92 + (pct / 100) * 4, message);
//     },
//     seed,
//   );
//   onProgress?.("generating_cover", 96, "Base cover generated");

//   // 4) Final cover with title (96% → 100%)
//   onProgress?.("generating_cover", 96, "Adding title to cover…");
//   const finalCoverImageUrl = await generateFinalCoverWithTitle(
//     bookId,
//     baseCoverImageUrl,
//     story.story_title,
//     (phase, pct, message) => {
//       onProgress?.("generating_cover", 96 + (pct / 100) * 4, message);
//     },
//     seed,
//   );
//   onProgress?.("complete", 100, "Story generation complete");

//   // 5) Assemble output
//   const scenes: SceneOutput[] = story.scenes.map((scene, i) => ({
//     scene_number: i + 1,
//     scene_url: generatedImageUrls[i],
//     scene_text: scene.scene_text,
//     side: sides[i],
//     scene_inputs: {
//       scene_description: scene.scene_description,
//       characterImageMap,
//       previousImageUrl: i > 0 ? generatedImageUrls[i - 1] : null,
//       seed,
//     },
//   }));

//   return {
//     scenes,
//     cover: {
//       base_cover_url: baseCoverImageUrl,
//       story_title: story.story_title,
//       base_cover_inputs: {
//         front_cover: story.front_cover,
//         characterImageMap,
//         seed,
//       },
//       final_cover_url: finalCoverImageUrl,
//       final_cover_inputs: {
//         base_cover_url: baseCoverImageUrl,
//         story_title: story.story_title,
//         seed,
//       },
//     },
//   };
// }

/**
 * Creates an entire illustrated story and now also returns
 * the `responseId` coming from every scene image and the front-cover image.
 */
export async function generateCompleteStory(
  input: StorySceneInput,
  characterImageMap: Record<
    string,
    CharacterVariables
  > = DEFAULT_CHARACTER_IMAGES,
  bookId: string,
  onProgress?: ProgressCallback,
  seed = 3,
): Promise<StoryPackage> {
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

  const scenePromises = story.scenes.map((scene, index) =>
    generateImageForScene(
      bookId,
      scene as Scene | Scenewochar,
      null,
      characterImageMap,
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
      bookId,
      story.front_cover as FrontCover | FrontCoverWoChar,
      characterImageMap,
      (phase, pct, msg) =>
        onProgress?.("generating_cover", 92 + (pct / 100) * 4, msg),
      seed,
    );

  onProgress?.("generating_cover", 96, "Base cover generated");

  /* ── 4. Final cover with title (96 → 100 %) ───────────────────────── */
  onProgress?.("generating_cover", 96, "Adding title to cover…");

  const finalCoverUrl = await generateFinalCoverWithTitle(
    bookId,
    baseCoverUrl,
    story.story_title,
    seed,
    (phase, pct, msg) =>
      onProgress?.("generating_cover", 96 + (pct / 100) * 4, msg),
  );

  onProgress?.("complete", 100, "Story generation complete");

  /* ── 5. Assemble output ───────────────────────────────────────────── */
  // const scenes: SceneOutput[] = story.scenes.map((scene, i) => ({
  //   scene_number: i + 1,
  //   imageUrl: generatedScenes[i].firebaseUrl,
  //   sceneResponseId: generatedScenes[i].responseId, // NEW
  //   content: scene.scene_text,
  //   side: sides[i],
  //   scene_inputs: {
  //     scene_description: scene.scene_description,
  //     characterImageMap,
  //     previousImageUrl: i > 0 ? generatedScenes[i - 1].firebaseUrl : null,
  //     seed,
  //   },
  // }));

  const scenes: SceneOutput[] = story.scenes.map((scene, i) => ({
    scene_number: i + 1,
    imageUrl: generatedScenes[i].firebaseUrl,
    imageUrls: [generatedScenes[i].firebaseUrl], // CHANGED: Array with single element
    sceneResponseIds: [generatedScenes[i].responseId], // CHANGED: Array with single element
    current_scene_index: 0, // NEW: Start at index 0
    content: scene.scene_text,
    side: sides[i],
    scene_inputs: {
      scene_description: scene.scene_description,
      characterImageMap,
      previousImageUrl: i > 0 ? generatedScenes[i - 1].firebaseUrl : null,
      seed,
    },
  }));

  // return {
  //   scenes,
  //   cover: {
  //     base_cover_url: baseCoverUrl,
  //     base_cover_response_id: baseCoverResponseId, // NEW
  //     story_title: story.story_title,
  //     base_cover_inputs: {
  //       front_cover: story.front_cover,
  //       characterImageMap,
  //       seed,
  //     },
  //     final_cover_url: finalCoverUrl,
  //     final_cover_inputs: {
  //       base_cover_url: baseCoverUrl,
  //       story_title: story.story_title,
  //       seed,
  //     },
  //   },
  // };
  return {
    scenes,
    cover: {
      base_cover_url: baseCoverUrl,
      base_cover_urls: [baseCoverUrl], // CHANGED: Array with single element
      base_cover_response_id: baseCoverResponseId,
      base_cover_response_ids: [baseCoverResponseId], // CHANGED: Array with single element
      current_base_cover_index: 0, // NEW: Start at index 0
      story_title: story.story_title,
      base_cover_inputs: {
        front_cover: story.front_cover,
        characterImageMap,
        seed,
      },
      final_cover_url: finalCoverUrl,
      final_cover_urls: [finalCoverUrl], // CHANGED: Array with single element
      current_final_cover_index: 0, // NEW: Start at index 0
      final_cover_inputs: {
        base_cover_url: baseCoverUrl,
        story_title: story.story_title,
        seed,
      },
    },
  };
}

/**
 * Helper function for testing - generates story with default values
 */
export async function generateStoryScenes(
  override: Partial<StorySceneInput> = {},
): Promise<StoryResponse | StorywocharResponse> {
  return generateStoryScenesFromInputs({
    kidName: "Tyler",
    pronoun: "he/him/his",
    age: 7,
    moral: "True strength comes from teamwork",
    storyRhyming: true,
    kidInterests: ["Stargazing"],
    storyThemes: ["Adventure Story"],
    characters: ["Pengu"],
    characterDescriptions: ["a cute black and white penguin"],
    ...override,
  });
}
