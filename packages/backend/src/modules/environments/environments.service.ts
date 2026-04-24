import { Injectable, NotFoundException } from '@nestjs/common';
import type { Selectable } from 'kysely';
import type { Environment } from '@watchenv/shared';
import type { EnvironmentsTable } from '../../db/types';
import { EnvironmentsRepository } from './environments.repository';
import type { UpsertEnvironmentDto } from './dto/upsert-environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(private readonly repo: EnvironmentsRepository) {}

  findByProject(projectId: string): Promise<Environment[]> {
    return this.repo.findByProject(projectId);
  }

  async findOne(id: string): Promise<Environment> {
    const env = await this.repo.findByIdWithDeployment(id);
    if (!env) throw new NotFoundException(`Environment ${id} not found`);
    return env;
  }

  upsert(dto: UpsertEnvironmentDto): Promise<Selectable<EnvironmentsTable>> {
    return this.repo.upsert(dto);
  }

  updateCurrentDeployment(id: string, deploymentId: string): Promise<void> {
    return this.repo.updateCurrentDeployment(id, deploymentId);
  }

  findByIdWithDeployment(id: string): Promise<Environment | undefined> {
    return this.repo.findByIdWithDeployment(id);
  }
}
