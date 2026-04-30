import {
  ChangeDetectionStrategy, Component, inject, signal, DestroyRef, OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule }       from '@angular/material/button';
import { MatFormFieldModule }    from '@angular/material/form-field';
import { MatInputModule }        from '@angular/material/input';
import { MatSelectModule }       from '@angular/material/select';
import { MatDividerModule }      from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlunoService }        from '../../../alunos/data-access/aluno.service';
import { TurmaService }        from '../../../turmas/data-access/turma.service';
import { MatriculaService }    from '../../data-access/matricula.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HistoryService }      from '../../../../core/services/history.service';
import { TurmaResponse }       from '../../../../core/models/responses/turma.response';

@Component({
  selector: 'app-matricula-atualizar-dados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  templateUrl: './matricula-atualizar-dados.component.html',
  styleUrl: './matricula-atualizar-dados.component.scss',
})
export class MatriculaAtualizarDadosComponent implements OnInit {
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly alunoSvc     = inject(AlunoService);
  private readonly turmaSvc     = inject(TurmaService);
  private readonly matriculaSvc = inject(MatriculaService);
  private readonly notification = inject(NotificationService);
  private readonly history      = inject(HistoryService);
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly turmas   = signal<TurmaResponse[]>([]);
  protected readonly loading  = signal(false);
  protected readonly saving   = signal(false);
  protected readonly alunoId  = signal<number>(0);
  protected readonly series   = ['1º Ano', '2º Ano', '3º Ano'];
  protected readonly turnos   = ['Manhã', 'Tarde', 'Noite'];

  protected readonly form = this.fb.group({
    nome:         ['', Validators.required],
    dataNascimento:[''],
    cpf:          [''],
    nomeMae:      [''],
    telefone:     [''],
    email:        [''],
    endereco:     [''],
    bairro:       [''],
    cep:          [''],
    serie:        ['', Validators.required],
    turmaId:      [0 as number, Validators.required],
    turno:        ['', Validators.required],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.alunoId.set(id);
    this.turmaSvc.findAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(t => this.turmas.set(t));

    if (id) {
      this.loading.set(true);
      this.alunoSvc.findById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: a => {
          this.form.patchValue({
            nome: a.nome, dataNascimento: a.dataNascimento,
            cpf: a.cpf, nomeMae: a.nomeMae,
            telefone: a.telefone, email: a.email, endereco: a.endereco,
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  protected salvarERematricular(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.alunoSvc.update(this.alunoId(), {
      nome: v.nome, cpf: v.cpf, dataNascimento: v.dataNascimento,
      nomeMae: v.nomeMae, telefone: v.telefone, email: v.email, endereco: v.endereco,
      rg: '', nomePai: '',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success('Dados atualizados com sucesso!');
        this.history.add('Atualização de dados', '/matriculas/rematricula');
        this.router.navigateByUrl('/matriculas/rematricula');
      },
      error: () => this.saving.set(false),
    });
  }

  protected pularParaPendencias(): void {
    this.notification.info('Aluno adicionado às pendências.');
    this.router.navigateByUrl('/matriculas/pendencias');
  }

  protected voltar(): void { this.router.navigateByUrl('/matriculas/rematricula'); }
}
