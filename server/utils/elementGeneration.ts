// elementGeneration.ts

import axios from "axios";
import FormData from "form-data";
import { fal } from "@fal-ai/client";
import { getImageDataURL } from "./imageUtils";
import { createCanvas, loadImage, Canvas, Image } from "canvas";

const TEST_MODE = process.env.TEST_MODE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_API_URL = "https://api.openai.com/v1/chat/completions";

async function urlToDataUri(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch(${url}) -> ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const mime = r.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * Generates three image prompts via GPT-4-turbo (chat API).
 * Each line should be a visual description:
 * - Two square illustrations
 * - One wide cinematic
 */
export async function buildThreePromptsViaGPT(
  pageContent: string,
  context?: { previousPageText?: string; nextPageText?: string },
): Promise<string[]> {
  const systemPrompt = `
  You are an AI that specializes in generating short, imaginative prompts
  for DALL·E. The user will provide the text/story for one page.
  You must produce exactly one short words describing a natural element that can be used standalone to decorate the text along with it. An element could look like an object from surroundings like  bird, an animal, book etc but it has to be a singular item. Elements can not a group of birds etc. Elements can not be panoramic or non-subject items that need multiple items to represent them like sky, galaxy, towns, jungle, sky map. Elements can't also be a person or similar. Specifically each element has to make sense to kids up to 7 years of age and can be rendered in cartoon like format. Ideally it should not be something that is man made but preferably something found in nature. Keep description of each element simple and in 1-2 words like "rocket", "tree", "hill", "spaceship", "flower", "ice cubes"  etc.. 
  `;

  let userPrompt = `**Page Text**: "${pageContent}"\n\n`;
  if (context?.previousPageText) {
    userPrompt += `**Previous Page**: "${context.previousPageText}"\n`;
  }
  if (context?.nextPageText) {
    userPrompt += `**Next Page**: "${context.nextPageText}"\n`;
  }
  userPrompt += `\nProvide exactly the name of the element. No extra text or numbering.\n`;

  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1.0,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Chat API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content?.trim() || "";

  const lines = rawText
    .split("\n")
    .map((s) => s.replace(/^(\d+\)|[-*])/, "").trim())
    .filter(Boolean);

  while (lines.length < 3) {
    lines.push("Fallback prompt");
  }

  // const prompts = [
  //   "1. A twinkling star in the night sky.",
  //   "2. A small, picturesque rolling hill.",
  //   "3. A group of far-off galaxies.",
  // ];
  // console.log("Generated prompts:", prompts);
  // return prompts;

  console.log("Generated prompts:", lines.slice(0, 1));
  return lines.slice(0, 1);
}

/**
 * Generate 3 images from prompts via OpenAI image generation (DALL·E 3).
 * Returns URLs to generated images.
 */
export async function generateImagesForPage(pageContent: string) {
  const prompts = await buildThreePromptsViaGPT(pageContent);
  const imageUrls: string[] = [];
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const size =
      i === 2
        ? {
            width: 512,
            height: 256,
          }
        : {
            width: 512,
            height: 512,
          };
    const shadow = i === 2 ? "with minimal shadow" : "";
    const orientation = i === 2 ? "horizontal" : "vertical";
    const finalprompt = `Gentle, pastel-colored cartoon isolated image of a ${prompt} with white background, minimal style, with shadow, watercolour style`;

    const payload = {
      prompt: finalprompt,
      image_size: size,
      num_images: 1,
      num_inference_steps: 4,
      enable_safety_checker: true,
      seed: 3,
    };

    console.log(
      "[generateCartoonIsolatedImage] Payload:",
      JSON.stringify(payload, null, 2),
    );

    // Subscribe to the "fal-ai/flux/schnell" model with logs for progress updates
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: payload,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) =>
            console.log(
              "[generateCartoonIsolatedImage] Queue update:",
              log.message,
            ),
          );
        }
      },
    });

    if (result.data && result.data.images && result.data.images.length > 0) {
      const url =
        result.data.images[0].url ||
        "https://v3.fal.media/files/lion/BYulTnmCMtjoCWVxUo7xT_e6e032ba64ec4b39b11ce0449a6b7349.jpg";
      imageUrls.push(url);
    }
  }

  // const imageUrls = [
  //   "https://v3.fal.media/files/kangaroo/Nr73IYEbRexwf1wyimxbM_0149071e6fbf48398f4a550600728e9f.jpg",
  //   "https://v3.fal.media/files/kangaroo/Nr73IYEbRexwf1wyimxbM_0149071e6fbf48398f4a550600728e9f.jpg",
  //   "https://v3.fal.media/files/kangaroo/Nr73IYEbRexwf1wyimxbM_0149071e6fbf48398f4a550600728e9f.jpg",
  // ];

  console.log("Generated image URLs:", imageUrls);
  return imageUrls;
}

