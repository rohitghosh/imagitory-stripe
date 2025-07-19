import { fal } from "@fal-ai/client";
import {
  Scene,
  Scenewochar,
  SceneDescription,
  ScenewocharDescription,
  FrontCover,
  FrontCoverWoChar,
  ProgressCallback,
} from "../types";
import { SceneRegenerationInput, BaseCoverRegenerationInput } from "../types";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

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
export async function generateImageForScene(
  scene: Scene | Scenewochar,
  previousImageUrl: string | null,
  characterImageMap: Record<string, string> = DEFAULT_CHARACTER_IMAGES,
  onProgress?: ProgressCallback,
  seed: number = 3, // NEW PARAMETER
): Promise<string> {
  onProgress?.(
    "generating",
    0,
    `Preparing scene ${scene.scene_description.Scene_Number}`,
  );

  // Determine if this is a scene with characters or without
  const hasCharacters = "Present_Characters" in scene.scene_description;

  let Present_Characters: string[] = [];
  let Visual_Overlap_With_Previous: boolean = false;
  let basePrompt: string;

  if (hasCharacters) {
    const sceneWithChar = scene as Scene;
    Present_Characters = sceneWithChar.scene_description.Present_Characters;
    Visual_Overlap_With_Previous =
      sceneWithChar.scene_description.Visual_Overlap_With_Previous;
    basePrompt = generateImagePrompt(sceneWithChar.scene_description);
  } else {
    const sceneWoChar = scene as Scenewochar;
    Visual_Overlap_With_Previous =
      sceneWoChar.scene_description.Visual_Overlap_With_Previous;
    basePrompt = generateImagePromptWoChar(sceneWoChar.scene_description);
  }

  // Collect available character reference images
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
    imageUrls.push(previousImageUrl!);
    const prevSceneImageIndex = imageUrls.length;
    const suffix = prevSceneImageIndex === 3 ? "rd" : "th";
    attachmentText += ` and the image from the previous scene (${prevSceneImageIndex}${suffix} image)`;
  }

  const commonInputParams = {
    guidance_scale: 5,
    num_images: 1,
    output_format: "jpeg",
    seed: seed, // CHANGED: use parameter instead of hardcoded 3
    aspect_ratio: "21:9",
    safety_tolerance: 6,
  };

  const onQueueUpdate = (update: any) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log: any) => log.message).forEach(console.log);
    }
  };

  let falRes;

  if (imageUrls.length > 0) {
    // Case 1: Images are present. Use the 'multi' endpoint.
    let prompt = `Attached are the images of ${attachmentText} - create a scene as described below:\n${basePrompt}`;

    if (usePreviousImage) {
      prompt += `\n\n**Visual Consistency Note:** The last image attached is from the previous scene. Use it as a reference to maintain visual consistency in the setting, props, and overall environment. The character poses and actions should still follow the new scene description.`;
    }

    console.log(
      "Calling multi-modal endpoint: fal-ai/flux-pro/kontext/max/multi",
    );
    console.log("Final Prompt:", prompt);
    console.log("Image URLs sent to AI:", imageUrls);

    // falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
    //   input: {
    //     ...commonInputParams,
    //     prompt: prompt,
    //     image_urls: imageUrls,
    //   },
    //   logs: true,
    //   onQueueUpdate,
    // });
  } else {
    // Case 2: No images. Use the 'text-to-image' endpoint.
    console.log(
      "Calling text-to-image endpoint: fal-ai/flux-pro/kontext/max/text-to-image",
    );
    console.log("Final Prompt:", basePrompt);

    onProgress?.("generating", 20, "Calling image API…");

    // falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/text-to-image", {
    //   input: {
    //     ...commonInputParams,
    //     prompt: basePrompt,
    //   },
    //   logs: true,
    //   onQueueUpdate,
    // });
  }

  onProgress?.("generating", 80, "Processing Fal response…");
  // const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;
  const imageUrl =
    "https://fal.media/files/lion/40gW0lutCfGgdJhWLfm4q_1d65e0a733d6486993d346811ed817bf.jpg";

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

/**
 * Generate image for front cover (supports both with and without characters)
 */
