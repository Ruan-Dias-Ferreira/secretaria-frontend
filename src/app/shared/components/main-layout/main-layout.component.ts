import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/enums/role.enum';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  roles: Role[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav
        #sidenav
        [mode]="'side'"
        [opened]="true"
        class="sidenav"
      >
        <div class="brand">
          <mat-icon>school</mat-icon>
          <span>Secretaria</span>
        </div>

        <mat-divider></mat-divider>

        <mat-nav-list>
          <a
            *ngFor="let item of itensVisiveis"
            mat-list-item
            [routerLink]="item.path"
            routerLinkActive="active-link"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="sidenav.toggle()" aria-label="Menu">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">Sistema de Secretaria Escolar</span>
          <span class="spacer"></span>

          <button mat-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
            <span class="user-text">{{ login }} ({{ role }})</span>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="sair()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .layout { height: 100vh; }
    .sidenav {
      width: 250px;
      background: var(--mat-sys-surface-container);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      font-size: 18px;
      font-weight: 500;
      color: var(--mat-sys-primary);
    }
    .brand mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .active-link {
      background: var(--mat-sys-secondary-container) !important;
      color: var(--mat-sys-on-secondary-container);
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .toolbar-title {
      margin-left: 8px;
      font-size: 16px;
    }
    .user-text {
      margin-left: 6px;
    }
    .content {
      padding: 0;
      min-height: calc(100vh - 64px);
      background: var(--mat-sys-background);
    }
    @media (max-width: 768px) {
      .toolbar-title { display: none; }
      .user-text { display: none; }
    }
  `]
})
export class MainLayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private readonly menu: MenuItem[] = [
    { label: 'Dashboard',   path: '/dashboard',   icon: 'dashboard',     roles: [Role.SECRETARIA, Role.PROFESSOR, Role.ALUNO] },
    { label: 'Alunos',      path: '/alunos',      icon: 'people',        roles: [Role.SECRETARIA, Role.PROFESSOR] },
    { label: 'Turmas',      path: '/turmas',      icon: 'class',         roles: [Role.SECRETARIA] },
    { label: 'Disciplinas', path: '/disciplinas', icon: 'menu_book',     roles: [Role.SECRETARIA, Role.PROFESSOR] },
    { label: 'Matrículas',  path: '/matriculas',  icon: 'how_to_reg',    roles: [Role.SECRETARIA] },
    { label: 'Notas',       path: '/notas',       icon: 'grade',         roles: [Role.SECRETARIA, Role.PROFESSOR] },
    { label: 'Frequências', path: '/frequencias', icon: 'event_available', roles: [Role.SECRETARIA, Role.PROFESSOR] },
    { label: 'Documentos',  path: '/documentos',  icon: 'description',   roles: [Role.SECRETARIA] },
    { label: 'Usuários',    path: '/usuarios',    icon: 'manage_accounts', roles: [Role.SECRETARIA] }
  ];

  readonly itensVisiveis: MenuItem[];

  constructor(private auth: AuthService, private router: Router) {
    this.itensVisiveis = this.menu.filter(item => item.roles.some(r => this.auth.hasRole(r)));
  }

  get login(): string {
    return this.auth.getCurrentUser()?.login ?? '';
  }

  get role(): string {
    return this.auth.getCurrentUser()?.role ?? '';
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
