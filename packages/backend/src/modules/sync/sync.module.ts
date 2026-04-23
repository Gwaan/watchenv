import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { SyncService } from './sync.service';

@Module({
  imports: [ProjectsModule],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
