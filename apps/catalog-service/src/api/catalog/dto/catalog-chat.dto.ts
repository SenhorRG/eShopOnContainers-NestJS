import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsString, MinLength, ValidateNested } from 'class-validator';

export class CatalogChatMessageDto {
  @IsIn(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';

  @IsString()
  @MinLength(1)
  content!: string;
}

export class CatalogChatCompletionRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CatalogChatMessageDto)
  messages!: CatalogChatMessageDto[];
}
