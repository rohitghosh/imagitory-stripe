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

/**
 * Generate story scenes from inputs - handles both with and without characters
 */
export async function generateStoryScenesFromInputs(
  input: StorySceneInput,
  onProgress?: ProgressCallback,
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

  const openaiRes = await openai.responses.parse({
    model: "gpt-4.1-nano",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: zodTextFormat(schema, "story_response"),
    },
  });

  onProgress?.("prompting", 35, "Parsing AI response…");
  const story = openaiRes.output_parsed;

  // Validate the story structure
  console.log("Story structure:", story);
  if (
    !story.scenes ||
    !Array.isArray(story.scenes) ||
    story.scenes.length !== 9
  ) {
    throw new Error("Structured output did not contain exactly 9 scenes");
  }

  onProgress?.("prompting", 50, "Story outline ready");
  return story;
}

/**
 * Generate complete story package with images
 */
export async function generateCompleteStory(
  input: StorySceneInput,
  characterImageMap: Record<string, string> = DEFAULT_CHARACTER_IMAGES,
  onProgress?: ProgressCallback,
  seed: number = 3, // NEW PARAMETER
): Promise<StoryPackage> {
  // Generate story scenes
  onProgress?.("prompting", 0, "Generating story outline…");

  const story = await generateStoryScenesFromInputs(
    input,
    (phase, pct, message) => {
      onProgress?.(phase, pct * 0.3, message); // Story generation takes 30% of progress
    },
  );

  onProgress?.("prompting", 30, "Story outline ready");

  // Generate images for each scene
  const generatedImageUrls: string[] = [];
  let previousImageUrl: string | null = null;
  const total = story.scenes.length;

  for (let i = 0; i < story.scenes.length; i++) {
    const scene = story.scenes[i];
    onProgress?.(
      "generating",
      30 + (i / total) * 50,
      `Generating image for scene ${i + 1}/${total}`,
    );

    const newUrl = await generateImageForScene(
      scene as Scene | Scenewochar,
      previousImageUrl,
      characterImageMap,
      (phase, pct, message) => {
        // Image generation for each scene takes a portion of the 50% allocated
        const baseProgress = 30 + (i / total) * 50;
        const sceneProgress = (pct / 100) * (50 / total);
        onProgress?.(phase, baseProgress + sceneProgress, message);
      },
      seed, // PASS SEED PARAMETER
    );

    generatedImageUrls.push(newUrl);
    previousImageUrl = newUrl;
  }

  onProgress?.("generating", 80, "All scene images generated");

  // Generate the front cover image
  onProgress?.("generating_cover", 85, "Generating base front cover image...");

  // const baseCoverImageUrl = await generateImageForFrontCover(
  //   story.front_cover,
  //   characterImageMap,
  //   (phase, pct, message) => {
  //     onProgress?.(phase, 85 + (pct / 100) * 10, message); // Base cover takes 10%
  //   },
  //   seed,
  // );
  const baseCoverImageUrl =
    "https://fal.media/files/lion/40gW0lutCfGgdJhWLfm4q_1d65e0a733d6486993d346811ed817bf.jpg";

  onProgress?.("generating_cover", 95, "Base cover generated");

  // const finalCoverImageUrl = await generateFinalCoverWithTitle(
  //   baseCoverImageUrl,
  //   story.story_title,
  //   seed,
  //   (phase, pct, message) => {
  //     onProgress?.(phase, 95 + (pct / 100) * 5, message); // Final cover takes 5%
  //   },
  // );
  const finalCoverImageUrl = baseCoverImageUrl;

  onProgress?.("complete", 100, "Story generation complete");

  const scenes: SceneOutput[] = story.scenes.map((scene, index) => ({
    scene_number: index + 1,
    scene_url: generatedImageUrls[index],
    scene_text: scene.scene_text,
    scene_inputs: {
      scene_description: scene.scene_description,
      characterImageMap,
      previousImageUrl: index > 0 ? generatedImageUrls[index - 1] : null,
      seed,
    },
  }));

  return {
    scenes,
    cover: {
      base_cover_url: baseCoverImageUrl, // NEW
      story_title: story.story_title,
      base_cover_inputs: {
        // RENAMED
        front_cover: story.front_cover,
        characterImageMap,
        seed,
      },
      final_cover_url: finalCoverImageUrl, // NEW
      final_cover_inputs: {
        // NEW
        base_cover_url: baseCoverImageUrl,
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
