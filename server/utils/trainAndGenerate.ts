// server/utils/trainAndGenerate.ts
import fetch from "node-fetch";
import { fal } from "@fal-ai/client";
import archiver from "archiver";
import { WritableStreamBuffer } from "stream-buffers";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { URL } from "url";
import { expandImageToLeft, splitImageInHalf } from "./elementGeneration";
import { uploadBase64ToFirebase } from "./uploadImage";
import { STORY_SYSTEM_PROMPT, IMAGE_PROMPT_SYSTEM_PROMPT } from "./prompts";
import { jobTracker } from "../lib/jobTracker";

const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";

/**
 * Helper: Given an array of image URLs, downloads each image,
 * creates a zip archive in memory, and returns a Buffer for that zip.
 */
async function createZipBuffer(imageUrls: string[], jobId: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const bufferStream = new WritableStreamBuffer({
      initialSize: 100 * 1024, // start at 100KB
      incrementAmount: 10 * 1024, // grow by 10KB increments
    });

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err: any) => {
      if (DEBUG_LOGGING) console.error("[createZipBuffer] Archive error:", err);
      reject(err);
    });
    archive.pipe(bufferStream);

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        if (DEBUG_LOGGING)
          console.log(
            `[createZipBuffer] Fetching image ${i + 1} from URL:`,
            url,
          );
        const response = await fetch(url);
        if (!response.ok) {
          return reject(new Error(`Failed to fetch image at ${url}`));
        }
        const imageBuffer = await response.buffer();
        // Determine file extension from URL
        const ext = getExtension(url);
        archive.append(imageBuffer, { name: `image_${i + 1}${ext}` });
        const pct = (i + 1) / imageUrls.length * 5;
        jobTracker.set(jobId, {
          phase : "uploading",
          pct,
          message : `Uploading image ${i + 1}/${imageUrls.length}`
        });
      } catch (err) {
        return reject(err);
      }
    }

    archive.finalize();

    bufferStream.on("finish", () => {
      const zipBuffer = bufferStream.getContents();
      if (!zipBuffer) {
        return reject(new Error("Failed to get zip contents"));
      }
      if (DEBUG_LOGGING)
        console.log("[createZipBuffer] Zip archive created successfully");
      resolve(zipBuffer);
    });
  });
}

/**
 * Helper: Extract file extension from a URL.
 */
function getExtension(urlStr: string): string {
  try {
    const urlObj = new URL(urlStr);
    return path.extname(urlObj.pathname); // returns extension including the dot, e.g. ".jpg"
  } catch (error) {
    console.error("Failed to extract extension from URL:", urlStr, error);
    return "";
  }
}

/**
 * Initiate Flux/LoRA training using the official fal.ai client API.
 * Now accepts an array of image URLs (which we will zip) and captions.
 * Returns a jobId (and eventually modelId).
 */
