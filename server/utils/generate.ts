// --- Interfaces (optional for type safety) ---
import { z } from "zod";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { zodTextFormat } from "openai/helpers/zod";
import {
  STORY_SYSTEM_PROMPT,
  STORY_SYSTEM_PROMPT_WITH_CHARACTER,
  STORY_VALIDATION_PROMPT,
  STORY_VALIDATION_PROMPT_WITHOUT_CHARACTER,
} from "./prompts";
import { fal } from "@fal-ai/client";

export type ProgressCallback = (
  phase: string,
  pct: number,
  message?: string,
) => void;

// --- Zod Schema Definitions ---

/** ------------------------------------------------------------------------------
Validation Check 
------------------------------------------------------------------------------
*/

const validationResultSchema = z.object({
  check_name: z
    .string()
    .describe("The name of the validation check being performed."),
  Validation: z.enum(["Pass", "Fail"]),
  Problem: z
    .string()
    .describe(
      "If 'Fail', a concise, user-facing explanation of the issue. If 'Pass', this MUST be an empty string.",
    ),
  Solution: z
    .array(z.string())
    .describe(
      "If 'Fail', a list of 1-3 actionable suggestions for the user. If 'Pass', this MUST be an empty list [].",
    ),
});

/**
 * Defines the schema for the entire validation response, which is an array
 * of exactly 12 validation results, as required by the prompt.
 */

const storyValidationResponseSchema = z.object({
  results: z
    .array(validationResultSchema)
    .describe("An array of exactly 12 validation check results, in order.")
    .length(12),
});

export type ValidationFailure = {
  check: string;
  problem: string;
  solution: string[];
};
// --- Type Inference from Validation Schemas ---
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type StoryValidationResponse = z.infer<
  typeof storyValidationResponseSchema
>;

/**
---------------------------------------------------------------------------------
Story with 1 character
---------------------------------------------------------------------------------
*/

const FrontCoverCharacterDetailsSchema = z.object({
  Character_Name: z.string(),
  Gaze_Direction: z
    .string()
    .describe(
      "Direction of the gaze, aimed to be engaging. E.g., 'Looking just past the viewer with a welcoming and excited expression.'",
    ),
  Expression: z
    .string()
    .describe(
      "A clear, positive facial expression. E.g., 'A wide, joyful smile, with eyes full of wonder.'",
    ),
  Pose_and_Action: z
    .string()
    .describe(
      "A dynamic and appealing body pose. E.g., 'Leaning forward in anticipation, one arm slightly raised as if about to embark on a journey.'",
    ),
});

// Schema for the main front_cover object
export const FrontCoverSchema = z.object({
  Cover_Concept: z
    .string()
    .describe(
      "A one-sentence summary of the cover's core idea and emotional goal. E.g., 'A portrait of ${kidName} and ${character1} on the cusp of a magical adventure, filled with wonder and excitement.'",
    ),
  Present_Characters: z
    .array(z.string())
    .describe(
      "A JSON array of strings containing only the exact, clean names of characters in the scene (e.g., '${kidName}', '${character1}' )",
    ),
  Focal_Point: z
    .string()
    .describe(
      "Describes the central visual element of the cover. E.g., '${kidName} and ${character1} sharing a look of awe as they discover the story's central magical element.'",
    ),
  Character_Placement: z
    .string()
    .describe(
      "Describes the composition of characters, paying special attention to leaving space for the title. E.g., '${kidName} is positioned in the lower-center of the frame, looking slightly upwards. ${character1} is on ${pronoun} shoulder. This leaves the top third of the image open for title placement.'",
    ),
  Character_Details: z
    .array(FrontCoverCharacterDetailsSchema)
    .describe(
      "An array of objects, one for each character present on the cover.",
    ),
  Background_Setting: z
    .string()
    .describe(
      "A vibrant and slightly idealized depiction of a key story environment, combining elements of ${kidInterest} and ${storyTheme}.",
    ),
  Key_Visual_Elements: z
    .array(z.string())
    .describe(
      "An array of 1-2 iconic objects or symbols from the story that hint at the narrative.",
    ),
  Lighting_and_Mood: z
    .string()
    .describe("Describes the lighting style and the resulting atmosphere."),
  Color_Palette: z
    .string()
    .describe("A vibrant, eye-catching color scheme designed to stand out."),
});

const characterDetailSchema = z.object({
  Character_Name: z.string(),
  Gaze_Direction: z.string(),
  Expression: z.string(),
  Pose_and_Action: z.string(),
});

