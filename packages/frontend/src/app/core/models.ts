export interface Project {
  id: string;
  gitlabProjectId: number;
  name: string;
  namespacePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  gitlabEnvId: number;
  slug: string;
  name: string;
  externalUrl: string | null;
  projectId: string;
  currentDeploymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus = 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELED';

export interface Deployment {
  id: string;
  gitlabDeploymentId: number;
  gitlabPipelineId: number | null;
  gitlabJobId: number | null;
  status: DeploymentStatus;
  ref: string;
  sha: string;
  commitMessage: string | null;
  commitUrl: string | null;
  triggeredAt: string;
  finishedAt: string | null;
  environmentId: string;
  triggeredById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SseDeploymentEvent {
  deployment: Deployment;
  environment: Environment;
}
