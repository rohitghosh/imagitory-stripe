// imageUtils.ts
import axios from "axios";
import FormData from "form-data";
import { createCanvas, loadImage, Canvas, Image } from "canvas";
import { Buffer } from "buffer";
import sharp from "sharp";

function createRoughCirclePath(ctx, size, jitterRatio = 0.08, segments = 60) {
  // `size` is the width/height of the final square canvas
  // `jitterRatio` is how "uneven" the circle boundary is (e.g., 0.08 = 8% variation)
  // `segments` determines how many points we use around the circle (the more segments, the smoother but still wiggly)

  const pathPoints = [];
  const center = size / 2;
  const baseRadius = size / 2;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    // Random offset up to ±(jitterRatio * baseRadius)
    const offset = baseRadius * jitterRatio * (Math.random() - 0.5);
    const r = baseRadius + offset;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    pathPoints.push({ x, y });
  }

  return pathPoints;
}

export async function clipImageToCircleBuffer(
  imageUrl: string,
): Promise<Buffer> {
  // 1. Load image from URL
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(response.data);
  const img = await loadImage(imageBuffer);

  // 2. Determine final canvas size (square) based on the smallest dimension
  const size = Math.min(img.width, img.height);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // 3. Fill background with white
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);

  // 4. Generate a rough circular path
  const pathPoints = createRoughCirclePath(ctx, size, 0.08, 60);

  // 5. Clip to the rough circle
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.closePath();
  ctx.clip();

  // 6. Draw the image within this clipped area
  ctx.drawImage(img, 0, 0, size, size);
  ctx.restore(); // stop clipping

  // 7. Optionally, draw a playful "hand-drawn" stroke around the image
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.closePath();
  // Example: an orange-ish color, thickness 2% of the image size
  ctx.lineWidth = size * 0.02;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // 8. Return as PNG buffer
  return canvas.toBuffer("image/png");
}

// // Convert remote image to rounded rectangle clipped buffer
// export async function clipImageToRoundedRectBuffer(
//   imageUrl: string,
//   radius = 200,
// ): Promise<Buffer> {
//   const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
//   const imageBuffer = Buffer.from(response.data);

//   const img = await loadImage(imageBuffer);
//   const canvas = createCanvas(img.width, img.height);
//   const ctx = canvas.getContext("2d");

//   ctx.beginPath();
//   ctx.moveTo(radius, 0);
//   ctx.lineTo(img.width - radius, 0);
//   ctx.quadraticCurveTo(img.width, 0, img.width, radius);
//   ctx.lineTo(img.width, img.height - radius);
//   ctx.quadraticCurveTo(img.width, img.height, img.width - radius, img.height);
//   ctx.lineTo(radius, img.height);
//   ctx.quadraticCurveTo(0, img.height, 0, img.height - radius);
//   ctx.lineTo(0, radius);
//   ctx.quadraticCurveTo(0, 0, radius, 0);
//   ctx.clip();

//   ctx.drawImage(img, 0, 0);
//   return canvas.toBuffer("image/png");
// }

