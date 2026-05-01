import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCepMask]',
  standalone: true
})
export class CepMaskDirective {
  private control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5
      ? `${digits.slice(0,5)}-${digits.slice(5)}`
      : digits;
    input.value = formatted;
    this.control?.control?.setValue(formatted, { emitEvent: false });
  }
}
