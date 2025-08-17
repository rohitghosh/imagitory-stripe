import { z } from "zod";

// Character detail schema for unified scenes and covers
const characterDetailSchema = z.object({
  Character_Name: z.string(),
  Clothing_Details: z.string(),
  Gaze_Direction: z.string(),
  Expression: z.string(),
  Pose_and_Action: z.string(),
});

// Base scene description schema - fields that are always present
const baseSceneDescriptionSchema = z.object({
  Scene_Number: z.number().int(),
  Present_Characters: z.array(z.string()),
  Camera_Shot: z.enum(["Wide", "Medium", "Close-up"]),
  Composition_and_Blocking: z.string(), // Required for all scenes - describes character/element positioning
  Character_Details: z.array(characterDetailSchema), // Array length should match Present_Characters length
  Focal_Action: z.string(),
  Setting_and_Environment: z.string(),
  Time_of_Day_and_Atmosphere: z.string(),
  Lighting_Description: z.string(), // Always required - describes lighting for all scene types
  Key_Storytelling_Props: z.array(
    z.object({
      Object: z.string(),
      Description: z.string(),
    }),
  ),
  Background_Elements: z.string(),
  Hidden_Object: z.string(),
  Dominant_Color_Palette: z.string(),
});

// Single character scene description (Character_Interaction_Summary not included)
const singleCharacterSceneDescriptionSchema = baseSceneDescriptionSchema;

// Multiple character scene description (includes Character_Interaction_Summary)
const multipleCharacterSceneDescriptionSchema =
  baseSceneDescriptionSchema.extend({
    Character_Interaction_Summary: z.string(), // Required only for multiple character scenes
  });

// Union type for scene descriptions that can be either single or multiple character
const unifiedSceneDescriptionSchema = z.union([
  singleCharacterSceneDescriptionSchema,
  multipleCharacterSceneDescriptionSchema,
]);

// Unified front cover schema that handles both single and multiple characters
const unifiedFrontCoverSchema = z.object({
  Present_Characters: z.array(z.string()),
  Camera_Shot: z.enum(["Wide", "Medium", "Close-up"]),
  Cover_Concept: z.string(),
  Focal_Point: z.string(),
  Character_Placement: z.string(),
  Character_Details: z.array(characterDetailSchema),
  Background_Setting: z.string(),
  Key_Visual_Elements: z.array(
    z.object({
      Object: z.string(),
      Description: z.string(),
    }),
  ),
  Lighting_and_Mood: z.string(),
  Color_Palette: z.string(),
});

// Unified scene schema
const unifiedSceneSchema = z.object({
  scene_description: unifiedSceneDescriptionSchema,
  scene_text: z.array(z.string()),
});

// Unified scenes schema
const unifiedScenesSchema = z.array(unifiedSceneSchema);

// Unified story response schema
const unifiedStoryResponseSchema = z.object({
  story_title: z.string(),
  front_cover: unifiedFrontCoverSchema,
  scenes: unifiedScenesSchema,
});

// Story validation response schema
const storyValidationResponseSchema = z.object({
  results: z.array(
    z.object({
      check_name: z.string(),
      Validation: z.enum(["Pass", "Fail"]),
      Problem: z.string(),
      Solution: z.array(z.string()),
    }),
  ),
});

// Progress callback type
export type ProgressCallback = (
  phase: string,
  pct: number,
  message?: string,
) => void;

// Story validation input type
export interface StoryValidationInput {
  kidName: string;
  pronoun: string;
  age: number;
  theme: string;
  subject: string;
  storyRhyming: boolean;
  characters?: string[];
  character_descriptions?: string[];
}

// Validation failure type
export interface ValidationFailure {
  check: string;
  problem: string;
  solution: string[];
}

// Dynamic schema creation functions
export function createSceneDescriptionSchema(hasMultipleCharacters: boolean) {
  return hasMultipleCharacters
    ? multipleCharacterSceneDescriptionSchema
    : singleCharacterSceneDescriptionSchema;
}

export function createSceneSchema(hasMultipleCharacters: boolean) {
  return z.object({
    scene_description: createSceneDescriptionSchema(hasMultipleCharacters),
    scene_text: z.array(z.string()),
  });
}

export function createScenesSchema(hasMultipleCharacters: boolean) {
  return z.array(createSceneSchema(hasMultipleCharacters));
}

export function createStoryResponseSchema(hasMultipleCharacters: boolean) {
  return z.object({
    story_title: z.string(),
    front_cover: unifiedFrontCoverSchema,
    scenes: createScenesSchema(hasMultipleCharacters),
  });
}

// Helper function to determine if input has multiple characters
export function hasMultipleCharacters(characters?: string[]): boolean {
  return Boolean(characters && characters.length > 0);
}

// Export unified types
export type UnifiedSceneDescription = z.infer<
  typeof unifiedSceneDescriptionSchema
>;
export type SingleCharacterSceneDescription = z.infer<
  typeof singleCharacterSceneDescriptionSchema
>;
export type MultipleCharacterSceneDescription = z.infer<
  typeof multipleCharacterSceneDescriptionSchema
>;
export type UnifiedScene = z.infer<typeof unifiedSceneSchema>;
export type UnifiedFrontCover = z.infer<typeof unifiedFrontCoverSchema>;
export type UnifiedStoryResponse = z.infer<typeof unifiedStoryResponseSchema>;
export type StoryValidationResponse = z.infer<
  typeof storyValidationResponseSchema
>;

// Export schemas
export {
  unifiedSceneDescriptionSchema,
  singleCharacterSceneDescriptionSchema,
  multipleCharacterSceneDescriptionSchema,
  unifiedSceneSchema,
  unifiedScenesSchema,
  unifiedFrontCoverSchema,
  unifiedStoryResponseSchema,
  storyValidationResponseSchema,
  characterDetailSchema,
};
