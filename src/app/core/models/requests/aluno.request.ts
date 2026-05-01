export interface ResponsavelDto {
  nome?: string;
  cpf?: string;
  rg?: string;
  tituloEleitor?: string;
  telefone?: string;
}

export interface CertidaoNascimentoDto {
  matricula?: string;
  livro?: string;
  folha?: string;
  termo?: string;
}

export interface EnderecoDto {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface AlunoRequest {
  nome: string;
  cpf: string;
  rg?: string;
  tituloEleitor?: string;
  dataNascimento: string;
  email: string;
  telefone?: string;
  telefoneResponsavel: string;
  endereco: EnderecoDto;
  certidaoNascimento?: CertidaoNascimentoDto;
  mae?: ResponsavelDto;
  pai?: ResponsavelDto;
  responsavelLegal?: ResponsavelDto;
}
