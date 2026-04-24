import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsRepository } from './deployments.repository';
import { DeploymentsService } from './deployments.service';

@Module({
  imports: [AuthModule],
  providers: [DeploymentsRepository, DeploymentsService],
  controllers: [DeploymentsController],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
