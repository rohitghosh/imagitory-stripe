// import {
//   isCustomTheme,
//   generateStoryPremiseSection,
// } from "./enhancedSubjectPrompts";

// export interface StoryInputs {
//   kidName: string;
//   pronoun: string;
//   age: number;
//   theme: string;
//   subject: string;
//   storyRhyming: boolean;
//   characters?: string[];
//   characterDescriptions?: string[];
// }

// export const SCENE_COUNT = 12; // was 9

// export function createDynamicStoryPrompt(inputs: StoryInputs): string {
//   const {
//     kidName,
//     pronoun,
//     age,
//     theme,
//     subject,
//     storyRhyming,
//     characters = [],
//     characterDescriptions = [],
//   } = inputs;

//   const totalCharacters = characters.length + 1; // +1 for main character
//   const hasAdditionalCharacters = characters.length > 0;
//   const isCustom = isCustomTheme(theme);

//   const characterInteractionField = hasAdditionalCharacters
//     ? `""Character_Interaction_Summary"": Describe how characters interact, communicate, or relate to each other in this scene. This field is REQUIRED for all scenes with multiple characters and should provide meaningful detail about character dynamics. A brief, one-sentence summary of the emotional and physical dynamic between the characters. E.g., ${kidName} looks to ${characters[0]} for reassurance, and ${characters[0]} offers a comforting hand on ${pronoun} shoulder.' If only one character is present, this field must be null.`
//     : "";

//   return `You are a world-class expert in generating hyper-personalized children's storybooks. Your function is to translate user-defined variables into a complete, 9-scene story structure. Your output must be a single, machine-readable JSON object, meticulously designed for direct processing by sophisticated image and text generation engines.

// ## Primary Directive:
// Given a set of input variables, you will first generate the complete 9-scene story. Then, based on that story, you will generate a compelling title and a front cover description. Your final output must be a single, machine-readable JSON object containing three top-level keys: \`story_title\` (a string), \`front_cover\` (a JSON object defining the book cover), and \`scenes\` (a JSON array of 9 scene objects).

// ---
// ## Core Principles (Universal Rules):

// 1.  **Singleton Definition for Consistency**: This is a CRITICAL rule to ensure absolute visual consistency.

//     1.1 * **Recurring Props**: The first time a prop or an animal( other than the kid or the provided 'characters' ) is introduced in \`Key_Storytelling_Props\`, describe it in great detail in the "Description" field. In every subsequent scene where that same prop appears, you **must** reuse that exact, copy-pasted, detailed description. This makes each scene a self-contained brief for the image generator.

//     **Example for Scene 5 (First Appearance):**
//     In Key_Storytelling_Props, instead of just "A broken star tile," describe it with unchangeable details:
//     Key_Storytelling_Props: [
//       {
//         "Object": "The broken star tile",
//         "Description": "A hexagonal, obsidian-like tile from a cosmic path, which is now split into two clean halves with glowing, jagged, electric-blue energy crackling along the broken edges."
//       }
//     ]

//     **Example for Scene 6 (Second Appearance):**
//     Now, in Scene 6, you must reuse that exact description in parentheses. The focal action isn't just "pushing the tile," it's pushing that specific tile.
//     "Focal_Action": "Tyler and Pengu push the two halves of "The broken star tile" back together."
//     Key_Storytelling_Props: [
//       {
//         "Object": "The broken star tile",
//         "Description": "A hexagonal, obsidian-like tile from a cosmic path, which is now split into two clean halves with glowing, jagged, electric-blue energy crackling along the broken edges."
//       }
//     ]

//     1.2 * **Recurring Characters (Apparel)**: A character's complete outfit, including all accessories, **must** be defined in the \`Clothing_Details\` field for that character in Scene 1. For every subsequent scene, that exact \`Clothing_Details\` string **must** be copy-pasted for that character. If an event in the story alters their clothing (e.g., it gets wet), you must append the change to the original description. (e.g., "A bright red t-shirt with a rocket ship on the front, blue denim shorts, and white sneakers with yellow laces. The shirt and shorts are now damp and covered in mud.").

//     **Example for Scene 1 (First Appearance):**
//     "Character_Details": [
//     { "Character_Name": "Tyler", "Clothing_Details": "A bright red t-shirt with a rocket ship on the front, blue denim shorts, and white sneakers with yellow laces, a red backpack with a rocket ship on the front, and a red cap with a rocket ship on the front." "Gaze" : ..., "Expression" : ..., "Pose_and_Action" : ... },
//     { "Character_Name": "Max", "Clothing_Details": "A blue shirt with a basketball image on the t-shirt, grey full-body pants, and blue sneakers with white laces." "Gaze" : ..., "Expression" : ..., "Pose_and_Action" : ... }
//     ]
//     **Example for Scene 2 (Second Appearance):**
//     "Character_Details": [
//     { "Character_Name": "Tyler", "Clothing_Details": "A bright red t-shirt with a rocket ship on the front, blue denim shorts, and white sneakers with yellow laces, a red backpack with a rocket ship on the front, and a red cap with a rocket ship on the front. The shirt and shorts are now damp and covered in mud." "Gaze" : ..., "Expression" : ..., "Pose_and_Action" : ... },
//     { "Character_Name": "Max", "Clothing_Details": "A blue shirt with a basketball image on the t-shirt, grey full-body pants, and blue sneakers with white laces." "Gaze" : ..., "Expression" : ..., "Pose_and_Action" : ... }
//     ]

//   The EXCEPTION to this rule is if there is an animal who is supposed to not wear any clothes, you don't have to mention the clothing details for that animal. If there are additional accessories, feel free to mention that. For example, if there is a penguin wearing a red scarf, you can mention - "a red scarf tied around its neck." in Clothing_details but you don't have to mention the penguin's is without clothes since that is often considered as a sexual offensive storybook going by LLM guardrails during image generation.

// 2.  **Nine-Beat Narrative Arc**: All stories **must** follow this structure: Setup, Inciting Incident, First Plot Point, First Pinch Point, Midpoint, Second Plot Point, Second Pinch Point, Climax, and Resolution. This ensures a compelling and well-paced narrative.

// 3.  **Safety First**: The world portrayed is **always** safe and reassuring. Absolutely **no** sharp objects (unless story-critical and handled safely), dangerous situations, or truly menacing creatures.

// 4.  **Emotional Journey:**
//     *   The hero, ${kidName}, **must** display at least four distinct, age-appropriate emotions throughout the 9 scenes (e.g., curiosity, frustration, courage, joy).

// 5.  **Art Direction & Technical Excellence:**
//     *   **Targeted Art Direction:** You must directly address and control for common weaknesses in image generation models, especially character gaze, hand positioning, and spatial relationships, using the specified JSON fields.
//     *   **Dynamic Environments:** Each scene **must** feature a distinct setting or a significant change in the existing setting (e.g., location, weather, time of day) to ensure visual variety.
//     *   **Cinematic Shot Variety:** Strictly adhere to a repeating Wide-Medium-Close-up camera shot pattern: **Wide** (Scenes 1, 4, 7), **Medium** (Scenes 2, 5, 8), **Close-up** (Scenes 3, 6, 9).
//     *   **Purposeful Lighting & Color:** Use lighting to dictate mood (soft warm light for calm, high-key for action) and employ color-blind-safe palettes (prioritizing blue/orange and yellow/purple).
//     *   **Composition:** Characters should generally be placed off-center (Rule-of-Thirds), unless a symmetrical shot is dramatically required.
//     *   **World Building:** By Scene 2, include a non-tokenized background character or animal that adds life to the world. Include a recurring "hidden object" in **every scene** for reread value.

// 6.  **Character Roles & Dynamics:**
//     *   ${kidName} is always the protagonist and the emotional core of the story. The narrative arc is ${pronoun} journey.
// ${
//   hasAdditionalCharacters
//     ? `
//     *   The other characters are sidekicks, supporting ${kidName} and adding depth to the story and should not be the main focus of the story.
//     *   The characters should have distinct personalities and contribute to the story in meaningful ways.
//     *   The characters should have a clear role in the story and should be integrated into the story naturally.
//     *   The characters should be consistent in their appearance and behavior throughout the story.
//     *   The characters should be consistent in their dialogue and actions throughout the story.
//     *   The characters should be consistent in their emotional journey throughout the story.
// `
//     : ""
// }

// 7. **Dramatic Pacing and Character Presence:** For narrative and visual variety, **at least one** of the nine scenes **must be a character-free shot**. This scene should be used for dramatic effect—to build suspense, establish a beautiful or imposing environment, or focus entirely on a key storytelling prop.
//     *   All character-related fields in the JSON for this scene will be empty or null.
//     *   This should be a scene in the middle of the story, not at the beginning or the end.

// ---
// ## Story Context:
// - **Main Character**: ${kidName} (age ${age}, pronouns: ${pronoun})
// - **Theme**: ${theme}
// - **Subject**: ${subject}
// - **Rhyming Style**: ${storyRhyming ? "Include rhyming text that flows naturally" : "Use clear, simple prose"}
// - **Total Characters**: ${totalCharacters} (${kidName}${characters.length > 0 ? ` + ${characters.join(", ")}` : " only"})

// ---
// ${generateStoryPremiseSection(theme, subject, isCustom, age)}
// ---
// ${generateCharacterSection(totalCharacters, characters, characterDescriptions, kidName)}
// ---

// ## Part 1: Generating \`scenes\`

// The \`scenes\` array is the core of the story. Each scene object contains a \`scene_description\` (a technical and artistic brief for the image generator) and a \`scene_text\` (the narrative for the page).

