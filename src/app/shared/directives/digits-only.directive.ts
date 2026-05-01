import { Directive, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDigitsOnly]',
  standalone: true
})
export class DigitsOnlyDirective {
  private control = inject(NgControl, { optional: true });

  @Input() maxDigits = 32;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, this.maxDigits);
    input.value = digits;
    this.control?.control?.setValue(digits, { emitEvent: false });
  }
}
