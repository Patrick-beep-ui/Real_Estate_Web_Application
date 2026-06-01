import { ElevenLabsClient } from "../clients/ElevenLabsClient.ts";

export class ConversationTokenModule {
  constructor(private client: ElevenLabsClient) {}

  async getToken(): Promise<{ token: string }> {
    const token = await this.client.getConversationToken();
    return { token };
  }
}
