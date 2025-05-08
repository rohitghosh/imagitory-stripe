// // imageGenerator.ts
// import { inferTheme } from "./themeEngine";
// import { fadeImageBase64 } from "./fadeImageBase64";

// export async function generateBackgroundImage(theme) {
//   const size = "1024x1024";
//   const fullPrompt = `A soft, monotone in the theme of ${theme}. The middle and upper half of the image should have no elements - just simple color. Design elements should be subtle and mainly at the bottom or sides.`;
//   const response = await fetch("https://api.openai.com/v1/images/generations", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "dall-e-3",
//       prompt: fullPrompt,
//       size,
//       n: 1,
//       response_format: "b64_json",
//     }),
//   });

//   if (!response.ok) {
//     throw new Error(
//       `OpenAI API error: ${response.status} ${response.statusText}`,
//     );
//   }

//   const data = await response.json();
//   const faded = await fadeImageBase64(data.data[0].b64_json, 1.0);
//   return faded;
// }

// export async function generatePageBackgrounds(pages, layout = "side-by-side") {
//   const results: string[] = [];

//   for (const page of pages) {
//     const theme = inferTheme(page.content); // or use basePrompt if more accurate
//     const imageBase64 = await generateBackgroundImage(theme);
//     results.push(imageBase64);
//   }

//   return results;
// }

// utils/imageGenerator.ts
import { fal } from "@fal-ai/client";
import { getImageDataURL } from "./imageUtils";

export async function generateDecorativeBordersForPages(
  numPages: number,
  theme: string = "space",
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < numPages; i++) {
    const center =
      i === 4 || i === 5
        ? `, white background,`
        : `, white or transparent center,`;
    const prompt = `Gentle, pastel-colored ${theme}-themed border with subtle planets and stars, watercolor style${center} ideal as page margin background`;
    const size =
      i === 4 || i === 5
        ? {
            width: 600,
            height: 60,
          }
        : {
            width: 512,
            height: 512,
          };
    const payload = {
      prompt: prompt,
      image_size: size,
    };

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: payload,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) =>
            console.log("[generateBackgroundImage] Queue update:", log.message),
          );
        }
      },
    });

    if (result.data && result.data.images && result.data.images.length > 0) {
      const url = result.data.images[0].url;
      const databuffer = await getImageDataURL(url);
      results.push(databuffer);
    }
    // const url = `https://v3.fal.media/files/rabbit/0PFzdv1iEIx9yPXeWmWwi.png`;
    // const databuffer = await getImageDataURL(url);
    // results.push(databuffer);
    else {
      results.push(``);
    }
  }

  return results;
}
