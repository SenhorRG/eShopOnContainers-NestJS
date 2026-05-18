import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenIssuerService, jwtModuleSecret } from '../../application/auth/access-token-issuer.service';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtModuleSecret(),
      signOptions: {
        algorithm: 'HS256',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenIssuerService],
})
export class AuthModule {}
