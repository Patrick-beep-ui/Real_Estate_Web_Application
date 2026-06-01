export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  text: string;
  modelVersion?: string;
  responseId?: string;
  usageMetadata?: any;
}

export interface AIClientInterface {
  generate(prompt: string, timeout?: number): Promise<AIResponse>;
  generateWithHistory(
    systemPrompt: string,
    messages: Message[],
    timeout?: number
  ): Promise<AIResponse>;
}