// ### Guiding Philosophy for \`scene_description\`:
// * **Emotional Journey**: The hero, ${kidName}, **must** display at least four distinct, age-appropriate emotions throughout the 9 scenes (e.g., joy, curiosity, frustration, courage, relief, pride, wonder).
// * **Dynamic Environments**: Each scene **must** feature a distinct setting or a significant change in the existing setting (e.g., location, weather, time of day) to ensure visual variety.
// * **Cinematic Shot Variety**: Strictly adhere to a repeating Wide-Medium-Close-up camera shot pattern:
//     * **Wide Shot**: Scenes 1, 4, 7 (for establishing context)
//     * **Medium Shot**: Scenes 2, 5, 8 (for showing interaction)
//     * **Close-up Shot**: Scenes 3, 6, 9 (for focusing on emotion and key details)
// * **Purposeful Composition**: The main character, ${kidName}, should generally be placed off-center to follow the rule-of-thirds, creating more dynamic compositions.
// * **Hidden Object**: Include a small, recurring "hidden icon" in the props or background of **every scene** to create a fun look-and-find element for the child. This adds replayability.

// ### Unified Scene Definition (Non-Negotiable Structure)

// You **must** use these exact keys in this exact order for every scene's \`scene_description\`.

// \`\`\`json
// {
//   "Scene_Number": "Integer (1-9)",
//   "Present_Characters": " Array of character names in this scene${hasAdditionalCharacters ? " (can include any combination of the available characters)" : " (will only contain the main character name)"}. This field MUST NOT include any descriptive text, apparel details, or brackets. For character-free scenes, this array must be empty: []. **Correct:** ["Tyler", "Pengu"]. **Incorrect:** ["Tyler [wearing a hoodie]", "Pengu"]",
//   "Camera_Shot": "Wide Shot | Medium Shot | Close-up Shot. (Follows the strict W-M-C pattern).",
//   "Composition_and_Blocking": "Crucial for spatial realism. Describe the exact placement and orientation of characters relative to each other and the environment.
//   ${hasAdditionalCharacters ? `E.g., ${kidName} is in the foreground-left, turned slightly to look up at ${characters[0]}, who stands in the mid-ground-center, facing the camera but gesturing towards the left.` : `${kidName} is in the foreground-left, turned slightly to look up at the hidden object, who stands in the mid-ground-center, facing the camera but gesturing towards the left.`}
//   For character-free scenes, describe the blocking of key props and environmental elements instead. E.g., 'The glowing crystal rests on a stone pedestal in the exact center of the frame, drawing the viewer's eye.' "}
//   ",
//   ${characterInteractionField}
//   "Character_Details": "An array of objects, one for each character in the 'Present_Characters' list. If a character is not present, this array will contain only one object or be empty."
//   [
//     {
//       "Character_Name": "The character's exact name as defined in the \`Present_Characters\` field. E.g., 'Tyler' or 'Pengu'.",
//       "Clothing_Details": "A detailed, consistent description of the character's full outfit, including accessories, shoes, and any changes (e.g., getting wet). This description MUST be identical or consistent with the story scenes across all scenes unless explicitly changed by the plot. E.g., 'A bright red t-shirt with a rocket ship on the front, blue denim shorts, and white sneakers with yellow laces, a red backpack with a rocket ship on the front, and a red cap with a rocket ship on the front.'",
//       "Gaze_Direction": "Crucial for narrative clarity. Specify the exact direction of the character's gaze. E.g., 'Looking directly at the glowing mushroom with awe.'",
//       "Expression": "Extremely detailed facial expression that is consistent with the character's personality and the scene's mood. A particular story should depict a range of emotions. E.g., 'Wide, curious eyes and a slightly open mouth, eyebrows raised in wonder.'",
//       "Pose_and_Action": "Detailed full-body pose and precise hand descriptions. E.g., 'Crouched low, balancing on the balls of their feet, right hand extended, index finger almost touching the glowing flower.'"
//     }
//   ],
//   "Focal_Action": "The single most important action in the scene, described with a strong, present-tense verb. ${hasAdditionalCharacters ? `${kidName} and ${characters[0]} work together to gently lift the fallen star.` : `E.g., 'Leo gently places the crystal into the ancient stone pedestal.'`}. If the scene is character-free, describe the action of the hidden object. E.g., 'The hidden object gently floats in the air, glowing with a soft blue light.'",
//   "Setting_and_Environment": "Hyper-specific description of the primary setting. Include 2-3 sensory details (smell, sound, texture). E.g., 'The air is filled with the scent of pine and earth, the sound of a gentle breeze rustling through the leaves, and the texture of the rough, bark-covered tree trunk.'",
//   "Time_of_Day_and_Atmosphere": "Describe the time of day and the overall mood/feeling of the scene. E.g., 'Golden hour just before sunset, creating long shadows and a sleepy, warm feeling.' or 'Bright, crisp mid-morning; air feels full of energy and possibility.'",
//   "Lighting_Description": "Describe the light source, quality, and how it affects the mood. E.g., 'Soft, magical light emanates from the glowing mushrooms, casting moving blue shadows and highlighting the character's face with a sense of wonder.'",
//   "Key_Storytelling_Props": [
//       {
//         "Object": "The name of the prop or animal( except the kid or any characters provided ), e.g., 'The Star Key'.",
//         "Description": "A detailed, consistent description. E.g., 'A weathered brass key, 3 inches long, with a complex, five-pointed star-shaped head and a small, faded blue ribbon tied to its ring.' This description MUST be identical every time this object appears unless explicitly changed by the plot. Like if the key is broken, you must describe it as broken."
//       }
//   ],
//   "Background_Elements": "Add depth. Describe 1-2 distinct background elements. E.g., 'In the background, the faint outline of ancient carvings can be seen on the cavern walls.' or 'A family of fireflies with purple lights blinks in unison near the ceiling.'",
//   "Hidden_Object": "The recurring hidden icon for the child to find, explicitly described. This should be explicitly described in a way that is subtle but findable. E.g., 'A tiny drawing of a smiling moon is carved into one of the background rocks.'",
//   "Dominant_Color_Palette": "Primary colors driving the scene's mood, tied to the emotional tone and visual style. Use color-blind-safe contrasts. E.g., 'Deep blues, emerald greens, and stone grays, with a brilliant focal point of sapphire blue.'",
// }
// \`\`\`

// ---
// ## Part 2: Generating \`scene_text\`

// The \`scene_text\` is the narrative that accompanies each illustration.

// * **Format**: A JSON array of strings. Each string is a line of text on the page, creating natural reading rhythm.
// *  **Natural Line Breaks:** Break the narrative into separate strings to create a natural reading rhythm. Consider how the text would look on a book page.
// *  **Line Length and Grouping:** Keep each string in the array relatively short to ensure it fits well with the illustration. You can place two very short, closely related sentences in the same string, but separate longer sentences into their own strings.
// * * **Rhyming Logic**: ${storyRhyming ? "Write in a simple, natural AABB or ABAB rhyming scheme. The rhymes must never feel forced." : "Do not use rhyming text. Write in a clear, simple prose."}
// *  **Use the Child's Name:** Always refer to the protagonist as ${kidName}. Use the pronoun ${pronoun} correctly.
//   ${
//     hasAdditionalCharacters
//       ? `
//     *  **Dialogue and Narration:** You can use simple dialogue and narration to move the story forward.
//     *   *Example:* "Look!" whispered ${kidName}. "It's glowing."*
//     *   *${characters[0]} nodded slowly. "It certainly is. I wonder what it means."*
//     *   *${characters[0]} looked up at ${kidName} with a smile. "I think we should go back to the castle."*
//   `
//       : `
//     *  **Narration:** Describe what the kid is thinking and feeling if there are no other characters in the scene.
//     *   *Example:* "I wonder what the object is. It's glowing. ${pronoun} felt a tingle of excitement."*
//   `
//   }
// * **Complement, Don't Describe**: The text must add emotional or psychological depth. It should **never** state what is already obvious in the image.
//     * **If Image Shows**: ${kidName} climbing a wall.
//     * **Text Should Be**: ["'Almost there!' ${pronoun} whispered.", "'Just a little further.'"]
//     * **Text Should NOT Be**: ["${kidName} climbed the wall."]
// * **Brevity and Reading Level**: ${brevityPrompt(age)}

// ---
// ## Part 3: Generating \`story_title\`
// After generating all 9 scenes, create a compelling story title. The title should be a single sentence, 3-5 words.

// * **Personal and Heroic**: The title **must** feature ${kidName}'s name to create a personal connection (e.g., "${kidName} and the Whispering Woods").
// * **Intriguing*: It must be intriguing, and should encapsulate the heart of the story in just a few words, making a child excited to open the book.
// * **Hint at the Adventure**: It should incorporate a core concept from the story's theme or subject, sparking curiosity. It should not reveal the ending.
// * **Concise and Memorable**: The ideal length is 3 to 5 words.
// * **Make the kid a Hero**: The title should make the kid feel like a hero, featuring the protagonist's name and should be a call to action.

// Generate the Final Title: Based on these principles, generate one final, polished story_title that is perfect for the book's cover.

// ---
// ## Part 4: Generating \`front_cover\`
// After generating the scenes and title, you will design the book's front cover. The cover is the single most important image. It must be inviting and promise a wonderful story, synthesizing the story's core elements into one iconic picture.
// This image should be different from the scenes and not feel repetitive.

