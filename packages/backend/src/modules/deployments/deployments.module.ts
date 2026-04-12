import { Module } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';

@Module({
  providers: [DeploymentsService],
  controllers: [DeploymentsController]
})
export class DeploymentsModule {}
