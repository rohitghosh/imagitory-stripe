// async function main() {
//   try {
//     const argPath = process.argv[2];
//     const overrides =
//       argPath && fs.existsSync(argPath)
//         ? JSON.parse(fs.readFileSync(argPath, "utf8"))
//         : {};
//     const story = await generateStoryScenes();

//     const generatedImageUrls: string[] = [];
//     // Initialize a variable to hold the URL of the previously generated image.
//     let previousImageUrl: string | null = null;

//     for (const scene of story) {
//       // Pass the current scene and the previous image URL to the generation function.

//       const newUrl = await generateImageForScene(scene, previousImageUrl);

//       // Add the newly generated URL to our list.
//       generatedImageUrls.push(newUrl);

//       // Update previousImageUrl for the next loop iteration.
//       previousImageUrl = newUrl;
//     }

//     console.log("Generated image URLs for all scenes:\n");
//     generatedImageUrls.forEach((u, i) => console.log(`Scene ${i + 1}: ${u}`));
//     scene.forEach((scene) => {
//       console.log("Generated text for scene:", scene.scene_text);
//     });
//   } catch (err) {
//     console.error(err);
//   }
// }

/**
 * Generate complete story package with images
 */
// export async function generateCompleteStory(
//   input: StorySceneInput,
//   characterImageMap: Record<
//     string,
//     CharacterVariables
//   > = DEFAULT_CHARACTER_IMAGES,
//   bookId: string,
//   onProgress?: ProgressCallback,
//   seed: number = 3, // NEW PARAMETER
// ): Promise<StoryPackage> {
//   // Generate story scenes
//   onProgress?.("prompting", 0, "Generating story outline…");

//   const story = await generateStoryScenesFromInputs(
//     input,
//     (phase, pct, message) => {
//       onProgress?.(phase, pct * 0.4, message); // Story generation takes 30% of progress
//     },
//     (chunk) => onProgress?.("reasoning", 0, chunk),
//   );

//   onProgress?.("prompting", 40, "Story outline ready");

//   // Generate images for each scene
//   // const generatedImageUrls: string[] = [];
//   // let previousImageUrl: string | null = null;
//   // const total = story.scenes.length;

//   // for (let i = 0; i < story.scenes.length; i++) {
//   //   const scene = story.scenes[i];
//   //   onProgress?.(
//   //     "generating",
//   //     40 + (i / total) * 50,
//   //     `Generating image for scene ${i + 1}/${total}`,
//   //   );

//   //   const newUrl = await generateImageForScene(
//   //     bookId,
//   //     scene as Scene | Scenewochar,
//   //     previousImageUrl,
//   //     characterImageMap,
//   //     (phase, pct, message) => {
//   //       // Image generation for each scene takes a portion of the 50% allocated
//   //       const baseProgress = 40 + (i / total) * 50;
//   //       const sceneProgress = (pct / 100) * (50 / total);
//   //       onProgress?.(phase, baseProgress + sceneProgress, message);
//   //     },
//   //     seed, // PASS SEED PARAMETER
//   //   );

//   //   generatedImageUrls.push(newUrl);
//   //   previousImageUrl = newUrl;
//   // }

//   const scenePromises = story.scenes.map((scene) =>
//     generateImageForScene(
//       bookId, // pass your bookId here
//       scene as Scene | Scenewochar,
//       null, // overlap disabled
//       characterImageMap,
//       undefined,
//       seed,
//     ),
//   );
//   const generatedImageUrls = await Promise.all(scenePromises);

//   onProgress?.("generating", 90, "All scene images generated");

//   // Generate the front cover image
//   onProgress?.("generating_cover", 92, "Generating base front cover image...");

//   const baseCoverImageUrl = await generateImageForFrontCover(
//     bookId,
//     story.front_cover as FrontCover | FrontCoverWoChar,
//     characterImageMap,
//     (phase, pct, message) => {
//       onProgress?.(phase, 92 + (pct / 100) * 4, message); // Base cover takes 10%
//     },
//     seed,
//   );
//   // const baseCoverImageUrl =
//   //   "https://fal.media/files/lion/pPJMpX-NA6-hAAB0rOr9v_188f3c487cf046bcae6ace78d6864cc8.jpg";

//   onProgress?.("generating_cover", 96, "Base cover generated");

//   const finalCoverImageUrl = await generateFinalCoverWithTitle(
//     bookId,
//     baseCoverImageUrl,
//     story.story_title,
//     seed,
//     (phase, pct, message) => {
//       onProgress?.(phase, 96 + (pct / 100) * 4, message); // Final cover takes 5%
//     },
//   );
//   // const finalCoverImageUrl = baseCoverImageUrl;

