/**
 * test-image-upload.ts
 *
 * Verifies both the OpenAI edit API and your Firebase upload.
 * - Uses two placeholder PNGs
 * - Generates a composite scene
 * - Saves it as out.png
 * - Uploads it to Firebase under books/123/abcd.png
 */

// import fs from "fs";
// import OpenAI, { toFile } from "openai";
// // import { uploadBase64ToFirebase } from "../../../uploadImage";
// // 1) Initialize OpenAI client
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
// // import admin from "firebase-admin";
// import path from "path";
// import { fileURLToPath } from "url";

// // 2) Two test images (always valid PNGs)
// const IMAGE_URLS = [
//   "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/customCharacters%2FgyV-fP5PVcOYNMeAdxyzT_d41b388b415d48ddb1ff53947152dc52.jpg?alt=media&token=b890ec1f-5f4b-41de-b6aa-42877605ce15",
//   "https://fal.media/files/kangaroo/vehO-KtjxXEc9w85gIsFY_843bd51892ef43dc8038ad395e9f1268.jpg",
// ];

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// async function runTest() {
//   // 3) Fetch + wrap as Files with correct MIME
//   const files = await Promise.all(
//     IMAGE_URLS.map(async (url, idx) => {
//       const res = await fetch(url);
//       if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
//       const ct = res.headers.get("content-type") || "";
//       if (!ct.startsWith("image/"))
//         throw new Error(`Bad content-type ${ct} from ${url}`);
//       const buf = Buffer.from(await res.arrayBuffer());
//       return toFile(buf, `char${idx + 1}.png`, { type: ct as any });
//     }),
//   );

//   // 4) Call the OpenAI edit endpoint
//   const resp = await client.images.edit({
//     model: "gpt-image-1",
//     n: 1,
//     size: "1024x1024",
//     input_fidelity: "low",
//     quality: "medium",
//     background: "auto",
//     output_format: "png",
//     prompt: `
//       Attached are the images of Reet(a 4 year old human kid as shown in 1st image) and Jeet(a friendly elephant with soft gray skin, large expressive eyes, a friendly trunk, and endearing rounded features; as shown in 2nd image). Make a Pixar styled animation. DO NOT WRITE ANY NAMES ANYWHERE ON THE IMAGE. Create a scene as described below: The scene is set during late afternoon; atmosphere is warm and celebratory. The scene features: Reet, Jeet, Meet. Reet shares the medal with Meet, while Jeet cheers them on. Reet is extending both hands forward to pass the medal., looking at Meet with a kind smile. with an expression of a warm, generous grin. Jeet is raising trunk to clap lightly., looking watching the exchange happily. with an expression of a broad, encouraging smile. Meet is reaching forward with both hands to accept the medal., looking at the medal with appreciation. with an expression of a grateful, surprised smile. It unfolds in under a canopy on the field edge; the air smells of grass and sunscreen; murmur of other children practicing. The focal action is Reet passes the medal to Meet. Soft golden light streaks through tree branches, casting gentle highlights. 1. The friendship medal (a circular, gold-colored medal with embossed two clasped hands and a blue-and-orange striped ribbon). 2. A small coach's whistle. 3. A folding table. Colorful banners hang from the canopy; other kids cheer in the distance. The dominant color palette includes warm golds, soft greens, and gentle purples. The camera shot is a medium shot with Reet [wearing a blue soccer jersey with white stripes and red sneakers] stands center handing the medal to Meet [wearing a yellow jersey and blue shorts]; Jeet [wearing a red baseball cap] stands on the left clapping their trunk. A tiny, yellow smiling star sticker is on the leg of the folding table.

//     `,
//     image: files,
//   });

//   if (resp.usage) {
//     const {
//       total_tokens,
//       input_tokens,
//       output_tokens,
//       input_tokens_details: { text_tokens, image_tokens },
//     } = resp.usage;

//     console.log("✅ OpenAI edit usage:");
//     console.log("   • total_tokens:", total_tokens);
//     console.log("   • input_tokens:", input_tokens);
//     console.log("     – text_tokens:", text_tokens);
//     console.log("     – image_tokens:", image_tokens);
//     console.log("   • output_tokens:", output_tokens);
//   } else {
//     console.warn("⚠️ No usage information returned");
//   }

//   // 5) Extract base64 PNG
//   const b64 = resp.data[0].b64_json!;
//   const outBuf = Buffer.from(b64, "base64");

//   // 6) Save locally
//   fs.writeFileSync("out.png", outBuf);
//   console.log("✅ Wrote out.png");

//   // 7) Upload to Firebase under books/123/abcd.png
//   // const firebaseUrl = await uploadBase64ToFirebase(b64, `books/123/abcd.png`);
//   // console.log("✅ Uploaded to Firebase at:", firebaseUrl);
// }

// runTest().catch((err) => {
//   console.error("❌ Test failed:", err);
//   process.exit(1);
// });

// import path from "path";
// import tmp from "tmp-promise";
// import fetch from "node-fetch";
// import { uploadBase64ToFirebase } from "../../../uploadImage";
// import { toFile } from "openai";

// export async function generate() {
//   let baseCoverUrl =
//     "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/books%2FEUmT0tk4uYerhJILi2qP%2Ffrontcoverimage.png?alt=media&token=c867c4fe-e5d8-4564-90ca-e064aed66926";

