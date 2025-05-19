export async function refineImage(
  imageUrl: string,
  kidName: string,
  age: number,
  gender: string,
  seed: number,
  stylePreference: string,
  modelId: string,
  loraScale: number,
) {
  console.log(
    "[refineImage] Generating image with prompt:",
    "using lora path:",
    modelId,
  );

  let segmentedImage = "";
  const segmentationPrompt = `face of a ${age} year old ${gender} kid`;
  const segmentationPayload = {
    prompt: segmentationPrompt,
    image_url: imageUrl,
    mask_only: true,
  };

  console.log(
    "[refineImage Segmentation] Payload:",
    JSON.stringify(segmentationPayload, null, 2),
  );

  // Use fal.subscribe to trigger image generation.
  const result = await fal.subscribe("fal-ai/evf-sam", {
    input: segmentationPayload,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) =>
          console.log("[refineImage Segmentation] Queue update:", log.message),
        );
      }
    },
  });

  console.log(
    "[refineImage Segmentation] Generation result data:",
    result.data,
  );
  console.log("[refineImage Segmentation] Request ID:", result.requestId);

  if (result.data && result.data.image) {
    segmentedImage = result.data.image.url;
  } else {
    throw new Error("No image returned from segmentation");
  }

  const inpaintingPrompt = `closeup image of <${kidName}kidName> imagined as cartoon character`;

  const inpaintingPayload = {
    loras: [
      {
        path: modelId, // This is the URL returned from training.
        scale: loraScale,
      },
    ],
    prompt: inpaintingPrompt,
    image_url: imageUrl,
    mask_url: segmentedImage,
    seed: seed,
    strength: 0.95,
  };

  console.log(
    "[refineImage InPainting] Payload:",
    JSON.stringify(inpaintingPayload, null, 2),
  );

  // Use fal.subscribe to trigger image generation.
  const inpaintingResult = await fal.subscribe("fal-ai/flux-lora/inpainting", {
    input: inpaintingPayload,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) =>
          console.log("[refineImage Segmentation] Queue update:", log.message),
        );
      }
    },
  });

  console.log(
    "[refineImage Inpainting] Generation result data:",
    inpaintingResult.data,
  );
  console.log(
    "[refineImage Inpainting] Request ID:",
    inpaintingResult.requestId,
  );

  if (
    inpaintingResult.data &&
    inpaintingResult.data.images &&
    inpaintingResult.data.images.length > 0
  ) {
    return inpaintingResult.data.images[0].url;
  } else {
    throw new Error("No image returned from inpainting");
  }
}
