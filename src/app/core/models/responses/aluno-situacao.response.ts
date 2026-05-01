import { MatriculaResponse } from './matricula.response';
import { StatusMatricula } from '../enums/status-matricula.enum';

export interface AlunoSituacaoResponse {
  alunoId: number;
  alunoNome: string;
  statusAtual: StatusMatricula | null;
  anoLetivoAtual: number | null;
  turmaIdAtual: number | null;
  turmaNomeAtual: string | null;
  cursoAtual: string | null;
  turnoAtual: string | null;
  percentualFrequencia: number | null;
  totalMatriculas: number;
  matriculasAtivas: number;
  historicoMatriculas: MatriculaResponse[];
}
