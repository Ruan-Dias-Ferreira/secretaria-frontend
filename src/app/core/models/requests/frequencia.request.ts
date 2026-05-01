export type MotivoFalta =
    'ATESTADO' | 'JUSTIFICADA' | 'EXTERNA' | 'SUSPENSO' | 'DISPENSADO' | 'LUTO' | 'TRANSPORTE';

export interface FrequenciaRequest {
    data: string;
    presente: boolean;
    motivo?: MotivoFalta | null;
    alunoId: number;
    disciplinaId?: number | null;
}
