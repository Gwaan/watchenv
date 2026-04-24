import { Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import type { Kysely, Selectable } from 'kysely';
import type { Project } from '@watchenv/shared';
import { DB } from '../../db/db.module';
import type { Database, ProjectsTable } from '../../db/types';

export interface CreateProjectDto {
  gitlabProjectId: number;
  name: string;
  namespacePath: string;
  webhookSecret: string;
}

@Injectable()
export class ProjectsRepository {
  constructor(@Inject(DB) private db: Kysely<Database>) {}

  async findAll(): Promise<Project[]> {
    const rows = await this.db
      .selectFrom('projects')
      .select(['id', 'gitlabProjectId', 'name', 'namespacePath', 'createdAt'])
      .execute();
    return rows.map(r => ({
      id: r.id,
      gitlabProjectId: r.gitlabProjectId,
      name: r.name,
      namespacePath: r.namespacePath,
      createdAt: (r.createdAt as Date).toISOString(),
    }));
  }

  findById(id: string): Promise<Selectable<ProjectsTable> | undefined> {
    return this.db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  findByGitlabId(gitlabProjectId: number): Promise<Selectable<ProjectsTable> | undefined> {
    return this.db
      .selectFrom('projects')
      .selectAll()
      .where('gitlabProjectId', '=', gitlabProjectId)
      .executeTakeFirst();
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const row = await this.db
      .insertInto('projects')
      .values({ id: createId(), ...dto })
      .returningAll()
      .executeTakeFirstOrThrow();
    return {
      id: row.id,
      gitlabProjectId: row.gitlabProjectId,
      name: row.name,
      namespacePath: row.namespacePath,
      createdAt: (row.createdAt as Date).toISOString(),
    };
  }

  delete(id: string) {
    return this.db.deleteFrom('projects').where('id', '=', id).execute();
  }
}
