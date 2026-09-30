export type Role = 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO' | string;

export interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateMateriaDTO = Omit<Materia, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMateriaDTO = Partial<CreateMateriaDTO>;

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password?: string;
  tipo: Role;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateUsuarioDTO = Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUsuarioDTO = Partial<Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>>;

export interface AuthUserPayload {
  id: string;
  nombre: string;
  correo: string;
  tipo: Role;
}

export interface Variables {
  user?: AuthUserPayload;
}
