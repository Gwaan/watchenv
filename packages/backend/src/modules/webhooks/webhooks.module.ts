import { Module } from '@nestjs/common';
import { DeploymentsModule } from '../deployments/deployments.module';
import { EnvironmentsModule } from '../environments/environments.module';
import { ProjectsModule } from '../projects/projects.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [ProjectsModule, EnvironmentsModule, DeploymentsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
