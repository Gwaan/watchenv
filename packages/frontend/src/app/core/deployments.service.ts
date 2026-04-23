import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Deployment } from './models';

@Injectable({ providedIn: 'root' })
export class DeploymentsService {
  private readonly api = '/api/deployments';

  constructor(private http: HttpClient) {}

  getByEnvironment(environmentId: string) {
    return this.http.get<Deployment[]>(`${this.api}/environment/${environmentId}`, { withCredentials: true });
  }

  getOne(id: string) {
    return this.http.get<Deployment>(`${this.api}/${id}`, { withCredentials: true });
  }
}
