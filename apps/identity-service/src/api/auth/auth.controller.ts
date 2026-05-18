import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from '../../application/auth/auth.service';
import { LoginAccountDto } from './dto/login-account.dto';
import { RegisterAccountDto } from './dto/register-account.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterAccountDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginAccountDto) {
    return this.auth.login(dto);
  }
}
