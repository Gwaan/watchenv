import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { DbModule } from './db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { EnvironmentsModule } from './modules/environments/environments.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SseModule } from './modules/sse/sse.module';
import { SyncModule } from './modules/sync/sync.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

const staticPath = join(__dirname, '..', 'public');
const staticModules = existsSync(staticPath)
  ? [ServeStaticModule.forRoot({ rootPath: staticPath, exclude: ['/api{/*path}'] })]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DbModule,
    AuthModule,
    ProjectsModule,
    EnvironmentsModule,
    DeploymentsModule,
    WebhooksModule,
    SseModule,
    SyncModule,
    ...staticModules,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
