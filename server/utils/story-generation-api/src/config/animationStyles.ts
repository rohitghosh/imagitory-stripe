export interface AnimationStyle {
  id: string;
  label: string;
  description: string;
  sampleImageUrl: string;
  stylePrompt: string;
}

export const ANIMATION_STYLES: AnimationStyle[] = [
  {
    id: "pixar",
    label: "Pixar",
    description:
      "Cinematic 3D look with soft lighting and friendly proportions",
    sampleImageUrl:
      "https://v3.fal.media/files/panda/yQJZHNPB-70YFRxFps_uE.jpeg",
    stylePrompt:
      "Render in a **Pixar-style**: cinematic 3D look, soft global illumination, friendly proportions, expressive eyes, clean surfaces. Avoid studio logos or any text.",
  },
  {
    id: "storybook-watercolor",
    label: "Storybook Watercolor",
    description: "Soft edges with gentle washes and cozy palette",
    sampleImageUrl:
      "https://v3.fal.media/files/elephant/Ll_3ZW5Co8YZu-RaR4m6K.jpeg",
    stylePrompt:
      "Render in a **storybook watercolor** style: soft edges, gentle washes, visible paper texture, cozy palette, no outlines on backgrounds.",
  },
  {
    id: "flat-vector",
    label: "Flat Vector",
    description: "Clean geometric shapes with minimal gradients",
    sampleImageUrl:
      "https://v3.fal.media/files/tiger/wzKxuAVPHv07gK1OBb-pi.jpeg",
    stylePrompt:
      "Render in a **flat vector** style: clean geometric shapes, minimal gradients, crisp edges, solid colors.",
  },
  {
    id: "ghibli",
    label: "Ghibli",
    description:
      "Painterly backgrounds with natural light and gentle expressions",
    sampleImageUrl:
      "https://v3.fal.media/files/zebra/UU9HhTxnsa-6xSBxXYVOb.jpeg",
    stylePrompt:
      "Render with a **Ghibli-like** warmth: painterly backgrounds, natural light, gentle expressions, subtle texture.",
  },
];

export function getAnimationStyleById(id: string): AnimationStyle | undefined {
  return ANIMATION_STYLES.find((style) => style.id === id);
}

export function getStylePrompt(animationStyleId?: string): string | null {
  if (!animationStyleId) return null;
  const style = getAnimationStyleById(animationStyleId);
  return style?.stylePrompt || null;
}

// Default animation style
export const DEFAULT_ANIMATION_STYLE = "pixar";
