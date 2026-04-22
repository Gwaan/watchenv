import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import type { Kysely } from 'kysely';
import { DB } from 'src/db/db.module';
import type { Database } from '../../db/types';
import type { UpsertDeploymentDto } from './dto/upsert-deployment.dto';

@Injectable()
export class DeploymentsService {
  constructor(@Inject(DB) private db: Kysely<Database>) {}

  findByEnvironment(environmentId: string) {
    return this.db
      .selectFrom('deployments')
      .selectAll()
      .where('environmentId', '=', environmentId)
      .orderBy('triggeredAt', 'desc')
      .execute();
  }

  async findOne(id: string) {
    const deployment = await this.db
      .selectFrom('deployments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!deployment) throw new NotFoundException(`Deployment ${id} not found`);
    return deployment;
  }

  upsert(dto: UpsertDeploymentDto) {
    return this.db
      .insertInto('deployments')
      .values({ id: createId(), ...dto })
      .onConflict(oc =>
        oc.column('gitlabDeploymentId').doUpdateSet({
          status: dto.status,
          finishedAt: dto.finishedAt ?? null,
          updatedAt: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
