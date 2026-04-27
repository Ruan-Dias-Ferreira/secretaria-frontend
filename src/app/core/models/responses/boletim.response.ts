
import { NotaResponse } from './nota.response';
import { SituacaoNota } from '../enums/situacao-nota.enum';

export interface BoletimResponse {
  nomeDisciplina: string;
  notaDisciplinas: NotaResponse[];
  mediaNotaDisciplina: number;
  situacaoNota: SituacaoNota;
}