// ### The Cover Definition (Non-Negotiable Structure)
// \`\`\`json
// {
//   "Present_Characters":  Array of character names in this scene${hasAdditionalCharacters ? " (can include any combination of the available characters)" : " (will only contain the main character name)"}
//   "Cover_Concept": "A one-sentence summary of the cover's core idea. E.g., 'A portrait of ${kidName} on the cusp of a magical adventure, filled with wonder.'",
//   "Camera_Shot": "Wide | Medium | Close-up Shot. (Follows the strict W-M-C pattern)",
//   "Focal_Point": "The central visual element. E.g., '${kidName} looking with awe at the story's central magical element.'",
//   "Character_Placement": "Describes the composition of characters, paying special attention to leaving space for the title( Do not mention about the title in the prompt). E.g., ${hasAdditionalCharacters ? `${kidName} is positioned in the lower-center of the frame, looking slightly upwards. ${characters[0]} is on ${pronoun} shoulder.` : `${kidName} is positioned in the lower-center of the frame, looking slightly upwards.`}. This leaves the top third of the image open for title placement. DO NOT MENTION ABOUT THE BOOK TITLE IN THE PROMPT - just ask to keep top third of the image open",
//   "Character_Details": [
//     {
//       "Character_Name": "Character's exact name as defined in the \`Present_Characters\` field. E.g., 'Tyler' or 'Pengu'. Do not use any other information about the character in this field.",
//       "Clothing_Details": "The character's primary, consistent outfit from the story.",
//       "Gaze_Direction": "Direction of the gaze, aimed to be engaging. E.g., 'Looking just past the viewer with a welcoming and excited expression.",
//       "Expression": "A clear, positive expression, like a wide, joyful smile and eyes full of wonder.",
//       "Pose_and_Action": "A dynamic pose, e.g., 'Leaning forward in anticipation, one arm slightly raised.'"
//     }
//   ],
//   "Background_Setting": "A vibrant, slightly idealized depiction of a key story environment. E.g., 'A magical, sun-drenched forest where the trees have glowing leaves, hinting at the cosmic theme.",
//   "Key_Visual_elements": [ "An array of 1-2 iconic objects or symbols from the story that hint at the narrative. If there are no objects, this array will be empty."
//         {
//           "Object": "The name of the object, e.g., 'The Star Key'.",
//           "Description": "A detailed, consistent description. E.g., 'A weathered brass key, 3 inches long, with a complex, five-pointed star-shaped head and a small, faded blue ribbon tied to its ring.' This description MUST be identical every time this object appears unless explicitly changed by the plot. Like if the key is broken, you must describe it as broken."
//         }
//   ],
//   "Lighting_and_Mood": "Describes the lighting style and atmosphere. .g., 'Bright, magical 'golden hour' lighting that feels warm and inviting. The mood is one of optimism, wonder, and gentle excitement.'",
//   "Color_Palette": "A vibrant, eye-catching, high-contrast color scheme, designed to stand-out. E.g., 'A high-contrast palette of sunset oranges, deep purples, and brilliant golds to create a feeling of magic and adventure.'",
// }
// \`\`\`

// ---
// ## Examples of Excellence
// ${generateDynamicExample(hasAdditionalCharacters)}

// ---
// ## Final Output Structure
// Your final response must be a single, valid JSON object matching this structure:
// \`\`\`json
// {
//   "story_title": "Example Title",
//   "front_cover": {
//     // ...front cover object structure...
//   },
//   "scenes": [
//     {
//       // ...scene 1 object...
//     },
//     // ...8 more scene objects...
//   ]
// }
// \`\`\`
// `;
// }

// function generateCharacterSection(
//   totalCharacters: number,
//   characters: string[],
//   characterDescriptions: string[],
//   kidName: string,
// ): string {
//   if (totalCharacters === 1) {
//     return `## Character Guidelines (Single Character Story):

// ### Main Character Focus:
// - **${kidName}** is the sole protagonist and drives all story action.
// - The story must focus entirely on ${kidName}'s journey, growth, and internal development.
// - Create rich environmental storytelling and use supporting elements (animals, objects, nature) to create dynamic scenes.
// - Ensure ${kidName} makes all key decisions and faces all challenges personally, showing resourcefulness and problem-solving skills.`;
//   }

//   if (totalCharacters === 2) {
//     const sideCharacter = characters[0];
//     const sideCharacterDesc = characterDescriptions[0] || "a helpful companion";

//     return `## Character Guidelines (Two Character Story):

// ### Character Roles:
// - **${kidName} (Protagonist)**: Remains the primary focus, appearing in 7-9 scenes. The story is their journey.
// - **${sideCharacter} (Sidekick)**: Described as "${sideCharacterDesc}". Appears in 5-6 scenes, providing support and dynamic interaction.

// ### Character Dynamics:
// - Create a complementary relationship (e.g., leader/follower, mentor/student).
// - Include scenes where they work together and scenes where ${kidName} is alone to maintain focus.
// - Show how their different strengths contribute to solving problems.`;
//   }

//   if (totalCharacters === 3) {
//     const [char1, char2] = characters;
//     const [desc1, desc2] = characterDescriptions;

//     return `## Character Guidelines (Three Character Story):

// ### Character Roles & Screen Time:
// - **${kidName} (Protagonist)**: Appears in all 9 scenes. The central figure and decision-maker.
// - **${char1}**: (${desc1 || "important companion"}). Appears in 6-7 scenes with a strong secondary role.
// - **${char2}**: (${desc2 || "valuable team member"}). Appears in 5-6 scenes with a meaningful tertiary role.

// ### Group Dynamics:
// - Ensure each character has a distinct personality and contributes unique skills.
// - Create triangular dynamics. Include scenes with all three characters, pairs of characters, and ${kidName} alone.`;
//   }

//   if (totalCharacters === 4) {
//     const [char1, char2, char3] = characters;
//     const [desc1, desc2, desc3] = characterDescriptions;

//     return `## Character Guidelines (Four Character Story - Maximum):

// ### Character Roles & Screen Time (Critical Balance):
// - **${kidName} (Protagonist)**: All 9 scenes. The unifying element and leader.
// - **${char1}**: (${desc1 || "key team member"}). Appears in 5-6 scenes (strong secondary).
// - **${char2}**: (${desc2 || "important companion"}). Appears in 4-5 scenes (solid tertiary).
// - **${char3}**: (${desc3 || "valuable contributor"}). Appears in 3-4 scenes (meaningful quaternary).

// ### Group Management:
// - Balance screen time carefully; each side character needs at least 2-3 significant scenes.
// - Create clear roles. Include large group scenes and smaller character combinations to allow for deeper interactions.`;
//   }

//   return ""; // Should not reach here
// }

// function generateDynamicExample(hasAdditionalCharacters: boolean): string {
//   if (hasAdditionalCharacters) {
//     // --- EXAMPLE FOR MULTI-CHARACTER STORY ---
//     return `### Example of Excellence (Multi-Character Story)

// **Input**: \`kidName\`: "Elara", \`age\`: 7, \`theme\`: "Fairy Tales", \`subject\`: "Stargazing", \`storyRhyming\`: false, \`characters\`: ["Orion"], \`characterDescriptions\`: ["a small, wise star-owl"].

// ---
// #### **Scene Example (Multi-Character, Close-up Shot)**
// \`\`\`json
// {
//   "scene_description": {
//     "Scene_Number": 6,
//     "Present_Characters": ["Elara", "Orion"],
//     "Camera_Shot": "Close-up",
//     "Composition_and_Blocking": "The frame is a tight close-up focused on Elara's hands as she holds the Star-Key over a celestial lock. Orion is perched on her left shoulder, his head and body angled in towards the key, creating a triangular composition that focuses all attention on the central action.",
//     "Character_Interaction_Summary": "Elara and Orion work in perfect sync to solve the final part of the cosmic riddle, showcasing their deep bond and trust as Orion provides the final piece of guidance.",
//     "Character_Details": [
//       {
//         "Character_Name": "Elara",
//         "Clothing_Details": "A deep navy blue jumpsuit made of soft, velvety material, adorned with faint, silvery, embroidered constellations. She wears soft, grey felt boots.",
//         "Gaze_Direction": "Her gaze is locked with intense focus on the tip of the Star-Key as it aligns with a marking on the lock.",
//         "Expression": "A look of deep concentration and determination, with her brow furrowed and her lips pressed together.",
//         "Pose_and_Action": "She is holding the Star-Key with both hands, her fingers positioned delicately but firmly as she slowly turns it. Her posture is leaned in and focused."
//       },
//       {
//         "Character_Name": "Orion",
//         "Clothing_Details": "A tiny, leather scholar's cap with a small, brass telescope charm attached, perched jauntily between his feathered ear tufts.",
//         "Gaze_Direction": "Looking intently at the same alignment marking as Elara, his head cocked as if listening for the click.",
//         "Expression": "A calm, wise, and patient expression. His large, golden owl-eyes reflect the glow from the lock.",
//         "Pose_and_Action": "Perched securely on Elara's shoulder, he has his right wing slightly extended, the very tip of his longest feather pointing to the final symbol on the lock."
//       }
//     ],
//     "Focal_Action": "Elara gently turns the Star-Key, and as its tip aligns with the symbol Orion indicated, the lock emits a brilliant, warm glow.",
//     "Setting_and_Environment": "Inside a celestial observatory, the focus is on an ancient, ornate stone pedestal. The air is still and cool, smelling of old parchment and the faint, electric scent of ozone from the magical energy.",
//     "Time_of_Day_and_Atmosphere": "Late at night. The atmosphere is tense with anticipation and the quiet, thrilling excitement of a secret about to be unlocked.",
//     "Lighting_Description": "The only significant light source is the brilliant, magical golden light emanating from the celestial lock as the key turns. It casts sharp, dramatic shadows and highlights the intense concentration on both characters' faces.",
//     "Key_Storytelling_Props": [
//        {
//         "Object": "The Star-Key",
//         "Description": "A silver key with two interlocking, five-pointed stars at its head. The stars pulse with a soft, internal blue light."
//       },
//       {
//         "Object": "The Celestial Lock",
//         "Description": "An ancient, circular brass lock covered in rotating rings of constellations and glowing runes."
//       }
//     ],
//     "Background_Elements": "The background is deeply out of focus, showing only the blurred edge of a large, brass telescope and a few scattered, glowing star charts.",
//     "Hidden_Object": "A tiny, cartoonish Saturn with a friendly face and a floating ring is subtly carved into the scrollwork on the stone pedestal.",
//     "Dominant_Color_Palette": "Brilliant gold, deep brass, and midnight blue, with accents of silver and sapphire from the key and Elara's clothing."
//   },
//   "scene_text": [
//     "\"Just a little more,\" Orion hooted softly.",
//     "Elara took a deep breath, her heart thumping like a drum.",
//     "She turned the key one last time.",
//     "With a gentle *click*, the entire room was filled with a warm, golden light."
//   ]
// }
// \`\`\`

