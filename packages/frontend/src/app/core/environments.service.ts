import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Environment } from './models';

@Injectable({ providedIn: 'root' })
export class EnvironmentsService {
  private readonly api = '/api/environments';

  constructor(private http: HttpClient) {}

  getByProject(projectId: string) {
    return this.http.get<Environment[]>(`${this.api}/project/${projectId}`, { withCredentials: true });
  }

  getOne(id: string) {
    return this.http.get<Environment>(`${this.api}/${id}`, { withCredentials: true });
  }
}
