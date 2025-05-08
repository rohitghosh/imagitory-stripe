// themeEngine.ts
export function inferTheme(basePrompt) {
  const prompt = basePrompt.toLowerCase();
  if (prompt.includes("forest"))
    return "whimsical forest with glowing mushrooms and vines";
  if (
    prompt.includes("space") ||
    prompt.includes("galaxy") ||
    prompt.includes("stars")
  )
    return "night sky with stars, planets, and comets";
  if (prompt.includes("underwater") || prompt.includes("ocean"))
    return "colorful underwater coral reef with bubbles and fish";
  if (prompt.includes("castle") || prompt.includes("princess"))
    return "royal fairytale with crowns, hearts, and ribbons";
  if (prompt.includes("dragon") || prompt.includes("magic"))
    return "magical kingdom with sparkles and spells";
  return "dreamy pastel storybook with clouds and stars";
}
