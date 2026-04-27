
export interface DisciplinaRequest {
  nome: string;
  cargaHoraria: number;
  turmaId: number;
  professorId?: number;
}