// ---
// #### **Front Cover Example (Multi-Character)**
// \`\`\`json
// {
//   "front_cover": {
//     "Present_Characters": ["Elara", "Orion"],
//     "Camera_Shot": "Medium",
//     "Cover_Concept": "A portrait of Elara and her wise companion Orion on the cusp of a cosmic adventure, inviting the reader to join their magical journey of discovery.",
//     "Focal_Point": "Elara and Orion sharing a look of wonder and excitement as they gaze towards a glowing constellation, with Elara holding the Star-Key.",
//     "Character_Placement": "Elara is in the foreground-center, with Orion perched on her shoulder. They are positioned in the lower two-thirds of the frame, leaving the top third of the image clear for title placement.",
//     "Character_Details": [
//       {
//         "Character_Name": "Elara",
//         "Clothing_Details": "A deep navy blue jumpsuit made of soft, velvety material, adorned with faint, silvery, embroidered constellations. She wears soft, grey felt boots.",
//         "Gaze_Direction": "Looking slightly upwards and just past the viewer with a bright, curious expression.",
//         "Expression": "A slight, knowing smile and wide, wonder-filled eyes, as if she sees the magic in the stars.",
//         "Pose_and_Action": "She is holding the Star-Key in one hand, while her other arm is slightly raised towards the sky, as if tracing a constellation."
//       },
//       {
//         "Character_Name": "Orion",
//         "Clothing_Details": "A tiny, leather scholar's cap with a small, brass telescope charm attached, perched jauntily between his feathered ear tufts.",
//         "Gaze_Direction": "Looking in the same direction as Elara, his head tilted with a wise and calm expression.",
//         "Expression": "His large, golden eyes are wide and knowing, reflecting the starlight.",
//         "Pose_and_Action": "Perched securely on Elara's shoulder, one wing is slightly extended as if gesturing towards the sky with her."
//       }
//     ],
//     "Background_Setting": "A fantastical, magical forest clearing at night. The trees shimmer with nebula-like colors, and the path before them appears to be made of starlight.",
//     "Key_Visual_Elements": [
//       {
//         "Object": "The Star-Key",
//         "Description": "A silver key with two interlocking, five-pointed stars at its head. The stars pulse with a soft, internal blue light."
//       }
//     ],
//     "Lighting_and_Mood": "Warm, magical light emanates from the starlight path and the key, creating a hopeful and adventurous mood. The overall atmosphere is one of wonder, friendship, and gentle excitement.",
//     "Color_Palette": "A vibrant palette of deep indigo blues and purples, contrasted with the glowing golds and silvers of the starlight and the key."
//   }
// }
// \`\`\``;
//   } else {
//     // --- EXAMPLE FOR SINGLE CHARACTER STORY ---
//     return `### Example of Excellence (Single Character Story)

// **Input**: \`kidName\`: "Leo", \`age\`: 6, \`theme\`: "Educational", \`subject\`: "Gardening", \`storyRhyming\`: false.

// ---
// #### **Scene Example (Single Character, Medium Shot)**
// \`\`\`json
// {
//   "scene_description": {
//     "Scene_Number": 5,
//     "Present_Characters": ["Leo"],
//     "Camera_Shot": "Medium",
//     "Composition_and_Blocking": "Leo is positioned slightly off-center to the left, kneeling on the ground, which makes him appear small next to the large, wilting magical plant that dominates the right side of the frame. An overturned watering can lies in the immediate foreground, drawing the eye into the scene.",
//     "Character_Interaction_Summary": "",
//     "Character_Details": [
//       {
//         "Character_Name": "Leo",
//         "Clothing_Details": "A bright yellow raincoat with oversized wooden toggle buttons, navy blue rain boots with green frog faces on the toes, and a red-and-white striped beanie.",
//         "Gaze_Direction": "Staring at the drooping head of the magical flower with a look of deep concern.",
//         "Expression": "A worried frown, with his eyebrows furrowed and the corners of his mouth turned down. His cheeks are slightly puffed in a frustrated sigh.",
//         "Pose_and_Action": "He is kneeling on a patch of moss, shoulders slumped in disappointment. His hands are resting limply on his knees, palms up, in a gesture of helplessness."
//       }
//     ],
//     "Focal_Action": "Leo watches as the last petal of the glowing Moonpetal flower begins to lose its light and droop.",
//     "Setting_and_Environment": "A magical, hidden garden that now feels somber. The normally vibrant, oversized plants seem to have lost some of their color. The air, which usually smells sweet, now has a hint of dry dust and decay.",
//     "Time_of_Day_and_Atmosphere": "Mid-day, but the atmosphere is heavy and disheartening. The sunlight is harsh and direct, failing to bring life to the wilting plants.",
//     "Lighting_Description": "Harsh, direct overhead sunlight washes out some of the garden's color and casts short, sharp shadows. The fading, soft blue light from the wilting Moonpetal flower provides a weak, sad counterpoint, highlighting the disappointment on Leo's face.",
//     "Key_Storytelling_Props": [
//       {
//         "Object": "The Moonpetal Plant",
//         "Description": "A tall, elegant plant with a single, large, bell-shaped flower whose five petals once glowed with a soft, internal blue light. The petals are now drooping and their luminescence is fading to a dull grey."
//       },
//       {
//         "Object": "The Watering Can",
//         "Description": "A small, child-sized, bright red plastic watering can with a yellow spout, now lying on its side with a few drops of water leaking out."
//       }
//     ],
//     "Background_Elements": "In the background, a stream that was once sparkling now flows sluggishly. A family of tiny, purple-winged fairies are huddled together on a mushroom, looking on with sad expressions.",
//     "Hidden_Object": "A tiny garden gnome, usually cheerful, is hidden behind a rock, now holding a miniature umbrella even though it is not raining.",
//     "Dominant_Color_Palette": "Faded greens and desaturated browns, with the dull grey of the wilting flower and the harsh white of the sunlight creating a somber mood."
//   },
//   "scene_text": [
//     "The garden wasn't supposed to be sad.",
//     "Leo had followed all the rules.",
//     "But the beautiful Moonpetal flower was still drooping.",
//     "\"What did I do wrong?\" he whispered to a little ladybug."
//   ]
// }
// \`\`\`

// ---
// #### **Front Cover Example (Single Character)**
// \`\`\`json
// {
//   "front_cover": {
//     "Present_Characters": ["Leo"],
//     "Camera_Shot": "Medium",
//     "Cover_Concept": "A portrait of Leo at the beginning of his magical gardening adventure, filled with a sense of wonder and the promise of something amazing about to happen.",
//     "Focal_Point": "Leo's face, lit with awe as he holds the glowing Rainbow Seed, which serves as the central point of light and color.",
//     "Character_Placement": "Leo is positioned in the lower-center of the frame, looking slightly upwards and towards the viewer. This composition leaves the top third of the image open and less cluttered for title placement.",
//     "Character_Details": [
//       {
//         "Character_Name": "Leo",
//         "Clothing_Details": "A bright yellow raincoat with oversized wooden toggle buttons, navy blue rain boots with green frog faces on the toes, and a red-and-white striped beanie.",
//         "Gaze_Direction": "Looking just past the viewer with a bright, curious expression.",
//         "Expression": "A wide, joyful smile with wonder-filled eyes, as if sharing a magical secret with the reader.",
//         "Pose_and_Action": "He is holding the glowing Rainbow Seed cupped carefully in both hands, presenting it forward slightly as if to show it off."
//       }
//     ],
//     "Background_Setting": "A fantastical, sun-drenched garden where the plants and flowers shimmer with soft, internal light and the grass is a vibrant, glowing green. The scale is slightly exaggerated to feel magical.",
//     "Key_Visual_Elements": [
//       {
//         "Object": "The Rainbow Seed",
//         "Description": "A single, iridescent, tear-drop shaped seed that pulses with a soft, inner light and slowly shifts through all the colors of the rainbow."
//       }
//     ],
//     "Lighting_and_Mood": "Bright, magical 'golden hour' lighting that feels warm, inviting, and full of optimism. The mood is one of wonder and gentle excitement.",
//     "Color_Palette": "A high-contrast palette of vibrant greens, glowing golds, and soft rainbow highlights from the seed to create a feeling of pure magic."
//   }
// }
// \`\`\``;
//   }
// }

// export const brevityPrompt = (age: number) =>
//   `
// ### Brevity & Reading Level (Age-Adaptive)