//   onProgress?.("complete", 100, "Story generation complete");

//   const scenes: SceneOutput[] = story.scenes.map((scene, index) => ({
//     scene_number: index + 1,
//     scene_url: generatedImageUrls[index],
//     scene_text: scene.scene_text,
//     scene_inputs: {
//       scene_description: scene.scene_description,
//       characterImageMap,
//       previousImageUrl: index > 0 ? generatedImageUrls[index - 1] : null,
//       seed,
//     },
//   }));

//   return {
//     scenes,
//     cover: {
//       base_cover_url: baseCoverImageUrl, // NEW
//       story_title: story.story_title,
//       base_cover_inputs: {
//         // RENAMED
//         front_cover: story.front_cover,
//         characterImageMap,
//         seed,
//       },
//       final_cover_url: finalCoverImageUrl, // NEW
//       final_cover_inputs: {
//         // NEW
//         base_cover_url: baseCoverImageUrl,
//         story_title: story.story_title,
//         seed,
//       },
//     },
//   };
// }

/**
 * Generate story scenes from inputs - handles both with and without characters
 */
// export async function generateStoryScenesFromInputs(
//   input: StorySceneInput,
//   onProgress?: ProgressCallback,
// ): Promise<StoryResponse | StorywocharResponse> {
//   // Validate input
//   if (!validateCharacterArrays(input.characters, input.characterDescriptions)) {
//     throw new Error(
//       "Characters and characterDescriptions arrays must have the same length",
//     );
//   }

//   onProgress?.("prompting", 5, "Building LLM prompt…");

//   const hasChars = hasCharacters(input.characters);
//   const storyInputs = createStoryInputs(input);

//   // Choose the appropriate system prompt
//   const systemPrompt = hasChars
//     ? injectVariables(STORY_SYSTEM_PROMPT_WITH_CHARACTER, storyInputs)
//     : injectVariables(STORY_SYSTEM_PROMPT, storyInputs);

//   onProgress?.("prompting", 15, "System prompt assembled…");

//   // Build user prompt dynamically
//   let userPrompt = `\nYou are a world-class story generator. Follow all rules, structures, and principles from the System Prompt to generate a 9-scene story blueprint`;

//   if (hasChars) {
//     userPrompt += ` featuring a main character and a side character`;
//   } else {
//     userPrompt += ` featuring only the main character`;
//   }

//   userPrompt += `.\n\n**INPUTS FOR THIS STORY:**
// * **kidName:** "\`${input.kidName}\`"
// * **pronoun:** "\`${input.pronoun}\`"
// * **age:** \`${input.age}\`
// * **moral:** "\`${input.moral}\`"
// * **kidInterest:** "\`${input.kidInterests[0]}\`"
// * **storyTheme:** "\`${input.storyThemes[0]}\`"`;

//   if (hasChars) {
//     userPrompt += `
// * **character1 (Side Character Name):** "\`${input.characters![0]}\`"
// * **character1_description (Side Character Description):** "\`${input.characterDescriptions![0]}\`"`;
//   }

//   userPrompt += `
// * **storyRhyming:** \`${input.storyRhyming}\`

// **TASK:**
// Produce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each scene, strictly following the ${hasChars ? "15-field" : "12-field"} \`scene_description\` structure and the \`scene_text\` guidelines outlined in the System Prompt.

// Do not write any other text, explanation, or introduction. Your entire output must be only the raw JSON array.`;

//   onProgress?.("prompting", 25, "Calling AI servers…");

//   // Choose the appropriate schema based on whether characters are present
//   const schema = hasChars ? storyResponseSchema : storywocharResponseSchema;

//   const openaiRes = await openai.responses.parse({
//     model: "gpt-4.1-nano",
//     input: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: userPrompt },
//     ],
//     text: {
//       format: zodTextFormat(schema, "story_response"),
//     },
//   });

//   onProgress?.("prompting", 35, "Parsing AI response…");
//   const story = openaiRes.output_parsed;

//   // Validate the story structure
//   console.log("Story structure:", story);
//   if (
//     !story.scenes ||
//     !Array.isArray(story.scenes) ||
//     story.scenes.length !== 9
//   ) {
//     throw new Error("Structured output did not contain exactly 9 scenes");
//   }

//   onProgress?.("prompting", 50, "Story outline ready");
//   return story;
// }

// const commonInputParams = {
//   guidance_scale: 5,
//   num_images: 1,
//   output_format: "jpeg",
//   seed: seed, // CHANGED: use parameter instead of hardcoded 3
//   aspect_ratio: "21:9",
//   safety_tolerance: 6,
// };

// let falRes;

