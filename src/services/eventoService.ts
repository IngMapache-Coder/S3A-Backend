import type {
  Evento,
  CreateEventoDTO,
  UpdateEventoDTO,
  AsistenciaEvento,
  CreateAsistenciaEventoDTO,
} from '../types/index.js';

function generarCodigoRandom(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return rand;
}

function newId(prefix = 'evt'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

export class EventoService {
  private db: D1Database;
  private bucket: R2Bucket | undefined;

  constructor(db: D1Database, bucket?: R2Bucket | undefined) {
    this.db = db;
    this.bucket = bucket;
  }

  async listar(): Promise<Evento[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
          e.id,
          e.codigo,
          e.nombre,
          e.descripcion,
          e.lugar,
          e.facilitador,
          e.facilitador     AS ponente,
          e.creada_por_id   AS creadaPorId,
          u.nombre          AS creadaPorNombre,
          e.estado,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.fecha_inicio) AS fechaInicio,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.fecha_cierre) AS fechaCierre,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.created_at)   AS createdAt,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.updated_at)   AS updatedAt,
          COUNT(ae.id)      AS totalAsistencias
         FROM eventos e
         LEFT JOIN usuarios u ON u.id = e.creada_por_id
         LEFT JOIN asistencias_eventos ae ON ae.evento_id = e.id
         GROUP BY e.id
         ORDER BY e.created_at DESC`
      )
      .all<Evento>();

    return (results ?? []).map((e) => ({
      ...e,
      ponente: e.ponente || e.facilitador,
      totalAsistencias: Number(e.totalAsistencias || 0),
      qrUrl: `/firmar/${e.codigo}?tipo=evento`,
    }));
  }

  async getById(id: string): Promise<Evento | null> {
    const row = await this.db
      .prepare(
        `SELECT
          e.id,
          e.codigo,
          e.nombre,
          e.descripcion,
          e.lugar,
          e.facilitador,
          e.facilitador     AS ponente,
          e.creada_por_id   AS creadaPorId,
          u.nombre          AS creadaPorNombre,
          e.estado,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.fecha_inicio) AS fechaInicio,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.fecha_cierre) AS fechaCierre,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.created_at)   AS createdAt,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.updated_at)   AS updatedAt,
          COUNT(ae.id)      AS totalAsistencias
         FROM eventos e
         LEFT JOIN usuarios u ON u.id = e.creada_por_id
         LEFT JOIN asistencias_eventos ae ON ae.evento_id = e.id
         WHERE e.id = ?
         GROUP BY e.id`
      )
      .bind(id)
      .first<Evento>();

    if (!row) return null;
    return {
      ...row,
      ponente: row.ponente || row.facilitador,
      totalAsistencias: Number(row.totalAsistencias || 0),
      qrUrl: `/firmar/${row.codigo}?tipo=evento`,
    };
  }

  async getByCodigo(codigo: string): Promise<Evento | null> {
    const clean = codigo.trim().toUpperCase();
    const row = await this.db
      .prepare(
        `SELECT
          e.id,
          e.codigo,
          e.nombre,
          e.descripcion,
          e.lugar,
          e.facilitador,
          e.facilitador     AS ponente,
          e.creada_por_id   AS creadaPorId,
          u.nombre          AS creadaPorNombre,
          e.estado,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.fecha_inicio) AS fechaInicio,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.fecha_cierre) AS fechaCierre,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.created_at)   AS createdAt,
          strftime('%Y-%m-%dT%H:%M:%SZ', e.updated_at)   AS updatedAt,
          COUNT(ae.id)      AS totalAsistencias
         FROM eventos e
         LEFT JOIN usuarios u ON u.id = e.creada_por_id
         LEFT JOIN asistencias_eventos ae ON ae.evento_id = e.id
         WHERE UPPER(e.codigo) = ?
         GROUP BY e.id`
      )
      .bind(clean)
      .first<Evento>();

    if (!row) return null;
    return {
      ...row,
      ponente: row.ponente || row.facilitador,
      totalAsistencias: Number(row.totalAsistencias || 0),
      qrUrl: `/firmar/${row.codigo}?tipo=evento`,
    };
  }

  async crear(data: CreateEventoDTO): Promise<Evento> {
    let codigo = (data.codigo || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

    if (!codigo) {
      let intentos = 0;
      do {
        codigo = `EVT-${generarCodigoRandom()}`;
        const existe = await this.db
          .prepare('SELECT id FROM eventos WHERE codigo = ?')
          .bind(codigo)
          .first();
        if (!existe) break;
        intentos++;
      } while (intentos < 10);
    } else {
      const existe = await this.db
        .prepare('SELECT id FROM eventos WHERE codigo = ?')
        .bind(codigo)
        .first();
      if (existe) {
        throw new Error(`Ya existe un evento con el código "${codigo}".`);
      }
    }

    const id = newId('evt');
    const timestamp = now();
    const ponente = data.ponente?.trim() || data.facilitador?.trim() || null;

    await this.db
      .prepare(
        `INSERT INTO eventos (id, codigo, nombre, descripcion, lugar, facilitador, creada_por_id, estado, fecha_inicio, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'activa', ?, ?, ?)`
      )
      .bind(
        id,
        codigo,
        data.nombre.trim(),
        data.descripcion?.trim() || null,
        data.lugar?.trim() || null,
        ponente,
        data.creadaPorId,
        timestamp,
        timestamp,
        timestamp
      )
      .run();

    const evento = await this.getById(id);
    if (!evento) throw new Error('Error al recuperar el evento recién creado.');
    return evento;
  }

  async actualizar(id: string, data: UpdateEventoDTO): Promise<Evento | null> {
    const evento = await this.getById(id);
    if (!evento) return null;

    let nuevoCodigo = evento.codigo;
    if (data.codigo && data.codigo.trim() !== '') {
      nuevoCodigo = data.codigo.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (nuevoCodigo !== evento.codigo) {
        const existe = await this.db
          .prepare('SELECT id FROM eventos WHERE codigo = ? AND id != ?')
          .bind(nuevoCodigo, id)
          .first();
        if (existe) {
          throw new Error(`El código "${nuevoCodigo}" ya está en uso por otro evento.`);
        }
      }
    }

    const timestamp = now();
    const ponenteNuevo =
      data.ponente !== undefined
        ? (data.ponente?.trim() || null)
        : data.facilitador !== undefined
        ? (data.facilitador?.trim() || null)
        : evento.ponente || evento.facilitador;

    await this.db
      .prepare(
        `UPDATE eventos
         SET codigo = ?,
             nombre = ?,
             descripcion = ?,
             lugar = ?,
             facilitador = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .bind(
        nuevoCodigo,
        (data.nombre !== undefined ? data.nombre : evento.nombre).trim(),
        data.descripcion !== undefined ? (data.descripcion?.trim() || null) : evento.descripcion,
        data.lugar !== undefined ? (data.lugar?.trim() || null) : evento.lugar,
        ponenteNuevo,
        timestamp,
        id
      )
      .run();

    return this.getById(id);
  }

  async cerrar(id: string): Promise<Evento | null> {
    const evento = await this.getById(id);
    if (!evento) return null;

    const timestamp = now();
    await this.db
      .prepare(`UPDATE eventos SET estado = 'cerrada', fecha_cierre = ?, updated_at = ? WHERE id = ?`)
      .bind(timestamp, timestamp, id)
      .run();

    return this.getById(id);
  }

  async reabrir(id: string): Promise<Evento | null> {
    const evento = await this.getById(id);
    if (!evento) return null;

    const timestamp = now();
    await this.db
      .prepare(`UPDATE eventos SET estado = 'activa', fecha_cierre = NULL, updated_at = ? WHERE id = ?`)
      .bind(timestamp, id)
      .run();

    return this.getById(id);
  }

  async eliminar(id: string): Promise<boolean> {
    const res = await this.db
      .prepare('DELETE FROM eventos WHERE id = ?')
      .bind(id)
      .run();
    return (res.meta?.changes ?? 0) > 0;
  }

  async listarAsistencias(eventoId: string): Promise<AsistenciaEvento[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
          ae.id,
          ae.evento_id          AS eventoId,
          e.nombre              AS eventoNombre,
          e.codigo              AS eventoCodigo,
          ae.nombre_estudiante  AS nombreEstudiante,
          ae.codigo_estudiante  AS codigoEstudiante,
          ae.correo_estudiante  AS correoEstudiante,
          ae.firma_url          AS firmaUrl,
          strftime('%Y-%m-%dT%H:%M:%SZ', ae.fecha_hora) AS fechaHora
         FROM asistencias_eventos ae
         JOIN eventos e ON e.id = ae.evento_id
         WHERE ae.evento_id = ?
         ORDER BY ae.fecha_hora ASC`
      )
      .bind(eventoId)
      .all<AsistenciaEvento>();

    return results ?? [];
  }

  async consultarAsistencias(filtros: {
    desde?: string | undefined;
    hasta?: string | undefined;
    eventoId?: string | undefined;
    codigoEstudiante?: string | undefined;
    nombreEstudiante?: string | undefined;
  }): Promise<AsistenciaEvento[]> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.desde) {
      condiciones.push('ae.fecha_hora >= ?');
      valores.push(filtros.desde);
    }
    if (filtros.hasta) {
      condiciones.push('ae.fecha_hora <= ?');
      valores.push(filtros.hasta);
    }
    if (filtros.eventoId) {
      condiciones.push('ae.evento_id = ?');
      valores.push(filtros.eventoId);
    }
    if (filtros.codigoEstudiante) {
      condiciones.push('ae.codigo_estudiante LIKE ?');
      valores.push(`%${filtros.codigoEstudiante}%`);
    }
    if (filtros.nombreEstudiante) {
      condiciones.push('LOWER(ae.nombre_estudiante) LIKE ?');
      valores.push(`%${filtros.nombreEstudiante.toLowerCase()}%`);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const sql = `
      SELECT
        ae.id,
        ae.evento_id          AS eventoId,
        e.nombre              AS eventoNombre,
        e.codigo              AS eventoCodigo,
        ae.nombre_estudiante  AS nombreEstudiante,
        ae.codigo_estudiante  AS codigoEstudiante,
        ae.correo_estudiante  AS correoEstudiante,
        ae.firma_url          AS firmaUrl,
        strftime('%Y-%m-%dT%H:%M:%SZ', ae.fecha_hora) AS fechaHora
      FROM asistencias_eventos ae
      JOIN eventos e ON e.id = ae.evento_id
      ${where}
      ORDER BY ae.fecha_hora DESC
    `;

    const stmt = this.db.prepare(sql);
    const bound = valores.length > 0 ? stmt.bind(...valores) : stmt;
    const { results } = await bound.all<AsistenciaEvento>();
    return results ?? [];
  }

  async registrarAsistencia(data: CreateAsistenciaEventoDTO): Promise<AsistenciaEvento> {
    if (!this.bucket) {
      throw new Error('Bucket R2 no disponible para almacenar firmas de eventos.');
    }

    const cleanCodigo = data.codigoEvento.trim().toUpperCase();
    const evento = await this.getByCodigo(cleanCodigo);

    if (!evento) {
      throw new Error(`Evento con código "${data.codigoEvento}" no encontrado.`);
    }

    if (evento.estado === 'cerrada') {
      throw new Error(`El evento "${evento.nombre}" ya ha finalizado y no acepta más asistencias.`);
    }

    const asistenciaId = newId('asevt');

    const mimeMatch = data.firmaBase64.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
    const contentType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/png';
    const extension = contentType.includes('webp') ? 'webp' : 'png';
    const r2Key = `firmas/eventos/${evento.id}/${asistenciaId}.${extension}`;

    const base64Data = data.firmaBase64.includes(',')
      ? (data.firmaBase64.split(',')[1] ?? '')
      : data.firmaBase64;

    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    await this.bucket.put(r2Key, bytes.buffer, {
      httpMetadata: { contentType },
    });

    await this.db
      .prepare(
        `INSERT INTO asistencias_eventos
           (id, evento_id, nombre_estudiante, codigo_estudiante, correo_estudiante, firma_url)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        asistenciaId,
        evento.id,
        data.nombreEstudiante.trim(),
        data.codigoEstudiante.trim(),
        data.correoEstudiante?.trim() || null,
        r2Key
      )
      .run();

    const row = await this.db
      .prepare(
        `SELECT
          ae.id,
          ae.evento_id          AS eventoId,
          e.nombre              AS eventoNombre,
          e.codigo              AS eventoCodigo,
          ae.nombre_estudiante  AS nombreEstudiante,
          ae.codigo_estudiante  AS codigoEstudiante,
          ae.correo_estudiante  AS correoEstudiante,
          ae.firma_url          AS firmaUrl,
          strftime('%Y-%m-%dT%H:%M:%SZ', ae.fecha_hora) AS fechaHora
         FROM asistencias_eventos ae
         JOIN eventos e ON e.id = ae.evento_id
         WHERE ae.id = ?`
      )
      .bind(asistenciaId)
      .first<AsistenciaEvento>();

    if (!row) throw new Error('Error al recuperar la asistencia de evento recién creada.');
    return row;
  }
}
