import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TurmaService } from '../../../turmas/data-access/turma.service';
import { MatriculaService } from '../../../matriculas/data-access/matricula.service';
import { AlunoService } from '../../../alunos/data-access/aluno.service';
import { EventoService } from '../../../eventos/data-access/evento.service';
import { EventoResponse } from '../../../../core/models/responses/evento.response';
import { FrequenciaService } from '../../data-access/frequencia.service';
import { FrequenciaRequest, MotivoFalta } from '../../../../core/models/requests/frequencia.request';
import { FrequenciaResponse } from '../../../../core/models/responses/frequencia.response';
import { NotificationService } from '../../../../core/services/notification.service';
import { AnoLetivoService } from '../../../../core/services/ano-letivo.service';
import { TurmaResponse } from '../../../../core/models/responses/turma.response';
import { AlunoResponse } from '../../../../core/models/responses/aluno.response';
import { StatusMatricula } from '../../../../core/models/enums/status-matricula.enum';

type StatusKey = 'PRESENTE' | 'FALTOU' | 'OUTRO';

interface OpcaoCustom { id: string; label: string; icon: string; }

interface Linha {
  alunoId: number;
  nome: string;
  selecionado: boolean;
  status: StatusKey | null;
  opcaoCustomId: string | null;
}

@Component({
  selector: 'app-inserir-frequencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './inserir-frequencia.component.html',
  styleUrl: './inserir-frequencia.component.scss',
})
export class InserirFrequenciaComponent implements OnInit {

  private turmaSvc = inject(TurmaService);
  private matriculaSvc = inject(MatriculaService);
  private alunoSvc = inject(AlunoService);
  private eventoSvc = inject(EventoService);
  private frequenciaSvc = inject(FrequenciaService);
  private notify = inject(NotificationService);
  private anoSvc = inject(AnoLetivoService);
  private destroyRef = inject(DestroyRef);

  protected eventos = signal<EventoResponse[]>([]);

  protected dataInvalida = computed(() => this.motivoDataBloqueada(this.data()));
  protected anoStatus = this.anoSvc.status;
  protected anoBloqueado = computed(() => !this.anoSvc.emAndamento());
  protected dataMin = computed(() => {
    const a = this.anoSvc.ano(); const s = this.anoSvc.semestre();
    return s === 1 ? `${a}-01-01` : `${a}-07-01`;
  });
  protected dataMax = computed(() => {
    const a = this.anoSvc.ano(); const s = this.anoSvc.semestre();
    const fimSemestre = s === 1 ? `${a}-06-30` : `${a}-12-31`;
    const hojeIso = new Date().toISOString().slice(0, 10);
    return hojeIso < fimSemestre ? hojeIso : fimSemestre;
  });
  protected msgAnoBloqueado = computed(() => {
    const s = this.anoSvc.status();
    if (s === 'PASSADO') return `Ano letivo ${this.anoSvc.ano()} (${this.anoSvc.semestre()}º sem) já encerrado. Frequência só pode ser consultada.`;
    if (s === 'FUTURO') return `Ano letivo ${this.anoSvc.ano()} (${this.anoSvc.semestre()}º sem) ainda não iniciou. Selecione um período em andamento.`;
    return null;
  });

  protected turmas = signal<TurmaResponse[]>([]);
  protected turmaId = signal<number | null>(null);
  protected data = signal<string>(new Date().toISOString().slice(0, 10));

  protected loadingTurmas = signal(false);
  protected loadingAlunos = signal(false);
  protected salvando = signal(false);

  protected linhas = signal<Linha[]>([]);

  // Opções fixas (depois editáveis em outro menu pela secretaria)
  protected readonly opcoesCustom: OpcaoCustom[] = [
    { id: 'atestado',    label: 'Atestado Médico',   icon: 'medical_services' },
    { id: 'justificada', label: 'Falta Justificada', icon: 'edit_note' },
    { id: 'externa',     label: 'Atividade Externa', icon: 'directions_walk' },
    { id: 'suspenso',    label: 'Suspenso',          icon: 'gpp_bad' },
    { id: 'dispensado',  label: 'Dispensado',        icon: 'event_busy' },
    { id: 'luto',        label: 'Luto',              icon: 'sentiment_dissatisfied' },
    { id: 'transporte',  label: 'Transporte',        icon: 'directions_bus' },
  ];

