import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <h1>WatchEnv</h1>
      @if (authUrl()) {
        <a [href]="authUrl()">Se connecter avec GitLab</a>
      }
    </div>
  `,
})
export class LoginComponent implements OnInit {
  authUrl = signal<string | null>(null);

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getAuthorizationUrl().subscribe(({ url }) => this.authUrl.set(url));
  }
}
