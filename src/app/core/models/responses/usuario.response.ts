import { Role } from "../enums/role.enum";

export interface UsuarioResponse{
    login:string;
    role:Role;
}