// export async function removeBackgroundFromImage(
//   imageString: string,
// ): Promise<string> {
//   let imageBytes: Buffer;

//   if (imageString.startsWith("data:")) {
//     // Data URL format: "data:image/jpeg;base64,..."
//     const base64Data = imageString.split(",")[1];
//     imageBytes = Buffer.from(base64Data, "base64");
//   } else {
//     // Otherwise, assume it's a remote URL
//     const response = await axios.get<ArrayBuffer>(imageString, {
//       responseType: "arraybuffer",
//     });
//     imageBytes = Buffer.from(response.data);
//   }

//   // 2) Build a multipart form with "image_file"
//   const form = new FormData();
//   form.append("image_file", imageBytes, "image.jpg");

//   // 3) Post to PhotoRoom’s remove-background endpoint
//   const uploadResponse = await axios.post<ArrayBuffer>(
//     "https://sdk.photoroom.com/v1/segment",
//     form,
//     {
//       headers: {
//         "x-api-key": process.env.PHOTOROOM_API_KEY || "",
//         ...form.getHeaders(),
//       },
//       responseType: "arraybuffer", // we'll receive the final image bytes
//     },
//   );

//   // 4) Convert the returned image (with background removed) to base64
//   // If you want a file buffer, just return "uploadResponse.data"
//   const removedBgBuffer = Buffer.from(uploadResponse.data);
//   const base64 = removedBgBuffer.toString("base64");

//   // Return a data URL for convenience in jsPDF or HTML <img> usage
//   return `data:image/png;base64,${base64}`;
// }

/**
 * Fills the `imageVariants` field of a page object with squares and wide image URLs.
 */

export async function preparePageWithImages(page: any) {
  const [sq1, sq2, wide] = await generateImagesForPage(page.content);
  // const sq1NoBG = await removeBackgroundFromImage(sq1);
  // const sq2NoBG = await removeBackgroundFromImage(sq2);
  // const wideNoBG = await removeBackgroundFromImage(wide);

  const imgNoBG = await getImageDataURL(sq1);
  // const sq2NoBG = await getImageDataURL(sq2);
  // const wideNoBG = await getImageDataURL(wide);

  // page.imageVariants = {
  //   squares: [sq1NoBG, sq2NoBG],
  //   wide: wideNoBG,
  // };

  page.imageVariants = {
    squares: ["", ""],
    wide: imgNoBG,
  };
  return page;
}

export async function expandImageToLeft(imageUrl) {
  // Load the original image to get its dimensions
  // const img = await loadImage(imageUrl);
  console.log(`[expandImageLeft] Image URL: ${imageUrl}`);
  const resolved = imageUrl.startsWith("data:")
    ? imageUrl
    : await urlToDataUri(imageUrl);
  const img = await loadImage(resolved);

  const originalWidth = img.width;
  const originalHeight = img.height;

  // Set the new canvas size to double the original width
  const newCanvasWidth = originalWidth * 2;
  const newCanvasHeight = originalHeight;

  // Set the position of the original image in the new canvas
  const originalImageLocation = [originalWidth, 0];

  // Call the Bria Expand API
  // const result = await fal.subscribe("fal-ai/bria/expand", {
  //   input: {
  //     image_url: imageUrl,
  //     canvas_size: [newCanvasWidth, newCanvasHeight],
  //     original_image_size: [originalWidth, originalHeight],
  //     original_image_location: originalImageLocation,
  //   },
  //   logs: true,
  //   onQueueUpdate: (update) => {
  //     if (update.status === "IN_PROGRESS" && update.logs) {
  //       update.logs.forEach((log) =>
  //         console.log("[ExpandImageLeft] Queue update:", log.message),
  //       );
  //     }
  //   },
  // });

  // // Return the expanded image as a data URL
  // if (result.data && result.data.image) {
  //   const url = result.data.image.url;
  //   console.log("Extended image URL:", url);
  //   return url;
  // } else {
  //   console.log("[expandImageLeft] Error observed with  ", result.data);
  // }

  if (TEST_MODE) {
    const url =
      "https://v3.fal.media/files/lion/RGNgroBRmshN7ed-_PQc__962ba9c27d2747448e02225d821531df.png";
    return url;
  } else {
    const result = await fal.subscribe("fal-ai/bria/expand", {
      input: {
        image_url: imageUrl,
        canvas_size: [newCanvasWidth, newCanvasHeight],
        original_image_size: [originalWidth, originalHeight],
        original_image_location: originalImageLocation,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) =>
            console.log("[ExpandImageLeft] Queue update:", log.message),
          );
        }
      },
    });

    // Return the expanded image as a data URL
    if (result.data && result.data.image) {
      const url = result.data.image.url;
      console.log("Extended image URL:", url);
      return url;
    } else {
      console.log("[expandImageleft] Error observed with  ", result.data);
    }
  }
  // const url =
  //   "https://v3.fal.media/files/koala/ygHkTig3RLa1Pb9EsODYT_9afbb85b0f7d415a94a4071fa7b6188a.png";
  // return url;
}

