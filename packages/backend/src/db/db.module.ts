import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDb, Database } from './index';

export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        return createDb(config.getOrThrow('DATABASE_URL'));
      },
    },
  ],
  exports: [DB],
})
export class DbModule {}
