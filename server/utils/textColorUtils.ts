// textColorUtils.ts
import { createCanvas, Image } from "canvas";

/**
 * Given a background canvas/image and a small sampling region (x,y,width,height),
 * compute the average brightness and return either white or black
 * for maximum contrast.
 *
 * @param bgImg The background Image or canvas
 * @param sampleX The x coordinate to sample
 * @param sampleY The y coordinate to sample
 * @param sampleW The width of the sampling box
 * @param sampleH The height of the sampling box
 */
export function pickContrastingTextColor(
  bgImg: Image,
  sampleX: number,
  sampleY: number,
  sampleW: number,
  sampleH: number
): "white" | "black" {
  // 1) Create a small canvas just to sample
  const sampleCanvas = createCanvas(sampleW, sampleH);
  const sampleCtx = sampleCanvas.getContext("2d");

  // 2) Draw the region from bgImg to our sample canvas
  sampleCtx.drawImage(
    bgImg,
    sampleX, sampleY, sampleW, sampleH,  // src region
    0, 0, sampleW, sampleH              // dest region
  );

  // 3) Read pixel data
  const imgData = sampleCtx.getImageData(0, 0, sampleW, sampleH).data;

  let totalR = 0, totalG = 0, totalB = 0;
  const numPixels = sampleW * sampleH;

  for (let i = 0; i < imgData.length; i += 4) {
    totalR += imgData[i + 0];
    totalG += imgData[i + 1];
    totalB += imgData[i + 2];
  }

  const avgR = totalR / numPixels;
  const avgG = totalG / numPixels;
  const avgB = totalB / numPixels;

  // 4) Approximate brightness (using sRGB luminance)
  const brightness =
    0.2126 * (avgR / 255) +
    0.7152 * (avgG / 255) +
    0.0722 * (avgB / 255);

  // If brightness < 0.5 => use white, else black
  return brightness < 0.5 ? "white" : "black";
}