// ${
//   age <= 2
//     ? `- Target: 1 sentence, 5–15 words total (≤ 15 words/sentence).
// - Goal: Flesch–Kincaid ≤ 0.5.
// - Style: name-and-point language; onomatopoeia; gentle repetition; present tense.
// - Preference: Aim for the mid-range.`
//     : age <= 4
//       ? `- Target: 1–3 sentences, 20–45 words total (≤ 12 words/sentence).
// - Goal: Flesch–Kincaid ≤ 1.5.
// - Style: simple SVO; concrete nouns & actions; light repetition.
// - Preference: Aim near the UPPER end of the range.`
//       : age <= 6
//         ? `- Target: 2–4 sentences, 40–80 words total (≤ 15 words/sentence).
// - Goal: Flesch–Kincaid ≤ 2.5.
// - Style: simple connectors (and, but, because); short dialogue OK; mostly 1–2 syllable words.
// - Preference: Aim near the UPPER end of the range.`
//         : age <= 8
//           ? `- Target: 3–5 sentences, 70–120 words total (≤ 18 words/sentence).
// - Goal: Flesch–Kincaid ≤ 3.5.
// - Style: light description; mild figurative language; short, clear clauses.
// - Preference: Aim near the UPPER end of the range.`
//           : `- Target: 5–8 sentences, 120–220 words total (≤ 20 words/sentence).
// - Goal: Flesch–Kincaid ≤ 5.5.
// - Style: richer description; light subplots; occasional metaphor.
// - Preference: Aim near the UPPER end of the range.`
// }

// - Keep sentences independent (no run-ons), active voice, concrete imagery tied to illustrations.
// - Avoid advanced vocabulary, idioms, or complex timelines for ages ≤ 8.
// `.trim();

// // function createValidationPrompt(hasCharacters: boolean) {
// //   return `You are an expert children's storybook validator. Your task is to thoroughly validate a story for children aged 3-8, ensuring it meets high standards for quality, appropriateness, and educational value.

// // ## Validation Criteria:

// // ### 1. Character Consistency & Development
// // - **Character Consistency**: All characters maintain consistent personalities, appearances, and behaviors throughout the story
// // - **Character Development**: Each character shows meaningful growth or change
// // - **Character Balance**: All characters receive appropriate screen time and development (especially important for multiple character stories)
// // - **Character Real Estate**: Each character has distinct roles and moments to shine

// // ### 2. Story Structure & Quality
// // - **Story Structure**: Follows the nine-beat narrative arc properly
// // - **Scene Variety**: Scenes vary in pacing, setting, and emotional tone
// // - **Pacing**: Story flows well with appropriate rhythm and timing
// // - **Dialogue Quality**: Conversations are natural, age-appropriate, and advance the plot

// // ### 3. Age Appropriateness & Safety
// // - **Age Appropriateness**: Content is suitable for children aged 3-8
// // - **Educational Value**: Story teaches positive lessons or skills
// // - **Emotional Engagement**: Story connects emotionally with young readers
// // - **Safety**: No inappropriate content, violence, or scary elements

// // ### 4. Visual & Technical Quality
// // - **Visual Consistency**: All scenes are visually coherent and engaging
// // - **Moral Integration**: The moral lesson is naturally woven into the story
// // - **Environmental Storytelling**: Settings and environments support the narrative
// // - **Interactive Elements**: Hidden objects and visual details enhance engagement

// // ### 5. Multi-Character Specific Validations
// // - **Character Limit**: Maximum of 4 characters total (1 main + 3 additional)
// // - **Character Distribution**: Each character appears in multiple scenes
// // - **Interaction Quality**: Character interactions are meaningful and advance the plot
// // - **Role Clarity**: Each character has a clear, distinct role in the story
// // - **Screen Time Balance**: No character dominates or is neglected

// // ### 6. Dynamic Field Validation
// // - **Required Fields**: All fields must be present - Character_Interaction_Summary should be empty strings ("") for single-character scenes, Lighting_Description should always have descriptions
// // - **Required Fields**: Composition_and_Blocking should always be present
// // - **Character Details**: Should match the number of characters in Present_Characters
// // - **Empty Arrays**: Present_Characters should never be empty

// // ## Validation Process:
// // 1. Check each criterion thoroughly
// // 2. Flag any issues with specific details
// // 3. Provide actionable suggestions for improvement
// // 4. Ensure all characters are properly utilized

// // ## Output Format:
// // Return a JSON object with a "results" array containing exactly ${hasCharacters ? "12" : "13"} validation check objects. Each object must have:

// // {
// //   "results": [
// //     {
// //       "check_name": "Character Consistency",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Character Development",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Character Balance",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Character Real Estate",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Story Structure",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Scene Variety",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Pacing",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Dialogue Quality",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Age Appropriateness",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Educational Value",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Emotional Engagement",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     },
// //     {
// //       "check_name": "Safety",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     }
// //     ${
// //       hasCharacters
// //         ? ""
// //         : `,
// //     {
// //       "check_name": "Visual Consistency",
// //       "Validation": "Pass" | "Fail",
// //       "Problem": "Description of the issue (if Validation is Fail)",
// //       "Solution": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
// //     }`
// //     }
// //   ]
// // }

// // ## Special Multi-Character Checks:
// // - Verify that all input characters are present in the story
// // - Check that no unauthorized characters appear
// // - Ensure character interactions are meaningful
// // - Validate that each character contributes to the plot
// // - Confirm balanced screen time distribution
// // - Check that Character_Interaction_Summary is empty for single characters and descriptive for multiple characters
// // - Ensure Lighting_Description always provides atmospheric details for all scenes

// // ## Dynamic Field Validation Examples:

// // ### Single Character Scene Validation:
// // - Present_Characters: ["Alex"] ✓
// // - Character_Interaction_Summary: "" (empty string) ✓
// // - Lighting_Description: "Soft light illuminates Alex's face..." ✓
// // - Character_Details: 1 entry ✓

// // ### Multiple Character Scene Validation:
// // - Present_Characters: ["Alex", "Luna"] ✓
// // - Character_Interaction_Summary: "Alex and Luna work together..." ✓
// // - Lighting_Description: "Warm light illuminates both characters..." ✓
// // - Character_Details: 2 entries ✓

// // ### Invalid Single Character Scene:
// // - Present_Characters: ["Alex"] ✓
// // - Character_Interaction_Summary: "Alex talks to Luna" ✗ (Should be empty string)
// // - Lighting_Description: "" (empty string) ✗ (Should describe lighting for the scene)

// // ### Invalid Multiple Character Scene:
// // - Present_Characters: ["Alex", "Luna"] ✓
// // - Character_Interaction_Summary: "" (empty string) ✗ (Should describe interaction)
// // - Lighting_Description: "" (empty string) ✗ (Should describe lighting for multiple characters)

// // Remember: A valid story should be engaging, educational, and appropriate for young children while giving all characters meaningful roles and development. The dynamic field handling is crucial for proper story generation and image creation.`;
// // }

// /**
//  * Creates a dynamic validation prompt for a children's story concept.
//  * @param {boolean} hasCharacters - True if the story includes custom side characters, false otherwise.
//  * @returns {string} The validation prompt for the AI model.
//  */
// export function createValidationPrompt(hasCharacters: boolean) {
//   // The number of validation checks is consistent to simplify parsing.
//   // The 'Character Role Consistency' check will be conditionally evaluated.
//   const totalChecks = 9;

//   return `You are an expert Story Concept Validator for a children's storybook company. Your primary function is to determine if a user's custom story idea is feasible for creation as a 9-page illustrated book for children aged 3-8. Your analysis must be strict, systematic, and focused solely on feasibility.

// ## Primary Directive:
// You will be given a JSON object containing a user's story idea. You must perform a comprehensive series of ${totalChecks} validation checks on the subject of the story. Your entire output must be a single, machine-readable JSON object with a "results" key. The value of this key must be a JSON array containing exactly ${totalChecks} validation result objects.

// ## Input Story Concept Schema:
// {
//   "kidName": "string",
//   "age": "integer",
//   "characters": ["string"], // Array of side character names. Can be empty.
//   "character_descriptions": ["string"] // Array of side character descriptions. Can be empty.
//   "subject": "string" // The user's custom story text. This is what needs to be validated.
// }

// ---
// ## Validation Checklist & Rules
// You must evaluate the 'subject' against the following checks.

// ### 1. Age Appropriateness & Safety
// - **Logic:** Scan the 'subject' for any themes, actions, or language that are too scary, violent, or complex for a 1-8 year old.
// - **Pass Example:** "A story about helping a lost puppy find its way home."
// - **Fail Example:** "A story where pirates have a sword fight to get treasure."

// ### 2. Policy Compliance
// - **Logic:** Scan all inputs for copyrighted characters (e.g., from Disney, Marvel), real-world brands, or harmful stereotypes.
// - **Pass Example:** "Leo and his friend, a magical creature named Sparklehoof."
// - **Fail Example:** "Leo and Mickey Mouse go to McDonalds for a happy meal."

// ### 3. Core Premise Viability
// - **Logic:** The 'subject' must contain a basic, actionable idea. It cannot be empty, nonsensical, or just a statement of fact.
// - **Pass Example:** "A little girl who finds a magic seed that grows into a candy tree."
// - **Fail Example:** "A story." or "The main character is a boy."

// ### 4. Protagonist Focus
// - **Logic:** The 'subject' must allow the main child ('kidName') to be the central character who drives the action.
// - **Pass Example:** "Mia and her robot friend build a rocket ship to fly to the moon."
// - **Fail Example:** "A story about the adventures of a robot, and Mia is there watching him."

// ### 5. Narrative Complexity
// - **Logic:** The premise must be simple enough for a 9-page story. It should not involve complex plots, excessive world-building, or too many events.
// - **Pass Example:** "Two friends have to work together to get their kite out of a tall tree."
// - **Fail Example:** "A story about the complex political history of the enchanted forest and the multi-generational feud between the elves and the goblins."

