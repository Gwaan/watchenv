import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [ProjectsRepository, ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
