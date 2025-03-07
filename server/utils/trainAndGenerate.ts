// server/utils/trainAndGenerate.ts
import fetch from "node-fetch";
import { fal } from "@fal-ai/client";
import archiver from "archiver";
import { WritableStreamBuffer } from "stream-buffers";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";

/**
 * Helper: Given an array of image URLs, downloads each image,
 * creates a zip archive in memory, and returns a Buffer for that zip.
 */
async function createZipBuffer(imageUrls: string[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const bufferStream = new WritableStreamBuffer({
      initialSize: 100 * 1024, // start at 100KB
      incrementAmount: 10 * 1024, // grow by 10KB increments
    });

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
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
function getExtension(url: string): string {
  const parts = url.split(".");
  if (parts.length === 0) return "";
  let ext = parts.pop() || "";
  if (ext.indexOf("?") !== -1) {
    ext = ext.split("?")[0];
  }
  return "." + ext;
}

/**
 * Initiate Flux/LoRA training using the official fal.ai client API.
 * Now accepts an array of image URLs (which we will zip) and captions.
 * Returns a jobId (and eventually modelId).
 */
export async function trainCustomModel(
  imageUrls: string[],
  captions: string[],
  modelName: string,
): Promise<{ modelId: string; requestId: string }> {
  if (imageUrls.length !== captions.length) {
    throw new Error("Number of image URLs and captions must match.");
  }

  // Create a zip buffer from the provided image URLs.
  if (DEBUG_LOGGING)
    console.log("[trainCustomModel] Creating zip from image URLs...");
  const zipBuffer = await createZipBuffer(imageUrls);

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
    image_urls: zipUrl, // Pass the zip file URL
    captions, // Still pass the captions array as required (if API expects it)
    custom_token: "<kidStyle>",
    model_name: modelName,
    fast_training: true,
    steps: 5,
    create_masks: true,
  };
  if (DEBUG_LOGGING) {
    console.log(
      "[trainCustomModel] Training input payload:",
      JSON.stringify(input, null, 2),
    );
  }

  const result = await fal.subscribe("fal-ai/flux-lora-fast-training", {
    input,
    logs: true,
    onQueueUpdate: (update) => {
      if (DEBUG_LOGGING && update.status === "IN_PROGRESS") {
        update.logs
          .map((log) => log.message)
          .forEach((msg) =>
            console.log("[trainCustomModel] Queue update:", msg),
          );
      }
    },
  });

  if (DEBUG_LOGGING) {
    console.log("[trainCustomModel] Training result data:", result.data);
    console.log("[trainCustomModel] Request ID:", result.requestId);
  }

  // Assume result.data contains the modelId.
  return { modelId: result.data.modelId, requestId: result.requestId };
}

/**
 * Generate a single image using fal.ai and the custom-trained model.
 */
export async function generateImage(
  prompt: string,
  modelId: string,
): Promise<string> {
  if (DEBUG_LOGGING)
    console.log(
      "[generateImage] Generating image with prompt:",
      prompt,
      "using modelId:",
      modelId,
    );
  const response = await fetch("https://api.fal.ai/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FALAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      model: modelId,
      num_inference_steps: 50,
      guidance_scale: 7.5,
    }),
  });
  const data = await response.json();
  if (DEBUG_LOGGING) {
    console.log("[generateImage] Fal.ai generate response:", data);
  }
  return data.imageUrl;
}

/**
 * Generate scene prompts using an LLM.
 * The prompt incorporates the kid's name, a base story prompt, and the story moral.
 */
export async function generateScenePromptsLLM(
  kidName: string,
  basePrompt: string,
  moral: string,
): Promise<string[]> {
  const llmPrompt = `Generate a list of 10 creative, one-sentence scene descriptions for a story about ${kidName} based on this prompt: "${basePrompt}". The story should clearly convey the moral: "${moral}".`;
  if (DEBUG_LOGGING)
    console.log("[generateScenePromptsLLM] LLM Prompt:", llmPrompt);
  const response = await fetch(
    "https://api.openai.com/v1/engines/text-davinci-003/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: llmPrompt,
        max_tokens: 500,
        n: 1,
        temperature: 0.7,
      }),
    },
  );
  const data = await response.json();
  if (DEBUG_LOGGING) {
    console.log("[generateScenePromptsLLM] OpenAI response:", data);
  }
  const scenes = data.choices[0].text
    .split("\n")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
  if (DEBUG_LOGGING) {
    console.log("[generateScenePromptsLLM] Generated scene prompts:", scenes);
  }
  return scenes;
}

/**
 * Augment a scene description with your custom token.
 */
export function createImagePrompt(sceneDescription: string): string {
  return `<kidStyle> A high-quality, cinematic illustration of ${sceneDescription}`;
}

/**
 * Generate story images using the custom model.
 * It first generates scene prompts using the LLM (incorporating base prompt and moral)
 * and then generates an image for each prompt.
 */
export async function generateStoryImages(
  modelId: string,
  kidName: string,
  baseStoryPrompt: string,
  moral: string,
): Promise<{ images: string[]; sceneTexts: string[] }> {
  if (DEBUG_LOGGING) {
    console.log("[generateStoryImages] Starting story generation for:", {
      kidName,
      baseStoryPrompt,
      moral,
    });
  }
  const scenePrompts = await generateScenePromptsLLM(
    kidName,
    baseStoryPrompt,
    moral,
  );
  if (scenePrompts.length < 10) {
    throw new Error("LLM did not return enough scene prompts.");
  }
  if (DEBUG_LOGGING)
    console.log("[generateStoryImages] Final scene prompts:", scenePrompts);
  const imagePromises = scenePrompts.map(async (scene) => {
    const fullPrompt = createImagePrompt(scene);
    return await generateImage(fullPrompt, modelId);
  });
  const images = await Promise.all(imagePromises);
  if (DEBUG_LOGGING)
    console.log("[generateStoryImages] Generated images:", images);
  return { images, sceneTexts: scenePrompts };
}
