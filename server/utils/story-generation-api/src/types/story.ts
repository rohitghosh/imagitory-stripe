// import { z } from "zod";

// // Base character detail schema
// const characterDetailSchema = z.object({
//   Character_Name: z.string(),
//   Gaze_Direction: z.string(),
//   Expression: z.string(),
//   Pose_and_Action: z.string(),
// });

// // Front cover character detail schema
// const FrontCoverCharacterDetailsSchema = z.object({
//   Character_Name: z.string(),
//   Gaze_Direction: z
//     .string()
//     .describe(
//       "Direction of the gaze, aimed to be engaging. E.g., 'Looking just past the viewer with a welcoming and excited expression.'",
//     ),
//   Expression: z
//     .string()
//     .describe(
//       "A clear, positive facial expression. E.g., 'A wide, joyful smile, with eyes full of wonder.'",
//     ),
//   Pose_and_Action: z
//     .string()
//     .describe(
//       "A dynamic and appealing body pose. E.g., 'Leaning forward in anticipation, one arm slightly raised as if about to embark on a journey.'",
//     ),
// });

// // Scene description schema for stories WITH characters
// const sceneDescriptionSchema = z.object({
//   Scene_Number: z.number().int(),
//   Present_Characters: z.array(z.string()),
//   Camera_Shot: z.string(),
//   Composition_and_Blocking: z.string(),
//   Character_Interaction_Summary: z.string().nullable(),
//   Character_Details: z.array(characterDetailSchema),
//   Focal_Action: z.string(),
//   Setting_and_Environment: z.string(),
//   Time_of_Day_and_Atmosphere: z.string(),
//   Lighting_Description: z.string(),
//   Key_Storytelling_Props: z.string(),
//   Background_Elements: z.string(),
//   Hidden_Object: z.string(),
//   Dominant_Color_Palette: z.string(),
//   Visual_Overlap_With_Previous: z.boolean(),
// });

// // Scene description schema for stories WITHOUT characters
// const scenewocharDescriptionSchema = z.object({
//   Scene_Number: z.string(),
//   Present_Characters: z.array(z.string()),
//   Camera_Shot: z.string(),
//   Character_Gaze: z.string(),
//   Character_Expression_and_Pose: z.string(),
//   Focal_Action: z.string(),
//   Setting_and_Environment: z.string(),
//   Time_of_Day_and_Atmosphere: z.string(),
//   Key_Storytelling_Props: z.string(),
//   Background_Elements: z.string(),
//   Hidden_Object: z.string(),
//   Dominant_Color_Palette: z.string(),
//   Visual_Overlap_With_Previous: z.boolean(),
// });

// // Front cover schema for stories WITH characters
// export const FrontCoverSchema = z.object({
//   Cover_Concept: z
//     .string()
//     .describe(
//       "A one-sentence summary of the cover's core idea and emotional goal.",
//     ),
//   Present_Characters: z
//     .array(z.string())
//     .describe(
//       "A JSON array of strings containing only the exact, clean names of characters in the scene",
//     ),
//   Focal_Point: z
//     .string()
//     .describe("Describes the central visual element of the cover."),
//   Character_Placement: z
//     .string()
//     .describe(
//       "Describes the composition of characters, paying special attention to leaving space for the title.",
//     ),
//   Character_Details: z
//     .array(FrontCoverCharacterDetailsSchema)
//     .describe(
//       "An array of objects, one for each character present on the cover.",
//     ),
//   Background_Setting: z
//     .string()
//     .describe(
//       "A vibrant and slightly idealized depiction of a key story environment.",
//     ),
//   Key_Visual_Elements: z
//     .array(z.string())
//     .describe(
//       "An array of 1-2 iconic objects or symbols from the story that hint at the narrative.",
//     ),
//   Lighting_and_Mood: z
//     .string()
//     .describe("Describes the lighting style and the resulting atmosphere."),
//   Color_Palette: z
//     .string()
//     .describe("A vibrant, eye-catching color scheme designed to stand out."),
// });

// // Front cover schema for stories WITHOUT characters
// const FrontCoverwocharSchema = z.object({
//   Present_Characters: z.array(z.string()),
//   Cover_Concept: z.string(),
//   Focal_Point: z.string(),
//   Character_Placement_and_Pose: z.string(),
//   Character_Gaze_and_Expression: z.string(),
//   Background_Setting: z.string(),
//   Key_Visual_Elements: z.array(z.string()),
//   Lighting_and_Mood: z.string(),
//   Color_Palette: z.string(),
// });

// // Scene schema for stories WITH characters
// const sceneSchema = z.object({
//   scene_description: sceneDescriptionSchema,
//   scene_text: z.array(z.string()),
// });

// // Scene schema for stories WITHOUT characters
// const scenewocharSchema = z.object({
//   scene_description: scenewocharDescriptionSchema,
//   scene_text: z.array(z.string()),
// });

// // Main story response schemas
// const scenesSchema = z.array(sceneSchema).min(9).max(9);
// const sceneswocharSchema = z.array(scenewocharSchema).min(9).max(9);

