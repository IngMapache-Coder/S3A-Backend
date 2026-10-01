import { Hono } from 'hono';
import { FirmaService } from '../services/firmaService.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';

const reportes = new Hono<{ Bindings: Env; Variables: Variables }>();

reportes.use('*', authMiddleware);
reportes.use('*', requireRole('DIRECTOR', 'SUPER_ADMIN'));

/**
 * GET /reportes/asistencias
 * Consulta general de asistencias con filtros opcionales.
 *
 * Query params opcionales:
 *   desde            — fecha ISO inicio (ej: 2026-01-01)
 *   hasta            — fecha ISO fin
 *   materiaId        — ID de materia
 *   codigoEstudiante — código institucional (parcial)
 *   nombreEstudiante — nombre del estudiante (parcial, sin distinción mayúsculas)
 */
reportes.get('/asistencias', async (c) => {
  try {
    const q = c.req.query();
    const desde = q['desde'];
    const hasta = q['hasta'];
    const materiaId = q['materiaId'] || q['materia_id'];
    const codigoEstudiante = q['codigoEstudiante'] || q['codigo_estudiante'];
    const nombreEstudiante = q['nombreEstudiante'] || q['nombre_estudiante'];

    const service = new FirmaService(c.env.DB, c.env.FIRMAS_BUCKET);
    const data = await service.consultar({
      desde: desde || undefined,
      hasta: hasta || undefined,
      materiaId: materiaId || undefined,
      codigoEstudiante: codigoEstudiante || undefined,
      nombreEstudiante: nombreEstudiante || undefined,
    });

    return c.json({ success: true, data, count: data.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al consultar asistencias';
    return c.json({ success: false, error: msg }, 500);
  }
});

/**
 * GET /reportes/excel
 * Descarga un archivo CSV compatible con Excel (con BOM UTF-8)
 * que contiene el consolidado de asistencias.
 */
reportes.get('/excel', async (c) => {
  try {
    const q = c.req.query();
    const desde = q['desde'];
    const hasta = q['hasta'];
    const materiaId = q['materiaId'] || q['materia_id'];
    const codigoEstudiante = q['codigoEstudiante'] || q['codigo_estudiante'];
    const nombreEstudiante = q['nombreEstudiante'] || q['nombre_estudiante'];

    const service = new FirmaService(c.env.DB, c.env.FIRMAS_BUCKET);
    const data = await service.consultar({
      desde: desde || undefined,
      hasta: hasta || undefined,
      materiaId: materiaId || undefined,
      codigoEstudiante: codigoEstudiante || undefined,
      nombreEstudiante: nombreEstudiante || undefined,
    });

    // Construir CSV
    const headers = [
      'Fecha y Hora',
      'Código Sesión',
      'Materia',
      'Motivo',
      'Nombre Estudiante',
      'Código Estudiante',
      'Ruta Firma (R2)',
    ];

    const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = data.map((r) =>
      [
        escape(r.fechaHora),
        escape(r.codigoSesion),
        escape(r.materiaNombre),
        escape(r.motivo),
        escape(r.nombreEstudiante),
        escape(r.codigoEstudiante),
        escape(r.firmaUrl),
      ].join(',')
    );

    // \uFEFF es el BOM de UTF-8 que hace que Excel reconozca tildes y caracteres en español
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const fecha = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="asistencias_s3a_${fecha}.csv"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al generar reporte';
    return c.json({ success: false, error: msg }, 500);
  }
});

export default reportes;
