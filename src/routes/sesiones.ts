import { Hono, type Context } from 'hono';
import { SesionService } from '../services/sesionService.js';
import { FirmaService } from '../services/firmaService.js';
import { PusherService } from '../services/pusherService.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';

const sesiones = new Hono<{ Bindings: Env; Variables: Variables }>();

sesiones.get('/verificar/:codigo', async (c) => {
  try {
    const codigo = c.req.param('codigo');
    const service = new SesionService(c.env.DB);
    const sesion = await service.verificarCodigo(codigo);

    if (!sesion) {
      return c.json({ success: false, error: 'Sesión no encontrada o ya cerrada' }, 404);
    }

    return c.json({ success: true, data: sesion });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al verificar sesión';
    return c.json({ success: false, error: msg }, 500);
  }
});

sesiones.use('*', authMiddleware);

sesiones.get('/activa', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'), async (c) => {
  try {
    const service = new SesionService(c.env.DB);
    const sesion = await service.getActiva();

    if (!sesion) {
      return c.json({ success: true, data: null, message: 'No hay sesión activa en este momento' });
    }

    return c.json({ success: true, data: sesion });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener sesión activa';
    return c.json({ success: false, error: msg }, 500);
  }
});

const abrirSesionHandler = async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  try {
    const user = c.get('user')!;
    const service = new SesionService(c.env.DB);
    const { sesion, creada } = await service.abrir({ creadaPorId: user.id });

    // Notificar en tiempo real a todos los tutores conectados
    const pusher = new PusherService(c.env);
    await pusher.trigger('sala-asesoria', 'sesion-abierta', { sesion, creadaPor: user.nombre });

    return c.json(
      {
        success: true,
        data: sesion,
        creada,
        message: creada
          ? 'Sesión de sala abierta exitosamente'
          : 'Ya existe una sesión activa. Te has sumado a ella.',
      },
      creada ? 201 : 200
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al abrir sesión';
    return c.json({ success: false, error: msg }, 500);
  }
};

sesiones.post('/abrir', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'), abrirSesionHandler);
sesiones.post('/abrir-compartida', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'), abrirSesionHandler);

sesiones.get('/:id/asistencias', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'), async (c) => {
  try {
    const sesionId = c.req.param('id');
    const firmaService = new FirmaService(c.env.DB, c.env.FIRMAS_BUCKET);
    const lista = await firmaService.listarPorSesion(sesionId);

    return c.json({ success: true, data: lista, count: lista.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener asistencias';
    return c.json({ success: false, error: msg }, 500);
  }
});

sesiones.patch('/:id/cerrar', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'), async (c) => {
  try {
    const id = c.req.param('id');
    const service = new SesionService(c.env.DB);
    const sesion = await service.cerrar(id);

    if (!sesion) {
      return c.json({ success: false, error: 'Sesión no encontrada o ya cerrada' }, 404);
    }

    // Notificar en tiempo real a todos los tutores conectados
    const pusher = new PusherService(c.env);
    await pusher.trigger('sala-asesoria', 'sesion-cerrada', { id, sesion });

    return c.json({ success: true, data: sesion, message: 'Sesión cerrada. El QR ya no acepta nuevas firmas.' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al cerrar sesión';
    return c.json({ success: false, error: msg }, 500);
  }
});

export default sesiones;
