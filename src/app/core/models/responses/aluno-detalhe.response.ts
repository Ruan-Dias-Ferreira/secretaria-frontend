import { CertidaoNascimentoDto, EnderecoDto, ResponsavelDto } from '../requests/aluno.request';

export interface AlunoDetalheResponse {
  id: number;
  nome: string;
  cpf: string;
  rg?: string;
  tituloEleitor?: string;
  dataNascimento: string;
  email: string;
  telefone?: string;
  telefoneResponsavel: string;
  localNascimento?: string;
  nacionalidade?: string;
  endereco: EnderecoDto;
  certidaoNascimento?: CertidaoNascimentoDto;
  mae?: ResponsavelDto;
  pai?: ResponsavelDto;
  responsavelLegal?: ResponsavelDto;
}