export async function trainCustomModel(
  imageUrls: string[],
  captions: string[],
  kidName: string,
  jobId: string,
): Promise<string> {
  if (imageUrls.length !== captions.length) {
    throw new Error("Number of image URLs and captions must match.");
  }

  // Create a zip buffer from the provided image URLs.
  if (DEBUG_LOGGING)
    console.log("[trainCustomModel] Creating zip from image URLs...");
  const zipBuffer = await createZipBuffer(imageUrls, jobId);

  // Upload the zip file to Firebase Storage.
  const bucket = getStorage().bucket();
  const zipFilename = `${uuidv4()}.zip`;
  const fileUpload = bucket.file(zipFilename);
  await fileUpload.save(zipBuffer, {
    metadata: {
      contentType: "application/zip",
    },
  });
  const zipUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    zipFilename,
  )}?alt=media`;
  if (DEBUG_LOGGING) {
    console.log("[trainCustomModel] Zip uploaded. Public URL:", zipUrl);
  }

  // Build the payload per fal.ai API; note that image_urls is now a single string (zipUrl)
  const input = {
    images_data_url: zipUrl, // Pass the zip file URL
    captions, // Still pass the captions array as required (if API expects it)
    custom_token: `<${kidName}kidName>`,
    fast_training: true,
    steps: 1000,
    create_masks: true,
  };
  if (DEBUG_LOGGING) {
    console.log(
      "[trainCustomModel] Training input payload:",
      JSON.stringify(input, null, 2),
    );
  }

  jobTracker.set(jobId, { message: "Uploading images…", pct: 5 });

  const sub = await fal.subscribe("fal-ai/turbo-flux-trainer", {
    input,
    logs: true,
    onQueueUpdate(update) {
      if (update.status === "IN_PROGRESS" && "logs" in update) {
        const last = (update as any).logs.at(-1)?.message ?? "";
        const m = last.match(/Step (\d+)\/(\d+)/);
        if (m) {
          const pct = 5 + (Number(m[1]) / Number(m[2])) * 55; // 0–55 %
          jobTracker.set(jobId, {
            phase: "training",
            pct,
            message: last,
          });
        }
      }
    },
  });

  if (DEBUG_LOGGING) {
    console.log("[trainCustomModel] Training result data:", sub.data);
    console.log("[trainCustomModel] Request ID:", sub.requestId);
  }

  let data = sub.data;
  const rid = sub.requestId;
  const deadline = Date.now() + 30 * 60_000;
  while (!data?.diffusers_lora_file && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    data = await fal.queue
      .result("fal-ai/turbo-flux-trainer", {
        requestId: rid,
      })
      .then((r) => r.data)
      .catch(() => null);
  }
  if (!data?.diffusers_lora_file)
    throw new Error("Fal job timed-out without a LoRA file.");

  jobTracker.set(jobId, {
    phase: "training",
    pct: 60,
    message: "Model ready",
    modelId: data.diffusers_lora_file.url,
  });
  return data.diffusers_lora_file.url;

  // Assume result.data contains the modelId.
  // await new Promise((resolve) => setTimeout(resolve, 10000));
  // return {
  //   modelId:
  //     "https://v3.fal.media/files/panda/q3C2L2ukMOD-XR0XCNLiO_pytorch_lora_weights.safetensors",
  //   requestId: "66115f6e-7f18-459a-abbb-184253c769e8",
  // };
}

/**
 * Generate a single image using fal.ai and the custom-trained model.
 */

export async function generateGuidedImage(
  prompt: string,
  cartoonAvatarUrl: string,
  modelId: string,
  loraScale: number,
  seed: number,
  controlLoraStrength?: number,
  width?: number,
  height?: number,
): Promise<string> {
  console.log(
    "[generateGuidedImage] Generating image with prompt:",
    prompt,
    "using lora path:",
    modelId,
  );

  // Build payload matching the API docs
  const payload = {
    loras: [
      {
        path: modelId, // This is the URL returned from training.
        scale: loraScale,
      },
    ],
    prompt, // The generation prompt.
    embeddings: [], // No extra embeddings.
    model_name: null, // As required.
    enable_safety_checker: true,
    num_inference_steps: 28,
    control_lora_strength: controlLoraStrength ? controlLoraStrength : 0.5,
    control_lora_image_url: cartoonAvatarUrl,
    seed: seed,
    image_size: {
      width: width ? width : 1024,
      height: height ? height : 512,
    },
  };

  console.log(
    "[generateGuidedImage] Payload:",
    JSON.stringify(payload, null, 2),
  );

  // Use fal.subscribe to trigger image generation.
  const result = await fal.subscribe("fal-ai/flux-control-lora-canny", {
    input: payload,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) =>
          console.log("[generateGuidedImage] Queue update:", log.message),
        );
      }
    },
  });

  console.log("[generateGuidedImage] Generation result data:", result.data);
  console.log("[generateGuidedImage] Request ID:", result.requestId);

  if (result.data && result.data.images && result.data.images.length > 0) {
    return result.data.images[0].url;
  } else {
    throw new Error("No image returned from generation");
  }

  // return "https://v3.fal.media/files/monkey/HIB4Or6Y7JZ0IbQtKiwas_84ff96cd1fb94937b4e261b339a0da7a.jpg";
}

export async function generateImage(
  prompt: string,
  modelId: string,
  loraScale: number,
  seed: number,
  width?: number,
  height?: number,
): Promise<string> {
  console.log(
    "[generateImage] Generating image with prompt:",
    prompt,
    "using lora path:",
    modelId,
  );

  // Build payload matching the API docs
  const payload = {
    loras: [
      {
        path: modelId, // This is the URL returned from training.
        scale: loraScale,
      },
    ],
    prompt, // The generation prompt.
    embeddings: [], // No extra embeddings.
    model_name: null, // As required.
    enable_safety_checker: true,
    num_inference_steps: 28,
    seed: seed,
    image_size: {
      width: width ? width : 1024,
      height: height ? height : 512,
    },
  };

  console.log("[generateImage] Payload:", JSON.stringify(payload, null, 2));

  // Use fal.subscribe to trigger image generation.
  const result = await fal.subscribe("fal-ai/flux-lora", {
    input: payload,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) =>
          console.log("[generateImage] Queue update:", log.message),
        );
      }
    },
  });

  console.log("[generateImage] Generation result data:", result.data);
  console.log("[generateImage] Request ID:", result.requestId);

  if (result.data && result.data.images && result.data.images.length > 0) {
    return result.data.images[0].url;
  } else {
    throw new Error("No image returned from generation");
  }
  // return "https://v3.fal.media/files/monkey/HIB4Or6Y7JZ0IbQtKiwas_84ff96cd1fb94937b4e261b339a0da7a.jpg";
}

/**
 * Generate scene prompts using an LLM.
 * The prompt incorporates the kid's name, a base story prompt, and the story moral.
 */
export async function generateScenePromptsLLM(
  kidName: string,
  age: number,
  gender: string,
  basePrompt: string,
  moral: string,
  storyRhyming: boolean,
  storyTheme: string,
): Promise<string[]> {
  // Determine the type of scene format based on the storyRhyming flag.
  const promptFormat = storyRhyming
    ? "rhyming 4 line stanzas"
    : "non rhyming paragraphs";

  // Construct the prompt. Instruct the model to output a valid JSON array of exactly 9 objects.
  // Each object must have a "number" key (scene number) and a "scene" key (text content).
  const llmPrompt = `Generate a valid JSON array containing exactly 9 objects.