export async function generateImageForFrontCover(
  frontCover: FrontCover | FrontCoverWoChar,
  characterImageMap: Record<string, string> = DEFAULT_CHARACTER_IMAGES,
  onProgress?: ProgressCallback,
  seed: number = 3, // NEW PARAMETER
): Promise<string> {
  onProgress?.("generating_cover", 0, "Preparing front cover image...");

  // Determine if this is a cover with characters or without
  const hasCharacters = "Present_Characters" in frontCover;

  let basePrompt: string;
  let Present_Characters: string[] = [];

  if (hasCharacters) {
    const coverWithChar = frontCover as FrontCover;
    Present_Characters = coverWithChar.Present_Characters;
    basePrompt = generateFrontCoverPrompt(coverWithChar);
  } else {
    const coverWoChar = frontCover as FrontCoverWoChar;
    basePrompt = generateFrontCoverPromptWoChar(coverWoChar);
  }

  const imageUrls: string[] = [];
  const characterNamesForPrompt: string[] = [];

  // Collect character reference images if any
  Present_Characters.forEach((name) => {
    const url = characterImageMap[name];
    if (url) {
      imageUrls.push(url);
      characterNamesForPrompt.push(name);
    }
  });

  // Set up API parameters with a 1:1 aspect ratio for the cover
  const commonInputParams = {
    guidance_scale: 5,
    num_images: 1,
    output_format: "jpeg",
    seed: seed, // CHANGED: use parameter instead of hardcoded 3
    aspect_ratio: "1:1",
    safety_tolerance: 6,
  };

  const onQueueUpdate = (update: any) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log: any) => log.message).forEach(console.log);
    }
  };

  onProgress?.("generating_cover", 20, "Calling image API for cover...");

  let falRes;

  if (imageUrls.length > 0) {
    // Create the attachment text for the prompt
    const attachmentText = characterNamesForPrompt
      .map(
        (name, idx) =>
          `${name}(${idx + 1}${idx === 0 ? "st" : idx === 1 ? "nd" : "rd"} image)`,
      )
      .join(" and ");

    const prompt = `Attached are the images of ${attachmentText}. Create a vibrant, beautiful book front cover as described below:\n${basePrompt}`;

    console.log("Calling multi-modal endpoint for front cover...");

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
    // No character images, use text-to-image
    console.log("Calling text-to-image endpoint for front cover...");

    falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/text-to-image", {
      input: {
        ...commonInputParams,
        prompt: basePrompt,
      },
      logs: true,
      onQueueUpdate,
    });
  }

  onProgress?.("generating_cover", 80, "Processing response for cover...");
  const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from Fal AI for front cover");
  }

  onProgress?.("generating_cover", 100, "Front cover image ready");
  return imageUrl;
}

/**
 * Generate final cover with title overlay using image-to-image generation
 */
export async function generateFinalCoverWithTitle(
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
  console.log("Base cover URL:", baseCoverUrl);
  console.log("Title prompt:", titlePrompt);

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

  onProgress?.(
    "generating_final_cover",
    80,
    "Processing title overlay response...",
  );

  const finalCoverUrl =
    falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

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
export async function regenerateFinalCover(
  finalCoverInputs: FinalCoverRegenerationInput,
  newSeed?: number,
  onProgress?: ProgressCallback,
): Promise<string> {
  const seedToUse = newSeed ?? finalCoverInputs.seed ?? 3;

  return generateFinalCoverWithTitle(
    finalCoverInputs.base_cover_url,
    finalCoverInputs.story_title,
    seedToUse,
    onProgress,
  );
}

// Update existing regenerateCoverImage to be more specific
export async function regenerateBaseCoverImage(
  baseCoverInputs: BaseCoverRegenerationInput,
  newSeed?: number,
  onProgress?: ProgressCallback
): Promise<string> {
  const seedToUse = newSeed ?? baseCoverInputs.seed ?? 3;

  return generateImageForFrontCover(
    baseCoverInputs.front_cover,
    baseCoverInputs.characterImageMap,
    onProgress,
    seedToUse
  );
}

// New function for regenerating individual scenes
export async function regenerateSceneImage(
  sceneInputs: SceneRegenerationInput,
  newSeed?: number,
  onProgress?: ProgressCallback,
): Promise<string> {
  const seedToUse = newSeed ?? sceneInputs.seed ?? 3;

  // Create a mock scene object for the existing function
  const mockScene = {
    scene_description: sceneInputs.scene_description,
    scene_text: "", // Not needed for image generation
  } as Scene | Scenewochar;

  return generateImageForScene(
    mockScene,
    sceneInputs.previousImageUrl || null,
    sceneInputs.characterImageMap,
    onProgress,
    seedToUse,
  );
}

// New function for regenerating cover
export async function regenerateCoverImage(
  coverInputs: CoverRegenerationInput,
  newSeed?: number,
  onProgress?: ProgressCallback,
): Promise<string> {
  const seedToUse = newSeed ?? coverInputs.seed ?? 3;

  return generateImageForFrontCover(
    coverInputs.front_cover,
    coverInputs.characterImageMap,
    onProgress,
    seedToUse,
  );
}
