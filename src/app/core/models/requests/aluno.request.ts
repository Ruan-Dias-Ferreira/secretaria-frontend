
export interface AlunoRequest {
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string; 
  email: string;
  telefone: string;
  endereco: string;
  nomeMae: string;
  nomePai?: string;       
}