/// <reference lib="deno.ns" />

import { AIClientInterface, AIResponse, Message } from "../AIClientInterface.ts";
import { buildGeminiRequestBody } from "../helpers/message-converter.ts";

export class GeminiClient implements AIClientInterface {
  constructor(
    private model = "gemini-2.5-flash",
    private imageModel = "gemini-3.1-flash-image"
  ) {}

  async generate(prompt: string, timeout = 30): Promise<AIResponse> {
    return this._call({
      contents: [{ parts: [{ text: prompt }] }],
    });
  }

  async generateWithHistory(
    systemPrompt: string,
    messages: Message[],
    timeout = 30
  ): Promise<AIResponse> {
    const body = buildGeminiRequestBody(systemPrompt, messages);
    return this._call(body);
  }

  async generateImage(prompt: string): Promise<string | null> {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${this.imageModel}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const part = data?.candidates?.[0]?.content?.parts?.[0];

      if (!part?.inlineData?.data || !part?.inlineData?.mimeType) return null;

      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    } catch (e) {
      console.error("Image generation error:", e);
      return null;
    }
  }

  private async _call(body: Record<string, unknown>): Promise<AIResponse> {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      const err = new Error(`Gemini API error [${response.status}]`);
      (err as any).status = response.status;
      (err as any).body = text;
      throw err;
    }

    const data = await response.json();

    return {
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || "",
      modelVersion: data?.modelVersion,
      responseId: data?.responseId,
      usageMetadata: data?.usageMetadata,
    };
  }
}
