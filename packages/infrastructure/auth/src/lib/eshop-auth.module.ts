import { DynamicModule, Module } from '@nestjs/common';

import { ESHOP_AUTH_MODULE_OPTIONS, type EshopAuthModuleOptions } from './eshop-auth.options';
import { EshopJwtStrategy } from './jwt.strategy';

@Module({})
export class EshopAuthModule {
  static register(options: EshopAuthModuleOptions): DynamicModule {
    return {
      module: EshopAuthModule,
      providers: [
        { provide: ESHOP_AUTH_MODULE_OPTIONS, useValue: options },
        EshopJwtStrategy,
      ],
      exports: [EshopJwtStrategy],
    };
  }
}
