export interface DisciplinaResponse {
    id: number;
    nome: string;
    cargaHoraria: number;
    turmaId: number;
    turmaAnoLetivo: number | null;
    turmaOperavel: boolean | null;
    professorId: number | null;
    professorLogin: string | null;
}
