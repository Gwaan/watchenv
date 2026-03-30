import { DeploymentStatus } from "../enums/deployment-status"

export interface Deployment {
  id: string
  gitlabDeploymentId: number
  gitlabPipelineId: number | null
  status: DeploymentStatus
  ref: string
  sha: string
  commitMessage: string | null
  commitUrl: string | null
  triggeredAt: string
  finishedAt: string | null
  environmentId: string
  triggeredBy: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  } | null
}
