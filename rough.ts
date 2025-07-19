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
