import { Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import type { Kysely, Selectable } from 'kysely';
import { sql } from 'kysely';
import type { Deployment } from '@watchenv/shared';
import { DB } from '../../db/db.module';
import type { Database, DeploymentsTable } from '../../db/types';
import { mapDeploymentRow } from './deployment.mapper';
import type { UpsertDeploymentDto } from './dto/upsert-deployment.dto';

@Injectable()
export class DeploymentsRepository {
  constructor(@Inject(DB) private db: Kysely<Database>) {}

  async findOne(id: string): Promise<Deployment | undefined> {
    const rows = await this.queryWithUser().where('d.id', '=', id).execute();
    return rows[0] ? mapDeploymentRow(rows[0]) : undefined;
  }

  async findByEnvironment(environmentId: string): Promise<Deployment[]> {
    const rows = await this.queryWithUser()
      .where('d.environmentId', '=', environmentId)
      .orderBy('d.triggeredAt', 'desc')
      .execute();
    return rows.map(mapDeploymentRow);
  }

  async findManyByIds(ids: string[]): Promise<Deployment[]> {
    if (!ids.length) return [];
    const rows = await this.queryWithUser().where('d.id', 'in', ids).execute();
    return rows.map(mapDeploymentRow);
  }

  upsert(dto: UpsertDeploymentDto): Promise<Selectable<DeploymentsTable>> {
    return this.db
      .insertInto('deployments')
      .values({ id: createId(), ...dto })
      .onConflict(oc =>
        oc.column('gitlabDeploymentId').doUpdateSet({
          status: dto.status,
          finishedAt: dto.finishedAt ?? null,
          updatedAt: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  private queryWithUser() {
    return this.db
      .selectFrom('deployments as d')
      .leftJoin('users as u', 'u.id', 'd.triggeredById')
      .select([
        'd.id',
        'd.gitlabDeploymentId',
        'd.gitlabPipelineId',
        'd.status',
        'd.ref',
        'd.sha',
        'd.commitMessage',
        'd.commitUrl',
        'd.triggeredAt',
        'd.finishedAt',
        'd.environmentId',
        sql<string | null>`u.id`.as('uId'),
        sql<string | null>`u.username`.as('uUsername'),
        sql<string | null>`u.display_name`.as('uDisplayName'),
        sql<string | null>`u.avatar_url`.as('uAvatarUrl'),
      ]);
  }
}
