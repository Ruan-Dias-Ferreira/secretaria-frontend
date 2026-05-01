import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TurmaRequest } from '../../../../core/models/requests/turma.request';
import { TurmaService } from '../../data-access/turma.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatriculaService } from '../../../matriculas/data-access/matricula.service';
import { RematriculaJanelaResponse } from '../../../../core/models/responses/rematricula-janela.response';

@Component({
  selector: 'app-cadastrar-turma',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './cadastrar-turma.component.html',
  styleUrl: './cadastrar-turma.component.scss',
})
export class CadastrarTurmaComponent {
  private fb = inject(NonNullableFormBuilder);
  private turmaSvc = inject(TurmaService);
  private notify = inject(NotificationService);
  private matriculaSvc = inject(MatriculaService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected salvando = signal(false);
  protected janela = signal<RematriculaJanelaResponse | null>(null);

  protected readonly anoAtual = new Date().getFullYear();
  protected readonly anoProximo = this.anoAtual + 1;

  protected readonly turnos = [
    { value: 'MATUTINO',   label: 'Matutino' },
    { value: 'VESPERTINO', label: 'Vespertino' },
    { value: 'NOTURNO',    label: 'Noturno' },
    { value: 'INTEGRAL',   label: 'Integral' },
  ];

  protected readonly series = [
    'Maternal', 'Pré I', 'Pré II',
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano',
    '1º EM', '2º EM', '3º EM',
    'EJA',
  ];

  protected janelaAberta = computed(() => this.janela()?.disponivel ?? false);

  protected anosPermitidos = computed(() => {
    const anos = [{ value: this.anoAtual, label: `${this.anoAtual} (em andamento)` }];
    if (this.janelaAberta()) {
      anos.push({ value: this.anoProximo, label: `${this.anoProximo} (rematrícula)` });
    }
    return anos;
  });

  protected mensagemJanela = computed(() => {
    const j = this.janela();
    if (!j) return null;
    return j.disponivel
      ? `Janela de rematrícula aberta (${j.inicio} → ${j.fim}). Pode cadastrar turmas para ${j.anoLetivoDestino}.`
      : `Janela de rematrícula fechada. Cadastro permitido apenas para ${this.anoAtual}.`;
  });

  protected form = this.fb.group({
    curso:     ['', [Validators.required]],
    nome:      ['', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]],
    turno:     ['MATUTINO', [Validators.required]],
    anoLetivo: [this.anoAtual, [Validators.required]],
  });

  constructor() {
    this.matriculaSvc.getJanelaRematricula()
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(j => this.janela.set(j));
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.info('Preencha os campos obrigatórios.');
      return;
    }
    const ano = this.form.getRawValue().anoLetivo;
    if (ano !== this.anoAtual && !(ano === this.anoProximo && this.janelaAberta())) {
      this.notify.error('Ano letivo inválido para cadastro.');
      return;
    }
    this.salvando.set(true);
    const req = this.form.getRawValue() as TurmaRequest;
    this.turmaSvc.save(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: t => {
          this.salvando.set(false);
          const sufixo = t.rematricula ? ' (turma de rematrícula)' : '';
          this.notify.success(`Turma "${t.nome}" cadastrada${sufixo}.`);
          this.router.navigateByUrl('/turmas/situacao');
        },
        error: err => {
          this.salvando.set(false);
          const msg = err?.error?.message ?? err?.error?.error ?? 'Erro ao cadastrar turma.';
          this.notify.error(msg);
        },
      });
  }

  protected limpar(): void {
    this.form.reset({
      curso: '', nome: '', turno: 'MATUTINO', anoLetivo: this.anoAtual,
    });
  }

  protected cancelar(): void { this.router.navigateByUrl('/turmas/situacao'); }
}
