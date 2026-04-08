import { effect, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'watchenv-theme';

  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
      localStorage.setItem(this.KEY, this.theme());
    });
  }

  toggle() {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
  }

  private initialTheme(): Theme {
    const stored = localStorage.getItem(this.KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
