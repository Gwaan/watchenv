import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createId } from '@paralleldrive/cuid2';
import axios from 'axios';
import { ProjectsService } from '../projects/projects.service';

interface GitlabProject {
  id: number;
  name: string;
  path_with_namespace: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly projects: ProjectsService,
  ) {}

  async syncUserProjects(userId: string, accessToken: string): Promise<void> {
    const gitlabUrl = this.config.getOrThrow('GITLAB_URL');
    const webhookBaseUrl = this.config.getOrThrow('WEBHOOK_BASE_URL');

    const allProjects: GitlabProject[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, headers } = await axios.get<GitlabProject[]>(
        `${gitlabUrl}/api/v4/projects`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { membership: true, per_page: 100, page },
        },
      );
      allProjects.push(...data);
      hasMore = !!headers['x-next-page'];
      page = hasMore ? Number(headers['x-next-page']) : page;
    }

    for (const glProject of allProjects) {
      const existing = await this.projects.findByGitlabIdOptional(glProject.id);
      if (existing) continue;

      const webhookSecret = createId();

      const project = await this.projects.create({
        gitlabProjectId: glProject.id,
        name: glProject.name,
        namespacePath: glProject.path_with_namespace,
        webhookSecret,
      });

      try {
        await axios.post(
          `${gitlabUrl}/api/v4/projects/${glProject.id}/hooks`,
          {
            url: `${webhookBaseUrl}/api/webhooks/gitlab`,
            deployment_events: true,
            token: webhookSecret,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
      } catch (err) {
        this.logger.warn(`Failed to register webhook for project ${project.id}: ${err}`);
      }

      this.logger.log(`Synced project ${glProject.path_with_namespace}`);
    }
  }
}
