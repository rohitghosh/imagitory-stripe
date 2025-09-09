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
import { jobTracker } from "../lib/jobTracker";

// import {
//   generateStoryScenesFromInputs,
//   generateImageForScene,
// } from "./generate";

const TEST_MODE = process.env.TEST_MODE;
const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";

/**
 * Helper: Given an array of image URLs, downloads each image,
 * creates a zip archive in memory, and returns a Buffer for that zip.
 */
async function createZipBuffer(
  imageUrls: string[],
  jobId: string,
): Promise<Buffer> {
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
        const pct = ((i + 1) / imageUrls.length) * 5;
        jobTracker.set(jobId, {
          phase: "uploading",
          pct,
          message: `Uploading image ${i + 1}/${imageUrls.length}`,
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

  // const sub = await fal.subscribe("fal-ai/turbo-flux-trainer", {
  //   input,
  //   logs: true,
  //   onQueueUpdate(update) {
  //     if (update.status === "IN_PROGRESS" && "logs" in update) {
  //       const last = (update as any).logs.at(-1)?.message ?? "";
  //       const m = last.match(/Step (\d+)\/(\d+)/);
  //       if (m) {
  //         const pct = 5 + (Number(m[1]) / Number(m[2])) * 55; // 0–55 %
  //         jobTracker.set(jobId, {
  //           phase: "training",
  //           pct,
  //           message: last,
  //         });
  //       }
  //     }
  //   },
  // });

  // if (DEBUG_LOGGING) {
  //   console.log("[trainCustomModel] Training result data:", sub.data);
  //   console.log("[trainCustomModel] Request ID:", sub.requestId);
  // }

  // let data = sub.data;
  // const rid = sub.requestId;
  // const deadline = Date.now() + 30 * 60_000;
  // while (!data?.diffusers_lora_file && Date.now() < deadline) {
  //   await new Promise((r) => setTimeout(r, 5000));
  //   data = await fal.queue
  //     .result("fal-ai/turbo-flux-trainer", {
  //       requestId: rid,
  //     })
  //     .then((r) => r.data)
  //     .catch(() => null);
  // }
  // if (!data?.diffusers_lora_file)
  //   throw new Error("Fal job timed-out without a LoRA file.");

  // jobTracker.set(jobId, {
  //   phase: "training",
  //   pct: 60,
  //   message: "Model ready",
  //   modelId: data.diffusers_lora_file.url,
  // });
  // return data.diffusers_lora_file.url;

  // Assume result.data contains the modelId.
  await new Promise((resolve) => setTimeout(resolve, 10000));
  return "https://v3.fal.media/files/panda/q3C2L2ukMOD-XR0XCNLiO_pytorch_lora_weights.safetensors";
}

/**
 * Generate a single image using fal.ai and the custom-trained model.
 */

export async function generateGuidedImage(
  prompt: string,
  cartoonAvatarUrl: string,
  modelId: string,
  gender: string,
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
  // const sceneUrl = await generateKontextImage(
  //   prompt,
  //   cartoonAvatarUrl,
  //   seed,
  //   width,
  //   height,
  // );
  const loras = [{ path: modelId, scale: 1 }];
  const sceneUrl = await generateKontextLoraImage(
    prompt,
    cartoonAvatarUrl,
    loras,
    seed,
    30, // num_inference_steps
    2.5, // guidance_scale
    1, // num_images
    true, // enable_safety_checker
    "match_input",
  );

  // 🔹 Step 2 – swap the kid’s face in
  // const finalUrl = await faceSwapWithAvatar(cartoonAvatarUrl, sceneUrl, gender);

  return sceneUrl;

  // return "https://v3.fal.media/files/monkey/HIB4Or6Y7JZ0IbQtKiwas_84ff96cd1fb94937b4e261b339a0da7a.jpg";
}

export async function generateKontextLoraImage(
  prompt: string,
  cartoonAvatarUrl: string,
  loras: Array<{ path: string; scale?: number }>,
  seed?: number,
  num_inference_steps?: number,
  guidance_scale?: number,
  num_images?: number,
  enable_safety_checker?: boolean,
  resolution_mode?: "auto" | "match_input",
): Promise<string> {
  const payload: any = {
    image_url: cartoonAvatarUrl,
    prompt,
    loras,
    num_inference_steps: num_inference_steps ?? 30,
    seed,
    guidance_scale: guidance_scale ?? 2.5,
    num_images: num_images ?? 1,
    enable_safety_checker: enable_safety_checker ?? true,
    resolution_mode: resolution_mode ?? "match_input",
  };

  // Remove undefined fields (for optional params)
  Object.keys(payload).forEach(
    (k) => payload[k] === undefined && delete payload[k],
  );

  console.log(
    "[generateKontextLoraImage] Payload:",
    JSON.stringify(payload, null, 2),
  );

  const result = await fal.subscribe("fal-ai/flux-kontext-lora", {
    input: payload,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) =>
          console.log("[generateKontextLoraImage] Queue update:", log.message),
        );
      }
    },
  });

  if (result.data && result.data.images && result.data.images.length > 0) {
    return result.data.images[0].url;
  } else {
    throw new Error("No image returned from kontext-lora generation");
  }
}

