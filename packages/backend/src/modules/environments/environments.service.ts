import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../../db/types';
import { DB } from 'src/db/db.module';
import { UpsertEnvironmentDto } from './dto/upsert-environment.dto';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class EnvironmentsService {
  constructor(@Inject(DB) private db: Kysely<Database>) {}

  async findByProject(projectId: string) {
    return await this.db
      .selectFrom('environments')
      .selectAll()
      .where('projectId', '=', projectId)
      .execute();
  }

  async findOne(id: string) {
    const env = await this.db
      .selectFrom('environments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!env) throw new NotFoundException(`Environment ${id} not found`);
    return env;
  }

  updateCurrentDeployment(id: string, deploymentId: string) {
    return this.db
      .updateTable('environments')
      .set({ currentDeploymentId: deploymentId, updatedAt: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  upsert(dto: UpsertEnvironmentDto) {
    return this.db
      .insertInto('environments')
      .values({ id: createId(), ...dto })
      .onConflict(oc =>
        oc.column('gitlabEnvId').doUpdateSet({
          slug: dto.slug,
          name: dto.name,
          externalUrl: dto.externalUrl ?? null,
          updatedAt: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
