import { MotivoFalta } from '../requests/frequencia.request';

export interface FrequenciaResponse {
    id: number;
    data: string;
    presente: boolean;
    motivo: MotivoFalta | null;
    alunoId: number;
    disciplinaId: number | null;
}
