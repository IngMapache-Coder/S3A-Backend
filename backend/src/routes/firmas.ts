import { Hono } from 'hono';
import { FirmaService } from '../services/firmaService.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';

const firmas = new Hono<{ Bindings: Env; Variables: Variables }>();

firmas.use('*', authMiddleware);

firmas.get('/:asistenciaId', requireRole('AMIGO_ACADEMICO', 'DIRECTOR', 'SUPER_ADMIN'), async (c) => {
  try {
    const asistenciaId = c.req.param('asistenciaId');
    const service = new FirmaService(c.env.DB, c.env.FIRMAS_BUCKET);
    const obj = await service.getFirma(asistenciaId);

    if (!obj) {
      return c.json({ success: false, error: 'Firma no encontrada' }, 404);
    }

    const body = await obj.arrayBuffer();
    return new Response(body, {
      headers: {
        'Content-Type': obj.httpMetadata?.contentType ?? 'image/webp',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener la firma';
    return c.json({ success: false, error: msg }, 500);
  }
});

export default firmas;
