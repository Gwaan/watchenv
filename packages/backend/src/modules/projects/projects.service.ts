import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import type { Kysely } from 'kysely';
import { DB } from '../../db/db.module';
import type { Database } from '../../db/types';

export interface CreateProjectDto {
  gitlabProjectId: number;
  name: string;
  namespacePath: string;
  webhookSecret: string;
}

@Injectable()
export class ProjectsService {
  constructor(@Inject(DB) private db: Kysely<Database>) {}

  findAll() {
    return this.db.selectFrom('projects').selectAll().execute();
  }

  async findByGitlabId(gitlabProjectId: number) {
    const project = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('gitlabProjectId', '=', gitlabProjectId)
      .executeTakeFirst();
    if (!project) throw new NotFoundException(`Project with gitlab id ${gitlabProjectId} not found`);
    return project;
  }

  async findOne(id: string) {
    const project = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.db
      .insertInto('projects')
      .values({ id: createId(), ...dto })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.db.deleteFrom('projects').where('id', '=', id).execute();
  }
}