const sceneDescriptionSchema = z.object({
  Scene_Number: z.number().int(),
  Present_Characters: z.array(z.string()),
  Camera_Shot: z.string(),
  Composition_and_Blocking: z.string(),
  Character_Interaction_Summary: z.string().nullable(),
  Character_Details: z.array(characterDetailSchema),
  Focal_Action: z.string(),
  Setting_and_Environment: z.string(),
  Time_of_Day_and_Atmosphere: z.string(),
  Lighting_Description: z.string(),
  Key_Storytelling_Props: z.string(),
  Background_Elements: z.string(),
  Hidden_Object: z.string(),
  Dominant_Color_Palette: z.string(),
  Visual_Overlap_With_Previous: z.boolean(),
});

const sceneSchema = z.object({
  scene_description: sceneDescriptionSchema,
  scene_text: z.string(),
});

// Main schema for the story response: an array of exactly 9 scenes
// const sceneArraySchema = z.array(sceneSchema).min(9).max(9);
// const storyResponseSchema = z.object({
//   story_response: sceneArraySchema,
// });

// Schema for the array of exactly 9 scenes
const scenesSchema = z.array(sceneSchema).min(9).max(9);

// Main schema for the entire story response object, including title and scenes
const storyResponseSchema = z.object({
  story_title: z.string(),
  scenes: scenesSchema,
  front_cover: FrontCoverSchema,
});

// --- Type Inference from Zod Schemas ---
export type CharacterDetail = z.infer<typeof characterDetailSchema>;
export type SceneDescription = z.infer<typeof sceneDescriptionSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type FrontCover = z.infer<typeof FrontCoverSchema>;

// Infer the StoryResponse type from the array schema
// type StoryResponse = z.infer<typeof sceneArraySchema>;
export type StoryResponse = z.infer<typeof storyResponseSchema>;

/**
---------------------------------------------------------------------------------
Story without characters
---------------------------------------------------------------------------------
*/
/**
 * Defines the schema for the 12-field scene_description object.
 * Based on the prompt, all fields are strings except for Visual_Overlap_With_Previous.
 */
const scenewocharDescriptionSchema = z.object({
  Scene_Number: z.string(),
  Camera_Shot: z.string(),
  Character_Gaze: z.string(),
  Character_Expression_and_Pose: z.string(),
  Focal_Action: z.string(),
  Setting_and_Environment: z.string(),
  Time_of_Day_and_Atmosphere: z.string(),
  Key_Storytelling_Props: z.string(),
  Background_Elements: z.string(),
  Hidden_Object: z.string(),
  Dominant_Color_Palette: z.string(),
  Visual_Overlap_With_Previous: z.boolean(),
});

const FrontCoverwocharSchema = z.object({
  Cover_Concept: z.string(),
  Focal_Point: z.string(),
  Character_Placement_and_Pose: z.string(),
  Character_Gaze_and_Expression: z.string(),
  Background_Setting: z.string(),
  Key_Visual_Elements: z.array(z.string()),
  Lighting_and_Mood: z.string(),
  Color_Palette: z.string(),
});

/**
 * Defines the schema for a single scene, which includes the
 * detailed description and the narrative text.
 */
const scenewocharSchema = z.object({
  scene_description: scenewocharDescriptionSchema,
  scene_text: z.string(),
});

/**
 * Defines the schema for the scenes array, ensuring it contains
 * exactly 9 scenes as required by the narrative structure.
 */
const sceneswocharSchema = z.array(scenewocharSchema).min(9).max(9);

/**
 * The main schema for the entire story response object.
 * This validates the final output containing the story title and the scenes array.
 */
const storywocharResponseSchema = z.object({
  story_title: z.string(),
  scenes: sceneswocharSchema,
  front_cover: FrontCoverwocharSchema,
});

// --- Type Inference from Zod Schemas ---
export type ScenewocharDescription = z.infer<
  typeof scenewocharDescriptionSchema
>;
export type FrontCoverWoChar = z.infer<typeof FrontCoverwocharSchema>;

export type Scenewochar = z.infer<typeof scenewocharSchema>;
export type StorywocharResponse = z.infer<typeof storywocharResponseSchema>;

// --- OpenAI Client ---
const openai = new OpenAI();

