import { TipoDocumento } from "../enums/tipo-documento.enum";

export interface DocumentoRequest {
    tipo: TipoDocumento;
    alunoId: number;
}