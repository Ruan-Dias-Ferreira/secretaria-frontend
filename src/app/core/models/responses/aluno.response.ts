import { RematriculaInfoResponse } from './rematricula-info.response';

export interface AlunoResponse {
    id: number;
    nome: string;
    cpf: string;
    email: string;
    nomeResponsavel?: string | null;
    rematriculado?: RematriculaInfoResponse | null;
}
