import {
  pgTable,
  varchar,
  integer,
  timestamp,
  text,
  pgEnum,
  unique,
  index,
} from 'drizzle-orm/pg-core';

export const projectRoleEnum = pgEnum('project_role', ['ADMIN', 'MEMBER', 'VIEWER']);
export const deploymentStatusEnum = pgEnum('deployment_status', [
  'CREATED',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'CANCELED',
]);
export const reservationStatusEnum = pgEnum('reservation_status', ['ACTIVE', 'RELEASED']);

export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  gitlabId: integer('gitlab_id').unique().notNull(),
  username: varchar('username').unique().notNull(),
  email: varchar('email').unique().notNull(),
  displayName: varchar('display_name').notNull(),
  avatarUrl: varchar('avatar_url'),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: varchar('id').primaryKey(),
  gitlabProjectId: integer('gitlab_project_id').unique().notNull(),
  name: varchar('name').notNull(),
  namespacePath: varchar('namespace_path').notNull(),
  webhookSecret: varchar('webhook_secret').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectMembers = pgTable(
  'project_members',
  {
    id: varchar('id').primaryKey(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: varchar('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    role: projectRoleEnum('role').default('VIEWER').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  t => [unique().on(t.userId, t.projectId)]
);

export const environments = pgTable(
  'environments',
  {
    id: varchar('id').primaryKey(),
    gitlabEnvId: integer('gitlab_env_id').notNull(),
    slug: varchar('slug').notNull(),
    name: varchar('name').notNull(),
    externalUrl: varchar('external_url'),
    projectId: varchar('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    currentDeploymentId: varchar('current_deployment_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  t => [unique().on(t.projectId, t.gitlabEnvId), unique().on(t.projectId, t.slug)]
);

export const deployments = pgTable(
  'deployments',
  {
    id: varchar('id').primaryKey(),
    gitlabDeploymentId: integer('gitlab_deployment_id').unique().notNull(),
    gitlabPipelineId: integer('gitlab_pipeline_id'),
    gitlabJobId: integer('gitlab_job_id'),
    status: deploymentStatusEnum('status').default('CREATED').notNull(),
    ref: varchar('ref').notNull(),
    sha: varchar('sha').notNull(),
    commitMessage: text('commit_message'),
    commitUrl: varchar('commit_url'),
    triggeredAt: timestamp('triggered_at').notNull(),
    finishedAt: timestamp('finished_at'),
    environmentId: varchar('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    triggeredById: varchar('triggered_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  t => [index().on(t.environmentId), index().on(t.gitlabPipelineId)]
);

export const reservations = pgTable(
  'reservations',
  {
    id: varchar('id').primaryKey(),
    reason: text('reason').notNull(),
    status: reservationStatusEnum('status').default('ACTIVE').notNull(),
    reservedAt: timestamp('reserved_at').defaultNow().notNull(),
    releasedAt: timestamp('released_at'),
    environmentId: varchar('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  t => [index().on(t.environmentId, t.status)]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id').primaryKey(),
    action: varchar('action').notNull(),
    actorId: varchar('actor_id'),
    targetId: varchar('target_id'),
    targetType: varchar('target_type'),
    payload: text('payload').notNull(),
    ipAddress: varchar('ip_address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  t => [index().on(t.actorId), index().on(t.targetType, t.targetId), index().on(t.createdAt)]
);
