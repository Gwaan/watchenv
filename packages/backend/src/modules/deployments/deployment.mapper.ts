import type { Deployment, DeploymentStatus } from '@watchenv/shared';

export interface DeploymentRow {
  id: string;
  gitlabDeploymentId: number;
  gitlabPipelineId: number | null;
  status: string;
  ref: string;
  sha: string;
  commitMessage: string | null;
  commitUrl: string | null;
  triggeredAt: Date;
  finishedAt: Date | null;
  environmentId: string;
  uId: string | null;
  uUsername: string | null;
  uDisplayName: string | null;
  uAvatarUrl: string | null;
}

export function mapDeploymentRow(row: DeploymentRow): Deployment {
  return {
    id: row.id,
    gitlabDeploymentId: row.gitlabDeploymentId,
    gitlabPipelineId: row.gitlabPipelineId,
    status: row.status as DeploymentStatus,
    ref: row.ref,
    sha: row.sha,
    commitMessage: row.commitMessage,
    commitUrl: row.commitUrl,
    triggeredAt: row.triggeredAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    environmentId: row.environmentId,
    triggeredBy: row.uId
      ? {
          id: row.uId,
          username: row.uUsername!,
          displayName: row.uDisplayName!,
          avatarUrl: row.uAvatarUrl,
        }
      : null,
  };
}
