import { AIService } from "../services/AIService.ts";
import { buildImagePromptsPrompt } from "../prompts/blog-image-gen.ts";
import safeJsonParse from "../helpers/json-parser.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

export interface GeneratedImage {
  url: string;
  alt: string;
}

export class BlogImageModule {
  constructor(private ai: AIService) {}

  async generateImagePrompts(
    title: string,
    content: string,
    count: number
  ): Promise<string[]> {
    const prompt = buildImagePromptsPrompt(title, content, count);
    const response = await this.ai.run(prompt);
    const parsed = safeJsonParse(response.text || "");
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, count);
  }

  async generateAndUploadImage(
    supabase: ReturnType<typeof createClient>,
    prompt: string,
    blogSlug: string,
    index: number
  ): Promise<GeneratedImage | null> {
    const base64 = await this.ai.runImage(prompt);
    if (!base64) return null;

    const base64Data = base64.split(",")[1];
    if (!base64Data) return null;

    const imageBytes = base64Decode(base64Data);
    const fileName = `${blogSlug}/image-${index}-${Date.now()}.png`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    return { url: data.publicUrl, alt: prompt.slice(0, 100) };
  }

  insertImagesIntoContent(
    content: string,
    images: GeneratedImage[]
  ): string {
    const lines = content.split("\n");
    const h2Indexes: number[] = [];

    lines.forEach((line, i) => {
      if (line.startsWith("## ")) h2Indexes.push(i);
    });

    if (!h2Indexes.length) return content;

    const step = Math.max(1, Math.floor(h2Indexes.length / images.length));
    const inserts: { line: number; imgIndex: number }[] = [];

    for (let i = 0; i < images.length; i++) {
      const h2Index = h2Indexes[i * step];
      if (h2Index === undefined) break;

      let insertAt = h2Index + 1;
      while (insertAt < lines.length && lines[insertAt].trim() !== "") {
        insertAt++;
      }

      inserts.push({ line: insertAt, imgIndex: i });
    }

    inserts.reverse().forEach(({ line, imgIndex }) => {
      const img = images[imgIndex];
      lines.splice(line, 0, `\n![${img.alt}](${img.url})\n`);
    });

    return lines.join("\n");
  }

  async generateBlogImages(
    supabase: ReturnType<typeof createClient>,
    blogSlug: string,
    blogTitle: string,
    blogContent: string,
    imageCount: number = 3
  ): Promise<GeneratedImage[]> {
    const prompts = await this.generateImagePrompts(blogTitle, blogContent, imageCount);
    if (!prompts.length) return [];

    const images: GeneratedImage[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const image = await this.generateAndUploadImage(supabase, prompts[i], blogSlug, i);
      if (image) images.push(image);
      if (i < prompts.length - 1) await new Promise((r) => setTimeout(r, 2000));
    }

    return images;
  }
}
