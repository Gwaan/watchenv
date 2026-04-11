import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

export interface User {
  id: string;
  gitlabId: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = '/api/auth';

  readonly user = signal<User | null>(null);

  constructor(private http: HttpClient) {}

  getAuthorizationUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.api}/gitlab/authorize`);
  }

  loadSession(): Observable<User | null> {
    if (this.user() !== undefined) {
      return of(this.user() ?? null);
    }

    return this.http.get<User>(`${this.api}/session`, { withCredentials: true }).pipe(
      tap((user) => this.user.set(user))
    );
  }

  logout(): Observable<void> {
    return this.http.delete<void>(`${this.api}/session`, { withCredentials: true }).pipe(
      tap(() => this.user.set(null))
    );
  }
}
