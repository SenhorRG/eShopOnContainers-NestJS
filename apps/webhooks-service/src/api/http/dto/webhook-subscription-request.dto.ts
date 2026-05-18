import { IsOptional, IsString, IsUrl } from 'class-validator';

export class WebhookSubscriptionRequestDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsString()
  event!: string;

  @IsUrl()
  grantUrl!: string;
}
