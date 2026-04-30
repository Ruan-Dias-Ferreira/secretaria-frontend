import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  template: `
    <div class="container">
      <h1>Acesso Negado</h1>
      <p>Você não tem permissão para acessar esta página.</p>
      <button (click)="voltar()">Voltar ao Login</button>
    </div>
  `,
  styles: [`
    .container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
    h1 { color: #dc2626; margin-bottom: 8px; }
    p { color: #6b7280; margin-bottom: 24px; }
    button { padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
  `]
})
export class UnauthorizedPageComponent {
  private readonly router = inject(Router);

  voltar(): void {
    this.router.navigate(['/auth/login']);
  }
}
