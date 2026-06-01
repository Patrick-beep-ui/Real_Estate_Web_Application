import { GeminiClient } from "./clients/GeminiClient.ts";
import { ElevenLabsClient } from "./clients/ElevenLabsClient.ts";
import { AIService } from "./services/AIService.ts";
import { ChatModule } from "./modules/ChatModule.ts";
import { ConversationTokenModule } from "./modules/ConversationTokenModule.ts";

const client = new GeminiClient();
const aiService = new AIService(client);
export const chatModule = new ChatModule(aiService);

const elevenLabsClient = new ElevenLabsClient();
export const conversationTokenModule = new ConversationTokenModule(elevenLabsClient);
