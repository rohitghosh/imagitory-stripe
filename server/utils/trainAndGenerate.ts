// server/utils/trainAndGenerate.ts
import fetch from "node-fetch";
import { fal } from "@fal-ai/client";
import archiver from "archiver";
import { WritableStreamBuffer } from "stream-buffers";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { URL } from "url";
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
  modelName: string,
): Promise<{ modelId: string; requestId: string }> {
  if (imageUrls.length !== captions.length) {
    throw new Error("Number of image URLs and captions must match.");
  }

  // // Create a zip buffer from the provided image URLs.
  // if (DEBUG_LOGGING)
  //   console.log("[trainCustomModel] Creating zip from image URLs...");
  // const zipBuffer = await createZipBuffer(imageUrls);

  // // Upload the zip file to Firebase Storage.
  // const bucket = getStorage().bucket();
  // const zipFilename = `${uuidv4()}.zip`;
  // const fileUpload = bucket.file(zipFilename);
  // await fileUpload.save(zipBuffer, {
  //   metadata: {
  //     contentType: "application/zip",
  //   },
  // });
  // const zipUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
  //   zipFilename,
  // )}?alt=media`;
  // if (DEBUG_LOGGING) {
  //   console.log("[trainCustomModel] Zip uploaded. Public URL:", zipUrl);
  // }

  // // Build the payload per fal.ai API; note that image_urls is now a single string (zipUrl)
  // const input = {
  //   images_data_url: zipUrl, // Pass the zip file URL
  //   captions, // Still pass the captions array as required (if API expects it)
  //   custom_token: "<kidStyle>",
  //   model_name: modelName,
  //   fast_training: true,
  //   steps: 5,
  //   create_masks: true,
  // };
  // if (DEBUG_LOGGING) {
  //   console.log(
  //     "[trainCustomModel] Training input payload:",
  //     JSON.stringify(input, null, 2),
  //   );
  // }

  // const result = await fal.subscribe("fal-ai/flux-lora-fast-training", {
  //   input,
  //   logs: true,
  //   onQueueUpdate: (update) => {
  //     if (DEBUG_LOGGING && update.status === "IN_PROGRESS") {
  //       update.logs
  //         .map((log) => log.message)
  //         .forEach((msg) =>
  //           console.log("[trainCustomModel] Queue update:", msg),
  //         );
  //     }
  //   },
  // });

  // if (DEBUG_LOGGING) {
  //   console.log("[trainCustomModel] Training result data:", result.data);
  //   console.log("[trainCustomModel] Request ID:", result.requestId);
  // }

  // // Assume result.data contains the modelId.
  // return {
  //   modelId: result.data.diffusers_lora_file.url,
  //   requestId: result.requestId,
  // };
  await new Promise((resolve) => setTimeout(resolve, 10000));
  return {
    modelId:
      "https://v3.fal.media/files/rabbit/Q2UqOqEdJzLM1dZfJuBsV_pytorch_lora_weights.safetensors",
    requestId: "66115f6e-7f18-459a-abbb-184253c769e8",
  };
}

/**
 * Generate a single image using fal.ai and the custom-trained model.
 */