// ### 6. Extraneous Character Introduction
// - **Logic:** The 'subject' must NOT introduce any characters by name or role that are not defined in the input 'characters' array. The story can only feature 'kidName' and the provided side characters.
// - **Pass Example:** (Given characters: ["Pip"]): "Leo and Pip the squirrel search for a giant acorn."
// - **Fail Example:** (Given characters: ["Pip"]): "Leo and Pip meet a friendly bear named Barnaby in the woods."

// ### 7. Character Role Consistency
// - **Logic:** ${
//     hasCharacters
//       ? "Compare the role of each side character in the 'subject' with their given 'character_descriptions'. The character's actions in the story must align with their described personality."
//       : "This check is not applicable as there are no side characters. You must return 'Pass'."
//   }
// - **Pass Example:** (Description: "a brave knight"): "Sir Reginald the knight helps the princess cross a scary bridge."
// - **Fail Example:** (Description: "a very shy and quiet bunny"): "Bouncer the bunny decides to host a loud rock concert for the whole forest."

// ### 8. Visual Concreteness
// - **Logic:** The core concepts in the 'subject' must be concrete and visually representable. Avoid highly abstract ideas that cannot be clearly illustrated.
// - **Pass Example:** "A story about a car that can fly and swim underwater."
// - **Fail Example:** "A story that explains the concept of quantum physics to children."

// ### 9. Visual Policy Adherence
// - **Logic:** The story premise must not fundamentally rely on elements that are forbidden by image generation guidelines, such as readable text, numbers, or logos.
// - **Pass Example:** "The children follow a treasure map marked with a skull symbol."
// - **Fail Example:** "The hero solves the riddle by reading the secret message written on the wall."

// ---
// ## Required Output Format:
// Your output MUST be a single JSON object. The "results" array must contain exactly ${totalChecks} objects. For any "Fail" validation, provide a concise problem description and 1-2 actionable solutions. For "Pass", "Problem" must be an empty string and "Solution" must be an empty array.

// {
//   "results": [
//     {
//       "check_name": "Age Appropriateness & Safety",
//       "Validation": "Pass" | "Fail",
//       "Problem": "...",
//       "Solution": ["..."]
//     },
//     // ... (8 more result objects)
//   ]
// }
// `;
// }

// // Legacy export for backward compatibility
// export const UNIFIED_VALIDATION_PROMPT = createValidationPrompt(false);
// prompts.ts

import {
  isCustomTheme,
  generateStoryPremiseSection,
} from "./enhancedSubjectPrompts";

// ---- Scene count single source of truth ----
const sceneCount =
  typeof (globalThis as any).sceneCount === "number"
    ? (globalThis as any).sceneCount
    : 11; // default to 11 if not injected
// --------------------------------------------

export interface StoryInputs {
  kidName: string;
  pronoun: string;
  age: number;
  theme: string;
  subject: string;
  storyRhyming: boolean;
  characters?: string[];
  characterDescriptions?: string[];
}

export function createDynamicStoryPrompt(inputs: StoryInputs): string {
  const {
    kidName,
    pronoun,
    age,
    theme,
    subject,
    storyRhyming,
    characters = [],
    characterDescriptions = [],
  } = inputs;

  const totalCharacters = characters.length + 1; // +1 for main character
  const hasAdditionalCharacters = characters.length > 0;
  const isCustom = isCustomTheme(theme);

  const characterInteractionField = hasAdditionalCharacters
    ? `""Character_Interaction_Summary"": Describe how characters interact, communicate, or relate to each other in this scene. This field is REQUIRED for all scenes with multiple characters and should provide meaningful detail about character dynamics. A brief, one-sentence summary of the emotional and physical dynamic between the characters. E.g., ${kidName} looks to ${characters[0]} for reassurance, and ${characters[0]} offers a comforting hand on ${pronoun} shoulder.' If only one character is present, this field must be null.`
    : "";

  const narrativeArcName =
    sceneCount === 11 ? "Eleven-Beat Narrative Arc" : "Nine-Beat Narrative Arc";
  const narrativeArcBeats =
    sceneCount === 11
      ? "Ordinary world & gentle curiosity; A small, inviting discovery (inciting moment); Decision to take a tiny brave step; Enter the new space (first threshold); Learn & explore (fun progress); Midpoint surprise or new rule; Stakes rise (the problem complicates); A setback or confusion; Lightbulb idea or help appears; The push to do the brave thing (climax); Warm resolution, tiny lesson, cozy return."
      : "Setup, Inciting Incident, First Plot Point, First Pinch Point, Midpoint, Second Plot Point, Second Pinch Point, Climax, and Resolution.";

  return `You are a world-class expert in generating hyper-personalized children's storybooks. Your function is to translate user-defined variables into a complete, ${sceneCount}-scene story structure. Your output must be a single, machine-readable JSON object, meticulously designed for direct processing by sophisticated image and text generation engines.

## Primary Directive:
Given a set of input variables, you will first generate the complete ${sceneCount}-scene story. Then, based on that story, you will generate a compelling title and a front cover description. Your final output must be a single, machine-readable JSON object containing three top-level keys: \`story_title\` (a string), \`front_cover\` (a JSON object defining the book cover), and \`scenes\` (a JSON array of ${sceneCount} scene objects).

---
## Core Principles (Universal Rules):

1.  **Singleton Definition for Consistency**: This is a CRITICAL rule to ensure absolute visual consistency.

    1.1 * **Recurring Props**: The first time a prop or an animal( other than the kid or the provided 'characters' ) is introduced in \`Key_Storytelling_Props\`, describe it in great detail in the "Description" field. In every subsequent scene where that same prop appears, you **must** reuse that exact, copy-pasted, detailed description. This makes each scene a self-contained brief for the image generator.

    1.2 * **Recurring Characters (Apparel)**: A character's complete outfit, including all accessories, **must** be defined in the \`Clothing_Details\` field for that character in Scene 1. For every subsequent scene, that exact \`Clothing_Details\` string **must** be copy-pasted for that character. If an event in the story alters their clothing (e.g., it gets wet), you must append the change to the original description. (e.g., "A bright red t-shirt with a rocket ship on the front, blue denim shorts, and white sneakers with yellow laces. The shirt and shorts are now damp and covered in mud.").

2.  **${narrativeArcName}**: All stories **must** follow this structure: ${narrativeArcBeats} This ensures a compelling and well-paced narrative.

3.  **Safety First**: The world portrayed is **always** safe and reassuring. Absolutely **no** sharp objects (unless story-critical and handled safely), dangerous situations, or truly menacing creatures.

4.  **Emotional Journey:**
    * The hero, ${kidName}, **must** display at least four distinct, age-appropriate emotions throughout the ${sceneCount} scenes (e.g., curiosity, frustration, courage, joy).

5.  **Art Direction & Technical Excellence:**
    * **Targeted Art Direction:** You must directly address and control for common weaknesses in image generation models, especially character gaze, hand positioning, and spatial relationships, using the specified JSON fields.
    * **Dynamic Environments:** Each scene **must** feature a distinct setting or a significant change in the existing setting (e.g., location, weather, time of day) to ensure visual variety.
    * **Cinematic Shot Variety:** Strictly adhere to a repeating camera shot pattern: **Wide** (Scenes 1, 4, 7, 10), **Medium** (Scenes 2, 5, 8, 11), **Close-up** (Scenes 3, 6, 9).
    * **Purposeful Lighting & Color:** Use lighting to dictate mood (soft warm light for calm, high-key for action) and employ color-blind-safe palettes (prioritizing blue/orange and yellow/purple).
    * **Composition:** Characters should generally be placed off-center (Rule-of-Thirds), unless a symmetrical shot is dramatically required.
    * **World Building:** By Scene 2, include a non-tokenized background character or animal that adds life to the world. Include a recurring "hidden object" in **every scene** for reread value.

6.  **Character Roles & Dynamics:**
    * ${kidName} is always the protagonist and the emotional core of the story. The narrative arc is ${pronoun} journey.
${
  hasAdditionalCharacters
    ? `
    * The other characters are sidekicks, supporting ${kidName} and adding depth to the story and should not be the main focus of the story.`
    : ""
}

7. **Dramatic Pacing and Character Presence:** For narrative and visual variety, **at least one** of the ${sceneCount} scenes **must be a character-free shot**. This scene should be used for dramatic effect—to build suspense, establish a beautiful or imposing environment, or focus entirely on a key storytelling prop. 
    * All character-related fields in the JSON for this scene will be empty or null. 
    * This should be a scene in the middle of the story, not at the beginning or the end.

8. **Continuity & Flow Rules:**
   **Continuity (Non-Output Rule):** For scenes 2–${sceneCount}, the first line of story_text must gently reference the prior scene using a temporal or causal connector (e.g., “After that…”, “Because of the glowing shell…”, “Later that day…”). 
   For scenes 1–${sceneCount - 1}, the last line of story_text should softly set a micro-goal or question that leads into the next page (no cliffhangers; cozy curiosity). 
   Scene ${sceneCount} must close the loop warmly. 

   **Open & Close Formula:** Scene 1 (3 lines): ordinary world → gentle trigger → small decision. 
   Scene ${sceneCount} (2–3 lines): calm resolution → child-friendly lesson → cosy final image.

---
## Story Context:
- **Main Character**: ${kidName} (age ${age}, pronouns: ${pronoun})
- **Theme**: ${theme}
- **Subject**: ${subject}
- **Rhyming Style**: ${storyRhyming ? "Include rhyming text that flows naturally" : "Use clear, simple prose"}
- **Total Characters**: ${totalCharacters} (${kidName}${characters.length > 0 ? ` + ${characters.join(", ")}` : " only"})

---
${generateStoryPremiseSection(theme, subject, isCustom, age)}
---
${generateCharacterSection(totalCharacters, characters, characterDescriptions, kidName)}
---

## Part 1: Generating \`scenes\`

The \`scenes\` array is the core of the story. Each scene object contains a \`scene_description\` (a technical and artistic brief for the image generator) and a \`scene_text\` (the narrative for the page).

### Guiding Philosophy for \`scene_description\`:
* **Emotional Journey**: The hero, ${kidName}, **must** display at least four distinct, age-appropriate emotions throughout the ${sceneCount} scenes (e.g., joy, curiosity, frustration, courage, relief, pride, wonder).
* **Dynamic Environments**: Each scene **must** feature a distinct setting or a significant change in the existing setting.
* **Cinematic Shot Variety**: Strictly adhere to a repeating camera shot pattern: **Wide** (Scenes 1, 4, 7, 10), **Medium** (Scenes 2, 5, 8, 11), **Close-up** (Scenes 3, 6, 9).
* **Purposeful Composition**: The main character, ${kidName}, should generally be placed off-center to follow the rule-of-thirds.
* **Hidden Object**: Include a small, recurring "hidden icon" in the props or background of **every scene**.
* **Self-Validation Check**: Before outputting, check that total scenes = ${sceneCount} and Scene_Number spans 1–${sceneCount}.
* **Self-Validation Check**: Check that each scene’s Camera_Shot matches the schedule: W (1,4,7,10), M (2,5,8,11), C (3,6,9).

### Continuity & Flow (CRITICAL REMINDER):
**Continuity (Non-Output Rule):** For scenes 2–${sceneCount}, the first line of story_text must gently reference the prior scene using a temporal or causal connector (e.g., “After that…”, “Because of the glowing shell…”, “Later that day…”). 
For scenes 1–${sceneCount - 1}, the last line of story_text should softly set a micro-goal or question that leads into the next page (no cliffhangers; cozy curiosity). 
Scene ${sceneCount} must close the loop warmly. 

**Open & Close Formula:** Scene 1 (3 lines): ordinary world → gentle trigger → small decision. 
Scene ${sceneCount} (2–3 lines): calm resolution → child-friendly lesson → cosy final image.

### Unified Scene Definition (Non-Negotiable Structure)

You **must** use these exact keys in this exact order for every scene's \`scene_description\`.

\`\`\`json
{
  "Scene_Number": "Integer (1-${sceneCount})",
  "Present_Characters": " Array of character names in this scene. For character-free scenes, this array must be empty: [].",
  "Camera_Shot": "Wide Shot | Medium Shot | Close-up Shot. (Follows the strict pattern: W: 1,4,7,10; M: 2,5,8,11; C: 3,6,9).",
  "Composition_and_Blocking": "Crucial for spatial realism. Describe the exact placement and orientation of characters relative to each other and the environment.",
  ${characterInteractionField}
  "Character_Details": "An array of objects, one for each character in the 'Present_Characters' list. If a character is not present, this array will be empty.",
  "Focal_Action": "The single most important action in the scene, described with a strong, present-tense verb.",
  "Setting_and_Environment": "Hyper-specific description of the primary setting. Include 2-3 sensory details (smell, sound, texture).",
  "Time_of_Day_and_Atmosphere": "Describe the time of day and the overall mood/feeling of the scene.",
  "Lighting_Description": "Describe the light source, quality, and how it affects the mood.",
  "Key_Storytelling_Props": [
      {
        "Object": "The name of the prop or animal.",
        "Description": "A detailed, consistent description."
      }
  ],
  "Background_Elements": "Add depth. Describe 1-2 distinct background elements.",
  "Hidden_Object": "The recurring hidden icon for the child to find, explicitly described.",
  "Dominant_Color_Palette": "Primary colors driving the scene's mood, tied to the emotional tone and visual style."
}
\`\`\`

---
## Part 2: Generating \`scene_text\`

The \`scene_text\` is the narrative that accompanies each illustration.

* **Format**: A JSON array of strings. Each string is a line of text on the page.
* **Natural Line Breaks:** Break the narrative into separate strings to create a natural reading rhythm.
* **Rhyming Logic**: ${storyRhyming ? "Write in a simple, natural AABB or ABAB rhyming scheme. The rhymes must never feel forced." : "Do not use rhyming text. Write in a clear, simple prose."}
* **Complement, Don't Describe**: The text must add emotional or psychological depth. It should **never** state what is already obvious in the image.
* **Brevity and Reading Level**: ${brevityPrompt(age)}

---
## Part 3: Generating \`story_title\`
After generating all ${sceneCount} scenes, create a compelling story title. The title should be a single sentence, 3-5 words.

---
## Part 4: Generating \`front_cover\`
After generating the scenes and title, you will design the book's front cover. This image should be different from the scenes and not feel repetitive.

### The Cover Definition (Non-Negotiable Structure)
\`\`\`json
{
  "Present_Characters":  "Array of character names on the cover",
  "Cover_Concept": "A one-sentence summary of the cover's core idea.",
  "Camera_Shot": "Wide | Medium | Close-up Shot.",
  "Focal_Point": "The central visual element.",
  "Character_Placement": "Describes the composition of characters, paying special attention to leaving space for the title.",
  "Character_Details": [
    {
      "Character_Name": "Character's exact name.",
      "Clothing_Details": "The character's primary, consistent outfit from the story.",
      "Gaze_Direction": "Direction of the gaze, aimed to be engaging.",
      "Expression": "A clear, positive expression.",
      "Pose_and_Action": "A dynamic pose."
    }
  ],
  "Background_Setting": "A vibrant, slightly idealized depiction of a key story environment.",
  "Key_Visual_elements": [ "An array of 1-2 iconic objects or symbols from the story." ],
  "Lighting_and_Mood": "Describes the lighting style and atmosphere.",
  "Color_Palette": "A vibrant, eye-catching, high-contrast color scheme."
}
\`\`\`

---
## Examples of Excellence
${generateDynamicExample(hasAdditionalCharacters)}

---
## Final Output Structure
Your final response must be a single, valid JSON object matching this structure:
\`\`\`json
{
  "story_title": "Example Title",
  "front_cover": {
    // ...front cover object structure...
  },
  "scenes": [
    {
      // ...scene 1 object...
    },
    // ...${sceneCount - 1} more scene objects...
  ]
}
\`\`\`
`;
}

