import { Component, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'running' | 'neutral';

@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'badge', '[attr.data-variant]': 'variant()' },
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: var(--weight-semibold);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid transparent;
        white-space: nowrap;
      }

      :host([data-variant='success']) {
        background: var(--success-bg);
        color: var(--success-text);
        border-color: var(--success-border);
      }

      :host([data-variant='warning']) {
        background: var(--warning-bg);
        color: var(--warning-text);
        border-color: var(--warning-border);
      }

      :host([data-variant='danger']) {
        background: var(--danger-bg);
        color: var(--danger-text);
        border-color: var(--danger-border);
      }

      :host([data-variant='info']) {
        background: var(--info-bg);
        color: var(--info-text);
        border-color: var(--info-border);
      }

      :host([data-variant='running']) {
        background: var(--running-bg);
        color: var(--running-text);
        border-color: var(--running-border);
      }

      :host([data-variant='neutral']) {
        background: var(--neutral-bg);
        color: var(--neutral-text);
        border-color: var(--neutral-border);
      }
    `,
  ],
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
}
