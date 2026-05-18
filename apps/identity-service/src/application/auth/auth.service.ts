import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AccessTokenIssuerService } from './access-token-issuer.service';
import { LoginAccountDto } from '../../api/auth/dto/login-account.dto';
import { RegisterAccountDto } from '../../api/auth/dto/register-account.dto';
import { resolveLoginEmail } from './resolve-login-email';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: AccessTokenIssuerService,
  ) {}

  async register(dto: RegisterAccountDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.identityUser.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.identityUser.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName.trim(),
      },
    });

    return this.tokens.issueForUser(user);
  }

  async login(dto: LoginAccountDto) {
    const email = resolveLoginEmail(dto.email);
    const user = await this.prisma.identityUser.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const ok = await compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.tokens.issueForUser(user);
  }
}
