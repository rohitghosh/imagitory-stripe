// --- Interfaces (optional for type safety) ---
import { z } from "zod";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { zodTextFormat } from "openai/helpers/zod";
import {
  STORY_SYSTEM_PROMPT,
  STORY_SYSTEM_PROMPT_WITH_CHARACTER,
} from "./prompts";
import { fal } from "@fal-ai/client";
// --- Zod Schema Definitions ---

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
const sceneArraySchema = z.array(sceneSchema).min(9).max(9);
const storyResponseSchema = z.object({
  story_response: sceneArraySchema,
});

// --- Type Inference from Zod Schemas ---
export type CharacterDetail = z.infer<typeof characterDetailSchema>;
export type SceneDescription = z.infer<typeof sceneDescriptionSchema>;
export type Scene = z.infer<typeof sceneSchema>;
// Infer the StoryResponse type from the array schema
type StoryResponse = z.infer<typeof sceneArraySchema>;

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

export async function generateStoryScenesFromInputs({
  kidName,
  pronoun,
  age,
  moral,
  storyRhyming,
  kidInterests,
  storyThemes,
  characters,
  characterDescriptions,
}: StorySceneInput): Promise<StoryResponse> {
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

  const userPrompt = `\nYou are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a 9-scene story blueprint featuring a main character and a side character.\n\n**INPUTS FOR THIS STORY:**\n* **kidName:** \"\`${kidName}\`\"\n* **pronoun:** \"\`${pronoun}\`\"\n* **age:** \`${age}\`\n* **moral:** \"\`${moral}\`\"\n* **kidInterest:** \"\`${kidInterests[0]}\`\"\n* **storyTheme:** \"\`${storyThemes[0]}\`\"\n* **character1 (Side Character Name):** \"\`${characters[0]}\`\"\n* **character1_description (Side Character Description):** \"\`${characterDescriptions[0]}\`\"\n* **storyRhyming:** \`${storyRhyming}\`\n\n**TASK:**\nProduce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each scene, strictly following the 14-field \`scene_description\` structure and the \`scene_text\` guidelines outlined in the System Prompt.\n\nDo not write any other text, explanation, or introduction. Your entire output must be only the raw JSON array.`;

  const openaiRes = await openai.responses.parse({
    model: "o4-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: zodTextFormat(storyResponseSchema, "story_response"),
    },
  });

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

  return story;
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

export async function generateImageForScene(
  scene: Scene,
  previousImageUrl: string | null,
  characterImageMap: Record<string, string> = DEFAULT_CHARACTER_IMAGES,
): Promise<string> {
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

  const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from Fal AI");
  }

  return imageUrl;
}

async function main() {
  try {
    const argPath = process.argv[2];
    const overrides =
      argPath && fs.existsSync(argPath)
        ? JSON.parse(fs.readFileSync(argPath, "utf8"))
        : {};
    const story = await generateStoryScenes();

    const generatedImageUrls: string[] = [];
    // Initialize a variable to hold the URL of the previously generated image.
    let previousImageUrl: string | null = null;

    for (const scene of story) {
      // Pass the current scene and the previous image URL to the generation function.

      const newUrl = await generateImageForScene(scene, previousImageUrl);

      // Add the newly generated URL to our list.
      generatedImageUrls.push(newUrl);

      // Update previousImageUrl for the next loop iteration.
      previousImageUrl = newUrl;
    }

    console.log("Generated image URLs for all scenes:\n");
    generatedImageUrls.forEach((u, i) => console.log(`Scene ${i + 1}: ${u}`));
    scene.forEach((scene) => {
      console.log("Generated text for scene:", scene.scene_text);
    });
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
