import { TipoDocumento } from "../enums/tipo-documento.enum";

export interface DocumentoResponse {
    tipo: TipoDocumento;
    alunoId: number;
    dataEmissao: string;
    id: number;
}