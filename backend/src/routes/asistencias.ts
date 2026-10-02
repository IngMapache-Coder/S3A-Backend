import { Hono } from 'hono';
import { FirmaService } from '../services/firmaService.js';
import type { Env, Variables } from '../types/env.js';

const asistencias = new Hono<{ Bindings: Env; Variables: Variables }>();

asistencias.post('/', async (c) => {
  try {
    const raw = await c.req.json<Record<string, unknown>>();

    const codigoSesion = String(raw['codigoSesion'] ?? raw['codigo_sesion'] ?? '').trim();
    const materiaId = String(raw['materiaId'] ?? raw['materia_id'] ?? '').trim();
    const motivo = String(raw['motivo'] ?? '').trim();
    const nombreEstudiante = String(raw['nombreEstudiante'] ?? raw['nombre_estudiante'] ?? raw['nombre'] ?? '').trim();
    const codigoEstudiante = String(raw['codigoEstudiante'] ?? raw['codigo_estudiante'] ?? raw['codigo'] ?? '').trim();
    const firmaBase64 = String(raw['firmaBase64'] ?? raw['firma_base64'] ?? '').trim();

    if (!codigoSesion || !materiaId || !motivo || !nombreEstudiante || !codigoEstudiante || !firmaBase64) {
      return c.json(
        {
          success: false,
          error: 'Campos obligatorios requeridos: codigo_sesion, materia_id, motivo, nombre_estudiante, codigo_estudiante, firma_base64',
        },
        400
      );
    }

    const service = new FirmaService(c.env.DB, c.env.FIRMAS_BUCKET);
    const asistencia = await service.registrar({
      codigoSesion,
      materiaId,
      motivo,
      nombreEstudiante,
      codigoEstudiante,
      firmaBase64,
    });

    return c.json(
      {
        success: true,
        data: asistencia,
        message: '¡Asistencia registrada correctamente!',
      },
      201
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al registrar asistencia';

    if (msg.includes('no encontrada o ya cerrada')) {
      return c.json({ success: false, error: msg }, 400);
    }

    return c.json({ success: false, error: msg }, 500);
  }
});

export default asistencias;
