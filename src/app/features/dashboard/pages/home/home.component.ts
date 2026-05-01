import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/enums/role.enum';
import { EventCalendarComponent } from '../../components/event-calendar/event-calendar.component';
import { FrequenciaService } from '../../../frequencias/data-access/frequencia.service';

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
export class HomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly frequenciaSvc = inject(FrequenciaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSecretaria = this.auth.hasRole(Role.SECRETARIA);

  protected presentesHoje = signal<number>(0);
  protected alunosAtivos = signal<number>(0);
  protected percentualHoje = signal<number>(0);

  protected readonly metrics = computed<MetricCard[]>(() => {
    const ativos = this.alunosAtivos();
    const presentes = this.presentesHoje();
    const pct = this.percentualHoje();
    return [
      { label: 'Alunos ativos',         value: ativos, sub: 'total matriculado' },
      {
        label: 'Alunos presentes hoje',
        value: presentes,
        sub: `${pct.toFixed(1)}% de presença`,
        color: 'var(--app-success)',
      },
    ];
  });

  protected readonly alerts: AlertCard[] = [
    {
      type: 'err', icon: '📝',
      title: 'Inserir Frequência',
      sub: 'Clique para lançar a frequência do dia →',
      route: '/frequencias/lancar',
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

  ngOnInit(): void {
    this.carregarResumo();
    this.frequenciaSvc.frequenciaAtualizada$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregarResumo());
  }

  private carregarResumo(): void {
    this.frequenciaSvc.resumoDia()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.alunosAtivos.set(r.alunosAtivos);
          this.presentesHoje.set(r.presentes);
          this.percentualHoje.set(r.percentual);
        },
        error: () => { /* silent */ },
      });
  }
}