// --- Helper: Mapping character name -> reference image URL ---
export const DEFAULT_CHARACTER_IMAGES: Record<string, string> = {
  // Tyler: "https://v3.fal.media/files/lion/T_c5iXrI8rU1pxN38CLsz_kid.jpg",
  Tyler:
    "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/customCharacters%2FgyV-fP5PVcOYNMeAdxyzT_d41b388b415d48ddb1ff53947152dc52.jpg?alt=media&token=b890ec1f-5f4b-41de-b6aa-42877605ce15",
  Pengu: "https://v3.fal.media/files/tiger/rZvMAEKdk8cUEqQjiwiv8_penguin.jpg",
};

function injectVariables(
  template: string,
  variables: Record<string, any>,
): string {
  let populated = template;
  for (const k in variables) {
    populated = populated.replaceAll(`\`\${${k}}\``, String(variables[k]));
  }
  return populated;
}

// --- Core pipeline ---

export interface StorySceneInput {
  kidName: string;
  pronoun: string;
  age: number;
  moral: string;
  storyRhyming: boolean;
  kidInterests: string[];
  storyThemes: string[];
  characters: string[];
  characterDescriptions: string[];
}

export async function generateStoryScenesFromInputs(
  {
    kidName,
    pronoun,
    age,
    moral,
    storyRhyming,
    kidInterests,
    storyThemes,
    characters,
    characterDescriptions,
  }: StorySceneInput,
  onProgress?: ProgressCallback,
): Promise<StoryResponse> {
  onProgress?.("prompting", 5, "Building LLM prompt…");
  // Build prompts
  const storyInputs = {
    kidName,
    pronoun,
    age,
    moral,
    kidInterest: kidInterests[0],
    storyTheme: storyThemes[0],
    storyRhyming,
    character1: characters[0],
    character1_description: characterDescriptions[0],
  };

  const systemPrompt = injectVariables(
    STORY_SYSTEM_PROMPT_WITH_CHARACTER,
    storyInputs,
  );

  onProgress?.("prompting", 15, "System prompt assembled…");

  const userPrompt = `\nYou are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a 9-scene story blueprint featuring a main character and a side character.\n\n**INPUTS FOR THIS STORY:**\n* **kidName:** \"\`${kidName}\`\"\n* **pronoun:** \"\`${pronoun}\`\"\n* **age:** \`${age}\`\n* **moral:** \"\`${moral}\`\"\n* **kidInterest:** \"\`${kidInterests[0]}\`\"\n* **storyTheme:** \"\`${storyThemes[0]}\`\"\n* **character1 (Side Character Name):** \"\`${characters[0]}\`\"\n* **character1_description (Side Character Description):** \"\`${characterDescriptions[0]}\`\"\n* **storyRhyming:** \`${storyRhyming}\`\n\n**TASK:**\nProduce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each scene, strictly following the 14-field \`scene_description\` structure and the \`scene_text\` guidelines outlined in the System Prompt.\n\nDo not write any other text, explanation, or introduction. Your entire output must be only the raw JSON array.`;

  onProgress?.("prompting", 25, "Calling AI servers…");

  const openaiRes = await openai.responses.parse({
    model: "gpt-4.1-nano",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: zodTextFormat(storyResponseSchema, "story_response"),
    },
  });

  onProgress?.("prompting", 35, "Parsing AI response…");
  const story: StoryResponse = openaiRes.output_parsed.story_response;

  // const openaiRes = await openai.responses.retrieve(
  //   "resp_68712971eea8819a931d668c01a3f91305e788cf6f850d14",
  // );
  // // Assuming openaiRes.output_text is a JSON string
  // const output = JSON.parse(openaiRes.output_text);
  // const story: StoryResponse = output.story_response;

  if (!Array.isArray(story) || story.length !== 9) {
    throw new Error("Structured output did not contain exactly 9 scenes");
  }

  onProgress?.("prompting", 50, "Story outline ready");
  return story;
}

export interface StoryValidationInput {
  kidName: string;
  pronoun: string;
  age: number;
  character1: string;
  character1_description: string;
  moral: string;
  kidInterests: string[];
  storyThemes: string[];
}

export interface StoryValidationInputwoChar {
  kidName: string;
  pronoun: string;
  age: number;
  moral: string;
  kidInterests: string[];
  storyThemes: string[];
}
/**
 * Runs the story premise validation check using a structured prompt.
 *
 * @param input The user-defined variables for the story premise.
 * @param onProgress An optional callback to report progress.
 * @returns A promise that resolves to an array of 12 validation results.
 */
