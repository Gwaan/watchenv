import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnvironmentsController } from './environments.controller';
import { EnvironmentsRepository } from './environments.repository';
import { EnvironmentsService } from './environments.service';

@Module({
  imports: [AuthModule],
  providers: [EnvironmentsRepository, EnvironmentsService],
  controllers: [EnvironmentsController],
  exports: [EnvironmentsService],
})
export class EnvironmentsModule {}
