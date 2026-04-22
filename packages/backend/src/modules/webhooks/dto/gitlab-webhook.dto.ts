import { z } from 'zod';

export const GitlabDeploymentEventSchema = z.object({
  object_kind: z.literal('deployment'),
  status: z.enum(['created', 'running', 'success', 'failed', 'canceled']),
  deployment_id: z.number(),
  pipeline_id: z.number().nullish(),
  deployable_id: z.number().nullish(),
  environment: z.string(),
  environment_slug: z.string(),
  environment_external_url: z.string().nullish(),
  environment_id: z.number(),
  project: z.object({ id: z.number() }),
  ref: z.string(),
  short_sha: z.string(),
  commit_title: z.string().nullish(),
  commit_url: z.string().nullish(),
  status_changed_at: z.string(),
});

export type GitlabDeploymentEvent = z.infer<typeof GitlabDeploymentEventSchema>;
