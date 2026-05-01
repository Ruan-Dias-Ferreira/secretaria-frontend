import {
  ChangeDetectionStrategy, Component, inject, signal, computed, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, catchError } from 'rxjs';

import { MatStepperModule }         from '@angular/material/stepper';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule }           from '@angular/material/chips';
import { MatDividerModule }         from '@angular/material/divider';

import { AlunoService }        from '../../../alunos/data-access/aluno.service';
import { TurmaService }        from '../../../turmas/data-access/turma.service';
import { MatriculaService }    from '../../data-access/matricula.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HistoryService }      from '../../../../core/services/history.service';

import { AlunoResponse }   from '../../../../core/models/responses/aluno.response';
import { TurmaResponse }   from '../../../../core/models/responses/turma.response';
import { StatusMatricula } from '../../../../core/models/enums/status-matricula.enum';

export const DOCUMENTOS_LIST = [
  'RG ou Certidão de Nascimento',
  'Comprovante de Residência',
  'Histórico Escolar anterior',
  'Cartão de Vacinação',
  'Foto 3×4',
];

@Component({
  selector: 'app-matricula-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatStepperModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatChipsModule, MatDividerModule,
  ],
  templateUrl: './matricula-form.component.html',
  styleUrl: './matricula-form.component.scss',
})
export class MatriculaFormComponent {
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly alunoSvc     = inject(AlunoService);
  private readonly turmaSvc     = inject(TurmaService);
  private readonly matriculaSvc = inject(MatriculaService);
  private readonly notification = inject(NotificationService);
  private readonly history      = inject(HistoryService);
  private readonly router       = inject(Router);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly anoLetivo  = new Date().getFullYear();
  protected readonly documentos = DOCUMENTOS_LIST;
  protected readonly situacoes  = [
    { value: StatusMatricula.ATIVA,      label: 'Ativa' },
    { value: StatusMatricula.DESISTENTE, label: 'Aguardando documentação' },
  ];

  protected readonly busca           = this.fb.control('');
  protected readonly buscaResults    = signal<AlunoResponse[]>([]);
  protected readonly searching       = signal(false);
  protected readonly showDropdown    = signal(false);
  protected readonly alunoSelecionado = signal<AlunoResponse | null>(null);
  protected readonly success         = signal(false);
  protected readonly submitting      = signal(false);
  protected readonly turmas          = signal<TurmaResponse[]>([]);
  protected readonly turmasFiltradas = signal<TurmaResponse[]>([]);

  protected readonly turmasDoAno = computed(() =>
    this.turmas().filter(t => t.anoLetivo === this.anoLetivo)
  );
  protected readonly series = computed(() =>
    Array.from(new Set(this.turmasDoAno().map(t => t.curso).filter(Boolean))).sort()
  );
  protected readonly turnosDaSerie = signal<string[]>([]);
  private readonly TURNO_LABELS: Record<string, string> = {
    MATUTINO: 'Matutino', VESPERTINO: 'Vespertino',
    NOTURNO: 'Noturno',   INTEGRAL: 'Integral',
    MANHA: 'Matutino',    TARDE: 'Vespertino', NOITE: 'Noturno',
  };
  protected turnoLabel(v: string | null | undefined): string {
    if (!v) return '';
    return this.TURNO_LABELS[v] ?? v;
  }

  protected turmaSelecionadaNome(): string {
    const id = this.step2Form.controls.turmaId.value;
    return this.turmasFiltradas().find(t => t.id === id)?.nome ?? '';
  }

  protected readonly docChecks = signal<Record<string, boolean>>(
    Object.fromEntries(DOCUMENTOS_LIST.map(d => [d, false]))
  );

  protected readonly step2Form = this.fb.group({
    dataMatricula: [new Date() as Date, Validators.required],
    serie:         ['', Validators.required],
    turmaId:       [0 as number, Validators.required],
    turno:         ['', Validators.required],
    situacao:      [StatusMatricula.ATIVA, Validators.required],
  });

  protected readonly step3Form = this.fb.group({
    observacoes: [''],
  });

  protected readonly step4Confirm = this.fb.control(false);

  protected readonly successAluno = signal<AlunoResponse | null>(null);

  constructor() {
    this.turmaSvc.findAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(t => {
      this.turmas.set(t);
      this.turmasFiltradas.set([]);
    });

    this.step2Form.controls.serie.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(serie => {
      const turnos = Array.from(new Set(
        this.turmasDoAno().filter(t => t.curso === serie).map(t => t.turno).filter(Boolean)
      )).sort();
      this.turnosDaSerie.set(turnos);
      this.turmasFiltradas.set([]);
      this.step2Form.controls.turno.reset('');
      this.step2Form.controls.turmaId.reset(0);
    });

    this.step2Form.controls.turno.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(turno => {
      const serie = this.step2Form.controls.serie.value;
      const f = this.turmasDoAno().filter(t => t.curso === serie && t.turno === turno);
      this.turmasFiltradas.set(f);
      this.step2Form.controls.turmaId.reset(0);
    });
  }

  protected buscar(): void {
    const q = (this.busca.value ?? '').trim();
    if (q.length < 2) {
      this.buscaResults.set([]);
      this.showDropdown.set(false);
      return;
    }
    this.searching.set(true);
    this.alunoSvc.search(q).pipe(
      catchError(() => of([] as AlunoResponse[])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((r: AlunoResponse[]) => {
      this.buscaResults.set(r);
      this.showDropdown.set(true);
      this.searching.set(false);
    });
  }

  protected selecionarAluno(a: AlunoResponse): void {
    this.alunoSelecionado.set(a);
    this.showDropdown.set(false);
    this.busca.setValue(a.nome, { emitEvent: false });
  }

  protected trocarAluno(): void {
    this.alunoSelecionado.set(null);
    this.busca.reset();
  }

  protected toggleDoc(doc: string): void {
    this.docChecks.update(m => ({ ...m, [doc]: !m[doc] }));
  }

  protected isDocChecked(doc: string): boolean {
    return this.docChecks()[doc] ?? false;
  }

  protected salvarMatricula(): void {
    if (!this.alunoSelecionado() || this.step2Form.invalid || !this.step4Confirm.value) {
      this.step2Form.markAllAsTouched(); return;
    }
    this.submitting.set(true);
    const v = this.step2Form.getRawValue();
    this.matriculaSvc.save({
      alunoId: this.alunoSelecionado()!.id,
      turmaId: v.turmaId,
      anoLetivo: this.anoLetivo,
      status: v.situacao,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successAluno.set(this.alunoSelecionado());
        this.success.set(true);
        this.history.add(`Matrícula — ${this.alunoSelecionado()!.nome}`, '/matriculas/nova');
      },
      error: () => { this.submitting.set(false); },
    });
  }

  protected novaMatricula(): void {
    this.success.set(false);
    this.alunoSelecionado.set(null);
    this.busca.reset();
    this.step2Form.reset({ dataMatricula: new Date(), situacao: StatusMatricula.ATIVA });
    this.docChecks.set(Object.fromEntries(DOCUMENTOS_LIST.map(d => [d, false])));
    this.step4Confirm.reset(false);
  }

  protected cancelar(): void { this.router.navigateByUrl('/dashboard'); }
  protected goConsultar(): void { this.router.navigateByUrl('/matriculas/consultar'); }
}
