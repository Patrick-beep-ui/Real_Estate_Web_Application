import { AIService } from "../services/AIService.ts";
import { CHAT_SYSTEM_PROMPT } from "../prompts/chat-system.ts";
import { Message } from "../AIClientInterface.ts";

export class ChatModule {
  constructor(private ai: AIService) {}

  async chat(messages: Message[]) {
    return this.ai.runWithHistory(CHAT_SYSTEM_PROMPT, messages);
  }
}