Each object should have the following keys:
  - "number": an integer from 1 to 9 indicating the scene number.
  - "scene": a string which is ${promptFormat} for a story where the hero is named "${kidName}", 
    based on the storyline "${basePrompt}", with a theme of ${storyTheme}. 
The story should clearly convey the moral: "${moral}" and be suitable for a ${age} year old ${gender}.
Output only the JSON array with no extra text or commentary.`;

  if (DEBUG_LOGGING) {
    console.log("[generateScenePromptsLLM] LLM Prompt:", llmPrompt);
  }

  // Execute the OpenAI Chat API call.
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: STORY_SYSTEM_PROMPT },
        { role: "user", content: llmPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (DEBUG_LOGGING) {
    console.log("[generateScenePromptsLLM] OpenAI response:", data);
  }

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Extract the assistant's reply.
  const content = data.choices[0].message.content;

  let scenesArray: any;
  // Attempt to parse the output as JSON.
  try {
    scenesArray = JSON.parse(content);
  } catch (jsonError) {
    console.error("[generateScenePromptsLLM] JSON parse error:", jsonError);
    // Fallback: attempt to clean the text by extracting a substring that looks like a JSON array.
    try {
      const jsonStart = content.indexOf("[");
      const jsonEnd = content.lastIndexOf("]") + 1;
      const jsonSubstring = content.substring(jsonStart, jsonEnd);
      scenesArray = JSON.parse(jsonSubstring);
    } catch (fallbackError) {
      console.error(
        "[generateScenePromptsLLM] Fallback JSON parse error:",
        fallbackError,
      );
      throw new Error("Failed to parse JSON response from the AI.");
    }
  }

  // Validate that exactly 9 scene objects are returned.
  if (!Array.isArray(scenesArray) || scenesArray.length !== 9) {
    throw new Error("Unexpected number of scenes returned, expected 9.");
  }

  // Extract the scene text from each object.
  const scenes = scenesArray
    .map((item: any) => {
      if (typeof item === "object" && item.scene) {
        return item.scene.trim();
      }
      return "";
    })
    .filter((scene: string) => scene.length > 0);

  if (DEBUG_LOGGING) {
    console.log("[generateScenePromptsLLM] Generated scenes:", scenes);
  }

  return scenes;
}

export async function regenerateImagePromptsFromScenes(
  kidName: string,
  age: number,
  gender: string,
  scenes: string[],
): Promise<string[]> {
  const formattedScenes = scenes.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const messages = [
    {
      role: "system",
      content: IMAGE_PROMPT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `
