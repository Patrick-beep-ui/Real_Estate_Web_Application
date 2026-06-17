export function buildDynamicTopicPrompt(categories: string): string {
  return `Generate a unique, SEO-optimized blog post title for a cash home buying website run by Tarek El Moussa (HGTV host). The title should target distressed homeowners nationwide and be something that hasn't been covered yet.

Categories available: ${categories}

Return ONLY a JSON object:
{"title": "Your Blog Title Here", "category": "one of: ${categories}"}`;
}
