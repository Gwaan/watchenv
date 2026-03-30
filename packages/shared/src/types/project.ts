import { ProjectRole } from '../enums/project-role';

export interface Project {
  id: string;
  gitlabProjectId: number;
  name: string;
  namespacePath: string;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}