  protected opcaoCustomAtiva = signal<string>(this.opcoesCustom[0].id);

  protected todosSelecionados = computed(() => {
    const ls = this.linhas();
    return ls.length > 0 && ls.every(l => l.selecionado);
  });

  protected algumSelecionado = computed(() => this.linhas().some(l => l.selecionado));

  protected resumo = computed(() => {
    const ls = this.linhas();
    const presentes = ls.filter(l => l.status === 'PRESENTE').length;
    const dispensados = ls.filter(l => l.status === 'OUTRO' && l.opcaoCustomId === 'dispensado').length;
    const justificadas = ls.filter(l => l.status === 'OUTRO' && l.opcaoCustomId !== 'dispensado').length;
    const faltasSimples = ls.filter(l => l.status === 'FALTOU').length;
    const faltas = faltasSimples + justificadas;
    const pendentes = ls.length - presentes - faltas - dispensados;
    return { total: ls.length, presentes, faltas, justificadas, dispensados, pendentes };
  });

  ngOnInit(): void {
    this.loadingTurmas.set(true);
    this.turmaSvc.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ts => { this.turmas.set(ts.filter(t => t.operavel)); this.loadingTurmas.set(false); },
        error: () => { this.loadingTurmas.set(false); }
      });

    this.eventoSvc.findAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: evs => this.eventos.set(evs),
        error: () => { /* silent: continua sem bloqueio */ },
      });
  }

  // Retorna mensagem se data bloqueada (fora do ano letivo, futura, fim de semana ou evento). Null se válida.
  motivoDataBloqueada(iso: string): string | null {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const anoSel = this.anoSvc.ano();
    const semSel = this.anoSvc.semestre();
    if (y !== anoSel) {
      return `Data fora do ano letivo selecionado (${anoSel}). Troque o ano no topo ou ajuste a data.`;
    }
    const semDoMes: 1 | 2 = m <= 6 ? 1 : 2;
    if (semDoMes !== semSel) {
      return `Data fora do ${semSel}º semestre de ${anoSel}. Troque o semestre no topo ou ajuste a data.`;
    }
    if (dt.getTime() > hoje.getTime()) {
      return 'Data futura: frequência só pode ser lançada para hoje ou datas passadas.';
    }
    const dow = dt.getDay();
    if (dow === 0) return 'Domingo: dia não letivo.';
    if (dow === 6) return 'Sábado: dia não letivo.';
    const ev = this.eventos().find(e => e.data === iso);
    if (ev) {
      const tipo = ev.tipo === 'FERIADO' ? 'Feriado' : 'Trabalho Coletivo';
      return `${tipo}: ${ev.titulo}`;
    }
    return null;
  }

  onDataChange(): void {
    if (this.motivoDataBloqueada(this.data()) || this.anoBloqueado()) {
      this.linhas.set([]);
      return;
    }
    if (this.turmaId() != null) {
      this.onTurmaChange();
    }
  }

  onTurmaChange(): void {
    const tid = this.turmaId();
    if (tid == null) { this.linhas.set([]); return; }
    if (this.motivoDataBloqueada(this.data())) { this.linhas.set([]); return; }
    if (this.anoBloqueado()) { this.linhas.set([]); return; }
    this.loadingAlunos.set(true);

    forkJoin({
      matriculas: this.matriculaSvc.findAll({ turmaId: String(tid) }),
      alunos: this.alunoSvc.findAll(),
      salvas: this.frequenciaSvc.findByTurmaAndData(tid, this.data()),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ matriculas, alunos, salvas }) => {
          const idsTurma = new Set(
            matriculas
              .filter(m => m.turmaId === tid && m.status === StatusMatricula.ATIVA)
              .map(m => m.alunoId)
          );
          const mapaSalvas = new Map<number, FrequenciaResponse>(
            salvas.map(f => [f.alunoId, f])
          );
          const lista: Linha[] = alunos
            .filter((a: AlunoResponse) => idsTurma.has(a.id))
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map(a => {
              const f = mapaSalvas.get(a.id);
              if (!f) {
                return { alunoId: a.id, nome: a.nome, selecionado: false, status: null, opcaoCustomId: null };
              }
              if (f.presente) {
                return { alunoId: a.id, nome: a.nome, selecionado: false, status: 'PRESENTE' as StatusKey, opcaoCustomId: null };
              }
              if (f.motivo) {
                return {
                  alunoId: a.id, nome: a.nome, selecionado: false,
                  status: 'OUTRO' as StatusKey,
                  opcaoCustomId: f.motivo.toLowerCase(),
                };
              }
              return { alunoId: a.id, nome: a.nome, selecionado: false, status: 'FALTOU' as StatusKey, opcaoCustomId: null };
            });
          this.linhas.set(lista);
          this.loadingAlunos.set(false);
        },
        error: () => { this.loadingAlunos.set(false); }
      });
  }

  toggleTodos(): void {
    const marcar = !this.todosSelecionados();
    this.linhas.update(ls => ls.map(l => ({ ...l, selecionado: marcar })));
  }

  toggleLinha(alunoId: number): void {
    this.linhas.update(ls => ls.map(l =>
      l.alunoId === alunoId ? { ...l, selecionado: !l.selecionado } : l
    ));
  }

  setStatusLinha(alunoId: number, status: StatusKey): void {
    this.linhas.update(ls => ls.map(l => {
      if (l.alunoId !== alunoId) return l;
      const opcao = status === 'OUTRO' ? this.opcaoCustomAtiva() : null;
      return { ...l, status, opcaoCustomId: opcao };
    }));
  }

  setOpcaoLinha(alunoId: number, opcaoId: string): void {
    this.linhas.update(ls => ls.map(l =>
      l.alunoId === alunoId ? { ...l, status: 'OUTRO', opcaoCustomId: opcaoId } : l
    ));
  }

  marcarTodos(status: StatusKey): void {
    const sel = this.algumSelecionado();
    const opcao = status === 'OUTRO' ? this.opcaoCustomAtiva() : null;
    this.linhas.update(ls => ls.map(l => {
      if (sel && !l.selecionado) return l;
      return { ...l, status, opcaoCustomId: opcao };
    }));
  }

  @HostListener('window:keydown', ['$event'])
  onArrowNav(ev: KeyboardEvent): void {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    const t = ev.target as HTMLElement | null;
    const tag = t?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    ev.preventDefault();
    if (ev.key === 'ArrowLeft') this.carrosselPrev();
    else this.carrosselNext();
  }

  carrosselPrev(): void {
    const idx = this.opcoesCustom.findIndex(o => o.id === this.opcaoCustomAtiva());
    const next = (idx - 1 + this.opcoesCustom.length) % this.opcoesCustom.length;
    this.opcaoCustomAtiva.set(this.opcoesCustom[next].id);
  }

  carrosselNext(): void {
    const idx = this.opcoesCustom.findIndex(o => o.id === this.opcaoCustomAtiva());
    const next = (idx + 1) % this.opcoesCustom.length;
    this.opcaoCustomAtiva.set(this.opcoesCustom[next].id);
  }

  selecionarOpcaoCarrossel(id: string): void {
    this.opcaoCustomAtiva.set(id);
  }

  labelOpcao(id: string | null): string {
    return this.opcoesCustom.find(o => o.id === id)?.label ?? '';
  }

  iconOpcao(id: string | null): string {
    return this.opcoesCustom.find(o => o.id === id)?.icon ?? 'help';
  }

  salvar(): void {
    if (this.dataInvalida()) {
      this.notify.error('Data inválida. ' + this.dataInvalida());
      return;
    }
    if (this.anoBloqueado()) {
      this.notify.error(this.msgAnoBloqueado() ?? 'Ano letivo fora de andamento.');
      return;
    }
    const pendentes = this.linhas().filter(l => l.status === null);
    if (pendentes.length > 0) {
      this.notify.info(`${pendentes.length} aluno(s) sem status. Marque todos antes de salvar.`);
      return;
    }
    this.salvando.set(true);
    const payload: FrequenciaRequest[] = this.linhas().map(l => ({
      alunoId: l.alunoId,
      data: this.data(),
      presente: l.status === 'PRESENTE',
      motivo: l.status === 'OUTRO' && l.opcaoCustomId
        ? (l.opcaoCustomId.toUpperCase() as MotivoFalta)
        : null,
    }));
    this.frequenciaSvc.saveLote(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.notify.success(`Frequência registrada para ${payload.length} alunos.`);
        },
        error: (err) => {
          this.salvando.set(false);
          const msg = err?.error?.message ?? err?.error?.error ?? 'Erro ao salvar frequência.';
          this.notify.error(msg);
        },
      });
  }
}
