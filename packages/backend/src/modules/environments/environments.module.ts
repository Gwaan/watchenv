import { Module } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsController } from './environments.controller';

@Module({
  providers: [EnvironmentsService],
  controllers: [EnvironmentsController]
})
export class EnvironmentsModule {}
