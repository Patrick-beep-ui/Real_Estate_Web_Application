export function buildImagePromptsPrompt(
  title: string,
  contentPreview: string,
  count: number
): string {
  return `You are generating image descriptions for a real estate blog post by Tarek El Moussa.

Blog title: "${title}"

Blog content preview:
${contentPreview.slice(0, 500)}

Generate exactly ${count} COMPLETELY DIFFERENT image prompts.

Rules:
- Each must be a different type of scene (interior, exterior, aerial, people, neighborhood, contract signing, etc.)
- Photorealistic, professional lighting
- NO text overlays or watermarks
- Suitable for a real estate website — warm, inviting, high-quality
- Each prompt should be a single sentence, descriptive but concise

Return ONLY a JSON array of strings. No markdown, no numbering, just the array.`;
}