export async function generateKontextImage(
  prompt: string,
  cartoonAvatarUrl: string,
  seed: number,
  width?: number,
  height?: number,
): Promise<string> {
  console.log("[generateImage] Generating image with prompt:", prompt);

  // Build payload matching the API docs
  const payload = {
    prompt,
    image_url: cartoonAvatarUrl,
    enable_safety_checker: true,
    num_inference_steps: 28,
    seed: seed,
    image_size: {
      width: width ? width : 512,
      height: height ? height : 256,
    },
  };

  console.log("[generateImage] Payload:", JSON.stringify(payload, null, 2));

  // Use fal.subscribe to trigger image generation.
  const result = await fal.subscribe("fal-ai/flux-kontext/dev", {
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
      width: width ? width : 512,
      height: height ? height : 256,
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

async function faceSwapWithAvatar(
  avatarUrl: string,
  sceneUrl: string,
  gender: string,
  workflow: "user_hair" | "target_hair" = "user_hair",
): Promise<string> {
  const genderForApi = normaliseGender(gender);
  const swapInput = {
    face_image_0: avatarUrl, // hero’s face
    gender_0: genderForApi, // empty is allowed
    target_image: sceneUrl, // scene from step-1
    workflow_type: workflow, // keep user-hair by default
    upscale: true, // model default
  };

  const swap = await fal.subscribe("easel-ai/advanced-face-swap", {
    input: swapInput,
    logs: true,
    onQueueUpdate(u) {
      if (u.status === "IN_PROGRESS")
        u.logs.forEach((l) => console.log("[faceSwap]", l.message));
    },
  });

  if (swap.data?.image?.url) return swap.data.image.url;
  throw new Error("Face-swap returned no image");
}

function normaliseGender(g: string): "" | "male" | "female" | "non-binary" {
  const s = (g || "").trim().toLowerCase();
  if (s === "boy" || s === "male" || s === "man") return "male";
  if (s === "girl" || s === "female" || s === "woman") return "female";
  if (s === "non-binary" || s === "nonbinary") return "non-binary";
  return ""; // safest fall-back → model guesses
}

/**
 * Generate scene prompts using an LLM.
 * The prompt incorporates the kid's name, a base story prompt, and the story moral.
 */
// export async function generateScenePromptsLLM(
//   kidName: string,
//   age: number,
//   gender: string,
//   basePrompt: string,
//   moral: string,
//   storyRhyming: boolean,
//   storyTheme: string,
// ): Promise<string[]> {
//   // Determine the type of scene format based on the storyRhyming flag.
//   const promptFormat = storyRhyming
//     ? "rhyming 4 line stanzas"
//     : "non rhyming paragraphs";

//   // Construct the prompt. Instruct the model to output a valid JSON array of exactly 9 objects.
//   // Each object must have a "number" key (scene number) and a "scene" key (text content).
//   const llmPrompt = `Generate a valid JSON array containing exactly 9 objects.
// Each object should have the following keys:
//   - "number": an integer from 1 to 9 indicating the scene number.
//   - "scene": a string which is ${promptFormat} for a story where the hero is named "${kidName}",
//     based on the storyline "${basePrompt}", with a theme of ${storyTheme}.
// The story should clearly convey the moral: "${moral}" and be suitable for a ${age} year old ${gender}.
// Output only the JSON array with no extra text or commentary.`;

//   if (DEBUG_LOGGING) {
//     console.log("[generateScenePromptsLLM] LLM Prompt:", llmPrompt);
//   }

//   // Execute the OpenAI Chat API call.
//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4",
//       messages: [
//         { role: "system", content: STORY_SYSTEM_PROMPT },
//         { role: "user", content: llmPrompt },
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   });

//   const data = await response.json();
//   if (DEBUG_LOGGING) {
//     console.log("[generateScenePromptsLLM] OpenAI response:", data);
//   }

//   if (data.error) {
//     throw new Error(data.error.message);
//   }

//   // Extract the assistant's reply.
//   const content = data.choices[0].message.content;

//   let scenesArray: any;
//   // Attempt to parse the output as JSON.
//   try {
//     scenesArray = JSON.parse(content);
//   } catch (jsonError) {
//     console.error("[generateScenePromptsLLM] JSON parse error:", jsonError);
//     // Fallback: attempt to clean the text by extracting a substring that looks like a JSON array.
//     try {
//       const jsonStart = content.indexOf("[");
//       const jsonEnd = content.lastIndexOf("]") + 1;
//       const jsonSubstring = content.substring(jsonStart, jsonEnd);
//       scenesArray = JSON.parse(jsonSubstring);
//     } catch (fallbackError) {
//       console.error(
//         "[generateScenePromptsLLM] Fallback JSON parse error:",
//         fallbackError,
//       );
//       throw new Error("Failed to parse JSON response from the AI.");
//     }
//   }

//   // Validate that exactly 9 scene objects are returned.
//   if (!Array.isArray(scenesArray) || scenesArray.length !== 9) {
//     throw new Error("Unexpected number of scenes returned, expected 9.");
//   }

//   // Extract the scene text from each object.
//   const scenes = scenesArray
//     .map((item: any) => {
//       if (typeof item === "object" && item.scene) {
//         return item.scene.trim();
//       }
//       return "";
//     })
//     .filter((scene: string) => scene.length > 0);

//   if (DEBUG_LOGGING) {
//     console.log("[generateScenePromptsLLM] Generated scenes:", scenes);
//   }

//   return scenes;
// }

// export async function regenerateImagePromptsFromScenes(
//   kidName: string,
//   age: number,
//   gender: string,
//   scenes: string[],
// ): Promise<string[]> {
//   const formattedScenes = scenes.map((s, i) => `${i + 1}. ${s}`).join("\n");

//   const messages = [
//     {
//       role: "system",
//       content: IMAGE_PROMPT_SYSTEM_PROMPT,
//     },
//     {
//       role: "user",
//       content: `
// Generate an image generation prompts to be used for illustration generation for the above story content. Below is a scene and I need an image generation prompt against that ensuring character consistency across previously geenrated prompts
// __________________
// ${formattedScenes}
// __________________

// Other inputs:
// Main Character : ${kidName}
// Age : ${age}
// Gender : ${gender}
// Trigger: <${kidName}kidName>
// Everyone else apart from ${kidName} is a secondary character. Follow the guidelines mandatorily`,
//     },
//   ];

//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4.1",
//       messages,
//       temperature: 1.0,
//       max_tokens: 500,
//     }),
//   });

//   const data = await response.json();
//   if (!data.choices || !data.choices[0]?.message?.content) {
//     throw new Error("Failed to generate image prompts from OpenAI response");
//   }

//   const content = data.choices[0].message.content;
//   console.log(content);
//   const prompts = content
//     .split("\n")
//     .map((line) => {
//       let trimmed = line.trim();
//       trimmed = trimmed.replace(/^Scene\s*\d+:\s*/i, "");
//       trimmed = trimmed.replace(/^\d+\.\s*/, "");
//       return trimmed;
//     })
//     .filter((line) => line.length > 0);

//   return prompts;
// }

export async function generateStoryfromMoralLLM(
  kidName: string,
  age: number,
  gender: string,
  pronoun: string,
  moral: string,
  storyRhyming: boolean,
  kidInterests: string[],
  storyThemes: string[],
  characters?: string[],
  character_descriptions?: string[],
): Promise<string[]> {
  // Determine the type of scene format based on the storyRhyming flag.
  const promptFormat = storyRhyming
    ? "rhyming 4 line stanzas"
    : "non rhyming paragraphs";

  // Construct the prompt. Instruct the model to output a valid JSON array of exactly 9 objects.
  // Each object must have a "number" key (scene number) and a "scene" key (text content).
  const storyInputs = {
    kidName,
    pronoun: "he",
    age,
    moral,
    kidinterests: kidInterests[0],
    storyThemes: storyThemes[0],
    storyRhyming, // The value is a string, but the prompt logic will interpret it.
    character1: characters[0],
    character1_description: character_descriptions[0],
  };
  const systemFullPrompt = injectVariables(STORY_SYSTEM_PROMPT, storyInputs);
  console.log(systemFullPrompt);

  //   const llmPrompt = `Generate a valid JSON array containing exactly 9 objects.
  // Each object should have the following keys:
  //   - "number": an integer from 1 to 9 indicating the scene number.
  //   - "scene": a string which is ${promptFormat} for a story where the hero is named "${kidName}",
  //     based on the storyline, with a theme of.
  // The story should clearly convey the moral: "${moral}" and be suitable for a ${age} year old ${gender}.
  // Output only the JSON array with no extra text or commentary.`;

  var llmPrompt = "";

  if (characters && character_descriptions) {
    llmPrompt = `
      You are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a 9-scene story blueprint featuring a main character and a side character.
    
      **INPUTS FOR THIS STORY:**
      *   **kidName:** "\`${kidName}\`"
      *   **pronoun:** "\`${pronoun}\`"
      *   **age:** \`${age}\`
      *   **moral:** "\`${moral}\`"
      *   **kidInterest:** "\`${kidInterests[0]}\`"
      *   **storyTheme:** "\`${storyThemes[0]}\`"
      *   **character1 (Side Character Name):** "\`${characters[0]}\`"
      *   **character1_description (Side Character Description):** "\`${character_descriptions[0]}\`"
      *   **storyRhyming:** "\`${storyRhyming}\`"
    
      **TASK:**
        Produce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each scene, strictly following the 14-field \`scene_description\` structure and the \`scene_text\` guidelines outlined in the System Prompt.
      
        Do not write any other text, explanation, or introduction. Your entire output must be only the raw JSON array.
        `;
  } else {
    llmPrompt = `
      You are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a 9-scene story blueprint.

      **INPUTS FOR THIS STORY:**
      *   **kidName:** "\`${kidName}\`"
      *   **pronoun:** "\`${pronoun}\`"
      *   **age:** \`${age}\`
      *   **moral:** "${moral}"
      *   **kidInterest:** "${kidInterests[0]}"
      *   **storyTheme:** "${storyThemes[0]}"
      *   **storyRhyming:** \`${storyRhyming}\`

      **TASK:**
      Produce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each scene, strictly following the 13-field \`scene_description\` structure and the \`scene_text\` guidelines outlined in the System Prompt.

      Do not write any other text, explanation, or introduction. Your entire output must be only the raw JSON array.
    `;
  }

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
        { role: "system", content: systemFullPrompt },
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
Age : ${age}
Gender : ${gender}
Scenes:
${formattedScenes}
__________________`,
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
  prompt: string,
  kontext: boolean = true,
) {
  const adjustedPrompt = prompt
    .trim()
    .replace(/^["'“”]+/, "")
    .replace(/["'“er�]+$/, "")
    .replace(/["'“”]/g, "");

  const cleanPrompt = adjustedPrompt.startsWith("<")
    ? adjustedPrompt
    : adjustedPrompt.charAt(0).toLowerCase() + adjustedPrompt.slice(1);

  let fullPrompt = "";
  const style = stylePreference.split("-").pop();

  switch (style) {
    case "pixar":
      fullPrompt = `
        Pixar-style 3D rendered illustration with ultra-detailed textures, cinematic lighting, joyful emotions ${cleanPrompt}`;
      break;

    case "handdrawn":
      fullPrompt = `
      detailed hand-drawn illustration with warm gentle colors, fine pencil outlines, storybook charm ${cleanPrompt}`;
      break;

    case "watercolor":
      fullPrompt = `
        whimsical watercolor illustratio with pastel color palette, smooth gradients, textured paper background, ${cleanPrompt}`;
      break;

    case "claymotion":
      fullPrompt = `
          claymation-style detailed scene with realistic handmade clay textures, tactile appearance, ${cleanPrompt}`;
      break;

    case "crayonart":
      fullPrompt = `
          bright, playful crayon-style drawing with vivid bold colors, childlike rough textures, ${cleanPrompt}`;
      break;

    case "pastelsketch":
      fullPrompt = `
          gentle pastel sketch with soft smudged textures, calming color tones, soothing, artistic sketch quality, ${cleanPrompt}`;
      break;

    default:
      // Fallback or handle unknown style
      fullPrompt = `
      Pixar-style 3D rendered illustration with ultra-detailed textures, cinematic lighting, joyful emotions ${cleanPrompt}`;
      break;
  }

  if (kontext) {
    fullPrompt = "Make this a " + fullPrompt;
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
 * Step 1: Generate a single avatar image as soon as the LoRA model is ready.
 */
export async function generateAvatarImage(
  modelId: string,
  kidName: string,
  age: number,
  gender: string,
  stylePreference: string,
): Promise<{ avatarUrl: string; avatarLora: number }> {
  if (DEBUG_LOGGING) {
    console.log(
      "[generateAvatarImage] Generating avatar for",
      kidName,
      "using model",
      modelId,
    );
  }

  const seed = 3.0;
  // Choose a friendly default starting LoRA scale
  const avatarLora =
    stylePreference === "predefined"
      ? 0.9
      : stylePreference.startsWith("hyper")
        ? 0.8
        : 0.7;
  const prompt = `photo of ${age}-year-old ${gender} kid <${kidName}kidName> with full body visible, white background`;

  const stylePrompt = buildFullPrompt(stylePreference, prompt, false);

  // Uses the same low-latency endpoint you already have
  const avatarUrl = await generateImage(
    stylePrompt,
    modelId,
    avatarLora,
    seed,
    512,
    512,
  );
  return { avatarUrl, avatarLora };
  // return { avatarUrl: dummyAvatarUrl, avatarLora: 0.8 };
}

/**
 * Step 2: In parallel, call GPT-4 to get the scene texts and
 * a matched list of image-generation prompts.
 */
export async function generateSceneData(
  jobId: string,
  kidName: string,
  age: number,
  gender: string,
  moral: string,
  storyRhyming: boolean,
  kidinterests: string[],
  storyTheme: string,
  characters?: string[],
): Promise<{ sceneTexts: string[]; imagePrompts: string[] }> {
  if (DEBUG_LOGGING) {
    console.log(
      "[generateSceneData] Generating scene texts & prompts for",
      kidName,
    );
  }

  jobTracker.set(jobId, {
    phase: "prompting",
    pct: 10,
    message: "Generating scene texts…",
  });

  // 1) Nine scene descriptions
  const sceneTexts = await generateStoryfromMoralLLM(
    kidName,
    age,
    gender,
    "he",
    moral,
    storyRhyming,
    kidinterests,
    [storyTheme],
    characters,
  );

  jobTracker.set(jobId, {
    phase: "prompting",
    pct: 50,
    message: "Scene texts ready",
  });

  jobTracker.set(jobId, {
    phase: "prompting",
    pct: 60,
    message: "Generating image prompts…",
  });

  // 2) Nine image prompts that match those scenes
  // const imagePrompts = await createImagePromptsFromScenes(
  //   kidName,
  //   age,
  //   gender,
  //   sceneTexts,
  //   baseStoryPrompt,
  //   moral,
  //   storyRhyming,
  //   storyTheme,
  // );

  jobTracker.set(jobId, {
    phase: "prompting",
    pct: 80,
    message: "Image prompts ready",
  });

  return { sceneTexts, imagePrompts };
  // return {
  //   sceneTexts: dummyPages.map((p) => p.content),
  //   imagePrompts: dummyPages.map((p) => p.prompt),
  // };
}

/**
 * Step 3: The heavy-lifting batch of 9+2 images, using the final avatar.
 * This is essentially your existing generateStoryImages() logic,
 * minus the GPT-4 steps (they’re now inputs).
 */
export async function generateStoryImagesWithAvatar(
  jobId: string,
  modelId: string,
  kidName: string,
  sceneTexts: string[],
  imagePrompts: string[],
  title: string,
  age: number,
  gender: string,
  stylePreference: string,
  avatarUrl: string,
  avatarLora: number,
  seed: number,
): Promise<{
  pages: Array<{
    imageUrl: string;
    prompt: string;
    content: string;
    loraScale: number;
    controlLoraStrength: number;
  }>;
  coverUrl: string;
  backCoverUrl: string;
  avatarUrl: string;
  avatarLora: number;
}> {
  if (DEBUG_LOGGING) {
    console.log(
      "[generateStoryImagesWithAvatar] Starting image batch for",
      kidName,
      "jobId",
      jobId,
    );
  }

  // 1) Kick off the main image generation phase
  jobTracker.set(jobId, {
    phase: "generating",
    pct: 75,
    message: "Generating story images…",
  });

  const controlLoraStrength = 0.5;

  const totalImages = imagePrompts.length + 2; // 9 scenes + cover + back cover
  let done = 0;

  // 2) Generate the 9 interior images in parallel
  const pages = await Promise.all(
    imagePrompts.map(async (promptText, idx) => {
      const fullPrompt = buildFullPrompt(stylePreference, promptText);
      const imageUrl = await generateGuidedImage(
        fullPrompt,
        avatarUrl,
        modelId,
        gender,
        avatarLora,
        seed,
        controlLoraStrength,
        1024,
        512,
      );

      done += 1;
      jobTracker.set(jobId, {
        phase: "generating",
        pct: 75 + (done / totalImages) * 20,
        message: `Generated image ${done}/${totalImages}`,
      });

      return {
        imageUrl,
        prompt: promptText,
        content: sceneTexts[idx],
        loraScale: avatarLora,
        controlLoraStrength,
      };
    }),
  );

  // 3) Generate the cover
  jobTracker.set(jobId, {
    phase: "generating",
    pct: 95,
    message: "Generating cover image…",
  });

  // const coverPrompt = `A captivating front cover photo for "${title}" featuring <${kidName}kidName> as hero, with the title text "${title}" in bold colorful font.`;
  const coverPrompt = `where this kid is featured on the cover of a kids story book with a captivating front cover photo; face and shoulders only visible; zoomed in one face; with the title text "${title}" visible in bold colorful font`;
  const coverFullPrompt = buildFullPrompt(stylePreference, coverPrompt);
  const coverUrl = await generateGuidedImage(
    coverFullPrompt,
    avatarUrl,
    modelId,
    gender,
    avatarLora,
    seed,
    controlLoraStrength,
    512,
    512,
  );

  // 4) Generate the back-cover
  jobTracker.set(jobId, {
    phase: "generating",
    pct: 98,
    message: "Generating back cover image…",
  });

  const backCoverFileName = `books/backCover/${kidName}_${title.replace(
    /\s+/g,
    "_",
  )}.png`;

  const backCoverUrl = await generateBackCoverImage(
    coverUrl,
    backCoverFileName,
  );

  // 5) Done!
  jobTracker.set(jobId, {
    phase: "complete",
    pct: 100,
    pages,
    coverUrl,
    backCoverUrl,
    avatarUrl,
    avatarLora,
  });

  return { pages, coverUrl, backCoverUrl, avatarUrl, avatarLora };

  // jobTracker.set(jobId, {
  //   phase: "complete",
  //   pct: 100,
  //   pages,
  //   coverUrl,
  //   backCoverUrl,
  //   avatarUrl,
  //   avatarLora,
  // });

  // return {
  //   pages,
  //   coverUrl: dummyCoverUrl,
  //   backCoverUrl: dummyBackCoverUrl,
  //   avatarUrl,
  //   avatarLora,
  // };
}

export async function cartoonifyImage(imageUrl: string): Promise<string> {
  // const result = await fal.subscribe("fal-ai/image-editing/cartoonify", {
  //   input: { image_url: imageUrl },
  // });

  if (TEST_MODE) {
    return "https://v3.fal.media/files/penguin/D9g2chjiCZrFkDps_y9Zd.png"; // dummy cartoonified image
  } else {
    const result = await fal.subscribe("fal-ai/instant-character", {
      input: {
        prompt:
          "Pixar style 3D high-resolution character of a young kid, based on the reference photo. Full body shot, character is standing straight and erect, symmetrical pose, looking directly at the camera. Retain the exact hair color, skin tone, and facial features from the photo. Plain white background. CRITICAL: the image should be high resolution.",
        image_url: imageUrl,
        image_size: "square_hd",
        scale: 0.9,
        negative_prompt:
          "blurry, low-resolution, pixelated, photorealistic, hyper-real pores, harsh skin texture, fine wrinkles",
        guidance_scale: 5,
        num_inference_steps: 40,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "png",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (result.data && result.data.images && result.data.images.length > 0) {
      return result.data.images[0].url;
    } else {
      throw new Error("No image returned from toonify generation");
    }
  }

  // await new Promise((resolve) => setTimeout(resolve, 15000));

  // return "https://fal.media/files/penguin/o04oxJ3NOF4DRPj2XRmcY_1101dde24df64ec09b350ba30d3b2d1f.jpg";
}

export interface StoryPipelineInput {
  kidName: string;
  pronoun: string; // “he/him”, “she/her”, “they/them”, …
  age: number;
  moral: string;
  storyRhyming: boolean;
  kidInterests: string[]; // at least one
  storyThemes: string[]; // at least one
  characters: string[]; // side-characters, optional
  characterDescriptions: string[]; // parallel array
  characterImageMap: Record<string, string>; // name -> reference img
  stylePreference?: string; // optional – if you want hand-drawn ⇢ etc.
}

export interface StoryPackage {
  scenes: Scene[]; // the full structured objects (texts included)
  images: string[]; // scene 1-9 image URLs (index-aligned)
}

export async function generateStoryPackage(
  input: StoryPipelineInput,
  jobId?: string, // ⬅ pass a fresh jobId if you want UI progress
): Promise<StoryPackage> {
  const {
    kidName,
    pronoun,
    age,
    moral,
    storyRhyming,
    kidInterests,
    storyThemes,
    characters,
    characterDescriptions,
    characterImageMap,
  } = input;

  /*─────────────────── GPT-4 / o4-mini : scene + text ───────────────────*/

  if (jobId)
    jobTracker.set(jobId, {
      phase: "prompting",
      pct: 0,
      message: "Generating story outline…",
    });

  const storyScenes: Scene[] = await generateStoryScenesFromInputs(
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
    },
    jobId
      ? (phase, pct, message) => jobTracker.set(jobId, { phase, pct, message })
      : undefined,
  );

  if (jobId)
    jobTracker.set(jobId, {
      phase: "prompting",
      pct: 50,
      message: "Story outline ready",
    });

  /*─────────────────── Image generation per scene ───────────────────*/

  const generatedImages: string[] = [];
  let previousImageUrl: string | null = null;

  const total = storyScenes.length;
  let done = 0;

  for (const scene of storyScenes) {
    const img = await generateImageForScene(
      scene,
      previousImageUrl,
      characterImageMap,
      jobId
        ? (phase, pct, message) =>
            jobTracker.set(jobId, {
              phase,
              pct: 50 + (pct / 100) * 50,
              message,
            })
        : undefined,
    );
    await new Promise((res) => setTimeout(res, 10000));

    generatedImages.push(img);
    previousImageUrl = img;

    done += 1;
    if (jobId) {
      jobTracker.set(jobId, {
        phase: "generating",
        pct: 50 + (done / total) * 50,
        message: `Rendered image ${done}/${total}`,
      });
    }
  }

  const pages = storyScenes.map((scene, i) => ({
    id: i + 1,
    imageUrl: generatedImages[i],
    prompt: scene.scene_description.Focal_Action,
    content: scene.scene_text,
    loraScale: 1,
    controlLoraStrength: 0.5,
  }));

  const coverUrl = pages[0].imageUrl;
  const backCoverUrl = pages[pages.length - 1].imageUrl;

  if (jobId)
    jobTracker.set(jobId, {
      phase: "complete",
      pct: 100,
      pages,
      coverUrl,
      backCoverUrl,
    });

  return { pages, coverUrl, backCoverUrl };
}

const img =
  "https://fal.media/files/lion/40gW0lutCfGgdJhWLfm4q_1d65e0a733d6486993d346811ed817bf.jpg";
