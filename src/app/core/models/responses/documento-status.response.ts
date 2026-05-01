export type TipoDocumento =
  | 'DECLARACAO_MATRICULA'
  | 'HISTORICO_ESCOLAR'
  | 'DECLARACAO_FREQUENCIA'
  | 'RG'
  | 'CPF'
  | 'COMPROVANTE_RESIDENCIA'
  | 'CERTIDAO_NASCIMENTO';

export interface DocumentoStatusResponse {
  tipo: TipoDocumento;
  entregue: boolean;
  dataEmissao: string | null;
  documentoId: number | null;
}