Generate an image generation prompts to be used for illustration generation for the above story content. Below is a scene and I need an image generation prompt against that ensuring character consistency across previously geenrated prompts
__________________
${formattedScenes}
__________________

Other inputs:
Main Character : ${kidName}
Age : ${age}
Gender : ${gender}
Trigger: <${kidName}kidName>
Everyone else apart from ${kidName} is a secondary character. Follow the guidelines mandatorily`,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      messages,
      temperature: 1.0,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error("Failed to generate image prompts from OpenAI response");
  }

  const content = data.choices[0].message.content;
  console.log(content);
  const prompts = content
    .split("\n")
    .map((line) => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/^Scene\s*\d+:\s*/i, "");
      trimmed = trimmed.replace(/^\d+\.\s*/, "");
      return trimmed;
    })
    .filter((line) => line.length > 0);

  return prompts;
}

/**
 * Augment a scene description with your custom token.
 */
export async function createImagePromptsFromScenes(
  kidName: string,
  age: number,
  gender: string,
  scenes: string[],
  basePrompt: string,
  moral: string,
  storyRhyming: boolean,
  storyTheme: string,
): Promise<string[]> {
  const formattedScenes = scenes.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const messages = [
    {
      role: "system",
      content: IMAGE_PROMPT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `
Generate a numbered list of 9 image generation prompts to be used for illustration generation for the above story content Here are the 9 scenes and I need an image generation prompt against each ensuring character consistency across the prompts.
__________________
${formattedScenes}
__________________

