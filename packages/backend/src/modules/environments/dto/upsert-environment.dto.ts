export interface UpsertEnvironmentDto {
  gitlabEnvId?: number | null;
  slug: string;
  name: string;
  externalUrl?: string | null;
  projectId: string;
}
