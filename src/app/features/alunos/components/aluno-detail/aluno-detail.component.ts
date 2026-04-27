import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { AlunoService } from '../../services/aluno.service';

@Component({
  selector: 'app-aluno-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aluno-detail.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #fff; border-radius: 8px; padding: 24px;
      width: 90%; max-width: 500px;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    dl { margin: 0; }
    dt { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 12px; }
    dd { margin: 4px 0 0 0; font-size: 15px; color: #111827; }
    .loading { text-align: center; padding: 24px; color: #6b7280; }
    .actions { display: flex; justify-content: flex-end; margin-top: 20px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #e5e7eb; }
  `]
})
export class AlunoDetailComponent implements OnInit, OnDestroy {

  @Input() alunoId!: number;
  @Output() close = new EventEmitter<void>();

  aluno: AlunoResponse | null = null;
  loading = false;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(private alunoService: AlunoService) {}

  ngOnInit(): void {
    this.loading = true;
    this.alunoService.findById(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.aluno = data;
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Erro ao carregar aluno.';
          this.loading = false;
        }
      });
  }

  fechar(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
