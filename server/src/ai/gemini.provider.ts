import { Injectable, Logger } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { Message } from '../../generated/prisma/client';

const SYSTEM_INSTRUCTION =
  'You are Pulse, the AI assistant built into the Pulse.Jc chat app. Keep replies short, friendly and conversational.';

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenerativeAI(
      this.configService.getOrThrow<string>('AI_API_KEY'),
    );
  }

  async generateResponse(messages: Message[]): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const history = messages.slice(0, -1).map((message) => ({
      role: message.senderType === 'AI' ? 'model' : 'user',
      parts: [{ text: message.content ?? '' }],
    }));

    const lastMessage = messages[messages.length - 1];

    try {
      const chat = model.startChat({ history });

      const result = await chat.sendMessage(lastMessage.content ?? '');

      return result.response.text();
    } catch (error) {
      this.logger.error(
        `Gemini request failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
