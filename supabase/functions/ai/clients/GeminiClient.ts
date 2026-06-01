/// <reference lib="deno.ns" />

import { AIClientInterface, AIResponse, Message } from "../AIClientInterface.ts";
import { buildGeminiRequestBody } from "../helpers/message-converter.ts";

const MODEL = "gemini-2.5-flash";

export class GeminiClient implements AIClientInterface {
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

  private async _call(body: Record<string, unknown>): Promise<AIResponse> {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`,
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
