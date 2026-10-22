import { Hono } from 'hono';
import { FirmaService } from '../services/firmaService.js';
import { EventoService } from '../services/eventoService.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';

const reportes = new Hono<{ Bindings: Env; Variables: Variables }>();

reportes.use('*', authMiddleware);
reportes.use('*', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'));

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

reportes.get('/eventos', async (c) => {
  try {
    const q = c.req.query();
    const desde = q['desde'];
    const hasta = q['hasta'];
    const eventoId = q['eventoId'] || q['evento_id'];
    const codigoEstudiante = q['codigoEstudiante'] || q['codigo_estudiante'];
    const nombreEstudiante = q['nombreEstudiante'] || q['nombre_estudiante'];

    const service = new EventoService(c.env.DB);
    const data = await service.consultarAsistencias({
      desde: desde || undefined,
      hasta: hasta || undefined,
      eventoId: eventoId || undefined,
      codigoEstudiante: codigoEstudiante || undefined,
      nombreEstudiante: nombreEstudiante || undefined,
    });

    return c.json({ success: true, data, count: data.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al consultar asistencias de eventos';
    return c.json({ success: false, error: msg }, 500);
  }
});

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

    const headers = [
      'N° Registro',
      'Código Materia',
      'Nombre Materia',
      'Nombre y Apellido Estudiante',
      'Código Estudiante',
      'Temas',
      'Fecha y Hora',
      'Firma (R2)',
    ];

    const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = data.map((r, index) =>
      [
        index + 1,
        escape(r.materiaCodigo || ''),
        escape(r.materiaNombre),
        escape(r.nombreEstudiante),
        escape(r.codigoEstudiante),
        escape(r.motivo),
        escape(r.fechaHora),
        escape(r.firmaUrl),
      ].join(',')
    );

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
