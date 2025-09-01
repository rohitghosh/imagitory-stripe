/**
 * Image Generation Configuration
 * Source of truth for all image generation settings
 * 
 * IMPORTANT: 
 * - OpenAI supports many configuration options (quality, input_fidelity, size, etc.)
 * - Gemini API has minimal config options per docs (only model selection)
 * - TEST_MODE env variable controls OpenAI quality settings for faster testing
 * - This config file is the single source of truth - no env variables for settings
 */

// OpenAI-specific configuration type
export type OpenAIImageConfig = {
  size: "1024x1024" | "512x512" | string;
  quality: "high" | "medium" | "low";
  input_fidelity: "high" | "medium" | "low";
  output_format: "png" | "webp" | "jpeg";
  n: number;
};

// Gemini has minimal configuration options based on API docs
export type GeminiImageConfig = {
  model: string; // Only configurable option
};

/**
 * Configuration settings stored in this file (source of truth)
 */
export const IMAGE_GEN_CONFIG = {
  // Current provider selection
  provider: (process.env.IMAGE_PROVIDER || "openai") as "openai" | "gemini",
  
  // OpenAI configuration for different use cases
  openai: {
    // Scene generation settings
    scene: {
      size: "1024x1024",
      quality: "medium",
      input_fidelity: "high", 
      output_format: "png",
      n: 1
    } as OpenAIImageConfig,
    
    // Cover generation settings (higher quality)
    cover: {
      size: "1024x1024",
      quality: "high",
      input_fidelity: "high",
      output_format: "png", 
      n: 1
    } as OpenAIImageConfig,
    
    // Test mode overrides (uses TEST_MODE env variable)
    testMode: {
      quality: "low",
      input_fidelity: "low"
    } as Partial<OpenAIImageConfig>
  },
  
  // Gemini configuration (minimal options available)
  gemini: {
    scene: {
      model: "gemini-2.5-flash-image-preview"
    } as GeminiImageConfig,
    
    cover: {
      model: "gemini-2.5-flash-image-preview" 
    } as GeminiImageConfig
  }
};

/**
 * Get OpenAI configuration for a specific use case
 */
export function getOpenAIConfig(type: "scene" | "cover"): OpenAIImageConfig {
  const baseConfig = { ...IMAGE_GEN_CONFIG.openai[type] };
  
  // Apply test mode overrides if TEST_MODE env variable is set
  if (process.env.TEST_MODE === "true") {
    return {
      ...baseConfig,
      ...IMAGE_GEN_CONFIG.openai.testMode
    };
  }
  
  return baseConfig;
}

/**
 * Get Gemini configuration for a specific use case
 */
export function getGeminiConfig(type: "scene" | "cover"): GeminiImageConfig {
  return IMAGE_GEN_CONFIG.gemini[type];
}

/**
 * Get the current provider
 */
export function getCurrentProvider(): "openai" | "gemini" {
  return IMAGE_GEN_CONFIG.provider;
}

/**
 * Update provider selection
 */
export function setProvider(provider: "openai" | "gemini"): void {
  IMAGE_GEN_CONFIG.provider = provider;
}

/**
 * Update OpenAI settings (for runtime configuration)
 */
export function updateOpenAIConfig(
  type: "scene" | "cover",
  settings: Partial<OpenAIImageConfig>
): void {
  IMAGE_GEN_CONFIG.openai[type] = {
    ...IMAGE_GEN_CONFIG.openai[type],
    ...settings
  };
}
