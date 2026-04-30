import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DocumentoRequest } from '../../../../core/models/requests/documento.request';
import { DocumentoService } from '../../data-access/documento.service';
import { AlunoService } from '../../../alunos/data-access/aluno.service';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { TipoDocumento } from '../../../../core/models/enums/tipo-documento.enum';
import { NotificationService } from '../../../../core/services/notification.service';

const TIPO_LABELS: Record<string, string> = {
  DECLARACAO_MATRICULA:  'Declaração de Matrícula',
  HISTORICO_ESCOLAR:     'Histórico Escolar',
  DECLARACAO_FREQUENCIA: 'Declaração de Frequência'
};

@Component({
  selector: 'app-documento-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './documento-form.component.html',
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .dialog-card {
      background: #fff; border-radius: 12px; padding: 28px 32px;
      width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 8px 30px rgba(0,0,0,.2);
    }
    .dialog-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .dialog-title h2 { margin: 0; font-weight: 500; }
    .dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .loading-inline { display: flex; align-items: center; gap: 8px; }
    .spinner-center { display: flex; justify-content: center; padding: 32px 0; }
    .info-hint { color: #1e40af; background: #eff6ff; border-radius: 6px;
      padding: 8px 12px; font-size: 13px; margin-bottom: 16px; }
  `]
})
export class DocumentoFormComponent implements OnInit {

  readonly close = output<void>();

  private fb = inject(NonNullableFormBuilder);
  private documentoService = inject(DocumentoService);
  private alunoService = inject(AlunoService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected loading = signal(false);
  protected alunos = signal<AlunoResponse[]>([]);
  readonly tipoOptions = Object.values(TipoDocumento);
  readonly tipoLabels = TIPO_LABELS;

  form = this.fb.group({
    alunoId: [null as unknown as number, [Validators.required]],
    tipo:    [null as unknown as string, [Validators.required]]
  });

  ngOnInit(): void {
    this.carregarAlunos();
  }

  private carregarAlunos(): void {
    this.loading.set(true);
    this.alunoService.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: alunos => { this.alunos.set(alunos); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const request = this.form.value as DocumentoRequest;

    this.documentoService.save(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notification.success('Documento emitido com sucesso.');
          this.loading.set(false);
          this.close.emit();
        },
        error: () => { this.loading.set(false); }
      });
  }

  cancelar(): void { this.close.emit(); }
}