export async function runStoryValidation(
  input: StoryValidationInput | StoryValidationInputwoChar, // Use a union type for the input
  onProgress?: ProgressCallback,
): Promise<ValidationFailure[]> {
  onProgress?.("validation", 5, "Assembling validation prompt…");

  // Dynamically determine if a secondary character is present
  const hasCharacter1 = "character1" in input;

  const systemPrompt = hasCharacter1
    ? STORY_VALIDATION_PROMPT
    : STORY_VALIDATION_PROMPT_WITHOUT_CHARACTER;

  // Dynamically build the user prompt based on the input structure
  let userPrompt = `
    You are a Story Feasibility Analyst. Follow all rules and checks from the System Prompt to validate the following story idea.

    **INPUTS FOR VALIDATION:**
    * **kidName:** "${input.kidName}"
    * **age:** ${input.age}
    * **pronoun:** "${input.pronoun}"
    * **moral:** "${input.moral}"
    * **kidInterest:** "${input.kidInterests[0]}"
    * **story_theme:** "${input.storyThemes[0]}"
  `;

  if (hasCharacter1) {
    const charInput = input as StoryValidationInput;
    userPrompt += `
    * **character1:** "${charInput.character1}"
    * **character1_description:** "${charInput.character1_description}"
    `;
  }

  userPrompt += `
    **TASK:**
    Produce a single, valid JSON array as your entire output. The array must contain exactly 12 JSON objects, one for each validation check performed in order, strictly following the output structure defined in the System Prompt. Add a "check_name" field to each object corresponding to the validation being performed. Do not write any other text.
  `;

  onProgress?.("validation", 25, "Calling AI servers for validation…");

  const openaiRes = await openai.responses.parse({
    model: "o4-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: zodTextFormat(
        storyValidationResponseSchema,
        "validation_response",
      ),
    },
  });

  onProgress?.("validation", 75, "Parsing validation results…");
  // const validationResults = openaiRes.output_parsed.validation_response;
  // Access the 'results' array inside the returned object
  const validationResults = openaiRes.output_parsed.results;

  if (!Array.isArray(validationResults)) {
    throw new Error(
      "Validation output did not contain the required check results.",
    );
  }

  const failures: ValidationFailure[] = validationResults
    .filter((result) => result.Validation === "Fail")
    .map((failedResult) => ({
      check: failedResult.check_name,
      problem: failedResult.Problem,
      solution: failedResult.Solution,
    }));

  onProgress?.("validation", 100, "Validation complete.");

  return failures;
}

export async function generateStoryScenes(
  override: Partial<StorySceneInput> = {},
): Promise<StoryResponse> {
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

function generateImagePrompt(input: SceneDescription): string {
  const promptParts: string[] = [];

  // Helper function to add parts to the prompt only if the content is valid.
  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      // Ensure the part ends with a period for better sentence structure.
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
      const nameDesc = char.Character_Name.split(" (")[0]; // Extract name
      const desc = char.Character_Name.match(/\((.*)\)/)?.[1] || ""; // Extract description
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

  // Join all the valid parts into a single string.
  return promptParts.join(" ");
}

function generateImagePromptWoChar(input: ScenewocharDescription): string {
  const promptParts: string[] = [];

  // Helper function to add parts to the prompt, ensuring they are valid and end with a period.
  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      promptParts.push(content.trim().replace(/\.$/, "") + ".");
    }
  };

  // 1. Start with the overall atmosphere and time of day.
  addPart(
    `The scene is set during ${input.Time_of_Day_and_Atmosphere.toLowerCase()}`,
  );

  // 2. Describe the primary setting.
  addPart(`It unfolds in ${input.Setting_and_Environment.toLowerCase()}`);

  // 3. Add character details. These fields are designed to be full sentences.
  addPart(input.Character_Gaze);
  addPart(input.Character_Expression_and_Pose);

  // 4. Specify the main action of the scene.
  addPart(`The focal action is ${input.Focal_Action.toLowerCase()}`);

  // 5. Detail the important objects and background elements. These are also written as sentences.
  addPart(input.Key_Storytelling_Props);
  addPart(input.Background_Elements);
  addPart(input.Hidden_Object);

  // 6. Define the artistic and cinematic direction.
  addPart(
    `The dominant color palette includes ${input.Dominant_Color_Palette.toLowerCase()}`,
  );
  addPart(`The camera shot is a ${input.Camera_Shot.toLowerCase()}`);

  // Join all the parts into a single, coherent paragraph.
  return promptParts.join(" ");
}

