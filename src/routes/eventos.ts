import { Hono } from 'hono';
import { EventoService } from '../services/eventoService.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';

const eventos = new Hono<{ Bindings: Env; Variables: Variables }>();

// ==========================================
// RUTAS PÚBLICAS (Para Estudiantes / QR)
// ==========================================

eventos.get('/verificar/:codigo', async (c) => {
  try {
    const codigo = c.req.param('codigo');
    const service = new EventoService(c.env.DB);
    const evento = await service.getByCodigo(codigo);

    if (!evento) {
      return c.json({ success: false, error: 'Evento no encontrado' }, 404);
    }

    if (evento.estado === 'cerrada') {
      return c.json(
        {
          success: false,
          error: 'El evento ya fue finalizado y no acepta más registros de asistencia.',
          data: evento,
        },
        400
      );
    }

    return c.json({ success: true, data: evento });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al verificar evento';
    return c.json({ success: false, error: msg }, 500);
  }
});

eventos.post('/asistencias', async (c) => {
  try {
    const raw = await c.req.json<Record<string, unknown>>();

    const codigoEvento = String(raw['codigoEvento'] ?? raw['codigo_evento'] ?? raw['codigo'] ?? '').trim();
    const nombreEstudiante = String(raw['nombreEstudiante'] ?? raw['nombre_estudiante'] ?? raw['nombre'] ?? '').trim();
    const codigoEstudiante = String(raw['codigoEstudiante'] ?? raw['codigo_estudiante'] ?? raw['codigo'] ?? '').trim();
    const correoEstudiante = String(raw['correoEstudiante'] ?? raw['correo_estudiante'] ?? raw['correo'] ?? '').trim();
    const firmaBase64 = String(raw['firmaBase64'] ?? raw['firma_base64'] ?? '').trim();

    if (!codigoEvento || !nombreEstudiante || !codigoEstudiante || !firmaBase64) {
      return c.json(
        {
          success: false,
          error: 'Campos obligatorios requeridos: codigoEvento, nombreEstudiante, codigoEstudiante, firmaBase64',
        },
        400
      );
    }

    const service = new EventoService(c.env.DB, c.env.FIRMAS_BUCKET);
    const asistencia = await service.registrarAsistencia({
      codigoEvento,
      nombreEstudiante,
      codigoEstudiante,
      correoEstudiante: correoEstudiante || undefined,
      firmaBase64,
    });

    return c.json(
      {
        success: true,
        data: asistencia,
        message: '¡Asistencia al evento registrada correctamente!',
      },
      201
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al registrar asistencia al evento';
    return c.json({ success: false, error: msg }, 400);
  }
});

// ==========================================
// RUTAS PROTEGIDAS (Para Tutores y Directores)
// ==========================================

eventos.use('*', authMiddleware);
eventos.use('*', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'));

eventos.get('/', async (c) => {
  try {
    const service = new EventoService(c.env.DB);
    const lista = await service.listar();
    return c.json({ success: true, data: lista, count: lista.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al listar eventos';
    return c.json({ success: false, error: msg }, 500);
  }
});

eventos.post('/', async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json<{
      nombre?: string;
      descripcion?: string;
      lugar?: string;
      facilitador?: string;
      ponente?: string;
      codigo?: string;
    }>();

    if (!body.nombre || body.nombre.trim() === '') {
      return c.json({ success: false, error: 'El nombre del evento es obligatorio' }, 400);
    }

    const ponente = body.ponente?.trim() || body.facilitador?.trim();

    const service = new EventoService(c.env.DB);
    const evento = await service.crear({
      nombre: body.nombre.trim(),
      descripcion: body.descripcion?.trim(),
      lugar: body.lugar?.trim(),
      ponente,
      codigo: body.codigo?.trim(),
      creadaPorId: user.id,
    });

    return c.json({ success: true, data: evento, message: 'Evento creado exitosamente' }, 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al crear evento';
    return c.json({ success: false, error: msg }, 400);
  }
});

eventos.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new EventoService(c.env.DB);
    const evento = await service.getById(id);

    if (!evento) {
      return c.json({ success: false, error: 'Evento no encontrado' }, 404);
    }

    return c.json({ success: true, data: evento });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener evento';
    return c.json({ success: false, error: msg }, 500);
  }
});

eventos.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      nombre?: string;
      descripcion?: string;
      lugar?: string;
      facilitador?: string;
      ponente?: string;
      codigo?: string;
    }>();

    const service = new EventoService(c.env.DB);
    const evento = await service.actualizar(id, {
      ...body,
      ponente: body.ponente?.trim() || body.facilitador?.trim(),
    });

    if (!evento) {
      return c.json({ success: false, error: 'Evento no encontrado' }, 404);
    }

    return c.json({ success: true, data: evento, message: 'Evento actualizado exitosamente' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al actualizar evento';
    return c.json({ success: false, error: msg }, 400);
  }
});

eventos.patch('/:id/cerrar', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new EventoService(c.env.DB);
    const evento = await service.cerrar(id);

    if (!evento) {
      return c.json({ success: false, error: 'Evento no encontrado' }, 404);
    }

    return c.json({
      success: true,
      data: evento,
      message: 'Evento finalizado. El código QR ya no acepta nuevas asistencias.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al cerrar evento';
    return c.json({ success: false, error: msg }, 500);
  }
});

eventos.patch('/:id/reabrir', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new EventoService(c.env.DB);
    const evento = await service.reabrir(id);

    if (!evento) {
      return c.json({ success: false, error: 'Evento no encontrado' }, 404);
    }

    return c.json({
      success: true,
      data: evento,
      message: 'Evento reactivado. El código QR vuelve a estar disponible para registrar asistencias.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al reactivar evento';
    return c.json({ success: false, error: msg }, 500);
  }
});

eventos.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new EventoService(c.env.DB);
    const ok = await service.eliminar(id);

    if (!ok) {
      return c.json({ success: false, error: 'Evento no encontrado o no se pudo eliminar' }, 404);
    }

    return c.json({ success: true, message: 'Evento y sus asistencias eliminados correctamente' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al eliminar evento';
    return c.json({ success: false, error: msg }, 500);
  }
});

eventos.get('/:id/asistencias', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new EventoService(c.env.DB);
    const asistencias = await service.listarAsistencias(id);

    return c.json({ success: true, data: asistencias, count: asistencias.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener asistencias del evento';
    return c.json({ success: false, error: msg }, 500);
  }
});

export default eventos;