// export const storyResponseSchema = z.object({
//   story_title: z.string(),
//   scenes: scenesSchema,
//   front_cover: FrontCoverSchema,
// });

// export const storywocharResponseSchema = z.object({
//   story_title: z.string(),
//   scenes: sceneswocharSchema,
//   front_cover: FrontCoverwocharSchema,
// });

// // Validation schemas
// const validationResultSchema = z.object({
//   check_name: z
//     .string()
//     .describe("The name of the validation check being performed."),
//   Validation: z.enum(["Pass", "Fail"]),
//   Problem: z
//     .string()
//     .describe(
//       "If 'Fail', a concise, user-facing explanation of the issue. If 'Pass', this MUST be an empty string.",
//     ),
//   Solution: z
//     .array(z.string())
//     .describe(
//       "If 'Fail', a list of 1-3 actionable suggestions for the user. If 'Pass', this MUST be an empty list [].",
//     ),
// });

// export const storyValidationResponseSchema = z.object({
//   results: z
//     .array(validationResultSchema)
//     .describe("An array of exactly 12 validation check results, in order.")
//     .length(12),
// });

// // Type exports
// export type CharacterDetail = z.infer<typeof characterDetailSchema>;
// export type SceneDescription = z.infer<typeof sceneDescriptionSchema>;
// export type ScenewocharDescription = z.infer<
//   typeof scenewocharDescriptionSchema
// >;
// export type Scene = z.infer<typeof sceneSchema>;
// export type Scenewochar = z.infer<typeof scenewocharSchema>;
// export type FrontCover = z.infer<typeof FrontCoverSchema>;
// export type FrontCoverWoChar = z.infer<typeof FrontCoverwocharSchema>;
// export type StoryResponse = z.infer<typeof storyResponseSchema>;
// export type StorywocharResponse = z.infer<typeof storywocharResponseSchema>;
// export type ValidationResult = z.infer<typeof validationResultSchema>;
// export type StoryValidationResponse = z.infer<
//   typeof storyValidationResponseSchema
// >;

// // Input interfaces
// export interface StorySceneInput {
//   kidName: string;
//   pronoun: string;
//   age: number;
//   moral: string;
//   storyRhyming: boolean;
//   kidInterests: string[];
//   storyThemes: string[];
//   characters?: string[];
//   characterDescriptions?: string[];
// }

// export interface StoryValidationInput {
//   kidName: string;
//   pronoun: string;
//   age: number;
//   characters?: string[];
//   character_descriptions?: string[];
//   moral: string;
//   kidInterests: string[];
//   storyThemes: string[];
// }

// export interface ValidationFailure {
//   check: string;
//   problem: string;
//   solution: string[];
// }

// // Progress callback type
// export type ProgressCallback = (
//   phase: string,
//   pct: number,
//   message?: string,
// ) => void;
import { z } from "zod";

// Character detail schema for unified scenes and covers
const characterDetailSchema = z.object({
  Character_Name: z.string(),
  Gaze_Direction: z.string(),
  Expression: z.string(),
  Pose_and_Action: z.string(),
});

// Unified scene description schema that handles both single and multiple characters
const unifiedSceneDescriptionSchema = z.object({
  Scene_Number: z.number().int(),
  Present_Characters: z.array(z.string()),
  Camera_Shot: z.string(),
  Composition_and_Blocking: z.string(), // Required for all scenes
  Character_Interaction_Summary: z.string(), // Required for all scenes (empty string for single character)
  Character_Details: z.array(characterDetailSchema),
  Focal_Action: z.string(),
  Setting_and_Environment: z.string(),
  Time_of_Day_and_Atmosphere: z.string(),
  Lighting_Description: z.string(), // Required for all scenes (empty string for single character)
  Key_Storytelling_Props: z.string(),
  Background_Elements: z.string(),
  Hidden_Object: z.string(),
  Dominant_Color_Palette: z.string(),
  Visual_Overlap_With_Previous: z.boolean(),
});

// Unified front cover schema that handles both single and multiple characters
const unifiedFrontCoverSchema = z.object({
  Present_Characters: z.array(z.string()),
  Cover_Concept: z.string(),
  Focal_Point: z.string(),
  Character_Placement: z.string(),
  Character_Details: z.array(characterDetailSchema),
  Background_Setting: z.string(),
  Key_Visual_Elements: z.array(z.string()),
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
  moral: string;
  storyRhyming: boolean;
  kidInterests: string[];
  storyThemes: string[];
  characters?: string[];
  character_descriptions?: string[];
}

// Validation failure type
export interface ValidationFailure {
  check: string;
  problem: string;
  solution: string[];
}

// Export unified types
export type UnifiedSceneDescription = z.infer<
  typeof unifiedSceneDescriptionSchema
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
  unifiedSceneSchema,
  unifiedScenesSchema,
  unifiedFrontCoverSchema,
  unifiedStoryResponseSchema,
  storyValidationResponseSchema,
  characterDetailSchema,
};