function generateFrontCoverPrompt(input: FrontCover): string {
  const promptParts: string[] = [];

  // Helper function to add parts to the prompt only if the content is valid.
  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      // Ensure the part ends with a period for better sentence structure.
      promptParts.push(content.trim().replace(/\.$/, "") + ".");
    }
  };

  // Add core concepts first.
  addPart(input.Cover_Concept);
  addPart(input.Focal_Point);
  addPart(input.Character_Placement);

  // Add detailed descriptions for each character.
  if (input.Character_Details && input.Character_Details.length > 0) {
    input.Character_Details.forEach((char) => {
      const charDescription = `${char.Character_Name} is ${char.Pose_and_Action.toLowerCase()}, looking ${char.Gaze_Direction.toLowerCase()} with an expression of ${char.Expression.toLowerCase()}`;
      addPart(charDescription);
    });
  }

  // Add background and atmospheric details.
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

  // Join all parts into a single descriptive prompt.
  return promptParts.join(" ");
}

function generateFrontCoverPromptWoChar(input: FrontCoverWoChar): string {
  const promptParts: string[] = [];

  // Helper function to add parts to the prompt only if the content is valid.
  const addPart = (content: string | null | undefined) => {
    if (content && content.trim()) {
      // Ensure the part ends with a period for better sentence structure.
      promptParts.push(content.trim().replace(/\.$/, "") + ".");
    }
  };

  // Add core concepts and character descriptions.
  addPart(input.Cover_Concept);
  addPart(input.Focal_Point);
  addPart(input.Character_Placement_and_Pose);
  addPart(input.Character_Gaze_and_Expression);

  // Add background and atmospheric details.
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

  // Join all parts into a single descriptive prompt.
  return promptParts.join(" ");
}

export async function generateImageForScene(
  scene: Scene,
  previousImageUrl: string | null,
  characterImageMap: Record<string, string> = DEFAULT_CHARACTER_IMAGES,
): Promise<string> {
  onProgress?.(
    "generating",
    0,
    `Preparing scene ${scene.scene_description.Scene_Number}`,
  );

  const { Present_Characters, Visual_Overlap_With_Previous } =
    scene.scene_description;

  // --- Logic for preparing image URLs and prompts ---

  // Collect available character reference images. This is more robust and
  // won't throw an error if a character has no reference image.
  const imageUrls: string[] = [];
  const characterNamesForPrompt: string[] = [];

  Present_Characters.forEach((name) => {
    const url = characterImageMap[name];
    if (url) {
      imageUrls.push(url);
      characterNamesForPrompt.push(name);
    }
  });

  // Build the text description for character images
  let attachmentText = characterNamesForPrompt
    .map(
      (name, idx) =>
        `${name}(${idx + 1}${idx === 0 ? "st" : idx === 1 ? "nd" : "th"} image)`,
    )
    .join(" and ");

  // Check if the previous image should be used for continuity
  const usePreviousImage = Visual_Overlap_With_Previous && previousImageUrl;

  if (usePreviousImage) {
    imageUrls.push(previousImageUrl!); // Add the previous scene's image
    const prevSceneImageIndex = imageUrls.length;
    const suffix = prevSceneImageIndex === 3 ? "rd" : "th";
    attachmentText += ` and the image from the previous scene (${prevSceneImageIndex}${suffix} image)`;
  }

  // --- Conditional API call ---

  let falRes;
  const basePrompt = generateImagePrompt(scene.scene_description);
  const commonInputParams = {
    guidance_scale: 5,
    num_images: 1,
    output_format: "jpeg",
    seed: 3,
    aspect_ratio: "21:9",
    safety_tolerance: 6,
  };
  const onQueueUpdate = (update: any) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log: any) => log.message).forEach(console.log);
    }
  };

  if (imageUrls.length > 0) {
    // **Case 1: Images are present. Use the 'multi' endpoint.**
    let prompt = `Attached are the images of ${attachmentText} - create a scene as described below:\n${basePrompt}`;

    if (usePreviousImage) {
      prompt += `\n\n**Visual Consistency Note:** The last image attached is from the previous scene. Use it as a reference to maintain visual consistency in the setting, props, and overall environment. The character poses and actions should still follow the new scene description.`;
    }

    console.log(
      "Calling multi-modal endpoint: fal-ai/flux-pro/kontext/max/multi",
    );
    console.log("Final Prompt:", prompt);
    console.log("Image URLs sent to AI:", imageUrls);

    falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        ...commonInputParams,
        prompt: prompt,
        image_urls: imageUrls,
      },
      logs: true,
      onQueueUpdate,
    });
  } else {
    // **Case 2: No images. Use the 'text-to-image' endpoint.**
    console.log(
      "Calling text-to-image endpoint: fal-ai/flux-pro/kontext/max/text-to-image",
    );
    console.log("Final Prompt:", basePrompt);

    onProgress?.("generating", 20, "Calling image API…");

    falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/text-to-image", {
      input: {
        ...commonInputParams,
        prompt: basePrompt,
      },
      logs: true,
      onQueueUpdate,
    });
  }

  // --- Process the result ---

  onProgress?.("generating", 80, "Processing Fal response…");
  const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from Fal AI");
  }

  onProgress?.(
    "generating",
    100,
    `Scene ${scene.scene_description.Scene_Number} ready`,
  );
  return imageUrl;
}

