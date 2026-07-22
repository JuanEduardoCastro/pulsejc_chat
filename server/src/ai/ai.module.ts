import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { AiService } from './ai.service';

@Module({
  providers: [
    GeminiProvider,
    { provide: AI_PROVIDER, useExisting: GeminiProvider },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
