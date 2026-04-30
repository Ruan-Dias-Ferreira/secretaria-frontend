import {
  ChangeDetectionStrategy, Component, inject, signal, computed, DestroyRef, OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';

import { MatriculaService } from '../../data-access/matricula.service';
import { MatriculaResponse } from '../../../../core/models/responses/matricula.response';
import { StatusMatricula }   from '../../../../core/models/enums/status-matricula.enum';

@Component({
  selector: 'app-matricula-pendencias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './matricula-pendencias.component.html',
  styleUrl: './matricula-pendencias.component.scss',
})
export class MatriculaPendenciasComponent implements OnInit {
  private readonly svc        = inject(MatriculaService);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading    = signal(false);
  protected readonly pendencias = signal<MatriculaResponse[]>([]);

  protected readonly agrupadas = computed(() => {
    const map = new Map<number, MatriculaResponse[]>();
    this.pendencias().forEach(m => {
      if (!map.has(m.turmaId)) map.set(m.turmaId, []);
      map.get(m.turmaId)!.push(m);
    });
    return Array.from(map.entries()).map(([turmaId, alunos]) => ({ turmaId, alunos }));
  });

  ngOnInit(): void {
    this.loading.set(true);
    // Filtra matrículas com status DESISTENTE como proxy de pendências
    this.svc.findAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: mats => {
        this.pendencias.set(mats.filter(m => m.status === StatusMatricula.DESISTENTE));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected atualizar(id: number): void {
    this.router.navigate(['/matriculas/rematricula/atualizar', id]);
  }
}
