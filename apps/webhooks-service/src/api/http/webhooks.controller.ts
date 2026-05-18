import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { parseWebhookTypeFromEventString } from '../../application/domain/webhook-type';
import { GrantUrlTesterService } from '../../application/services/grant-url-tester.service';

import { WebhooksPrismaService } from '../../infrastructure/prisma/webhooks-prisma.service';

import { WebhookSubscriptionRequestDto } from './dto/webhook-subscription-request.dto';
import { WebhooksAuthGuard } from './webhooks-auth.guard';

type Authed = { user: { sub: string } };

/** HTTP surface for `/api/webhooks`. */
@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(WebhooksAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  private readonly log = new Logger(WebhooksController.name);

  constructor(
    private readonly prisma: WebhooksPrismaService,
    private readonly grantUrlTester: GrantUrlTesterService,
  ) {}

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'List webhook subscriptions for the authenticated user' })
  async list(@Req() req: Authed) {
    const userId = req.user.sub;
    return this.prisma.webhookSubscription.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by id' })
  async getById(@Req() req: Authed, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    const subscription = await this.prisma.webhookSubscription.findFirst({
      where: { id, userId },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscriptions ${String(id)} not found`);
    }
    return subscription;
  }

  @Version('1')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create subscription (grant URL must succeed first)' })
  async create(
    @Req() req: Authed,
    @Body() body: WebhookSubscriptionRequestDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const parsed = parseWebhookTypeFromEventString(body.event);
    if (parsed === undefined) {
      throw new BadRequestException(`${body.event} is invalid event name`);
    }

    const grantOk = await this.grantUrlTester.testGrantUrl(body.url, body.grantUrl, body.token ?? '');
    if (!grantOk) {
      throw new BadRequestException(`Invalid grant URL: ${body.grantUrl}`);
    }

    const userId = req.user.sub;
    const subscription = await this.prisma.webhookSubscription.create({
      data: {
        userId,
        destUrl: body.url,
        token: body.token ?? null,
        type: parsed,
      },
    });

    this.log.log(`Created webhook subscription id=${String(subscription.id)} user=${userId}`);

    res
      .status(HttpStatus.CREATED)
      .location(`/api/webhooks/${String(subscription.id)}`)
      .send();
  }

  @Version('1')
  @Delete(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Delete a subscription' })
  async remove(@Req() req: Authed, @Param('id', ParseIntPipe) id: number): Promise<void> {
    const userId = req.user.sub;
    const subscription = await this.prisma.webhookSubscription.findFirst({
      where: { id, userId },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscriptions ${String(id)} not found`);
    }

    await this.prisma.webhookSubscription.delete({ where: { id } });
  }
}
