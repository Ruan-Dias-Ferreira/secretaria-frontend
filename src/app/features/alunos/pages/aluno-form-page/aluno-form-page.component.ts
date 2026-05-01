import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AlunoRequest } from '../../../../core/models/requests/aluno.request';
import { AlunoService } from '../../data-access/aluno.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CpfMaskDirective } from '../../../../shared/directives/cpf-mask.directive';
import { CepMaskDirective } from '../../../../shared/directives/cep-mask.directive';
import { TelefoneMaskDirective } from '../../../../shared/directives/telefone-mask.directive';
import { DigitsOnlyDirective } from '../../../../shared/directives/digits-only.directive';

function aoMenosUmResponsavel(group: AbstractControl): ValidationErrors | null {
  const fg = group as FormGroup;
  const mae = fg.get('mae')?.get('nome')?.value?.trim();
  const pai = fg.get('pai')?.get('nome')?.value?.trim();
  const legal = fg.get('responsavelLegal')?.get('nome')?.value?.trim();
  return (mae || pai || legal) ? null : { semResponsavel: true };
}

function certidaoFormatoValido(group: AbstractControl): ValidationErrors | null {
  const matricula = (group.get('matricula')?.value || '').replace(/\D/g, '');
  const livro = (group.get('livro')?.value || '').trim();
  const folha = (group.get('folha')?.value || '').trim();
  const termo = (group.get('termo')?.value || '').trim();
  if (matricula) {
    return matricula.length === 32 ? null : { matriculaInvalida: true };
  }
  if (livro && folha && termo) return null;
  return { certidaoIncompleta: true };
}

@Component({
  selector: 'app-aluno-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
    MatCheckboxModule,
    CpfMaskDirective,
    CepMaskDirective,
    TelefoneMaskDirective,
    DigitsOnlyDirective
  ],
  templateUrl: './aluno-form-page.component.html',
  styles: [`
    .page-container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .full { grid-column: 1 / -1; }
    .section { margin-bottom: 16px; padding: 12px; border-radius: 8px; border: 1px solid transparent; }
    .section h3 { margin: 8px 0; font-size: 16px; font-weight: 500; }
    .section.has-error {
      border-color: var(--mat-sys-error);
      background: color-mix(in srgb, var(--mat-sys-error) 6%, transparent);
    }
    .section.has-error h3 { color: var(--mat-sys-error); }
    mat-expansion-panel.has-error {
      border: 1px solid var(--mat-sys-error);
      background: color-mix(in srgb, var(--mat-sys-error) 6%, transparent);
    }
    mat-expansion-panel.has-error mat-panel-title { color: var(--mat-sys-error); }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
    .global-error {
      color: var(--mat-sys-error);
      margin-top: 8px;
      padding: 12px;
      border: 1px solid var(--mat-sys-error);
      border-radius: 8px;
      background: color-mix(in srgb, var(--mat-sys-error) 6%, transparent);
    }
    .loading-overlay { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class AlunoFormPageComponent {
  protected loading = signal(false);
  protected alunoId = signal<number | null>(null);
  protected submitTentado = signal(false);

  private fb = inject(NonNullableFormBuilder);
  private alunoService = inject(AlunoService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected isEdicao = computed(() => this.alunoId() !== null);

  private buildResponsavel() {
    return this.fb.group({
      nome: [''],
      cpf: [''],
      rg: [''],
      tituloEleitor: [''],
      telefone: ['']
    });
  }

  protected form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required]],
    rg: [''],
    tituloEleitor: [''],
    dataNascimento: ['', [Validators.required]],
    email: [''],
    telefone: [''],
    telefoneResponsavel: ['', [Validators.required]],
    endereco: this.fb.group({
      rua: ['', [Validators.required]],
      bairro: ['', [Validators.required]],
      cidade: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      cep: ['', [Validators.required]]
    }),
    certidaoNascimento: this.fb.group({
      matricula: [''],
      livro: [''],
      folha: [''],
      termo: ['']
    }, { validators: certidaoFormatoValido }),
    mae: this.buildResponsavel(),
    pai: this.buildResponsavel(),
    responsavelLegal: this.buildResponsavel()
  }, { validators: aoMenosUmResponsavel });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.alunoId.set(id);
      this.carregarAluno(id);
    }
  }

  private carregarAluno(id: number): void {
    this.loading.set(true);
    this.alunoService.findById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (aluno) => {
          this.form.patchValue(aluno as any);
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); }
      });
  }

  private nullifyVazio(r: any): any {
    if (!r) return null;
    const algumPreenchido = ['nome','cpf','rg','tituloEleitor','telefone']
      .some(k => (r[k] || '').toString().trim().length > 0);
    return algumPreenchido ? r : null;
  }

  protected secaoInvalida(path: string): boolean {
    if (!this.submitTentado()) return false;
    const ctrl = this.form.get(path);
    return !!ctrl && ctrl.invalid;
  }

  protected dadosAlunoInvalido(): boolean {
    if (!this.submitTentado()) return false;
    return ['nome','cpf','dataNascimento','telefoneResponsavel']
      .some(k => this.form.get(k)?.invalid);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.submitTentado.set(true);
      this.form.markAllAsTouched();
      queueMicrotask(() => {
        const el = document.querySelector('.has-error, .global-error') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    const raw = this.form.getRawValue();
    const request: AlunoRequest = {
      ...raw,
      mae: this.nullifyVazio(raw.mae),
      pai: this.nullifyVazio(raw.pai),
      responsavelLegal: this.nullifyVazio(raw.responsavelLegal)
    } as AlunoRequest;

    this.loading.set(true);
    const id = this.alunoId();
    const operacao$ = this.isEdicao() && id !== null
      ? this.alunoService.update(id, request)
      : this.alunoService.save(request);

    operacao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success(this.isEdicao() ? 'Aluno atualizado.' : 'Aluno cadastrado.');
        this.router.navigate(['/alunos']);
      },
      error: () => { this.loading.set(false); }
    });
  }

  voltar(): void { this.router.navigate(['/alunos']); }
}
