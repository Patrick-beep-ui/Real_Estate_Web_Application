import { AIService } from "../services/AIService.ts";
import { TOPIC_CATEGORIES } from "../data/blog-topics.ts";
import { buildBlogPrompt } from "../prompts/blog-content.ts";
import { buildDynamicTopicPrompt } from "../prompts/blog-topic-gen.ts";
import safeJsonParse from "../helpers/json-parser.ts";

export class BlogContentModule {
  constructor(private ai: AIService) {}

  async generateDynamicTopic(): Promise<{ title: string; category: string }> {
    const categories = TOPIC_CATEGORIES.map((c) => c.category).join(", ");
    const prompt = buildDynamicTopicPrompt(categories);
    const response = await this.ai.run(prompt);

    const parsed = safeJsonParse(response.text || "");
    if (!parsed || !parsed.title || !parsed.category) {
      return { title: "How to Sell Your House Fast for Cash", category: "cash-offers" };
    }

    return parsed;
  }

  async generateBlogPost(
    title: string,
    category: string,
    marketLinks: string
  ): Promise<{
    content: string;
    excerpt: string;
    meta_description: string;
    seo_title: string;
    slug: string;
  } | null> {
    const prompt = buildBlogPrompt(title, category, marketLinks);
    const response = await this.ai.run(prompt);

    if (!response.text) return null;

    const parsed = safeJsonParse(response.text);
    if (!parsed || !parsed.content) return null;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      content: parsed.content,
      excerpt: parsed.excerpt || parsed.content.substring(0, 200),
      meta_description: parsed.meta_description || "",
      seo_title: parsed.seo_title || title,
      slug,
    };
  }
}
