import { Injectable, NotFoundException } from '@nestjs/common';
import type { Selectable } from 'kysely';
import type { Project } from '@watchenv/shared';
import type { ProjectsTable } from '../../db/types';
import type { CreateProjectDto } from './projects.repository';
import { ProjectsRepository } from './projects.repository';

export type { CreateProjectDto };

@Injectable()
export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository) {}

  findAll(): Promise<Project[]> {
    return this.repo.findAll();
  }

  async findOne(id: string): Promise<Selectable<ProjectsTable>> {
    const project = await this.repo.findById(id);
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async findByGitlabId(gitlabProjectId: number): Promise<Selectable<ProjectsTable>> {
    const project = await this.repo.findByGitlabId(gitlabProjectId);
    if (!project) throw new NotFoundException(`Project with gitlab id ${gitlabProjectId} not found`);
    return project;
  }

  findByGitlabIdOptional(gitlabProjectId: number): Promise<Selectable<ProjectsTable> | undefined> {
    return this.repo.findByGitlabId(gitlabProjectId);
  }

  create(dto: CreateProjectDto): Promise<Project> {
    return this.repo.create(dto);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
