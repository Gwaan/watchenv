import { Injectable, NotFoundException } from '@nestjs/common';
import type { Selectable } from 'kysely';
import type { Deployment } from '@watchenv/shared';
import type { DeploymentsTable } from '../../db/types';
import { DeploymentsRepository } from './deployments.repository';
import type { UpsertDeploymentDto } from './dto/upsert-deployment.dto';

@Injectable()
export class DeploymentsService {
  constructor(private readonly repo: DeploymentsRepository) {}

  findByEnvironment(environmentId: string): Promise<Deployment[]> {
    return this.repo.findByEnvironment(environmentId);
  }

  async findOne(id: string): Promise<Deployment> {
    const dep = await this.repo.findOne(id);
    if (!dep) throw new NotFoundException(`Deployment ${id} not found`);
    return dep;
  }

  upsert(dto: UpsertDeploymentDto): Promise<Selectable<DeploymentsTable>> {
    return this.repo.upsert(dto);
  }
}
