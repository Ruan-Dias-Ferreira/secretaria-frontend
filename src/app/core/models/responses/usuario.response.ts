import { Role } from "../enums/role.enum";

export interface UsuarioResponse{
    id?: number;
    login: string;
    role: Role;
}
