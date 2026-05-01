import { RematriculaInfoResponse } from './rematricula-info.response';

export interface AlunoResponse {
    id: number;
    nome: string;
    cpf: string;
    email: string;
    rematriculado?: RematriculaInfoResponse | null;
}