export async function generateImage(
  prompt: string,
  modelId: string,
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
        scale: 1,
      },
    ],
    prompt, // The generation prompt.
    embeddings: [], // No extra embeddings.
    model_name: null, // As required.
    enable_safety_checker: true,
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
  const llmPrompt = `Generate a numbered list of 10 creative, one-sentence scene descriptions for a story about ${kidName} based on this prompt: "${basePrompt}". The story should clearly convey the moral: "${moral}".`;
  if (DEBUG_LOGGING) {
    console.log("[generateScenePromptsLLM] LLM Prompt:", llmPrompt);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a creative assistant that helps generate engaging scene descriptions for children's stories.",
        },
        { role: "user", content: llmPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
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
  // Split the text into individual scene prompts. Adjust the splitting logic if needed.
  const scenes = content
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
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
  //   const scenePrompts = await generateScenePromptsLLM(
  //     kidName,
  //     baseStoryPrompt,
  //     moral,
  //   );
  //   if (scenePrompts.length < 10) {
  //     throw new Error("LLM did not return enough scene prompts.");
  //   }
  //   if (DEBUG_LOGGING)
  //     console.log("[generateStoryImages] Final scene prompts:", scenePrompts);
  //   const imagePromises = scenePrompts.map(async (scene) => {
  //     const fullPrompt = createImagePrompt(scene);
  //     return await generateImage(fullPrompt, modelId);
  //   });
  //   const images = await Promise.all(imagePromises);
  //   if (DEBUG_LOGGING)
  //     console.log("[generateStoryImages] Generated images:", images);
  //   return { images, sceneTexts: scenePrompts };
  const images = [
    "https://v3.fal.media/files/lion/BYulTnmCMtjoCWVxUo7xT_e6e032ba64ec4b39b11ce0449a6b7349.jpg",
    "https://v3.fal.media/files/tiger/J5lzVpM_BqVbIhbUz2Hne_fe22e58aff3d4162af677c24bcd9bf1d.jpg",
    "https://v3.fal.media/files/tiger/j9MS5iglRS18iSq98pG4g_d7187c2696b54619a7afa8e8f5547325.jpg",
    "https://v3.fal.media/files/koala/wLuAkk35LqRsr3nh5J_KA_1b586234ad7142f097bcfe0f5f178ac5.jpg",
    "https://v3.fal.media/files/lion/NBazttn8soarZVbGiTv_x_04fe3fa5b55843fb803014c40d26fe36.jpg",
    "https://v3.fal.media/files/lion/X96gJElSTzsHbXLmULxCL_3702e907195e488092ce080a268cdcb5.jpg",
    "https://v3.fal.media/files/lion/aDjdirA6IgoHqcIriUbZQ_aad543a4bd78401fb2ada69bb5decae6.jpg",
    "https://v3.fal.media/files/kangaroo/-G8vLjMeKkosA1KoAfgAN_e114abaa9b1e43ccbcc62771f2c8a8da.jpg",
    "https://v3.fal.media/files/tiger/8cqtxgKY_pEr7N--wddiH_d44b2b548ba84d049d6280e9367d970c.jpg",
    "https://v3.fal.media/files/penguin/7kHX_XxdYG8-qi94ChSyg_74127af0e7ee4e97ad8d80fbb556a5bf.jpg",
  ];
  const sceneTexts = [
    "1. As Adventure Alex entered the village, he spotted a dragon with colorful scales and a big smile, eagerly greeting everyone.",
    "2. The dragon, named Spark, playfully chased after children, blowing bubbles from his nostrils as they giggled and ran around him.",
    "3. Despite their initial fear, the villagers soon realized that Spark was gentle and kind, just looking for companionship.",
    "4. Spark led Adventure Alex to a hidden cave filled with sparkling crystals, where he liked to spend his time painting colorful murals on the walls.",
    "5. Curious village cats and dogs approached Spark tentatively, only to end up curling around his massive paws, enjoying his warmth.",
    "6. One day, a mischievous goblin tried to stir up trouble by spreading rumors about Spark being a dangerous monster, but the villagers defended their new friend.",
    "7. Adventure Alex and Spark went on a quest together, traversing lush forests and crossing bubbling streams, forming an unbreakable bond along the way.",
    "8. When a sudden storm hit the village, it was Spark who shielded the villagers with his massive wings, proving his loyalty and bravery.",
    "9. As the sun set on the horizon, the villagers gathered around a bonfire, sharing stories and laughter with Spark, grateful for the lesson they had learned.",
    "10. The next time a stranger arrived in the village, the villagers welcomed them with open arms, remembering not to judge by appearances but to seek the kindness within.",
  ];
  return { images, sceneTexts };
}
