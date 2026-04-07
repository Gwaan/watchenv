import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  getAuthorizationUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>('/api/auth/gitlab/authorize');
  }

  getSession(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>('/api/auth/session', { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.delete<void>('/api/auth/session', { withCredentials: true });
  }
}