function createRoughRoundedRectPath(
  ctx,
  width,
  height,
  radius,
  jitterRatio = 0.1,
  segmentsPerCorner = 10,
  segmentsPerEdge = 10,
) {
  const points = [];

  // Helper to add jitter to a coordinate
  function jitter(val) {
    return val + (Math.random() - 0.5) * jitterRatio * radius;
  }

  // Top edge (from top-left corner end to top-right corner start)
  for (let i = 0; i <= segmentsPerEdge; i++) {
    const x = radius + ((width - 2 * radius) * i) / segmentsPerEdge;
    const y = 0;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  // Top-right corner: from angle -90deg to 0deg
  for (let i = 0; i <= segmentsPerCorner; i++) {
    const angle = -Math.PI / 2 + (i * (Math.PI / 2)) / segmentsPerCorner;
    const x = width - radius + Math.cos(angle) * radius;
    const y = radius + Math.sin(angle) * radius;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  // Right edge: from top-right corner end to bottom-right corner start
  for (let i = 0; i <= segmentsPerEdge; i++) {
    const x = width;
    const y = radius + ((height - 2 * radius) * i) / segmentsPerEdge;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  // Bottom-right corner: from 0deg to 90deg
  for (let i = 0; i <= segmentsPerCorner; i++) {
    const angle = 0 + (i * (Math.PI / 2)) / segmentsPerCorner;
    const x = width - radius + Math.cos(angle) * radius;
    const y = height - radius + Math.sin(angle) * radius;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  // Bottom edge: from bottom-right corner end to bottom-left corner start
  for (let i = 0; i <= segmentsPerEdge; i++) {
    const x = width - radius - ((width - 2 * radius) * i) / segmentsPerEdge;
    const y = height;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  // Bottom-left corner: from 90deg to 180deg
  for (let i = 0; i <= segmentsPerCorner; i++) {
    const angle = Math.PI / 2 + (i * (Math.PI / 2)) / segmentsPerCorner;
    const x = radius + Math.cos(angle) * radius;
    const y = height - radius + Math.sin(angle) * radius;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  // Left edge: from bottom-left corner end to top-left corner start
  for (let i = 0; i <= segmentsPerEdge; i++) {
    const x = 0;
    const y = height - radius - ((height - 2 * radius) * i) / segmentsPerEdge;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  // Top-left corner: from 180deg to 270deg
  for (let i = 0; i <= segmentsPerCorner; i++) {
    const angle = Math.PI + (i * (Math.PI / 2)) / segmentsPerCorner;
    const x = radius + Math.cos(angle) * radius;
    const y = radius + Math.sin(angle) * radius;
    points.push({ x: jitter(x), y: jitter(y) });
  }

  return points;
}

export async function clipImageToRoundedRectBuffer(
  imageUrl: string,
  radius = 50,
) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(response.data);

  const img = await loadImage(imageBuffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");

  // Generate rough rounded rectangle path points.
  const pathPoints = createRoughRoundedRectPath(
    ctx,
    img.width,
    img.height,
    radius,
    0.5,
  );

  // Begin and construct the path from our points.
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.closePath();

  // Use the path to clip the drawing area.
  ctx.clip();

  // Draw the image inside the clipped area.
  ctx.drawImage(img, 0, 0);
  return canvas.toBuffer("image/png");
}

async function fetchImage(url: string) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(res.data);
  return await loadImage(buffer);
}
async function fetchImageDataUrl(url: string): Promise<Image> {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
  });
  const buffer = Buffer.from(response.data);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;
  return loadImage(dataUrl);
}

/**
 * Given a Buffer (PNG, JPG, etc.), convert to a node-canvas Canvas.
 * We'll do this by base64-encoding it and loading via loadImage.
 */
async function bufferToCanvas(imageBuffer: Buffer): Promise<Canvas> {
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;
  const img = await loadImage(dataUrl);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Convert a node-canvas Canvas to a PNG buffer (or JPEG if you prefer).
 */
function canvasToBuffer(
  canvas: Canvas,
  mimeType: "image/png" | "image/jpeg" = "image/png",
): Buffer {
  if (mimeType === "image/png") {
    // toBuffer() with no arguments => PNG
    return canvas.toBuffer();
  } else {
    // toBuffer("image/jpeg", config) => JPEG
    return canvas.toBuffer("image/jpeg", { quality: 0.9 });
  }
}

/**
 * Call PhotoRoom’s segmentation endpoint with `channels=alpha`
 * to get back a PNG in which the background is fully transparent and the subject is opaque.
 */
async function removeBackgroundFromCanvas(
  spreadCanvas: Canvas,
): Promise<Canvas> {
  // 1) Convert the entire spread to a PNG buffer
  const spreadBuf = canvasToBuffer(spreadCanvas, "image/png");

  // 2) Build multipart form
  const form = new FormData();
  form.append("image_file", spreadBuf, "spread.png");
  // NOTE: no "channels" param => default is background removed with transparency

  // 3) Send to PhotoRoom’s /segment
  const res = await axios.post<ArrayBuffer>(
    "https://sdk.photoroom.com/v1/segment",
    form,
    {
      headers: {
        "x-api-key": process.env.PHOTOROOM_API_KEY || "",
        ...form.getHeaders(),
      },
      responseType: "arraybuffer",
    },
  );

  // 4) Convert returned bytes back to a Canvas
  const removedBgBuf = Buffer.from(res.data);
  return bufferToCanvas(removedBgBuf);
}

export async function splitImageForSpreadFlexible(
  imageUrl: string,
  layoutType: 2 | 3 | 6,
  pageWidth: number,
  pageHeight: number,
): Promise<{ leftImage: string; rightImage: string }> {
  // 1) Load the original image
  const img = await fetchImageDataUrl(imageUrl);

  // 2) Create a “spread” canvas sized for 1.5 pages wide
  const dpi = 100; // or whatever resolution
  const fullWidth = pageWidth * 1.5 * dpi; // e.g. 900 px
  const fullHeight = pageHeight * dpi; // e.g. 600 or 900 px

  const spreadCanvas = createCanvas(fullWidth, fullHeight);
  const spreadCtx = spreadCanvas.getContext("2d");
  // draw scaled to fill the spread
  spreadCtx.drawImage(img, 0, 0, fullWidth, fullHeight);

  // 3) If layout=2 or 3, we want a background-removed version.
  //    layout=6 => skip
  let removedCanvas: Canvas | null = null;
  // if (layoutType === 2 || layoutType === 3) {
  //   removedCanvas = await removeBackgroundFromCanvas(spreadCanvas);
  // }

  // 4) Build left and right page canvases
  const pagePx = pageWidth * dpi;
  const leftCanvas = createCanvas(pagePx, fullHeight);
  const rightCanvas = createCanvas(pagePx, fullHeight);
  const leftCtx = leftCanvas.getContext("2d");
  const rightCtx = rightCanvas.getContext("2d");

  // Optionally fill each page with white
  leftCtx.fillStyle = "white";
  leftCtx.fillRect(0, 0, pagePx, fullHeight);
  rightCtx.fillStyle = "white";
  rightCtx.fillRect(0, 0, pagePx, fullHeight);

  // 5) Do the slicing logic
  if (layoutType === 2) {
    // Left half is the background-removed subject
    if (removedCanvas) {
      leftCtx.drawImage(
        removedCanvas,
        /* srcX, srcY */ 0,
        0,
        /* srcW, srcH */ 300,
        fullHeight, // same cropping as your original code
        0,
        0,
        pagePx,
        fullHeight,
      );
    } else {
      // fallback
      leftCtx.drawImage(
        spreadCanvas,
        0,
        0,
        300,
        fullHeight,
        0,
        0,
        pagePx,
        fullHeight,
      );
    }
    // Right half from the original
    rightCtx.drawImage(
      spreadCanvas,
      300,
      0,
      pagePx,
      fullHeight,
      0,
      0,
      pagePx,
      fullHeight,
    );
  } else if (layoutType === 3) {
    // Left half is normal, right half is background-removed
    leftCtx.drawImage(
      spreadCanvas,
      0,
      0,
      pagePx,
      fullHeight,
      0,
      0,
      pagePx,
      fullHeight,
    );
    if (removedCanvas) {
      rightCtx.drawImage(
        removedCanvas,
        600,
        0,
        300,
        fullHeight,
        0,
        0,
        pagePx,
        fullHeight,
      );
    } else {
      rightCtx.drawImage(
        spreadCanvas,
        600,
        0,
        300,
        fullHeight,
        0,
        0,
        pagePx,
        fullHeight,
      );
    }
  } else if (layoutType === 6) {
    // 50/50 normal (no background removal at all)
    leftCtx.drawImage(
      spreadCanvas,
      0,
      0,
      fullWidth * 0.5,
      fullHeight,
      0,
      0,
      pagePx,
      fullHeight,
    );
    rightCtx.drawImage(
      spreadCanvas,
      fullWidth * 0.5,
      0,
      fullWidth * 0.5,
      fullHeight,
      0,
      0,
      pagePx,
      fullHeight,
    );
  }

  // 6) Return data URLs
  const leftImage = leftCanvas.toDataURL("image/jpeg");
  const rightImage = rightCanvas.toDataURL("image/jpeg");
  return { leftImage, rightImage };
}

export async function getImageDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

export async function fadeBottomBorderImage(base64: string): Promise<string> {
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const inputBuffer = Buffer.from(cleanBase64, "base64");

  const meta = await sharp(inputBuffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error(
      "Could not read image dimensions for fadeBottomBorderImage",
    );
  }
  const width = meta.width;
  const height = meta.height;

  // Create an RGBA gradient mask
  // We want a gradient that is fully transparent at the top (y=0) and fully opaque at the bottom (y=height-1)
  const alphaRGBA = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    // Calculate alpha: 0 at top, 255 at bottom.
    // Use (height - 1) to avoid division by zero and ensure bottom pixel is fully opaque.
    const a = Math.round((y / (height - 1)) * 255);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Set R, G, and B to 255 (white); these values are irrelevant for the mask,
      // but Sharp needs a 4-channel image for the blend mode to recognize the alpha.
      alphaRGBA[idx] = 255; // R
      alphaRGBA[idx + 1] = 255; // G
      alphaRGBA[idx + 2] = 255; // B
      alphaRGBA[idx + 3] = a; // A (gradient)
    }
  }

  // Composite the RGBA mask onto the original image using "dest-in" blend mode.
  // This multiplies the destination's alpha by the mask's alpha.
  const faded = await sharp(inputBuffer)
    .ensureAlpha()
    .composite([
      {
        input: alphaRGBA,
        raw: { width, height, channels: 4 },
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${faded.toString("base64")}`;
}

export async function fadeSideBordersImage(base64: string): Promise<string> {
  // Remove header and create a buffer
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const inputBuffer = Buffer.from(cleanBase64, "base64");

  // Get image dimensions
  const meta = await sharp(inputBuffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Could not read image dimensions for fadeSideBordersImage");
  }
  const width = meta.width;
  const height = meta.height;

  // Define fade areas: left 10% and right 10%
  const leftFadeWidth = Math.floor(0.1 * width);
  const rightFadeStart = Math.floor(0.9 * width);

  // Create an RGBA mask buffer.
  // For each pixel, the R, G, and B are set to 255.
  // The A channel (alpha) is computed based on x position:
  // - For x < leftFadeWidth, alpha ramps up from 0 to 255.
  // - For x between leftFadeWidth and rightFadeStart, alpha is 255.
  // - For x >= rightFadeStart, alpha ramps down from 255 to 0.
  const maskBuffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let alpha = 255;
      if (x < leftFadeWidth) {
        // Fade from transparent (0) to opaque (255)
        alpha = Math.round((x / leftFadeWidth) * 255);
      } else if (x >= rightFadeStart) {
        // Fade from opaque (255) to transparent (0)
        // Use (width - x - 1) so that the very right pixel is 0
        alpha = Math.round(((width - x - 1) / (width - rightFadeStart)) * 255);
      }
      maskBuffer[idx] = 255; // R channel (unused but required)
      maskBuffer[idx + 1] = 255; // G channel
      maskBuffer[idx + 2] = 255; // B channel
      maskBuffer[idx + 3] = alpha; // A channel (gradient)
    }
  }

  // Composite the mask onto the original image using "dest-in" blend mode,
  // which multiplies the destination's alpha by the mask's alpha.
  const faded = await sharp(inputBuffer)
    .ensureAlpha()
    .composite([
      {
        input: maskBuffer,
        raw: { width, height, channels: 4 },
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${faded.toString("base64")}`;
}

export async function fadeSideBordersWithStripes(
  base64: string,
): Promise<string> {
  // Remove data URI header
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const inputBuffer = Buffer.from(cleanBase64, "base64");

  // Get image dimensions
  const meta = await sharp(inputBuffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error(
      "Could not read image dimensions for fadeSideBordersWithStripesSym",
    );
  }
  const width = meta.width;
  const height = meta.height;

  // 10% fade on each side
  const fadeWidth = Math.floor(0.1 * width);

  // Stripe frequency parameters
  const maxPeriod = 20; // wide stripes
  const minPeriod = 2; // narrow stripes

  // Create overlay (RGBA) with full transparency
  const overlay = Buffer.alloc(width * height * 4, 0);

  // ============ LEFT EDGE ============

  // We'll iterate xLocal from 0..(fadeWidth-1)
  // xLocal=0 corresponds to the boundary with the main image (less fade),
  // xLocal=fadeWidth-1 corresponds to the extreme left edge.
  for (let xLocal = 0; xLocal < fadeWidth; xLocal++) {
    // Actual x coordinate on the left side
    const x = fadeWidth - 1 - xLocal;
    // So at xLocal=0 => x=fadeWidth-1 (inner boundary),
    //    xLocal=fadeWidth-1 => x=0 (outer edge)

    // Normalized distance from the inner boundary to the outer edge
    const norm = xLocal / (fadeWidth - 1); // goes from 0..1

    // Period transitions from maxPeriod at the inner boundary
    // to minPeriod at the extreme left
    const period = maxPeriod - norm * (maxPeriod - minPeriod);

    // Use xLocal (not the absolute x) for the modulus so it
    // starts from 0 on the inner boundary. This helps ensure
    // symmetrical stripes on both edges.
    const isWhite = xLocal % period < period / 2;

    if (isWhite) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        overlay[idx] = 255; // R
        overlay[idx + 1] = 255; // G
        overlay[idx + 2] = 255; // B
        overlay[idx + 3] = 255; // A
      }
    }
  }

  // ============ RIGHT EDGE ============

  // Similarly, xLocal=0 => near the boundary with the main image,
  // xLocal=fadeWidth-1 => extreme right edge.
  for (let xLocal = 0; xLocal < fadeWidth; xLocal++) {
    // Actual x coordinate on the right side
    const x = width - fadeWidth + xLocal;

    // Normalized distance from 0..1
    const norm = xLocal / (fadeWidth - 1);

    // Period transitions from maxPeriod (inner boundary)
    // to minPeriod (outer edge)
    const period = maxPeriod - norm * (maxPeriod - minPeriod);

    // Use xLocal for the stripe pattern
    const isWhite = xLocal % period < period / 2;

    if (isWhite) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        overlay[idx] = 255;
        overlay[idx + 1] = 255;
        overlay[idx + 2] = 255;
        overlay[idx + 3] = 255;
      }
    }
  }

  // Composite the overlay with the original image
  const merged = await sharp(inputBuffer)
    .composite([
      {
        input: overlay,
        raw: { width, height, channels: 4 },
      },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${merged.toString("base64")}`;
}

export async function mirrorImage(imageSource) {
  const img = await loadImage(imageSource);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");

  // Mirror horizontally: shift the context to the right, then flip horizontally.
  ctx.translate(img.width, 0);
  ctx.scale(-1, 1);

  // Draw the image (now mirrored) on the canvas.
  ctx.drawImage(img, 0, 0);

  // Return the resulting image as a data URL.
  return canvas.toDataURL("image/png");
}


