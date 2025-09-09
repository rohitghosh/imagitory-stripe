import { GoogleGenAI, Modality } from "@google/genai";
import {
  ImageEngine,
  ImageEngineInput,
  ImageEngineResult,
  Part,
  GeneratedImage,
} from "../core/types";
import { downloadAsBase64 } from "../core/storage";
import { getGeminiConfig } from "../config/imageGenConfig";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Convert Parts to Gemini input format
 */
async function partsToGeminiContent(parts: Part[]): Promise<any[]> {
  const contentParts: any[] = [];

  for (const part of parts) {
    if (part.type === "text") {
      contentParts.push({ text: part.text });
    } else if (part.type === "image_url") {
      try {
        const { base64, mimeType } = await downloadAsBase64(part.url);
        contentParts.push({
          inlineData: {
            mimeType,
            data: base64,
          },
        });
      } catch (error) {
        console.warn(`Failed to load image from ${part.url}:`, error);
      }
    }
  }

  return contentParts;
}

/**
 * Extract images from Gemini response
 */
function extractImagesFromResponse(response: any): GeneratedImage[] {
  const images: GeneratedImage[] = [];

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part?.inlineData || part?.inline_data;
    if (!inline?.data) continue;

    // Normalize to Buffer
    const raw = inline.data as any;
    const buffer = Buffer.isBuffer(raw)
      ? raw
      : raw instanceof Uint8Array
        ? Buffer.from(raw)
        : typeof raw === "string"
          ? Buffer.from(raw, "base64")
          : null;

    if (!buffer) continue;

    const mimeType = inline.mimeType || inline.mime_type || "image/png";

    images.push({
      buffer,
      mimeType,
    });
  }

  return images;
}

/**
 * Extract text from Gemini response
 */
function extractTextFromResponse(response: any): string | undefined {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const textParts = parts
    .filter((part: any) => part.text)
    .map((part: any) => part.text);
  return textParts.length > 0 ? textParts.join(" ") : undefined;
}

export class GeminiImageEngine implements ImageEngine {
  async generate(input: ImageEngineInput): Promise<ImageEngineResult> {
    // Determine use case and get config (only model is configurable for Gemini)
    const useCase = input.model?.includes("cover") ? "cover" : "scene";
    const config = getGeminiConfig(useCase as "scene" | "cover");

    // Build contents for conversation
    const contents: any[] = [];

    // Add conversation history if provided (for regenerations)
    if (input.conversation_history && input.conversation_history.length > 0) {
      for (const turn of input.conversation_history) {
        if (turn.role === "user") {
          const parts = await partsToGeminiContent(turn.parts);
          contents.push({
            role: "user",
            parts,
          });
        } else if (turn.role === "model") {
          // For model responses, we only include text (images are handled separately)
          const textParts = turn.parts
            .filter((p) => p.type === "text")
            .map((p) => ({ text: p.text }));
          if (textParts.length > 0) {
            contents.push({
              role: "model",
              parts: textParts,
            });
          }
        }
      }
    }

    // Add current prompt
    const currentParts = await partsToGeminiContent(input.prompt_parts);
    contents.push({
      role: "user",
      parts: currentParts,
    });

    // Based on Gemini API docs, the request format is minimal
    const response = await ai.models.generateContent({
      model: config.model,
      contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE] as const,
      },
    });

    const images = extractImagesFromResponse(response);
    const text = extractTextFromResponse(response);

    if (images.length === 0) {
      throw new Error("No images returned from Gemini");
    }

    return {
      images,
      text,
      provider_meta: {
        request_id: response?.responseId || `gemini_${Date.now()}`,
        usage: response?.usageMetadata,
      },
    };
  }

  // Gemini doesn't support stateful regeneration like OpenAI
  // Regeneration is handled by replaying the generate() call with stored inputs
  // This method is optional and not implemented for Gemini
}

// Export singleton instance
export const geminiImageEngine = new GeminiImageEngine();