//   const fetched = await fetch(baseCoverUrl);
//   if (!fetched.ok) {
//     throw new Error(`Failed to fetch base cover image: ${fetched.status}`);
//   }
//   const arrayBuffer = await fetched.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);
//   // wrap it as a proper PNG file for OpenAI
//   const baseImageFile = await toFile(buffer, "baseCover.png", {
//     type: "image/png",
//   });
//   console.log("✅ baseImageFile metadata:");
//   console.log("  • filename:", baseImageFile.filename || baseImageFile.name);
//   console.log("  • mimetype:", baseImageFile.type);
//   console.log("  • toString:", baseImageFile.toString());
//   console.dir(baseImageFile, { depth: 2 });
// }

// if (import.meta.url === `file://${path.resolve(process.argv[1])}`) {
//   generate().catch((err) => {
//     console.error(err);
//     process.exit(1);
//   });
// }

import fs from "fs";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ------------------------------------------------------------------ */
/* configuration                                                      */
/* ------------------------------------------------------------------ */
const IMAGE_URLS = [
  // "https://firebasestorage.googleapis.com/v0/b/kids-story-5eb1b.firebasestorage.app/o/customCharacters%2FgyV-fP5PVcOYNMeAdxyzT_d41b388b415d48ddb1ff53947152dc52.jpg?alt=media&token=b890ec1f-5f4b-41de-b6aa-42877605ce15",
  "https://fal.media/files/kangaroo/vehO-KtjxXEc9w85gIsFY_843bd51892ef43dc8038ad395e9f1268.jpg",
];

const QUALITY = "low"; // “high” | “medium” | “low”
const INPUT_FIDELITY = "low"; // only used when images are attached

/* helper: builds the flattened tool object -------------------------------- */
function buildImageGenTool({
  hasInputImage,
  quality = QUALITY,
}: {
  hasInputImage: boolean;
  quality?: "high" | "medium" | "low";
}) {
  const tool: Record<string, any> = {
    type: "image_generation",
    n: 1,
    model: "gpt-image-1",
    size: "1024x1024",
    quality,
    output_format: "png",
  };

  if (hasInputImage) tool.input_fidelity = INPUT_FIDELITY;
  return tool;
}

/* ------------------------------------------------------------------ */
/* main test routine                                                  */
/* ------------------------------------------------------------------ */
async function runTest() {
  /* --------------------------- 1. WITH ATTACHMENTS --------------------- */
  console.log("▶ Test 1 — with reference images");

  const promptWithImages =
    // "Attached images show a 4-year-old child (1st image) and a friendly kangaroo (2nd image). " +
    "Attached images show a friendly elephant (1st image). " +
    "Create a Pixar-style illustration where the elephant plays with a ball. " +
    "Do NOT write any names on the picture.";

  // const inputsWith = [
  //   { type: "input_text", text: promptWithImages },
  //   ...IMAGE_URLS.map((url) => ({ type: "input_image", image_url: { url } })),
  // ];

  const inputsWith = [
    {
      role: "user",
      content: [
        { type: "input_text", text: promptWithImages },
        ...IMAGE_URLS.map((url) => ({
          type: "input_image",
          image_url: url,
        })),
      ],
    },
  ];

  const toolWith = buildImageGenTool({ hasInputImage: true });

  // const respWith = await client.responses.create({
  //   model: "gpt-4o-mini", // wrapper model
  //   input: inputsWith,
  //   tools: [toolWith],
  // });
  const respWith = await client.responses.retrieve(
    "resp_6880d4746124819f85bac69f0055c03700d1ab5d60bfc8c6",
  );

  console.log(respWith.id);

  reportUsage(respWith.usage);
  saveImage(respWith, "out_with_attachments.png");

  /* --------------------------- 2. TEXT-ONLY ---------------------------- */
  console.log("\n▶ Test 2 — text only (no attachments)");

  const promptText =
    "Create a Pixar-style illustration of a joyful child flying a kite on a sunny meadow. " +
    "Do NOT write any text inside the picture.";

  // const inputsText = [{ type: "input_text", text: promptText }];
  const inputsText = [
    {
      role: "user",
      content: [{ type: "input_text", text: promptText }],
    },
  ];
  const toolText = buildImageGenTool({ hasInputImage: false });

  const respText = await client.responses.create({
    model: "gpt-4o-mini",
    input: inputsText,
    tools: [toolText],
  });
  // const respText = await client.responses.retrieve(
  //   "resp_6880d48a2750819d8d89dad908e22e6c04bf8c6eb295ed19",
  // );

  reportUsage(respText.usage);
  await saveImage(respText, "out_text_only.png");
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
function reportUsage(usage: any) {
  if (!usage) {
    console.warn("⚠️  No usage information returned");
    return;
  }
  const {
    total_tokens,
    input_tokens,
    output_tokens,
    input_tokens_details: { text_tokens, image_tokens } = {},
  } = usage;

  console.log("✅ Token usage");
  console.log("  • total_tokens :", total_tokens);
  console.log("  • input_tokens :", input_tokens);
  console.log("      – text     :", text_tokens ?? "n/a");
  console.log("      – image    :", image_tokens ?? "n/a");
  console.log("  • output_tokens:", output_tokens);
}

function saveImage(resp: any, filename: string) {
  const b64 = resp.output.find(
    (o: any) => o.type === "image_generation_call",
  )?.result;

  if (!b64) {
    console.error("❌ No image data in response");
    return;
  }
  fs.writeFileSync(filename, Buffer.from(b64, "base64"));
  console.log(`🖼️  Saved ${filename}`);
}

/* ------------------------------------------------------------------ */
/* kick it off                                                        */
/* ------------------------------------------------------------------ */
runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
