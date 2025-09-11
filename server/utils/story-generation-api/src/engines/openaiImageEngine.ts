import OpenAI from "openai";
import {
  ImageEngine,
  ImageEngineInput,
  ImageEngineResult,
  Part,
  GeneratedImage,
} from "../core/types";
import { toDataUrl } from "../core/storage";
import {
  getOpenAIConfig,
  type OpenAIImageConfig,
} from "../config/imageGenConfig";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Build image generation tool configuration using config file settings
 */
function buildImageGenTool(
  config: OpenAIImageConfig,
  hasInputImage: boolean,
): any {
  return {
    type: "image_generation" as const,
    size: config.size,
    quality: config.quality,
    output_format: config.output_format,
    ...(hasInputImage && {
      input_fidelity: config.input_fidelity,
    }),
  };
}

/**
 * Convert Parts to OpenAI input format
 */
async function partsToOpenAIInput(parts: Part[]): Promise<{
  textContent: string;
  imageInputs: any[];
  hasInputImages: boolean;
}> {
  const textParts: string[] = [];
  const imageInputs: any[] = [];

  for (const part of parts) {
    if (part.type === "text") {
      textParts.push(part.text);
    } else if (part.type === "image_url") {
      try {
        const dataUrl = await toDataUrl(part.url);
        imageInputs.push({
          type: "input_image" as const,
          image_url: dataUrl,
        });
      } catch (error) {
        console.warn(`Failed to load image from ${part.url}:`, error);
      }
    }
  }

  return {
    textContent: textParts.join(" "),
    imageInputs,
    hasInputImages: imageInputs.length > 0,
  };
}

export class OpenAIImageEngine implements ImageEngine {
  async generate(input: ImageEngineInput): Promise<ImageEngineResult> {
    const { textContent, imageInputs, hasInputImages } =
      await partsToOpenAIInput(input.prompt_parts);

    // Determine use case from input or default to scene
    const useCase = input.model?.includes("cover") ? "cover" : "scene";
    const config = getOpenAIConfig(useCase as "scene" | "cover");

    // Build the tool configuration using config file settings
    const tools = [buildImageGenTool(config, hasInputImages)];

    // Build the input structure for responses API
    const inputs = [
      {
        role: "user" as const,
        content: [
          { type: "input_text" as const, text: textContent },
          ...imageInputs,
        ],
      },
    ];

    let response = null;

    if (process.env.TEST_MODE === "true") {
      // Use test response in test mode
      response = await openai.responses.retrieve(
        "resp_68a259cb613c8194b4af7906a7d7d93e076c7acadee13977",
      );
    } else {
      // Make the API call using the responses API
      // Use actual OpenAI model, not the config hint
      const actualModel =
        input.model?.includes("cover") || input.model?.includes("scene")
          ? "gpt-4o-mini" // Default OpenAI model when model param is used as config hint
          : input.model || "gpt-4o-mini";

      const requestOptions: any = {
        model: actualModel,
        input: inputs,
        tools,
      };

      // Add previous response ID if provided for chaining
      if (input.previous_provider_ref?.response_id) {
        requestOptions.previous_response_id =
          input.previous_provider_ref.response_id;
      }

      response = await openai.responses.create(requestOptions);
    }

    const responseId = response.id;
    const imageBase64 = (
      response.output.find(
        (o: any) => o.type === "image_generation_call",
      ) as any
    )?.result;

    if (!imageBase64) {
      throw new Error("No image returned from OpenAI");
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageBase64, "base64");
    const mimeType = `image/${config.output_format}`;

    const images: GeneratedImage[] = [
      {
        buffer,
        mimeType,
      },
    ];

    return {
      images,
      provider_meta: {
        request_id: responseId,
        usage: response.usage,
        raw_refs: {
          response_id: responseId,
        },
      },
    };
  }

  async regenerate(ref: { response_id: string }): Promise<ImageEngineResult> {
    let response = null;

    if (process.env.TEST_MODE === "true") {
      // Use test response in test mode
      response = await openai.responses.retrieve(
        "resp_68a259cb009081908be84383be9363f90385d78bb1c4df69",
      );
    } else {
      // Use previous_response_id for regeneration
      response = await openai.responses.create({
        model: "gpt-4o-mini", // Always use valid OpenAI model for regeneration
        previous_response_id: ref.response_id,
      });
    }

    const responseId = response.id;
    const imageBase64 = (
      response.output.find(
        (o: any) => o.type === "image_generation_call",
      ) as any
    )?.result;

    if (!imageBase64) {
      throw new Error("No image returned from OpenAI regeneration");
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const mimeType = "image/png"; // Default for regeneration

    const images: GeneratedImage[] = [
      {
        buffer,
        mimeType,
      },
    ];

    return {
      images,
      provider_meta: {
        request_id: responseId,
        usage: response.usage,
        raw_refs: {
          response_id: responseId,
        },
      },
    };
  }
}

// Export singleton instance
export const openaiImageEngine = new OpenAIImageEngine();
