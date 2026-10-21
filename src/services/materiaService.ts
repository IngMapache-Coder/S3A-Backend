import type { Materia, CreateMateriaDTO, UpdateMateriaDTO } from '../types/index.js';

let inMemoryMaterias: Materia[] = [
  {
    id: 'mat-1',
    codigo: 'MAT-101',
    nombre: 'Cálculo Diferencial',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mat-2',
    codigo: 'INF-201',
    nombre: 'Estructuras de Datos',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mat-3',
    codigo: 'FIS-102',
    nombre: 'Física Mecánica',
    createdAt: new Date().toISOString(),
  }
];

export class MateriaService {
  private db?: D1Database | undefined;

  constructor(db?: D1Database) {
    this.db = db;
  }

  async getAll(): Promise<Materia[]> {
    if (this.db) {
      const { results } = await this.db.prepare('SELECT id, codigo, nombre, created_at as createdAt, updated_at as updatedAt FROM materias ORDER BY created_at DESC').all<Materia>();
      return results || [];
    }
    return [...inMemoryMaterias];
  }

  async getById(id: string): Promise<Materia | null> {
    if (this.db) {
      const result = await this.db.prepare('SELECT id, codigo, nombre, created_at as createdAt, updated_at as updatedAt FROM materias WHERE id = ?').bind(id).first<Materia>();
      return result || null;
    }
    const found = inMemoryMaterias.find((m) => m.id === id);
    return found || null;
  }

  async create(data: CreateMateriaDTO): Promise<Materia> {
    const newMateria: Materia = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      codigo: data.codigo,
      nombre: data.nombre,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.db) {
      await this.db
        .prepare(
          'INSERT INTO materias (id, codigo, nombre, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(
          newMateria.id,
          newMateria.codigo,
          newMateria.nombre,
          newMateria.createdAt || null,
          newMateria.updatedAt || null
        )
        .run();
    } else {
      inMemoryMaterias.unshift(newMateria);
    }

    return newMateria;
  }

  async update(id: string, data: UpdateMateriaDTO): Promise<Materia | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: Materia = {
      ...existing,
      codigo: data.codigo ?? existing.codigo,
      nombre: data.nombre ?? existing.nombre,
      updatedAt: new Date().toISOString(),
    };

    if (this.db) {
      await this.db
        .prepare(
          'UPDATE materias SET codigo = ?, nombre = ?, updated_at = ? WHERE id = ?'
        )
        .bind(
          updated.codigo,
          updated.nombre,
          updated.updatedAt || null,
          id
        )
        .run();
    } else {
      const idx = inMemoryMaterias.findIndex((m) => m.id === id);
      if (idx !== -1) {
        inMemoryMaterias[idx] = updated;
      }
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    if (this.db) {
      await this.db.prepare('DELETE FROM materias WHERE id = ?').bind(id).run();
    } else {
      inMemoryMaterias = inMemoryMaterias.filter((m) => m.id !== id);
    }

    return true;
  }
}
