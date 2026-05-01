import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { RematriculadoResponse } from '../../../../core/models/responses/rematriculado.response';

interface DialogData {
  rematriculado: RematriculadoResponse;
  turmas: TurmaResponse[];
}

@Component({
  selector: 'app-rematricula-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar rematrícula — {{ data.rematriculado.nome }}</h2>
    <mat-dialog-content>
      <p class="atual">
        Atual: {{ data.rematriculado.serie }} · {{ data.rematriculado.turma }} · {{ data.rematriculado.turno }}
      </p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nova turma destino</mat-label>
          <mat-select formControlName="turmaId">
            @for (t of data.turmas; track t.id) {
              <mat-option [value]="t.id">{{ t.nome }} — {{ t.turno }} ({{ t.curso }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="salvar()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .atual { font-size: 13px; color: var(--mat-sys-on-surface-variant); margin: 0 0 12px; }
    .full  { width: 100%; }
  `],
})
export class RematriculaEditDialogComponent {
  private readonly fb        = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RematriculaEditDialogComponent>);
  protected readonly data    = inject<DialogData>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.group({
    turmaId: [0 as number, [Validators.required, Validators.min(1)]],
  });

  protected salvar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue().turmaId);
  }

  protected cancelar(): void { this.dialogRef.close(); }
}
