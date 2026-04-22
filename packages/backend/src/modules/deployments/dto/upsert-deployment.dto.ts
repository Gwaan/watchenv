import type { DeploymentStatus } from '../../../db/types';

export interface UpsertDeploymentDto {
  gitlabDeploymentId: number;
  gitlabPipelineId?: number | null;
  gitlabJobId?: number | null;
  status: DeploymentStatus;
  ref: string;
  sha: string;
  commitMessage?: string | null;
  commitUrl?: string | null;
  triggeredAt: Date;
  finishedAt?: Date | null;
  environmentId: string;
  triggeredById?: string | null;
}