export async function expandImageToRight(imageUrl) {
  // Load the original image to get its dimensions
  console.log(`[expandImageRight] Image URL: ${imageUrl}`);
  const resolved = imageUrl.startsWith("data:")
    ? imageUrl
    : await urlToDataUri(imageUrl);
  const img = await loadImage(resolved);
  // const img = await loadImage(imageUrl);
  const originalWidth = img.width;
  const originalHeight = img.height;

  // Set the new canvas size to double the original width
  const newCanvasWidth = originalWidth * 2;
  const newCanvasHeight = originalHeight;

  // Set the position of the original image in the new canvas
  const originalImageLocation = [0, 0];

  // Call the Bria Expand API
  if (TEST_MODE) {
    const url =
      "https://v3.fal.media/files/rabbit/oWodpf2w2285BKqOG-njj_cf9447025e5b40eb8686baf87d2675d7.png";
    return url;
  } else {
    const result = await fal.subscribe("fal-ai/bria/expand", {
      input: {
        image_url: imageUrl,
        canvas_size: [newCanvasWidth, newCanvasHeight],
        original_image_size: [originalWidth, originalHeight],
        original_image_location: originalImageLocation,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) =>
            console.log("[ExpandImageRight] Queue update:", log.message),
          );
        }
      },
    });

    // Return the expanded image as a data URL
    if (result.data && result.data.image) {
      const url = result.data.image.url;
      console.log("Extended image URL:", url);
      return url;
    } else {
      console.log("[expandImageRight] Error observed with  ", result.data);
    }
  }
  // const url =
  //   "https://v3.fal.media/files/koala/ygHkTig3RLa1Pb9EsODYT_9afbb85b0f7d415a94a4071fa7b6188a.png";
  // return url;
}

export async function splitImageInHalf(imageDataURL) {
  const img = await loadImage(imageDataURL);
  const fullWidth = img.width;
  const halfWidth = fullWidth / 2;
  const height = img.height;

  // Create a canvas for the left half
  const leftCanvas = createCanvas(halfWidth, height);
  const leftCtx = leftCanvas.getContext("2d");
  leftCtx.drawImage(img, 0, 0, halfWidth, height, 0, 0, halfWidth, height);
  const leftHalf = leftCanvas.toDataURL("image/png");

  // Create a canvas for the right half
  const rightCanvas = createCanvas(halfWidth, height);
  const rightCtx = rightCanvas.getContext("2d");
  rightCtx.drawImage(
    img,
    halfWidth,
    0,
    halfWidth,
    height,
    0,
    0,
    halfWidth,
    height,
  );
  const rightHalf = rightCanvas.toDataURL("image/png");

  return { leftHalf, rightHalf };
}

export async function removeBackgroundFromImage(
  imageInput: string,
): Promise<string> {
  if (!imageInput) {
    throw new Error(
      "removeBackgroundFromImage: imageInput is undefined or empty",
    );
  }

  // Optionally, you can log or process the imageInput here.
  // The API accepts either a publicly accessible URL or a Data URI.
  const result = await fal.subscribe("fal-ai/ben/v2/image", {
    input: {
      image_url: imageInput, // either remote URL or Base64 data URI
      sync_mode: true, // wait for the image to be processed before returning
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });

  // The API returns the output image URL in result.output.
  // If needed, you can fetch and convert that to a data URI.
  return result.data.image.url;
}
