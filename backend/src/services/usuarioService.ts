import type { Usuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '../types/index.js';

let inMemoryUsuarios: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Super Administrador',
    correo: 'admin@s3a.edu.co',
    tipo: 'SUPER_ADMIN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    nombre: 'Carlos Pérez',
    correo: 'cperez@s3a.edu.co',
    tipo: 'DIRECTOR',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-3',
    nombre: 'Ana Gómez',
    correo: 'agomez@s3a.edu.co',
    tipo: 'AMIGO_ACADEMICO',
    createdAt: new Date().toISOString(),
  }
];

export class UsuarioService {
  private db?: D1Database | undefined;

  constructor(db?: D1Database) {
    this.db = db;
  }

  async getAll(): Promise<Usuario[]> {
    if (this.db) {
      const { results } = await this.db.prepare('SELECT id, nombre, correo, tipo, created_at as createdAt, updated_at as updatedAt FROM usuarios ORDER BY created_at DESC').all<Usuario>();
      return results || [];
    }
    return [...inMemoryUsuarios];
  }

  async getById(id: string): Promise<Usuario | null> {
    if (this.db) {
      const result = await this.db.prepare('SELECT id, nombre, correo, tipo, created_at as createdAt, updated_at as updatedAt FROM usuarios WHERE id = ?').bind(id).first<Usuario>();
      return result || null;
    }
    const found = inMemoryUsuarios.find((u) => u.id === id);
    return found || null;
  }

  async create(data: CreateUsuarioDTO): Promise<Usuario> {
    const newUsuario: Usuario = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: data.nombre,
      correo: data.correo,
      password: data.password || '123456',
      tipo: data.tipo || 'AMIGO_ACADEMICO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.db) {
      await this.db
        .prepare(
          'INSERT INTO usuarios (id, nombre, correo, password, tipo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          newUsuario.id,
          newUsuario.nombre,
          newUsuario.correo,
          newUsuario.password || '123456',
          newUsuario.tipo,
          newUsuario.createdAt || null,
          newUsuario.updatedAt || null
        )
        .run();
    } else {
      inMemoryUsuarios.unshift(newUsuario);
    }

    const { password, ...userWithoutPassword } = newUsuario;
    return userWithoutPassword;
  }

  async update(id: string, data: UpdateUsuarioDTO): Promise<Usuario | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: Usuario = {
      ...existing,
      nombre: data.nombre ?? existing.nombre,
      correo: data.correo ?? existing.correo,
      tipo: data.tipo ?? existing.tipo,
      updatedAt: new Date().toISOString(),
    };

    if (data.password !== undefined) {
      updated.password = data.password;
    }

    if (this.db) {
      await this.db
        .prepare(
          'UPDATE usuarios SET nombre = ?, correo = ?, tipo = ?, updated_at = ? WHERE id = ?'
        )
        .bind(
          updated.nombre,
          updated.correo,
          updated.tipo,
          updated.updatedAt || null,
          id
        )
        .run();
    } else {
      const idx = inMemoryUsuarios.findIndex((u) => u.id === id);
      if (idx !== -1) {
        inMemoryUsuarios[idx] = updated;
      }
    }

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    if (this.db) {
      await this.db.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();
    } else {
      inMemoryUsuarios = inMemoryUsuarios.filter((u) => u.id !== id);
    }

    return true;
  }
}
