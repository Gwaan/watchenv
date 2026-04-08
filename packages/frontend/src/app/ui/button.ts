import { Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Directive({
  selector: 'button[ui-btn], a[ui-btn]',
  standalone: true,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    class: 'ui-btn',
  },
})
export class ButtonDirective {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
}
