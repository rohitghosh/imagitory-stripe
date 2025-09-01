// API Request/Response types
import { UnifiedSceneDescription, UnifiedFrontCover } from "./story";

export interface SceneRegenerationInput {
  scene_description: UnifiedSceneDescription;
  characterImageMap: Record<string, CharacterVariables>;
  previousImageUrl?: string | null;
  seed?: number;
}

export interface FinalCoverRegenerationInput {
  base_cover_url: string;
  story_title: string;
  seed?: number;
}

// Update existing CoverRegenerationInput to be more specific
export interface BaseCoverRegenerationInput {
  front_cover: UnifiedFrontCover;
  characterImageMap: Record<string, CharacterVariables>;
  seed?: number;
}

export interface ValidationRequest {
  kidName: string;
  pronoun: string;
  age: number;
  theme: string;
  subject: string;
  characters?: string[];
  character_descriptions?: string[];
}

export interface ValidationResponse {
  success: boolean;
  failures: Array<{
    check: string;
    problem: string;
    solution: string[];
  }>;
}

export interface CharacterVariables {
  image_url: string;
  description: string;
  // add other properties as needed
}

export interface StoryGenerationRequest {
  kidName: string;
  pronoun: string;
  age: number;
  moral: string;
  storyRhyming: boolean;
  kidInterests: string[];
  storyThemes: string[];
  characters?: string[];
  characterDescriptions?: string[];
  characterImageMap?: Record<string, CharacterVariables>;
}

// export interface SceneOutput {
//   scene_number: number;
//   scene_url: string;
//   scene_response_id: string;
//   scene_text: string[];
//   scene_inputs: SceneRegenerationInput; // NEW
// }

export interface SceneOutput {
  scene_number: number;
  imageUrls: string[]; // CHANGED from scene_url
  sceneResponseIds: string[]; // CHANGED from scene_response_id
  current_scene_index: number; // NEW
  content: string[];
  scene_inputs: SceneRegenerationInput;
}

export interface StoryGenerationResponse {
  jobId: string;
}

// export interface StoryPackage {
//   scenes: SceneOutput[];
//   cover: {
//     base_cover_url: string; // NEW: Original cover without title
//     story_title: string;
//     base_cover_response_id: string;
//     base_cover_inputs: BaseCoverRegenerationInput; // RENAMED from cover_inputs
//     final_cover_url: string; // NEW: Cover with title overlaid
//     final_cover_inputs: FinalCoverRegenerationInput; // NEW
//   };
// }

export interface StoryPackage {
  scenes: SceneOutput[];
  cover: {
    base_cover_url: string;
    base_cover_urls: string[]; // CHANGED from base_cover_url
    story_title: string;
    base_cover_response_id: string;
    base_cover_response_ids: string[]; // CHANGED from base_cover_response_id
    current_base_cover_index: number; // NEW
    base_cover_inputs: BaseCoverRegenerationInput;
    final_cover_url: string;
    final_cover_urls: string[]; // CHANGED from final_cover_url
    current_final_cover_index: number; // NEW
    final_cover_inputs: FinalCoverRegenerationInput;
  };
}

export interface JobStatus {
  phase: string;
  pct: number;
  message?: string;
  error?: string;
  result?: StoryPackage;
}

export interface JobTracker {
  newJob(): string;
  set(jobId: string, status: Partial<JobStatus>): void;
  get(jobId: string): JobStatus | undefined;
}
