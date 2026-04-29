import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="placeholder-container">
      <div class="placeholder-icon">🚧</div>
      <h2 class="placeholder-title">{{ title() }}</h2>
      <p class="placeholder-sub">Esta tela está em construção e estará disponível em breve.</p>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 320px;
      padding: 48px 24px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    .placeholder-icon { font-size: 56px; margin-bottom: 16px; }
    .placeholder-title { font-size: 22px; font-weight: 600; margin: 0 0 8px; color: var(--mat-sys-on-surface); }
    .placeholder-sub { font-size: 15px; margin: 0; max-width: 360px; }
  `],
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map(d => d['title'] ?? 'Em construção')),
    { initialValue: 'Em construção' }
  );
}
