import { TipoEvento } from '../requests/evento.request';

export interface EventoResponse {
  id: number;
  data: string;
  tipo: TipoEvento;
  titulo: string;
  descricao: string | null;
}
