import { Role } from "../enums/role.enum";

export interface UsuarioRequest {
    login: string;
    senha: string;
    role: Role;
}