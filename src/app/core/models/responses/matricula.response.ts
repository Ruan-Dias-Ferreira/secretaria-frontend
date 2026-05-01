import { StatusMatricula } from "../enums/status-matricula.enum";
export interface MatriculaResponse{
id:number;
anoLetivo:number;
status:StatusMatricula;
alunoId:number;
alunoNome?:string;
alunoCpf?:string;
turmaId:number;
turmaNome?:string;
turno?:string;
curso?:string;
}