export type TextPart = { 
  type: "text"; 
  text: string; 
};

export type ImageUrlPart = { 
  type: "image_url"; 
  url: string; 
  mimeType?: string; 
};

export type Part = TextPart | ImageUrlPart;

export type ImageGenConfig = {
  size?: "1024x1024" | "512x512" | string;
  quality?: "high" | "medium" | "low";
  input_fidelity?: "high" | "medium" | "low";  // OpenAI tool param
  seed?: number;
  output_format?: "png" | "webp" | "jpeg";
  n?: number;
};

export type GeneratedImage = {
  buffer: Buffer;
  mimeType: string;
};

export type ProviderMeta = {
  request_id?: string;
  usage?: any;
  raw_refs?: {
    response_id?: string;  // OpenAI Responses API id for stateful regen
  };
};

export type ImageEngineResult = {
  images: GeneratedImage[];
  text?: string;
  provider_meta: ProviderMeta;
};

export type ImageEngineInput = {
  model?: string;
  prompt_parts: Part[];
  previous_provider_ref?: { response_id?: string };
};

export interface ImageEngine {
  generate(input: ImageEngineInput): Promise<ImageEngineResult>;
  regenerate?(ref: { response_id: string }): Promise<ImageEngineResult>;
}

// Job storage types
export type JobStatus = "pending" | "succeeded" | "failed";

export type ImageJobInput = {
  system?: string;
  prompt_parts: Part[];
  gen_config: ImageGenConfig;
};

export type ImageArtifact = {
  storagePath: string;
  url: string;
  mimeType: string;
  bytes?: number;
};

export type ImageJob = {
  provider: "openai" | "gemini";
  model: string;
  status: JobStatus;
  input_snapshot: ImageJobInput;
  output_summary?: {
    images: ImageArtifact[];
    text?: string;
  };
  provider_meta?: ProviderMeta;
  request_hash: string;
  createdAt: Date;
  updatedAt: Date;
};

// Generation types that match existing system
export type SceneGenerationInput = {
  bookId: string;
  scene: { scene_description: any; scene_text: string[] };
  previousImageUrl: string | null;
  characterImageMap: Record<string, any>;
  onProgress?: (phase: string, pct: number, message: string) => void;
  seed?: number;
};

export type CoverGenerationInput = {
  bookId: string;
  frontCover: any;
  characterImageMap: Record<string, any>;
  onProgress?: (phase: string, pct: number, message: string) => void;
  seed?: number;
};

export type RegenerationInput = {
  bookId: string;
  responseId: string;
  revisedPrompt: string;
  onProgress?: (phase: string, pct: number, message: string) => void;
};

export type GenerationResult = {
  firebaseUrl: string;
  responseId: string;
};

// Progress callback type
export type ProgressCallback = (phase: string, pct: number, message: string) => void;
