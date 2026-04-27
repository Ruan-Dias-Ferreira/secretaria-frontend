export interface DisciplinaResponse {
    id: number;
    nome: string;
    cargaHoraria: number;
    turmaId: number;
    professorId: number|null;
    professorLogin:string|null;
}