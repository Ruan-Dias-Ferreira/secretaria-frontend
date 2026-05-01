import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { AlunoService } from '../../data-access/aluno.service';
import { AlunoDetalheResponse } from '../../../../core/models/responses/aluno-detalhe.response';
import { AlunoSituacaoResponse } from '../../../../core/models/responses/aluno-situacao.response';
import { DocumentoStatusResponse, TipoDocumento } from '../../../../core/models/responses/documento-status.response';
import { NotificationService } from '../../../../core/services/notification.service';

const TIPO_LABEL: Record<TipoDocumento, string> = {
  DECLARACAO_MATRICULA: 'Declaração de Matrícula',
  HISTORICO_ESCOLAR: 'Histórico Escolar',
  DECLARACAO_FREQUENCIA: 'Declaração de Frequência',
  RG: 'RG',
  CPF: 'CPF',
  COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
  CERTIDAO_NASCIMENTO: 'Certidão de Nascimento',
};

@Component({
  selector: 'app-aluno-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTabsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatCheckboxModule, MatDividerModule, MatChipsModule,
  ],
  templateUrl: './aluno-perfil.component.html',
  styleUrl: './aluno-perfil.component.scss',
})
export class AlunoPerfilComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(AlunoService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly aluno = signal<AlunoDetalheResponse | null>(null);
  protected readonly situacao = signal<AlunoSituacaoResponse | null>(null);
  protected readonly documentos = signal<DocumentoStatusResponse[]>([]);
  protected readonly togglingTipo = signal<TipoDocumento | null>(null);

  protected readonly idade = computed(() => {
    const a = this.aluno();
    if (!a?.dataNascimento) return null;
    const nasc = new Date(a.dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  });

  protected readonly pendentes = computed(() =>
    this.documentos().filter(d => !d.entregue).length
  );

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/alunos']); return; }
    this.carregar(id);
  }

  private carregar(id: number): void {
    this.loading.set(true);
    this.svc.findById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: a => this.aluno.set(a),
      error: () => this.notify.error('Erro ao carregar aluno.'),
    });
    this.svc.getSituacao(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: s => this.situacao.set(s),
      error: () => {},
    });
    this.svc.getDocumentosStatus(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => { this.documentos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected labelTipo(t: TipoDocumento): string { return TIPO_LABEL[t] ?? t; }

  protected toggleDoc(doc: DocumentoStatusResponse, novoValor: boolean): void {
    const id = this.aluno()?.id;
    if (!id) return;
    this.togglingTipo.set(doc.tipo);
    this.svc.toggleDocumento(id, doc.tipo, novoValor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.documentos.update(list =>
            list.map(d => d.tipo === updated.tipo ? updated : d)
          );
          this.togglingTipo.set(null);
          this.notify.success(novoValor ? 'Documento marcado como entregue.' : 'Documento desmarcado.');
        },
        error: () => {
          this.togglingTipo.set(null);
          this.notify.error('Erro ao atualizar documento.');
        },
      });
  }

  protected voltar(): void { this.router.navigate(['/alunos']); }
  protected editar(): void {
    const id = this.aluno()?.id;
    if (id) this.router.navigate(['/alunos', id, 'editar']);
  }

  protected formatEndereco(): string {
    const e = this.aluno()?.endereco;
    if (!e) return '—';
    const parts = [e.rua, e.bairro, e.cidade && e.estado ? `${e.cidade}/${e.estado}` : (e.cidade || e.estado), e.cep].filter(Boolean);
    return parts.join(', ');
  }

  protected statusLabel(s: string | null | undefined): string {
    const map: Record<string, string> = {
      ATIVA: 'Ativa', TRANSFERIDO: 'Transferida', DESISTENTE: 'Cancelada', CONCLUIDA: 'Concluída',
    };
    return s ? (map[s] ?? s) : '—';
  }
}
