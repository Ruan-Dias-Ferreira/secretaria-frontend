import { StatusMatricula } from "../enums/status-matricula.enum";
export interface MatriculaResponse{
anoLetivo:number;
turmaId:number;
alunoId:number;
status:StatusMatricula;
id:number;

}