import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of, Subject, switchMap, takeUntil, tap, finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { DeploymentsService } from '../../core/deployments.service';
import { EnvironmentsService } from '../../core/environments.service';
import type { Deployment, DeploymentStatus, Environment, Project } from '../../core/models';
import { ProjectsService } from '../../core/projects.service';
import { SseService } from '../../core/sse.service';
import { ThemeService } from '../../core/theme.service';
import { AvatarComponent } from '../../ui/avatar';
import { BadgeComponent } from '../../ui/badge';
import type { BadgeVariant } from '../../ui/badge';
import { ButtonDirective } from '../../ui/button';
import { CardComponent } from '../../ui/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AvatarComponent, BadgeComponent, ButtonDirective, CardComponent],
  template: `
    <div class="page">
      <header class="header">
        <span class="brand">WatchEnv</span>
        <div class="header-actions">
          <button ui-btn variant="ghost" size="sm" (click)="theme.toggle()">
            {{ theme.theme() === 'dark' ? 'Light' : 'Dark' }}
          </button>
          <ui-avatar [src]="user()?.avatarUrl ?? null" [name]="user()?.displayName ?? ''" size="sm" />
          <span class="username">{{ user()?.displayName }}</span>
          <button ui-btn variant="ghost" size="sm" (click)="logout()">Logout</button>
        </div>
      </header>

      <main class="main">
        @if (loading()) {
          <div class="state">Loading...</div>
        } @else if (projects().length === 0) {
          <div class="state">No projects configured.</div>
        } @else {
          <div class="grid">
            @for (project of projects(); track project.id) {
              <ui-card>
                <div class="project-header">
                  <span class="project-name">{{ project.name }}</span>
                  <span class="project-ns">{{ project.namespacePath }}</span>
                </div>
                <div class="envs">
                  @for (env of (envsByProject()[project.id] || []); track env.id) {
                    <div class="env-row">
                      <div class="env-info">
                        <span class="env-name">{{ env.name }}</span>
                        @if (env.externalUrl) {
                          <a [href]="env.externalUrl" target="_blank" rel="noopener" class="ext-link">↗</a>
                        }
                      </div>
                      @if (getDeployment(env); as dep) {
                        <div class="dep-info">
                          <ui-badge [variant]="statusVariant(dep.status)">{{ dep.status }}</ui-badge>
                          <code class="dep-ref">{{ dep.ref }}</code>
                          <code class="dep-sha">{{ dep.sha.slice(0, 7) }}</code>
                        </div>
                      } @else {
                        <ui-badge variant="neutral">No deployment</ui-badge>
                      }
                    </div>
                  } @empty {
                    <span class="muted">No environments</span>
                  }
                </div>
              </ui-card>
            }
          </div>
        }
      </main>
    </div>

  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--bg-subtle);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 56px;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .brand {
      font-size: var(--text-lg);
      font-weight: var(--weight-bold);
      color: var(--text);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .username {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .main {
      flex: 1;
      padding: 24px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }

    .state {
      text-align: center;
      color: var(--text-muted);
      padding: 48px 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }

    .project-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 16px;
    }

    .project-name {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
    }

    .project-ns {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    .envs {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .env-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      background: var(--bg-subtle);
      border-radius: var(--radius);
    }

    .env-info {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .env-name {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ext-link {
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-decoration: none;
      flex-shrink: 0;

      &:hover { color: var(--accent); }
    }

    .dep-info {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .dep-ref,
    .dep-sha {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    .muted {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly projectsService = inject(ProjectsService);
  private readonly environmentsService = inject(EnvironmentsService);
  private readonly deploymentsService = inject(DeploymentsService);
  private readonly sseService = inject(SseService);
  protected readonly theme = inject(ThemeService);

  protected readonly user = this.auth.user;
  protected readonly projects = signal<Project[]>([]);
  protected readonly envsByProject = signal<Record<string, Environment[]>>({});
  protected readonly deploymentById = signal<Record<string, Deployment>>({});
  protected readonly loading = signal(true);

  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadAll();
    this.listenSse();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected getDeployment(env: Environment): Deployment | null {
    if (!env.currentDeploymentId) return null;
    return this.deploymentById()[env.currentDeploymentId] ?? null;
  }

  protected statusVariant(status: DeploymentStatus): BadgeVariant {
    const map: Record<DeploymentStatus, BadgeVariant> = {
      CREATED: 'neutral',
      RUNNING: 'running',
      SUCCESS: 'success',
      FAILED: 'danger',
      CANCELED: 'neutral',
    };
    return map[status];
  }

  protected logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }

  private loadAll() {
    this.projectsService.getAll().pipe(
      switchMap(projects => {
        this.projects.set(projects);
        if (!projects.length) return of([]);
        return forkJoin(projects.map(p => this.loadProjectData(p.id)));
      }),
      catchError(() => of(null)),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  private loadProjectData(projectId: string) {
    return this.environmentsService.getByProject(projectId).pipe(
      tap(envs => this.envsByProject.update(m => ({ ...m, [projectId]: envs }))),
      switchMap(envs => {
        const withDep = envs.filter(e => e.currentDeploymentId);
        if (!withDep.length) return of([]);
        return forkJoin(withDep.map(env =>
          this.deploymentsService.getOne(env.currentDeploymentId!).pipe(
            tap(dep => this.deploymentById.update(m => ({ ...m, [dep.id]: dep }))),
          )
        ));
      }),
    );
  }

  private listenSse() {
    this.sseService.connect().pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$),
    ).subscribe(event => {
      if (!event) return;
      const { deployment, environment } = event;

      this.envsByProject.update(map => {
        const envs = map[environment.projectId] ?? [];
        const idx = envs.findIndex(e => e.id === environment.id);
        const updated = [...envs];
        if (idx >= 0) {
          updated[idx] = environment;
        } else {
          updated.push(environment);
        }
        return { ...map, [environment.projectId]: updated };
      });

      this.deploymentById.update(m => ({ ...m, [deployment.id]: deployment }));
    });
  }
}