Other inputs:
Main Character : ${kidName}
Age : ${age}
Gender : ${gender}
Trigger: <${kidName}kidName>
Everyone else apart from ${kidName} is a secondary character. Follow the guidelines mandatorily`,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      temperature: 1.0,
      max_tokens: 3000,
    }),
  });

  const data = await response.json();
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error("Failed to generate image prompts from OpenAI response");
  }

  const content = data.choices[0].message.content;
  const prompts = content
    .split("\n")
    .map((line) => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/^Scene\s*\d+:\s*/i, "");
      trimmed = trimmed.replace(/^\d+\.\s*/, "");
      return trimmed;
    })
    .filter((line) => line.length > 0);

  return prompts;
}

export function buildFullPrompt(
  stylePreference: string,
  age: number,
  gender: string,
  prompt: string,
) {
  let fullPrompt = "";
  const style = stylePreference.split("-").pop();

  switch (style) {
    case "pixar":
      fullPrompt = `
        Pixar-style 3D rendered, vibrant colors, expressive characters, ultra-detailed textures, cinematic lighting, joyful emotions, ${prompt}`;
      break;

    case "handdrawn":
      fullPrompt = `
      Detailed hand-drawn illustration, warm gentle colors, fine pencil or ink outlines, inviting textures, storybook charm, ${prompt}`;
      break;

    case "watercolor":
      fullPrompt = `
        Whimsical watercolor illustration, pastel color palette, smooth gradients, textured paper background, dream-like atmosphere, ${prompt}`;
      break;

    case "claymotion":
      fullPrompt = `
            Claymation-style detailed scene, realistic handmade clay textures, subtle imperfections, vibrant tactile appearance, playful composition, ${prompt}`;
      break;

    case "crayonart":
      fullPrompt = `
            Bright, playful crayon-style drawing, vivid bold colors, childlike rough textures, joyful simplicity, ${prompt}`;
      break;

    case "pastelsketch":
      fullPrompt = `
              Gentle pastel sketch, soft smudged textures, calming color tones, soothing, artistic sketch quality, ${prompt}`;
      break;

    default:
      // Fallback or handle unknown style
      fullPrompt = `
      Pixar-style 3D rendered, vibrant colors, expressive characters, ultra-detailed textures, cinematic lighting, joyful emotions, ${prompt}`;
      break;
  }

  // Optional: Clean up whitespace
  return fullPrompt.trim();
}

export async function generateBackCoverImage(
  coverUrl: string,
  backCoverFileName: string,
): Promise<{
  backCoverUrl: string;
}> {
  const expandedImageUrl = await expandImageToLeft(coverUrl);
  const { leftHalf, rightHalf } = await splitImageInHalf(expandedImageUrl);
  const backCoverUrl = await uploadBase64ToFirebase(
    leftHalf,
    backCoverFileName,
  );
  return backCoverUrl;
}

/**
 * Generate story images using the custom model.
 * It first generates scene prompts using the LLM (incorporating base prompt and moral)
 * and then generates an image for each prompt.
 */
export async function generateStoryImages(
  jobId: string,
  modelId: string,
  kidName: string,
  baseStoryPrompt: string,
  moral: string,
  title: string,
  age: number,
  gender: string,
  stylePreference: string,
  storyRhyming: boolean,
  storyTheme: string,
  seed: number,
): Promise<{
  pages: string[];
  coverUrl: string;
  backCoverUrl: string;
  avatarUrl: string;
  avatarLora: number;
}> {
  if (DEBUG_LOGGING) {
    console.log("[generateStoryImages] Starting story generation for:", {
      kidName,
      baseStoryPrompt,
      moral,
      title,
      stylePreference,
    });
  }

  jobTracker.set(jobId, {
    phase: "prompting",
    pct: 60,
    message: "Generating stories",
  });

  const mode = "refine";
  const controlLoraStrength = 0.5;

  const loraScale =
    stylePreference === "predefined"
      ? 0.9
      : stylePreference.startsWith("hyper")
        ? 0.7
        : 0.6;

  const scenePrompts = await generateScenePromptsLLM(
    kidName,
    age,
    gender,
    baseStoryPrompt,
    moral,
    storyRhyming,
    storyTheme,
  );
  if (scenePrompts.length < 9) {
    throw new Error("LLM did not return enough scene prompts.");
  }
  if (DEBUG_LOGGING)
    console.log("[generateStoryImages] Final scene prompts:", scenePrompts);

  jobTracker.set(jobId, {
    phase: "prompting",
    pct: 67,
    message: "Generating prompts for images",
  });

  const imageGenerationPrompts = await createImagePromptsFromScenes(
    kidName,
    age,
    gender,
    scenePrompts,
    baseStoryPrompt,
    moral,
    storyRhyming,
    storyTheme,
  );

  console.log(
    "[generateStoryImages] Image generation prompts length:",
    imageGenerationPrompts.length,
  );

  console.log(
    "[generateStoryImages] Image generation prompts length:",
    imageGenerationPrompts,
  );
  
  jobTracker.set(jobId, {
    phase: "prompting",
    pct: 72,
    message: "Generating prompts for images",
  });
  
  let avatarUrl = "";
  if (mode === "refine") {
    const avatarPrompt = `closeup photo of ${age} year old ${gender} kid <${kidName}kidName>,  imagined as pixar cartoon character,  clearly visible against a white background`;
    avatarUrl = await generateImage(avatarPrompt, modelId, loraScale, seed);
  }

  jobTracker.set(jobId, {
    phase: "generating",
    pct: 75,
    message: "Generating images…",
  });
  const total = 11;
  let done = 0;

  const pages = await Promise.all(
    imageGenerationPrompts.map(async (promptText, i) => {
      const fullPrompt = buildFullPrompt(
        stylePreference,
        age,
        gender,
        promptText,
      );
      const imageUrl =
        mode === "refine"
          ? await generateGuidedImage(
              fullPrompt,
              avatarUrl,
              modelId,
              loraScale,
              seed,
              controlLoraStrength,
            )
          : await generateImage(fullPrompt, modelId, loraScale, seed);
      done += 1;
      jobTracker.set(jobId, {
        phase: "generating",
        pct: 75 + (done / total) * 20, // 65-95
      });

      return {
        imageUrl,
        prompt: promptText,
        sceneText: scenePrompts[i], // <- was in sceneTexts[]
        loraScale,
        controlLoraStrength: mode === "refine" ? controlLoraStrength : 1, //
      };
    }),
  );
  if (DEBUG_LOGGING)
    console.log("[generateStoryImages] Generated images:", pages);

  jobTracker.set(jobId, {
    phase: "generating",
    pct: 95,
    message: "Generating cover images…",
  });

  const coverPrompt = `A captivating front cover photo which is apt for title: ${title} featuring <${kidName}kidName> as hero. It should clearly display the text "${title}" on top of the photo in a bold and colourful font`;

  if (DEBUG_LOGGING) console.log("[generateStoryImages] loraScale:", loraScale);

  const coverPromptFull = buildFullPrompt(
    stylePreference,
    age,
    gender,
    coverPrompt,
  );

  const coverUrl = await generateGuidedImage(
    coverPromptFull,
    avatarUrl,
    modelId,
    loraScale,
    seed,
    controlLoraStrength,
    512,
  );
  const backCoverFileName = `books/backCover/${kidName}_${baseStoryPrompt}.png`;
  const backCoverUrl = await generateBackCoverImage(
    coverUrl,
    backCoverFileName,
  );

  if (DEBUG_LOGGING) {
    console.log(
      "[generateStoryImages] Generated cover image:",
      coverUrl,
      backCoverUrl,
    );
  }

  const result = {
    pages: pages,
    coverUrl: coverUrl,
    backCoverUrl: backCoverUrl,
    avatarUrl: avatarUrl,
    avatarLora: loraScale,
  };

  jobTracker.set(jobId, {
    phase: "complete",
    pct: 100,
    ...result,
  });

  return result;
}

//   const dummyPages = [
//     {
//       imageUrl:
//         "https://v3.fal.media/files/lion/BYulTnmCMtjoCWVxUo7xT_e6e032ba64ec4b39b11ce0449a6b7349.jpg",
//       prompt:
//         "1. As Adventure Alex entered the village, he spotted a dragon with colorful scales and a big smile, eagerly greeting everyone.",
//       sceneText:
//         "As Adventure Alex entered the village, he spotted a dragon with colorful scales and a big smile, eagerly greeting everyone.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/tiger/J5lzVpM_BqVbIhbUz2Hne_fe22e58aff3d4162af677c24bcd9bf1d.jpg",
//       prompt:
//         "2. The dragon, named Spark, playfully chased after children, blowing bubbles from his nostrils as they giggled and ran around him.",
//       sceneText:
//         "The dragon, named Spark, playfully chased after children, blowing bubbles from his nostrils as they giggled and ran around him.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/tiger/j9MS5iglRS18iSq98pG4g_d7187c2696b54619a7afa8e8f5547325.jpg",
//       prompt:
//         "3. Despite their initial fear, the villagers soon realized that Spark was gentle and kind, just looking for companionship.",
//       sceneText:
//         "Despite their initial fear, the villagers soon realized that Spark was gentle and kind, just looking for companionship.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/koala/wLuAkk35LqRsr3nh5J_KA_1b586234ad7142f097bcfe0f5f178ac5.jpg",
//       prompt:
//         "4. Spark led Adventure Alex to a hidden cave filled with sparkling crystals, where he liked to spend his time painting colorful murals on the walls.",
//       sceneText:
//         "Spark led Adventure Alex to a hidden cave filled with sparkling crystals, where he liked to spend his time painting colorful murals on the walls.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/lion/NBazttn8soarZVbGiTv_x_04fe3fa5b55843fb803014c40d26fe36.jpg",
//       prompt:
//         "5. Curious village cats and dogs approached Spark tentatively, only to end up curling around his massive paws, enjoying his warmth.",
//       sceneText:
//         "Curious village cats and dogs approached Spark tentatively, only to end up curling around his massive paws, enjoying his warmth.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/lion/X96gJElSTzsHbXLmULxCL_3702e907195e488092ce080a268cdcb5.jpg",
//       prompt:
//         "6. One day, a mischievous goblin tried to stir up trouble by spreading rumors about Spark being a dangerous monster, but the villagers defended their new friend.",
//       sceneText:
//         "One day, a mischievous goblin tried to stir up trouble by spreading rumors about Spark being a dangerous monster, but the villagers defended their new friend.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/lion/aDjdirA6IgoHqcIriUbZQ_aad543a4bd78401fb2ada69bb5decae6.jpg",
//       prompt:
//         "7. Adventure Alex and Spark went on a quest together, traversing lush forests and crossing bubbling streams, forming an unbreakable bond along the way.",
//       sceneText:
//         "Adventure Alex and Spark went on a quest together, traversing lush forests and crossing bubbling streams, forming an unbreakable bond along the way.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/kangaroo/-G8vLjMeKkosA1KoAfgAN_e114abaa9b1e43ccbcc62771f2c8a8da.jpg",
//       prompt:
//         "8. When a sudden storm hit the village, it was Spark who shielded the villagers with his massive wings, proving his loyalty and bravery.",
//       sceneText:
//         "When a sudden storm hit the village, it was Spark who shielded the villagers with his massive wings, proving his loyalty and bravery.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//     {
//       imageUrl:
//         "https://v3.fal.media/files/tiger/8cqtxgKY_pEr7N--wddiH_d44b2b548ba84d049d6280e9367d970c.jpg",
//       prompt:
//         "9. As the sun set on the horizon, the villagers gathered around a bonfire, sharing stories and laughter with Spark, grateful for the lesson they had learned.",
//       sceneText:
//         "As the sun set on the horizon, the villagers gathered around a bonfire, sharing stories and laughter with Spark, grateful for the lesson they had learned.",
//       loraScale: 0.8,
//       controlLoraStrength: 0.7,
//     },
//   ];

//   const dummyBackCoverUrl =
//     "https://v3.fal.media/files/koala/PtOeBiekDUU8eJ-z9cjFZ_d1a6e15d77464e5291b4bf6d7cf4424b.jpg";

//   const dummyAvatarUrl =
//     "https://v3.fal.media/files/koala/PtOeBiekDUU8eJ-z9cjFZ_d1a6e15d77464e5291b4bf6d7cf4424b.jpg";

//   const dummyCoverUrl =
//     "https://v3.fal.media/files/zebra/Ut7N9_NMY_xuRk1JddLog_006730264e5b40e784b80c543558d601.jpg";

//   const result = {
//     pages: dummyPages,
//     coverUrl: dummyCoverUrl,
//     backCoverUrl: dummyBackCoverUrl,
//     avatarUrl: dummyAvatarUrl,
//     avatarLora: loraScale,
//   };

//   jobTracker.set(jobId, {
//     phase: "complete",
//     pct: 100,
//     ...result,
//   });

//   return result;
// }
