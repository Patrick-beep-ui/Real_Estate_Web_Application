import { GeminiClient } from "./clients/GeminiClient.ts";
import { AIService } from "./services/AIService.ts";
import { ChatModule } from "./modules/ChatModule.ts";

const client = new GeminiClient();
const aiService = new AIService(client);

export const chatModule = new ChatModule(aiService);
