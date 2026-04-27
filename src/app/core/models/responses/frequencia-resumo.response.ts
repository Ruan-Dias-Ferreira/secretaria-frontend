import { SituacaoFrequencia } from "../enums/situacao-frequencia.enum";

export interface FrequenciaResumoResponse {
    disciplinaId: number;
    nomeDisciplina: string;
    cargaHoraria: number;
    presencas: number;
    percentual: number;
    situacao: SituacaoFrequencia;

}