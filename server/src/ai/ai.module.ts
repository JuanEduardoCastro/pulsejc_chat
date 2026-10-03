import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [
    GeminiProvider,
    { provide: AI_PROVIDER, useExisting: GeminiProvider },
    AiService,
    AiUsageService,
  ],
  exports: [AiService, AiUsageService],
})
export class AiModule {}
