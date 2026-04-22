import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { timingSafeEqual } from 'node:crypto';
import { DeploymentsService } from '../deployments/deployments.service';
import { EnvironmentsService } from '../environments/environments.service';
import { ProjectsService } from '../projects/projects.service';
import type { DeploymentStatus } from '../../db/types';
import type { GitlabDeploymentEvent } from './dto/gitlab-webhook.dto';

const GITLAB_STATUS_MAP: Record<string, DeploymentStatus> = {
  created: 'CREATED',
  running: 'RUNNING',
  success: 'SUCCESS',
  failed: 'FAILED',
  canceled: 'CANCELED',
};

const FINISHED_STATUSES = new Set(['SUCCESS', 'FAILED', 'CANCELED']);

@Injectable()
export class WebhooksService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly environmentsService: EnvironmentsService,
    private readonly deploymentsService: DeploymentsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async processDeploymentEvent(token: string, payload: GitlabDeploymentEvent) {
    const project = await this.projectsService.findByGitlabId(payload.project.id);

    if (!this.verifyToken(token, project.webhookSecret)) {
      throw new UnauthorizedException();
    }

    const environment = await this.environmentsService.upsert({
      gitlabEnvId: payload.environment_id,
      slug: payload.environment_slug,
      name: payload.environment,
      externalUrl: payload.environment_external_url ?? null,
      projectId: project.id,
    });

    const status = GITLAB_STATUS_MAP[payload.status];
    const deployment = await this.deploymentsService.upsert({
      gitlabDeploymentId: payload.deployment_id,
      gitlabPipelineId: payload.pipeline_id ?? null,
      gitlabJobId: payload.deployable_id ?? null,
      status,
      ref: payload.ref,
      sha: payload.short_sha,
      commitMessage: payload.commit_title ?? null,
      commitUrl: payload.commit_url ?? null,
      triggeredAt: new Date(payload.status_changed_at),
      finishedAt: FINISHED_STATUSES.has(status) ? new Date(payload.status_changed_at) : null,
      environmentId: environment.id,
    });

    const updatedEnvironment = await this.environmentsService.updateCurrentDeployment(
      environment.id,
      deployment.id,
    );

    this.eventEmitter.emit('deployment.updated', { deployment, environment: updatedEnvironment });
  }

  private verifyToken(token: string, secret: string): boolean {
    try {
      return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
    } catch {
      return false;
    }
  }
}