// ... (The rest of the `prompts.ts` file, including generateCharacterSection, generateDynamicExample, brevityPrompt, and createValidationPrompt, remains unchanged as it was not part of the modification request.)
function generateCharacterSection(
  totalCharacters: number,
  characters: string[],
  characterDescriptions: string[],
  kidName: string,
): string {
  if (totalCharacters === 1) {
    return `## Character Guidelines (Single Character Story):

### Main Character Focus:
- **${kidName}** is the sole protagonist and drives all story action.
- The story must focus entirely on ${kidName}'s journey, growth, and internal development.
- Create rich environmental storytelling and use supporting elements (animals, objects, nature) to create dynamic scenes.
- Ensure ${kidName} makes all key decisions and faces all challenges personally, showing resourcefulness and problem-solving skills.`;
  }

  const scenesPerCharacter = Math.floor(sceneCount * 0.6); // General guidance for side characters

  if (totalCharacters === 2) {
    const sideCharacter = characters[0];
    const sideCharacterDesc = characterDescriptions[0] || "a helpful companion";

    return `## Character Guidelines (Two Character Story):

### Character Roles:
- **${kidName} (Protagonist)**: Remains the primary focus, appearing in ${sceneCount - 2}-${sceneCount} scenes. The story is their journey.
- **${sideCharacter} (Sidekick)**: Described as "${sideCharacterDesc}". Appears in ${scenesPerCharacter}-${scenesPerCharacter + 1} scenes, providing support and dynamic interaction.

### Character Dynamics:
- Create a complementary relationship (e.g., leader/follower, mentor/student).
- Include scenes where they work together and scenes where ${kidName} is alone to maintain focus.
- Show how their different strengths contribute to solving problems.`;
  }

  if (totalCharacters === 3) {
    const [char1, char2] = characters;
    const [desc1, desc2] = characterDescriptions;

    return `## Character Guidelines (Three Character Story):

### Character Roles & Screen Time:
- **${kidName} (Protagonist)**: Appears in all ${sceneCount} scenes. The central figure and decision-maker.
- **${char1}**: (${desc1 || "important companion"}). Appears in ${scenesPerCharacter}-${scenesPerCharacter + 2} scenes with a strong secondary role.
- **${char2}**: (${desc2 || "valuable team member"}). Appears in ${scenesPerCharacter - 1}-${scenesPerCharacter} scenes with a meaningful tertiary role.

### Group Dynamics:
- Ensure each character has a distinct personality and contributes unique skills.
- Create triangular dynamics. Include scenes with all three characters, pairs of characters, and ${kidName} alone.`;
  }

  if (totalCharacters === 4) {
    const [char1, char2, char3] = characters;
    const [desc1, desc2, desc3] = characterDescriptions;

    return `## Character Guidelines (Four Character Story - Maximum):

### Character Roles & Screen Time (Critical Balance):
- **${kidName} (Protagonist)**: All ${sceneCount} scenes. The unifying element and leader.
- **${char1}**: (${desc1 || "key team member"}). Appears in ${scenesPerCharacter - 1}-${scenesPerCharacter} scenes (strong secondary).
- **${char2}**: (${desc2 || "important companion"}). Appears in ${scenesPerCharacter - 2}-${scenesPerCharacter - 1} scenes (solid tertiary).
- **${char3}**: (${desc3 || "valuable contributor"}). Appears in ${scenesPerCharacter - 3}-${scenesPerCharacter - 2} scenes (meaningful quaternary).

### Group Management:
- Balance screen time carefully; each side character needs at least 2-3 significant scenes.
- Create clear roles. Include large group scenes and smaller character combinations to allow for deeper interactions.`;
  }

  return ""; // Should not reach here
}

