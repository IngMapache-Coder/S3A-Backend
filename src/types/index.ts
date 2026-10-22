export type Role = 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO';

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
  debeCambiarPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateUsuarioDTO = {
  nombre: string;
  correo: string;
  password: string;
  tipo: Role;
  debeCambiarPassword?: boolean;
};

export type UpdateUsuarioDTO = Partial<Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>>;

export interface Sesion {
  id: string;
  codigo: string;
  creadaPorId: string;
  estado: 'activa' | 'cerrada';
  fechaInicio: string;
  fechaCierre?: string | null;
  qrUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSesionDTO = {
  creadaPorId: string;
};

export interface Asistencia {
  id: string;
  sesionId: string;
  codigoSesion?: string;
  materiaId: string;
  materiaCodigo?: string;
  materiaNombre?: string;
  motivo: string;
  nombreEstudiante: string;
  codigoEstudiante: string;
  firmaUrl: string;
  fechaHora?: string;
}

export type CreateAsistenciaDTO = {
  codigoSesion: string;
  materiaId: string;
  motivo: string;
  nombreEstudiante: string;
  codigoEstudiante: string;
  firmaBase64: string;
};

export interface Evento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null | undefined;
  lugar?: string | null | undefined;
  facilitador?: string | null | undefined;
  ponente?: string | null | undefined;
  creadaPorId: string;
  creadaPorNombre?: string | undefined;
  estado: 'activa' | 'cerrada';
  fechaInicio: string;
  fechaCierre?: string | null | undefined;
  totalAsistencias?: number | undefined;
  qrUrl?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export type CreateEventoDTO = {
  nombre: string;
  descripcion?: string | undefined;
  lugar?: string | undefined;
  facilitador?: string | undefined;
  ponente?: string | undefined;
  codigo?: string | undefined;
  creadaPorId: string;
};

export type UpdateEventoDTO = {
  nombre?: string | undefined;
  descripcion?: string | undefined;
  lugar?: string | undefined;
  facilitador?: string | undefined;
  ponente?: string | undefined;
  codigo?: string | undefined;
};

export interface AsistenciaEvento {
  id: string;
  eventoId: string;
  eventoNombre?: string;
  eventoCodigo?: string;
  nombreEstudiante: string;
  codigoEstudiante: string;
  correoEstudiante?: string | null;
  firmaUrl: string;
  fechaHora: string;
}

export type CreateAsistenciaEventoDTO = {
  codigoEvento: string;
  nombreEstudiante: string;
  codigoEstudiante: string;
  correoEstudiante?: string | undefined;
  firmaBase64: string;
};

export interface AuthUserPayload {
  id: string;
  nombre: string;
  correo: string;
  tipo: Role;
  debeCambiarPassword?: boolean;
}

export interface LoginDTO {
  correo: string;
  password: string;
}

export interface Variables {
  user?: AuthUserPayload;
}
