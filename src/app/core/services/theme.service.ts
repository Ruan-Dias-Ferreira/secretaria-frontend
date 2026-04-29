import { Injectable, signal, computed } from '@angular/core';

type Theme = 'light' | 'dark' | 'high-contrast';

const THEME_ICONS: Record<Theme, string> = {
  light: 'light_mode',
  dark: 'dark_mode',
  'high-contrast': 'contrast',
};

const THEME_LABELS: Record<Theme, string> = {
  light: 'Tema Claro',
  dark: 'Tema Escuro',
  'high-contrast': 'Alto Contraste',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themes: Theme[] = ['light', 'dark', 'high-contrast'];
  private readonly current = signal<Theme>('light');

  readonly themeIcon = computed(() => THEME_ICONS[this.current()]);

  readonly nextThemeLabel = computed(() => {
    const idx = this.themes.indexOf(this.current());
    const next = this.themes[(idx + 1) % this.themes.length];
    return `Alternar para ${THEME_LABELS[next]}`;
  });

  toggleTheme(): void {
    const idx = this.themes.indexOf(this.current());
    const next = this.themes[(idx + 1) % this.themes.length];
    document.body.classList.remove(...this.themes);
    if (next !== 'light') document.body.classList.add(next);
    this.current.set(next);
  }
}
