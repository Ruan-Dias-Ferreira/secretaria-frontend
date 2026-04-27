
import { SituacaoNota } from '../enums/situacao-nota.enum';

export interface NotaResponse {
  id: number;
  valor: number;
  alunoId: number;
  disciplinaId: number;
  bimestre: number;
  situacaoNota: SituacaoNota;
}