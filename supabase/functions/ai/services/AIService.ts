import { AIClientInterface, AIResponse, Message } from "../AIClientInterface.ts";

export class AIService {
  private client: AIClientInterface;

  constructor(client: AIClientInterface) {
    this.client = client;
  }

  async run(prompt: string, timeout?: number): Promise<AIResponse> {
    return this.client.generate(prompt, timeout);
  }

  async runWithHistory(
    systemPrompt: string,
    messages: Message[],
    timeout?: number
  ): Promise<AIResponse> {
    return this.client.generateWithHistory(systemPrompt, messages, timeout);
  }

  async runImage(prompt: string): Promise<string | null> {
    if (!this.client.generateImage) {
      throw new Error("AI client does not support image generation");
    }
    return this.client.generateImage(prompt);
  }
}
