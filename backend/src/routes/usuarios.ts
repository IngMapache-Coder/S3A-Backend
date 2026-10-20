import { Hono } from 'hono';
import { UsuarioService } from '../services/usuarioService.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';
import type { CreateUsuarioDTO, UpdateUsuarioDTO } from '../types/index.js';

const usuarios = new Hono<{ Bindings: Env; Variables: Variables }>();

usuarios.use('*', authMiddleware);

usuarios.get('/', requireRole('SUPER_ADMIN', 'DIRECTOR'), async (c) => {
  try {
    const { tipo } = c.req.query();
    const usuarioService = new UsuarioService(c.env.DB);
    let list = await usuarioService.getAll();

    if (tipo) {
      list = list.filter((u) => u.tipo === tipo);
    }

    return c.json({ success: true, data: list, count: list.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener usuarios';
    return c.json({ success: false, error: msg }, 500);
  }
});

usuarios.get('/:id', requireRole('SUPER_ADMIN', 'DIRECTOR'), async (c) => {
  try {
    const id = c.req.param('id');
    const usuarioService = new UsuarioService(c.env.DB);
    const usuario = await usuarioService.getById(id);

    if (!usuario) {
      return c.json({ success: false, error: 'Usuario no encontrado' }, 404);
    }

    return c.json({ success: true, data: usuario });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener el usuario';
    return c.json({ success: false, error: msg }, 500);
  }
});

usuarios.post('/', requireRole('SUPER_ADMIN', 'DIRECTOR'), async (c) => {
  try {
    const caller = c.get('user')!;
    const body = await c.req.json<CreateUsuarioDTO>();

    if (!body.nombre || !body.correo || !body.tipo || !body.password) {
      return c.json(
        { success: false, error: 'Los campos nombre, correo, tipo y password son obligatorios' },
        400
      );
    }

    if (caller.tipo === 'DIRECTOR' && body.tipo !== 'AMIGO_ACADEMICO') {
      return c.json(
        { success: false, error: 'Un Director solo puede crear cuentas de tipo AMIGO_ACADEMICO' },
        403
      );
    }

    const usuarioService = new UsuarioService(c.env.DB);
    const newUsuario = await usuarioService.create(body);

    return c.json({ success: true, data: newUsuario, message: 'Usuario creado exitosamente' }, 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al crear el usuario';
    return c.json({ success: false, error: msg }, 500);
  }
});

usuarios.put('/:id', requireRole('SUPER_ADMIN'), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateUsuarioDTO>();
    const usuarioService = new UsuarioService(c.env.DB);

    const updated = await usuarioService.update(id, body);
    if (!updated) {
      return c.json({ success: false, error: 'Usuario no encontrado para actualizar' }, 404);
    }

    return c.json({ success: true, data: updated, message: 'Usuario actualizado exitosamente' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al actualizar el usuario';
    return c.json({ success: false, error: msg }, 500);
  }
});

usuarios.delete('/:id', requireRole('SUPER_ADMIN'), async (c) => {
  try {
    const id = c.req.param('id');
    const usuarioService = new UsuarioService(c.env.DB);

    const deleted = await usuarioService.delete(id);
    if (!deleted) {
      return c.json({ success: false, error: 'Usuario no encontrado para eliminar' }, 404);
    }

    return c.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al eliminar el usuario';
    return c.json({ success: false, error: msg }, 500);
  }
});

export default usuarios;
