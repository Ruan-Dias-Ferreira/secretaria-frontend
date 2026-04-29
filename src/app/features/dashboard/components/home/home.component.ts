import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { EventCalendarComponent } from '../event-calendar/event-calendar.component';

interface MetricCard {
  label: string;
  value: string | number;
  sub: string;
  color?: string;
}

interface AlertCard {
  type: 'err' | 'warn';
  icon: string;
  title: string;
  sub: string;
  route?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatDividerModule,
    EventCalendarComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly auth = inject(AuthService);

  protected readonly isSecretaria = this.auth.hasRole(Role.SECRETARIA);

  protected readonly metrics: MetricCard[] = [
    { label: 'Alunos ativos',         value: 342, sub: 'total matriculado' },
    { label: 'Alunos presentes hoje', value: 289, sub: '84% de presença', color: 'var(--app-success)' },
  ];

  protected readonly alerts: AlertCard[] = [
    {
      type: 'err', icon: '⚠️',
      title: 'Frequência não lançada — 3 turmas em aberto',
      sub: 'Clique para ver e tratar todos os casos →',
      route: '/frequencias',
    },
    {
      type: 'warn', icon: '📋',
      title: 'Alunos não alocados — 2 alunos pendentes',
      sub: 'Clique para ver e tratar todos os casos →',
      route: '/matriculas/consultar',
    },
    {
      type: 'warn', icon: '📉',
      title: 'Baixa frequência — 2 alunos abaixo de 75%',
      sub: 'Clique para ver e tratar todos os casos →',
      route: '/alunos',
    },
    {
      type: 'warn', icon: '📋',
      title: 'Atualização de dados pendente — 4 alunos pendentes',
      sub: 'Clique para ver e tratar as pendências de rematrícula →',
      route: '/matriculas/pendencias',
    },
  ];

  protected readonly quickAccess = [
    { label: 'Nova Matrícula', route: '/matriculas/nova',         icon: 'how_to_reg' },
    { label: 'Rematrícula',    route: '/matriculas/rematricula',  icon: 'refresh' },
    { label: 'Alunos',         route: '/alunos',                  icon: 'school' },
    { label: 'Turmas',         route: '/turmas/situacao',         icon: 'class' },
    { label: 'Frequências',    route: '/frequencias',             icon: 'event_available' },
    { label: 'Documentos',     route: '/documentos',              icon: 'description' },
  ];
}
