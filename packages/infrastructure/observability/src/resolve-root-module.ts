import type { Type } from '@nestjs/common';

export type RootModuleLoader = () => Type<object> | Promise<Type<object>>;

export async function resolveRootModule(loader: RootModuleLoader): Promise<Type<object>> {
  return await loader();
}
