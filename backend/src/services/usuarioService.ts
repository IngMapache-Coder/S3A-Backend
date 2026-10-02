import type { Usuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '../types/index.js';
import { hashPassword } from '../utils/passwordHash.js';

let inMemoryUsuarios: Usuario[] = [
  {
    id: 'usr-1',
    nombre: 'Amigo Académico',
    correo: 'amigoacademicoufps@ufps.edu.co',
    password: 'admin123',
    tipo: 'SUPER_ADMIN',
    debeCambiarPassword: false,
    createdAt: new Date().toISOString(),
  },
];

export class UsuarioService {
  private db?: D1Database | undefined;

  constructor(db?: D1Database) {
    this.db = db;
    if (this.db) {
      this.db.prepare('ALTER TABLE usuarios ADD COLUMN debe_cambiar_password INTEGER DEFAULT 1').run().catch(() => {});
    }
  }

  async getAll(): Promise<Usuario[]> {
    if (this.db) {
      const { results } = await this.db.prepare(
        `SELECT id, nombre, correo, tipo,
                CASE WHEN tipo = 'SUPER_ADMIN' THEN 0 ELSE COALESCE(debe_cambiar_password, 1) END = 1 as debeCambiarPassword,
                created_at as createdAt, updated_at as updatedAt
         FROM usuarios
         ORDER BY created_at DESC`
      ).all<{ id: string; nombre: string; correo: string; tipo: 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO'; debeCambiarPassword: number | boolean; createdAt?: string; updatedAt?: string }>();

      return (results || []).map((u) => ({
        ...u,
        debeCambiarPassword: Boolean(u.debeCambiarPassword),
      }));
    }
    return [...inMemoryUsuarios];
  }

  async getById(id: string): Promise<Usuario | null> {
    if (this.db) {
      const result = await this.db.prepare(
        `SELECT id, nombre, correo, tipo,
                CASE WHEN tipo = 'SUPER_ADMIN' THEN 0 ELSE COALESCE(debe_cambiar_password, 1) END = 1 as debeCambiarPassword,
                created_at as createdAt, updated_at as updatedAt
         FROM usuarios WHERE id = ?`
      ).bind(id).first<{ id: string; nombre: string; correo: string; tipo: 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO'; debeCambiarPassword: number | boolean; createdAt?: string; updatedAt?: string }>();

      if (!result) return null;
      return {
        ...result,
        debeCambiarPassword: Boolean(result.debeCambiarPassword),
      };
    }
    const found = inMemoryUsuarios.find((u) => u.id === id);
    return found || null;
  }

  async create(data: CreateUsuarioDTO): Promise<Usuario> {
    if (!data.password) {
      throw new Error('La contraseña es obligatoria');
    }

    const debeCambiar = data.tipo === 'SUPER_ADMIN' ? false : (data.debeCambiarPassword ?? true);
    const hashedPassword = await hashPassword(data.password);

    const newUsuario: Usuario = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: data.nombre,
      correo: data.correo,
      password: hashedPassword,
      tipo: data.tipo || 'AMIGO_ACADEMICO',
      debeCambiarPassword: debeCambiar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.db) {
      await this.db
        .prepare(
          'INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          newUsuario.id,
          newUsuario.nombre,
          newUsuario.correo,
          hashedPassword,
          newUsuario.tipo,
          debeCambiar ? 1 : 0,
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
      updated.password = await hashPassword(data.password);
    }

    if (this.db) {
      if (data.password !== undefined) {
        await this.db
          .prepare(
            'UPDATE usuarios SET nombre = ?, correo = ?, password = ?, tipo = ?, updated_at = ? WHERE id = ?'
          )
          .bind(
            updated.nombre,
            updated.correo,
            updated.password,
            updated.tipo,
            updated.updatedAt || null,
            id
          )
          .run();
      } else {
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
      }
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