// if (imageUrls.length > 0) {
//   // Case 1: Images are present. Use the 'multi' endpoint.
// let prompt = `Attached are the images of ${attachmentText}. DO NOT WRITE ANY OF THE CHARACTER NAMES ANYWHERE ON THE IMAGE. Create a scene as described below:\n${basePrompt}`;

//   if (usePreviousImage) {
//     prompt += `\n\n**Visual Consistency Note:** The last image attached is from the previous scene. Use it as a reference to maintain visual consistency in the setting, props, and overall environment. The character poses and actions should still follow the new scene description.`;
//   }

//   console.log(
//     "Calling multi-modal endpoint: fal-ai/flux-pro/kontext/max/multi",
//   );
//   console.log("Final Prompt:", prompt);
//   console.log("Image URLs sent to AI:", imageUrls);

//   const replacementNames = ["Reet", "Jeet", "Meet", "Heet"];
//   prompt = replaceCharacterNames(
//     prompt,
//     Present_Characters,
//     replacementNames,
//   );

//   falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
//     input: {
//       ...commonInputParams,
//       prompt: prompt,
//       image_urls: imageUrls,
//     },
//     logs: true,
//     onQueueUpdate,
//   });
// } else {
//   // Case 2: No images. Use the 'text-to-image' endpoint.
//   console.log(
//     "Calling text-to-image endpoint: fal-ai/flux-pro/kontext/max/text-to-image",
//   );
//   console.log("Final Prompt:", basePrompt);

//   onProgress?.("generating", 20, "Calling image API…");

//   falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/text-to-image", {
//     input: {
//       ...commonInputParams,
//       prompt: basePrompt,
//     },
//     logs: true,
//     onQueueUpdate,
//   });
// }

// onProgress?.("generating", 80, "Processing Fal response…");
// const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

// onProgress?.("generating", 80, "Processing Fal response…");
// const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

// const imageUrl =
//   "https://fal.media/files/lion/pPJMpX-NA6-hAAB0rOr9v_188f3c487cf046bcae6ace78d6864cc8.jpg";

// if (!imageUrl) {
//   throw new Error("No image URL returned from Fal AI");
// }

// Collect character reference images if any
// Present_Characters.forEach((name) => {
//   const url = characterImageMap[name]["image_url"];
//   if (url) {
//     imageUrls.push(url);
//     characterNamesForPrompt.push(name);
//   }
// });

// Set up API parameters with a 1:1 aspect ratio for the cover
// const commonInputParams = {
//   guidance_scale: 5,
//   num_images: 1,
//   output_format: "jpeg",
//   seed: seed, // CHANGED: use parameter instead of hardcoded 3
//   aspect_ratio: "1:1",
//   safety_tolerance: 6,
// };

// falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
//   input: {
//     ...commonInputParams,
//     prompt: prompt,
//     image_urls: imageUrls,
//   },
//   logs: true,
//   onQueueUpdate,
// });
// const attachments = await Promise.all(imageUrls.map(urlToReadableStream));

// falRes = await fal.subscribe("fal-ai/flux-pro/kontext/max/text-to-image", {
//   input: {
//     ...commonInputParams,
//     prompt: basePrompt,
//   },
//   logs: true,
//   onQueueUpdate,
// });

// const imageUrl = falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

// const imageUrl =
//   "https://fal.media/files/lion/pPJMpX-NA6-hAAB0rOr9v_188f3c487cf046bcae6ace78d6864cc8.jpg";

// if (!imageUrl) {
//   throw new Error("No image URL returned from Fal AI for front cover");
// }


// fetch the existing cover image into a buffer
// const fetched = await fetch(baseCoverUrl);
// if (!fetched.ok) {
//   throw new Error(`Failed to fetch base cover image: ${fetched.status}`);
// }
// const arrayBuffer = await fetched.arrayBuffer();
// const buffer = Buffer.from(arrayBuffer);
// // wrap it as a proper PNG file for OpenAI
// const baseImageFile = await toFile(buffer, "baseCover.png", {
//   type: "image/png",
// });

// const response = await openai.images.edit({
//   model: "gpt-image-1",
//   n: 1,
//   input_fidelity,
//   quality,
//   background: "auto",
//   output_format: "png",
//   size: "1024x1024",
//   image: [baseImageFile],
//   prompt: titlePrompt,
// });


// const finalCoverUrl =
//   falRes?.data?.images?.[0]?.url || falRes?.images?.[0]?.url;

// const base64 = response.data[0].b64_json!;
// const finalCoverUrl = await uploadBase64ToFirebase(
//   base64,
//   `books/${bookId}/frontcoverimagewithtitle.png`,
// );
