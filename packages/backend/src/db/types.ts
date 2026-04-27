import { ColumnType } from 'kysely';

type Auto<T> = ColumnType<T, T | undefined, never>;
type AutoUpdatable<T> = ColumnType<T, T | undefined, T>;

export type ProjectRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type DeploymentStatus = 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELED';
export type ReservationStatus = 'ACTIVE' | 'RELEASED';

export interface UsersTable {
  id: string;
  gitlabId: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Auto<Date>;
  updatedAt: AutoUpdatable<Date>;
}

export interface ProjectsTable {
  id: string;
  gitlabProjectId: number;
  name: string;
  namespacePath: string;
  webhookSecret: string;
  createdAt: Auto<Date>;
  updatedAt: AutoUpdatable<Date>;
}

export interface ProjectMembersTable {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  createdAt: Auto<Date>;
  updatedAt: AutoUpdatable<Date>;
}

export interface EnvironmentsTable {
  id: string;
  gitlabEnvId: number | null;
  slug: string;
  name: string;
  externalUrl: string | null;
  projectId: string;
  currentDeploymentId: string | null;
  createdAt: Auto<Date>;
  updatedAt: AutoUpdatable<Date>;
}

export interface DeploymentsTable {
  id: string;
  gitlabDeploymentId: number;
  gitlabPipelineId: number | null;
  gitlabJobId: number | null;
  status: DeploymentStatus;
  ref: string;
  sha: string;
  commitMessage: string | null;
  commitUrl: string | null;
  triggeredAt: Date;
  finishedAt: Date | null;
  environmentId: string;
  triggeredById: string | null;
  createdAt: Auto<Date>;
  updatedAt: AutoUpdatable<Date>;
}

export interface ReservationsTable {
  id: string;
  reason: string;
  status: ReservationStatus;
  reservedAt: Auto<Date>;
  releasedAt: Date | null;
  environmentId: string;
  userId: string;
  createdAt: Auto<Date>;
  updatedAt: AutoUpdatable<Date>;
}

export interface AuditLogsTable {
  id: string;
  action: string;
  actorId: string | null;
  targetId: string | null;
  targetType: string | null;
  payload: string;
  ipAddress: string | null;
  createdAt: Auto<Date>;
}

export interface Database {
  users: UsersTable;
  projects: ProjectsTable;
  projectMembers: ProjectMembersTable;
  environments: EnvironmentsTable;
  deployments: DeploymentsTable;
  reservations: ReservationsTable;
  auditLogs: AuditLogsTable;
}
