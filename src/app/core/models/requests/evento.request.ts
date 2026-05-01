export type TipoEvento = 'FERIADO' | 'TRABALHO_COLETIVO';

export interface EventoRequest {
  data: string;
  tipo: TipoEvento;
  titulo: string;
  descricao?: string | null;
}
