// ─────────────────────────────────────────────────────────────
// Tipos e interfaces del dominio S3A
// ─────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO';

// ── Materias ──────────────────────────────────────────────────
export interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateMateriaDTO = Omit<Materia, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMateriaDTO = Partial<CreateMateriaDTO>;

// ── Usuarios ──────────────────────────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password?: string;
  tipo: Role;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateUsuarioDTO = {
  nombre: string;
  correo: string;
  password: string;
  tipo: Role;
};

export type UpdateUsuarioDTO = Partial<Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>>;

// ── Sesiones (sesión compartida de sala) ──────────────────────
export interface Sesion {
  id: string;
  codigo: string;         // código único que genera el QR (ej: "SALA-01")
  creadaPorId: string;    // FK usuarios.id — Amigo Académico que abrió la sala
  estado: 'activa' | 'cerrada';
  fechaInicio: string;
  fechaCierre?: string | null;
  qrUrl?: string;         // ruta relativa para el QR (ej: "/firmar/SALA-01")
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSesionDTO = {
  creadaPorId: string;
};

// ── Asistencias (registro del estudiante) ─────────────────────
export interface Asistencia {
  id: string;
  sesionId: string;          // FK sesiones.id
  materiaId: string;         // FK materias.id
  motivo: string;            // duda, parcial, taller, etc.
  nombreEstudiante: string;
  codigoEstudiante: string;  // código institucional
  firmaUrl: string;          // ruta en Cloudflare R2
  fechaHora?: string;
}

export type CreateAsistenciaDTO = {
  codigoSesion: string;    // código del QR escaneado
  materiaId: string;
  motivo: string;
  nombreEstudiante: string;
  codigoEstudiante: string;
  firmaBase64: string;     // imagen de la firma en base64 para subir a R2
};

// ── Auth ──────────────────────────────────────────────────────
export interface AuthUserPayload {
  id: string;
  nombre: string;
  correo: string;
  tipo: Role;
}

export interface LoginDTO {
  correo: string;
  password: string;
}

// ── Hono Variables (contexto autenticado) ─────────────────────
export interface Variables {
  user?: AuthUserPayload;
}
