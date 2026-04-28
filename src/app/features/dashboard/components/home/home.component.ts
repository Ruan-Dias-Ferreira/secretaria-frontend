import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="container">
      <h1>Dashboard</h1>
      <p>Bem-vindo ao Sistema de Secretaria Escolar.</p>
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    h1 { margin: 0 0 8px; }
    p { color: #6b7280; }
  `]
})
export class HomeComponent {}
