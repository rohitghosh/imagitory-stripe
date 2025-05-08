// // fadeImageBase64.ts
// import sharp from "sharp";

// /**
//  * Takes a base64-encoded image string (without data URI prefix),
//  * applies a white transparent overlay to simulate fade,
//  * and returns the new base64 string (no prefix).
//  */
// export async function fadeImageBase64(
//   base64: string,
//   fadeOpacity: number = 0.3, // 0 = transparent, 1 = solid white
// ): Promise<string> {
//   const imageBuffer = Buffer.from(base64, "base64");

//   const width = 1024;
//   const height = 1024;

//   // Create white overlay
//   const overlay = await sharp({
//     create: {
//       width,
//       height,
//       channels: 4,
//       background: { r: 255, g: 255, b: 255, alpha: fadeOpacity },
//     },
//   })
//     .png()
//     .toBuffer();

//   const faded = await sharp(imageBuffer)
//     .resize(width, height)
//     .composite([{ input: overlay }])
//     .jpeg()
//     .toBuffer();

//   return faded.toString("base64");
// }

// // fadeImageBase64.ts
// import sharp from "sharp";

// /**
//  * Applies a radial white fade to the image.
//  * The center is faded most (white), edges are less faded (transparent).
//  */
// export async function fadeImageBase64(
//   base64: string,
//   fadeStrength: number = 0.6 // controls overall strength of center fade
// ): Promise<string> {
//   const imageBuffer = Buffer.from(base64, "base64");
//   const width = 1024;
//   const height = 1024;

//   // Generate radial alpha mask in raw pixel buffer (grayscale)
//   const alphaMask = Buffer.alloc(width * height);
//   const centerX = width / 2;
//   const centerY = height / 2;
//   const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       const dx = x - centerX;
//       const dy = y - centerY;
//       const dist = Math.sqrt(dx * dx + dy * dy);
//       const fade = 1 - dist / maxDist; // 1 in center, 0 at edge
//       const value = Math.min(255, Math.round(255 * fade * fadeStrength));
//       alphaMask[y * width + x] = value;
//     }
//   }

//   // Convert alpha mask to full RGBA white image with alpha channel
//   const rgbaBuffer = Buffer.alloc(width * height * 4);
//   for (let i = 0; i < width * height; i++) {
//     rgbaBuffer[i * 4 + 0] = 255; // R
//     rgbaBuffer[i * 4 + 1] = 255; // G
//     rgbaBuffer[i * 4 + 2] = 255; // B
//     rgbaBuffer[i * 4 + 3] = alphaMask[i]; // A
//   }

//   const gradientOverlay = await sharp(rgbaBuffer, {
//     raw: { width, height, channels: 4 },
//   })
//     .png()
//     .toBuffer();

//   const faded = await sharp(imageBuffer)
//     .resize(width, height)
//     .composite([{ input: gradientOverlay, blend: "over" }])
//     .jpeg()
//     .toBuffer();

//   return faded.toString("base64");
// }

// fadeImageBase64.ts
import sharp from "sharp";

/**
 * Applies a radial white fade to the image.
 * The center is faded most (white), edges are less faded (transparent).
 */
export async function fadeImageBase64(
  base64: string,
  fadeStrength: number = 0.6, // controls overall strength of center fade
): Promise<string> {
  const imageBuffer = Buffer.from(base64, "base64");
  const width = 1024;
  const height = 1024;

  // Generate radial alpha mask in raw pixel buffer (grayscale)
  const alphaMask = Buffer.alloc(width * height);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Apply a steeper drop-off curve using exponential decay
      const normalized = dist / maxDist;
      const fade = Math.pow(1 - normalized, 3); // steeper fall-off from center
      const value = Math.min(255, Math.round(255 * fade * fadeStrength));

      alphaMask[y * width + x] = value;
    }
  }

  // Convert alpha mask to full RGBA white image with alpha channel
  const rgbaBuffer = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgbaBuffer[i * 4 + 0] = 255; // R
    rgbaBuffer[i * 4 + 1] = 255; // G
    rgbaBuffer[i * 4 + 2] = 255; // B
    rgbaBuffer[i * 4 + 3] = alphaMask[i]; // A
  }

  const gradientOverlay = await sharp(rgbaBuffer, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  const faded = await sharp(imageBuffer)
    .resize(width, height)
    .composite([{ input: gradientOverlay, blend: "over" }])
    .jpeg()
    .toBuffer();

  return faded.toString("base64");
}
