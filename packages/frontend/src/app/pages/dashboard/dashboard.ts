import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <h1>Dashboard</h1>
      @if (user()) {
        <p>Connecté en tant que {{ user()!.displayName }}</p>
      }
      <button (click)="logout()">Se déconnecter</button>
    </div>
  `,
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  user = toSignal(this.auth.getSession());

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
