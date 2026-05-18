import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
