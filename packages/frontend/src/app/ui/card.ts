import { Component } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'ui-card' },
  styles: [
    `
      :host {
        display: block;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        padding: 20px;
      }
    `,
  ],
})
export class CardComponent {}