function generateDynamicExample(hasAdditionalCharacters: boolean): string {
  // This function's content remains unchanged as it provides a static example.
  // The principles it demonstrates are still valid for the 11-scene structure.
  if (hasAdditionalCharacters) {
    // --- EXAMPLE FOR MULTI-CHARACTER STORY ---
    return `### Example of Excellence (Multi-Character Story)

**Input**: \`kidName\`: "Elara", \`age\`: 7, \`theme\`: "Fairy Tales", \`subject\`: "Stargazing", \`storyRhyming\`: false, \`characters\`: ["Orion"], \`characterDescriptions\`: ["a small, wise star-owl"].

---
#### **Scene Example (Multi-Character, Close-up Shot)**
\`\`\`json
{
  "scene_description": {
    "Scene_Number": 6,
    "Present_Characters": ["Elara", "Orion"],
    "Camera_Shot": "Close-up",
    "Composition_and_Blocking": "The frame is a tight close-up focused on Elara's hands as she holds the Star-Key over a celestial lock. Orion is perched on her left shoulder, his head and body angled in towards the key, creating a triangular composition that focuses all attention on the central action.",
    "Character_Interaction_Summary": "Elara and Orion work in perfect sync to solve the final part of the cosmic riddle, showcasing their deep bond and trust as Orion provides the final piece of guidance.",
    "Character_Details": [
      {
        "Character_Name": "Elara",
        "Clothing_Details": "A deep navy blue jumpsuit made of soft, velvety material, adorned with faint, silvery, embroidered constellations. She wears soft, grey felt boots.",
        "Gaze_Direction": "Her gaze is locked with intense focus on the tip of the Star-Key as it aligns with a marking on the lock.",
        "Expression": "A look of deep concentration and determination, with her brow furrowed and her lips pressed together.",
        "Pose_and_Action": "She is holding the Star-Key with both hands, her fingers positioned delicately but firmly as she slowly turns it. Her posture is leaned in and focused."
      },
      {
        "Character_Name": "Orion",
        "Clothing_Details": "A tiny, leather scholar's cap with a small, brass telescope charm attached, perched jauntily between his feathered ear tufts.",
        "Gaze_Direction": "Looking intently at the same alignment marking as Elara, his head cocked as if listening for the click.",
        "Expression": "A calm, wise, and patient expression. His large, golden owl-eyes reflect the glow from the lock.",
        "Pose_and_Action": "Perched securely on Elara's shoulder, he has his right wing slightly extended, the very tip of his longest feather pointing to the final symbol on the lock."
      }
    ],
    "Focal_Action": "Elara gently turns the Star-Key, and as its tip aligns with the symbol Orion indicated, the lock emits a brilliant, warm glow.",
    "Setting_and_Environment": "Inside a celestial observatory, the focus is on an ancient, ornate stone pedestal. The air is still and cool, smelling of old parchment and the faint, electric scent of ozone from the magical energy.",
    "Time_of_Day_and_Atmosphere": "Late at night. The atmosphere is tense with anticipation and the quiet, thrilling excitement of a secret about to be unlocked.",
    "Lighting_Description": "The only significant light source is the brilliant, magical golden light emanating from the celestial lock as the key turns. It casts sharp, dramatic shadows and highlights the intense concentration on both characters' faces.",
    "Key_Storytelling_Props": [
       {
        "Object": "The Star-Key",
        "Description": "A silver key with two interlocking, five-pointed stars at its head. The stars pulse with a soft, internal blue light."
      },
      {
        "Object": "The Celestial Lock",
        "Description": "An ancient, circular brass lock covered in rotating rings of constellations and glowing runes."
      }
    ],
    "Background_Elements": "The background is deeply out of focus, showing only the blurred edge of a large, brass telescope and a few scattered, glowing star charts.",
    "Hidden_Object": "A tiny, cartoonish Saturn with a friendly face and a floating ring is subtly carved into the scrollwork on the stone pedestal.",
    "Dominant_Color_Palette": "Brilliant gold, deep brass, and midnight blue, with accents of silver and sapphire from the key and Elara's clothing."
  },
  "scene_text": [
    "\"Just a little more,\" Orion hooted softly.",
    "Elara took a deep breath, her heart thumping like a drum.",
    "She turned the key one last time.",
    "With a gentle *click*, the entire room was filled with a warm, golden light."
  ]
}
\`\`\`
`;
  } else {
    // --- EXAMPLE FOR SINGLE CHARACTER STORY ---
    return `### Example of Excellence (Single Character Story)

**Input**: \`kidName\`: "Leo", \`age\`: 6, \`theme\`: "Educational", \`subject\`: "Gardening", \`storyRhyming\`: false.

---
#### **Scene Example (Single Character, Medium Shot)**
\`\`\`json
{
  "scene_description": {
    "Scene_Number": 5,
    "Present_Characters": ["Leo"],
    "Camera_Shot": "Medium",
    "Composition_and_Blocking": "Leo is positioned slightly off-center to the left, kneeling on the ground, which makes him appear small next to the large, wilting magical plant that dominates the right side of the frame. An overturned watering can lies in the immediate foreground, drawing the eye into the scene.",
    "Character_Interaction_Summary": null,
    "Character_Details": [
      {
        "Character_Name": "Leo",
        "Clothing_Details": "A bright yellow raincoat with oversized wooden toggle buttons, navy blue rain boots with green frog faces on the toes, and a red-and-white striped beanie.",
        "Gaze_Direction": "Staring at the drooping head of the magical flower with a look of deep concern.",
        "Expression": "A worried frown, with his eyebrows furrowed and the corners of his mouth turned down. His cheeks are slightly puffed in a frustrated sigh.",
        "Pose_and_Action": "He is kneeling on a patch of moss, shoulders slumped in disappointment. His hands are resting limply on his knees, palms up, in a gesture of helplessness."
      }
    ],
    "Focal_Action": "Leo watches as the last petal of the glowing Moonpetal flower begins to lose its light and droop.",
    "Setting_and_Environment": "A magical, hidden garden that now feels somber. The normally vibrant, oversized plants seem to have lost some of their color. The air, which usually smells sweet, now has a hint of dry dust and decay.",
    "Time_of_Day_and_Atmosphere": "Mid-day, but the atmosphere is heavy and disheartening. The sunlight is harsh and direct, failing to bring life to the wilting plants.",
    "Lighting_Description": "Harsh, direct overhead sunlight washes out some of the garden's color and casts short, sharp shadows. The fading, soft blue light from the wilting Moonpetal flower provides a weak, sad counterpoint, highlighting the disappointment on Leo's face.",
    "Key_Storytelling_Props": [
      {
        "Object": "The Moonpetal Plant",
        "Description": "A tall, elegant plant with a single, large, bell-shaped flower whose five petals once glowed with a soft, internal blue light. The petals are now drooping and their luminescence is fading to a dull grey."
      },
      {
        "Object": "The Watering Can",
        "Description": "A small, child-sized, bright red plastic watering can with a yellow spout, now lying on its side with a few drops of water leaking out."
      }
    ],
    "Background_Elements": "In the background, a stream that was once sparkling now flows sluggishly. A family of tiny, purple-winged fairies are huddled together on a mushroom, looking on with sad expressions.",
    "Hidden_Object": "A tiny garden gnome, usually cheerful, is hidden behind a rock, now holding a miniature umbrella even though it is not raining.",
    "Dominant_Color_Palette": "Faded greens and desaturated browns, with the dull grey of the wilting flower and the harsh white of the sunlight creating a somber mood."
  },
  "scene_text": [
    "The garden wasn't supposed to be sad.",
    "Leo had followed all the rules.",
    "But the beautiful Moonpetal flower was still drooping.",
    "\"What did I do wrong?\" he whispered to a little ladybug."
  ]
}
\`\`\`
`;
  }
}

export const brevityPrompt = (age: number) =>
  `
### Brevity & Reading Level (Age-Adaptive)

${
  age <= 2
    ? `- Target: 1 sentence, 5–15 words total (≤ 15 words/sentence).`
    : age <= 4
      ? `- Target: 1–3 sentences, 20–45 words total (≤ 12 words/sentence).`
      : age <= 6
        ? `- Target: 2–4 sentences, 40–80 words total (≤ 15 words/sentence).`
        : age <= 8
          ? `- Target: 3–5 sentences, 70–120 words total (≤ 18 words/sentence).`
          : `- Target: 5–8 sentences, 120–220 words total (≤ 20 words/sentence).`
}

- Keep sentences independent (no run-ons), active voice, concrete imagery tied to illustrations.
- Avoid advanced vocabulary, idioms, or complex timelines for ages ≤ 8.
`.trim();

export function createValidationPrompt(hasCharacters: boolean) {
  const totalChecks = 9;

  return `You are an expert Story Concept Validator for a children's storybook company. Your primary function is to determine if a user's custom story idea is feasible for creation as a ${sceneCount}-page illustrated book for children aged 3-8. Your analysis must be strict, systematic, and focused solely on feasibility.

## Primary Directive:
You will be given a JSON object containing a user's story idea. You must perform a comprehensive series of ${totalChecks} validation checks on the subject of the story. Your entire output must be a single, machine-readable JSON object with a "results" key. The value of this key must be a JSON array containing exactly ${totalChecks} validation result objects.

### 5. Narrative Complexity
- **Logic:** The premise must be simple enough for a ${sceneCount}-page story. It should not involve complex plots, excessive world-building, or too many events.
`;
}

export const UNIFIED_VALIDATION_PROMPT = createValidationPrompt(false);
