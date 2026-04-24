import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Project } from '@watchenv/shared';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly api = '/api/projects';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Project[]>(this.api, { withCredentials: true });
  }

  getOne(id: string) {
    return this.http.get<Project>(`${this.api}/${id}`, { withCredentials: true });
  }

  create(dto: { gitlabProjectId: number; name: string; namespacePath: string; webhookSecret: string }) {
    return this.http.post<Project>(this.api, dto, { withCredentials: true });
  }
}
