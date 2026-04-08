import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="alt()" />
    } @else {
      <span>{{ initials() }}</span>
    }
  `,
  host: { class: 'ui-avatar', '[attr.data-size]': 'size()' },
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: var(--accent-subtle);
        color: var(--accent-text);
        font-weight: var(--weight-semibold);
        overflow: hidden;
        flex-shrink: 0;
      }

      :host([data-size='sm']) {
        width: 24px;
        height: 24px;
        font-size: var(--text-xs);
      }

      :host([data-size='md']) {
        width: 32px;
        height: 32px;
        font-size: var(--text-sm);
      }

      :host([data-size='lg']) {
        width: 40px;
        height: 40px;
        font-size: var(--text-base);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class AvatarComponent {
  src = input<string | null>(null);
  alt = input('');
  name = input('');
  size = input<'sm' | 'md' | 'lg'>('md');

  initials = computed(() => {
    const parts = this.name().trim().split(' ');
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  });
}
