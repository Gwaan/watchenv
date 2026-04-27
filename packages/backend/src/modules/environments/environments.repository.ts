import { Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import type { Kysely, Selectable } from 'kysely';
import { sql } from 'kysely';
import type { Environment } from '@watchenv/shared';
import { DB } from '../../db/db.module';
import type { Database, EnvironmentsTable } from '../../db/types';
import { mapDeploymentRow } from '../deployments/deployment.mapper';
import type { UpsertEnvironmentDto } from './dto/upsert-environment.dto';

@Injectable()
export class EnvironmentsRepository {
  constructor(@Inject(DB) private db: Kysely<Database>) {}

  async findByProject(projectId: string): Promise<Environment[]> {
    const envRows = await this.db
      .selectFrom('environments')
      .selectAll()
      .where('projectId', '=', projectId)
      .execute();
    return this.embedDeployments(envRows);
  }

  async findByIdWithDeployment(id: string): Promise<Environment | undefined> {
    const envRow = await this.db
      .selectFrom('environments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!envRow) return undefined;
    const [env] = await this.embedDeployments([envRow]);
    return env;
  }

  upsert(dto: UpsertEnvironmentDto): Promise<Selectable<EnvironmentsTable>> {
    return this.db
      .insertInto('environments')
      .values({ id: createId(), gitlabEnvId: dto.gitlabEnvId ?? null, ...dto })
      .onConflict(oc =>
        oc.columns(['projectId', 'slug']).doUpdateSet({
          name: dto.name,
          externalUrl: dto.externalUrl ?? null,
          updatedAt: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateCurrentDeployment(id: string, deploymentId: string): Promise<void> {
    await this.db
      .updateTable('environments')
      .set({ currentDeploymentId: deploymentId, updatedAt: new Date() })
      .where('id', '=', id)
      .execute();
  }

  private async embedDeployments(envRows: Selectable<EnvironmentsTable>[]): Promise<Environment[]> {
    const depIds = envRows
      .map(e => e.currentDeploymentId)
      .filter((id): id is string => id !== null);

    const depMap = new Map<string, ReturnType<typeof mapDeploymentRow>>();

    if (depIds.length) {
      const rows = await this.db
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
        ])
        .where('d.id', 'in', depIds)
        .execute();

      for (const row of rows) depMap.set(row.id, mapDeploymentRow(row));
    }

    return envRows.map(e => ({
      id: e.id,
      gitlabEnvId: e.gitlabEnvId,
      slug: e.slug,
      name: e.name,
      externalUrl: e.externalUrl,
      projectId: e.projectId,
      currentDeployment: e.currentDeploymentId ? (depMap.get(e.currentDeploymentId) ?? null) : null,
      activeReservation: null,
    }));
  }
}
