import type { Sesion, CreateSesionDTO } from '../types/index.js';

function generarCodigoSala(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 4; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

function newId(): string {
  return `ses-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

export class SesionService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getActiva(): Promise<Sesion | null> {
    const row = await this.db
      .prepare(
        `SELECT
          id,
          codigo,
          creada_por_id  AS creadaPorId,
          estado,
          fecha_inicio   AS fechaInicio,
          fecha_cierre   AS fechaCierre,
          created_at     AS createdAt,
          updated_at     AS updatedAt
         FROM sesiones
         WHERE estado = 'activa'
         ORDER BY fecha_inicio DESC
         LIMIT 1`
      )
      .first<Sesion>();
    if (!row) return null;
    return { ...row, qrUrl: `/firmar/${row.codigo}` };
  }

  async abrir(data: CreateSesionDTO): Promise<{ sesion: Sesion; creada: boolean }> {
    const activa = await this.getActiva();
    if (activa) {
      return { sesion: activa, creada: false };
    }

    let codigo = generarCodigoSala();
    let intentos = 0;
    while (intentos < 10) {
      const existe = await this.db
        .prepare('SELECT id FROM sesiones WHERE codigo = ?')
        .bind(codigo)
        .first();
      if (!existe) break;
      codigo = generarCodigoSala();
      intentos++;
    }

    const sesion: Sesion = {
      id: newId(),
      codigo,
      creadaPorId: data.creadaPorId,
      estado: 'activa',
      fechaInicio: now(),
      fechaCierre: null,
      qrUrl: `/firmar/${codigo}`,
      createdAt: now(),
      updatedAt: now(),
    };

    await this.db
      .prepare(
        `INSERT INTO sesiones (id, codigo, creada_por_id, estado, fecha_inicio, created_at, updated_at)
         VALUES (?, ?, ?, 'activa', ?, ?, ?)`
      )
      .bind(
        sesion.id,
        sesion.codigo,
        sesion.creadaPorId,
        sesion.fechaInicio,
        sesion.createdAt!,
        sesion.updatedAt!
      )
      .run();

    return { sesion, creada: true };
  }

  async verificarCodigo(codigo: string): Promise<Sesion | null> {
    const row = await this.db
      .prepare(
        `SELECT
          id,
          codigo,
          creada_por_id  AS creadaPorId,
          estado,
          fecha_inicio   AS fechaInicio,
          fecha_cierre   AS fechaCierre,
          created_at     AS createdAt,
          updated_at     AS updatedAt
         FROM sesiones
         WHERE codigo = ? AND estado = 'activa'`
      )
      .bind(codigo)
      .first<Sesion>();
    if (!row) return null;
    return { ...row, qrUrl: `/firmar/${row.codigo}` };
  }

  async cerrar(id: string): Promise<Sesion | null> {
    const sesion = await this.db
      .prepare(
        `SELECT id, estado FROM sesiones WHERE id = ?`
      )
      .bind(id)
      .first<{ id: string; estado: string }>();

    if (!sesion) return null;
    if (sesion.estado === 'cerrada') return null;

    const fechaCierre = now();
    await this.db
      .prepare(
        `UPDATE sesiones SET estado = 'cerrada', fecha_cierre = ?, updated_at = ? WHERE id = ?`
      )
      .bind(fechaCierre, now(), id)
      .run();

    return this.getById(id);
  }

  async getById(id: string): Promise<Sesion | null> {
    const row = await this.db
      .prepare(
        `SELECT
          id,
          codigo,
          creada_por_id  AS creadaPorId,
          estado,
          fecha_inicio   AS fechaInicio,
          fecha_cierre   AS fechaCierre,
          created_at     AS createdAt,
          updated_at     AS updatedAt
         FROM sesiones WHERE id = ?`
      )
      .bind(id)
      .first<Sesion>();
    if (!row) return null;
    return { ...row, qrUrl: `/firmar/${row.codigo}` };
  }
}
