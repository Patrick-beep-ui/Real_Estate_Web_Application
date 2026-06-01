import { Message } from "../AIClientInterface.ts";

export function toGeminiContents(messages: Message[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : m.role,
    parts: [{ text: m.content }],
  }));
}

export function buildGeminiRequestBody(systemPrompt: string, messages: Message[]) {
  const contents = systemPrompt
    ? [{ role: "user" as const, parts: [{ text: systemPrompt }] }, ...toGeminiContents(messages || [])]
    : toGeminiContents(messages || []);
  return { contents };
}
