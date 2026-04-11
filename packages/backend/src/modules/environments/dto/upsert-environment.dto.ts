export interface UpsertEnvironmentDto {
  gitlabEnvId: number;
  slug: string;
  name: string;
  externalUrl?: string | null;
  projectId: string;
}
