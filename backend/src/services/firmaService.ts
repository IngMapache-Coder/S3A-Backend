import type { Asistencia, CreateAsistenciaDTO } from '../types/index.js';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function newId(): string {
  return `asi-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────
// FirmaService
// Gestión del registro de asistencia del estudiante:
//   - Sube la firma a Cloudflare R2
//   - Inserta el registro en D1
// ─────────────────────────────────────────────────────────────
export class FirmaService {
  private db: D1Database;
  private bucket: R2Bucket;

  constructor(db: D1Database, bucket: R2Bucket) {
    this.db = db;
    this.bucket = bucket;
  }

  /**
   * Registra la asistencia de un estudiante:
   *  1. Valida que el codigo_sesion pertenezca a una sesión activa.
   *  2. Sube la imagen de firma (base64 → ArrayBuffer) a R2.
   *  3. Inserta el registro en la tabla asistencias de D1.
   */
  async registrar(data: CreateAsistenciaDTO): Promise<Asistencia> {
    // 1. Obtener la sesión activa por código
    const sesion = await this.db
      .prepare(`SELECT id FROM sesiones WHERE codigo = ? AND estado = 'activa'`)
      .bind(data.codigoSesion)
      .first<{ id: string }>();

    if (!sesion) {
      throw new Error(`Sesión con código "${data.codigoSesion}" no encontrada o ya cerrada.`);
    }

    // 2. Decodificar base64 → ArrayBuffer y subir a R2
    const asistenciaId = newId();

    const mimeMatch = data.firmaBase64.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
    const contentType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/png';
    const extension = contentType.includes('webp') ? 'webp' : 'png';
    const r2Key = `firmas/${sesion.id}/${asistenciaId}.${extension}`;

    // El base64 puede venir con o sin prefijo data:image/...;base64,
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

    // 3. Insertar en D1
    await this.db
      .prepare(
        `INSERT INTO asistencias
           (id, sesion_id, materia_id, motivo, nombre_estudiante, codigo_estudiante, firma_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        asistenciaId,
        sesion.id,
        data.materiaId,
        data.motivo,
        data.nombreEstudiante,
        data.codigoEstudiante,
        r2Key
      )
      .run();

    const registro = await this.db
      .prepare(
        `SELECT
          id,
          sesion_id          AS sesionId,
          materia_id         AS materiaId,
          motivo,
          nombre_estudiante  AS nombreEstudiante,
          codigo_estudiante  AS codigoEstudiante,
          firma_url          AS firmaUrl,
          strftime('%Y-%m-%dT%H:%M:%SZ', fecha_hora) AS fechaHora
         FROM asistencias WHERE id = ?`
      )
      .bind(asistenciaId)
      .first<Asistencia>();

    if (!registro) throw new Error('Error al recuperar el registro recién creado.');
    return registro;
  }

  /**
   * Lista todas las asistencias de una sesión (vista en vivo para el tutor).
   */
  async listarPorSesion(sesionId: string): Promise<Asistencia[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
          a.id,
          a.sesion_id          AS sesionId,
          a.materia_id         AS materiaId,
          m.nombre             AS materiaNombre,
          a.motivo,
          a.nombre_estudiante  AS nombreEstudiante,
          a.codigo_estudiante  AS codigoEstudiante,
          a.firma_url          AS firmaUrl,
          strftime('%Y-%m-%dT%H:%M:%SZ', a.fecha_hora) AS fechaHora
         FROM asistencias a
         JOIN materias m ON m.id = a.materia_id
         WHERE a.sesion_id = ?
         ORDER BY a.fecha_hora ASC`
      )
      .bind(sesionId)
      .all<Asistencia & { materiaNombre?: string }>();
    return results ?? [];
  }

  /**
   * Obtiene la imagen de una firma desde R2 para auditoría.
   * Retorna el objeto R2 o null si no existe.
   */
  async getFirma(asistenciaId: string): Promise<R2ObjectBody | null> {
    // Buscar la firma_url del registro
    const row = await this.db
      .prepare(`SELECT firma_url AS firmaUrl FROM asistencias WHERE id = ?`)
      .bind(asistenciaId)
      .first<{ firmaUrl: string }>();

    if (!row) return null;
    const obj = await this.bucket.get(row.firmaUrl);
    return obj;
  }

  /**
   * Consulta general de asistencias con filtros opcionales.
   * Usada por el panel de reportes del Director / Super Admin.
   */
  async consultar(filtros: {
    desde?: string | undefined;
    hasta?: string | undefined;
    materiaId?: string | undefined;
    codigoEstudiante?: string | undefined;
    nombreEstudiante?: string | undefined;
  }): Promise<(Asistencia & { materiaNombre: string; codigoSesion: string })[]> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.desde) {
      condiciones.push('a.fecha_hora >= ?');
      valores.push(filtros.desde);
    }
    if (filtros.hasta) {
      condiciones.push('a.fecha_hora <= ?');
      valores.push(filtros.hasta);
    }
    if (filtros.materiaId) {
      condiciones.push('a.materia_id = ?');
      valores.push(filtros.materiaId);
    }
    if (filtros.codigoEstudiante) {
      condiciones.push('a.codigo_estudiante LIKE ?');
      valores.push(`%${filtros.codigoEstudiante}%`);
    }
    if (filtros.nombreEstudiante) {
      condiciones.push('LOWER(a.nombre_estudiante) LIKE ?');
      valores.push(`%${filtros.nombreEstudiante.toLowerCase()}%`);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const sql = `
      SELECT
        a.id,
        a.sesion_id          AS sesionId,
        s.codigo             AS codigoSesion,
        a.materia_id         AS materiaId,
        m.nombre             AS materiaNombre,
        a.motivo,
        a.nombre_estudiante  AS nombreEstudiante,
        a.codigo_estudiante  AS codigoEstudiante,
        a.firma_url          AS firmaUrl,
        strftime('%Y-%m-%dT%H:%M:%SZ', a.fecha_hora) AS fechaHora
      FROM asistencias a
      JOIN sesiones  s ON s.id = a.sesion_id
      JOIN materias  m ON m.id = a.materia_id
      ${where}
      ORDER BY a.fecha_hora DESC
    `;

    const stmt = this.db.prepare(sql);
    const bound = valores.length > 0 ? stmt.bind(...valores) : stmt;
    const { results } = await bound.all<Asistencia & { materiaNombre: string; codigoSesion: string }>();
    return results ?? [];
  }
}