async function generateImageForFrontCover(
  frontCover: FrontCover,
  characterImageMap: Record<string, string> = DEFAULT_CHARACTER_IMAGES,
  onProgress?: ProgressCallback,
): Promise<string> {
  onProgress?.("generating_cover", 0, "Preparing front cover image...");

  const imageUrls: string[] = [];
  const characterNamesForPrompt: string[] = [];

  // Collect character reference images, same as for scenes.
  frontCover.Present_Characters.forEach((name) => {
    const url = characterImageMap[name];
    if (url) {
      imageUrls.push(url);
      characterNamesForPrompt.push(name);
    }
  });

  // Create the attachment text for the prompt.
  const attachmentText = characterNamesForPrompt
    .map(
      (name, idx) =>
        `${name}(${idx + 1}${idx === 0 ? "st" : idx === 1 ? "nd" : "rd"} image)`,
    )
    .join(" and ");

  // Build the final prompt for the API.
  const basePrompt = generateFrontCoverPrompt(frontCover);
  const prompt = `Attached are the images of ${attachmentText}. Create a vibrant, beautiful book front cover as described below:\n${basePrompt}`;

  // Set up API parameters with a 1:1 aspect ratio for the cover.
  const commonInputParams = {
    guidance_scale: 5,
    num_images: 1,
    output_format: "jpeg",
    seed: 3,
    aspect_ratio: "1:1", // For a square cover image
    safety_tolerance: 6,
  };

  const onQueueUpdate = (update: any) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log: any) => log.message).forEach(console.log);
    }
  };

  onProgress?.("generating_cover", 20, "Calling image API for cover...");
  console.log("Calling multi-modal endpoint for front cover...");

  // Call the Fal.ai API.
  const falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
    input: {
      ...commonInputParams,
      prompt: prompt,
      image_urls: imageUrls,
    },
    logs: true,
    onQueueUpdate,
  });

  onProgress?.("generating_cover", 80, "Processing response for cover...");
  const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from Fal AI for front cover");
  }

  onProgress?.("generating_cover", 100, "Front cover image ready");
  return imageUrl;
}

async function main() {
  try {
    const argPath = process.argv[2];
    const overrides =
      argPath && fs.existsSync(argPath)
        ? JSON.parse(fs.readFileSync(argPath, "utf8"))
        : {};

    // Note: ensure your generateStoryScenes now returns the full object { story_title, front_cover, scenes }
    const story = await generateStoryScenes(overrides);

    const generatedImageUrls: string[] = [];
    let previousImageUrl: string | null = null;

    for (const scene of story.scenes) {
      const newUrl = await generateImageForScene(scene, previousImageUrl);
      generatedImageUrls.push(newUrl);
      previousImageUrl = newUrl;
    }

    // --- Start of new code ---

    // Generate the front cover image
    console.log("\nGenerating front cover image...");
    const frontCoverImageUrl = await generateImageForFrontCover(
      story.front_cover,
    );

    // --- End of new code ---

    console.log("\n--- Generation Complete ---\n");
    console.log("Generated image URLs for all scenes:");
    generatedImageUrls.forEach((u, i) => console.log(`Scene ${i + 1}: ${u}`));

    // --- Start of new code ---

    console.log("\nGenerated Front Cover Image URL:");
    console.log(`Front Cover: ${frontCoverImageUrl}`);

    // --- End of new code ---
  } catch (err) {
    console.error(err);
  }
}

if (import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// ---- CLI entrypoint (ESM-friendly) ----
// (async () => {
//   try {
//     await main();
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// })();
