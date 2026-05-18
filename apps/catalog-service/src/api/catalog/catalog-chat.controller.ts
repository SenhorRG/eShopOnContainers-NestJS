import { Body, Controller, Get, Post, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CatalogChatService } from '../../application/catalog/catalog-chat.service';
import { CatalogChatCompletionRequestDto } from './dto/catalog-chat.dto';

@ApiTags('Catalog Chat')
@Controller('catalog/chat')
export class CatalogChatController {
  constructor(private readonly chat: CatalogChatService) {}

  @Version(VERSION_NEUTRAL)
  @Get('status')
  @ApiOperation({ summary: 'Whether storefront chat can call the completion endpoint' })
  status() {
    return this.chat.getStatus();
  }

  @Version(VERSION_NEUTRAL)
  @Post('completions')
  @ApiOperation({ summary: 'Non-streaming chat completion via configured Ollama /api/chat' })
  async completions(@Body() body: CatalogChatCompletionRequestDto) {
    const message = await this.chat.complete(body.messages);
    return { choices: [{ message }] };
  }
}
