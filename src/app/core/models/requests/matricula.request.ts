import { StatusMatricula } from "../enums/status-matricula.enum";

export interface MatriculaRequest {
    anoLetivo: number;
    status: StatusMatricula;
    turmaId: number;
    alunoId: number;

}