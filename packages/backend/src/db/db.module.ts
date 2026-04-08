import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import { createDb } from './index';
import type { Database } from './types';

export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Kysely<Database> => {
        return createDb(config.getOrThrow('DATABASE_URL'));
      },
    },
  ],
  exports: [DB],
})
export class DbModule {}
