import { Hono } from 'hono';
import { UsuarioService } from '../services/usuarioService.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import type { CreateUsuarioDTO, UpdateUsuarioDTO, Variables } from '../types/index.js';

const usuarios = new Hono<{ Bindings: { DB?: D1Database }; Variables: Variables }>();

// Proteger todas las rutas de Usuarios usando authMiddleware y exigiendo rol SUPER_ADMIN
usuarios.use('*', authMiddleware);
usuarios.use('*', requireRole('SUPER_ADMIN'));

// GET /usuarios - Listar todos los usuarios
usuarios.get('/', async (c) => {
  try {
    const usuarioService = new UsuarioService(c.env?.DB);
    const list = await usuarioService.getAll();
    return c.json({ success: true, data: list, count: list.length });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al obtener usuarios' }, 500);
  }
});

// GET /usuarios/:id - Obtener un usuario por ID
usuarios.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const usuarioService = new UsuarioService(c.env?.DB);
    const usuario = await usuarioService.getById(id);

    if (!usuario) {
      return c.json({ success: false, error: 'Usuario no encontrado' }, 404);
    }

    return c.json({ success: true, data: usuario });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al obtener el usuario' }, 500);
  }
});

// POST /usuarios - Crear un nuevo usuario (Solo Super Admin)
usuarios.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateUsuarioDTO>();

    if (!body.nombre || !body.correo || !body.tipo) {
      return c.json(
        {
          success: false,
          error: 'Los campos nombre, correo y tipo son obligatorios',
        },
        400
      );
    }

    const usuarioService = new UsuarioService(c.env?.DB);
    const newUsuario = await usuarioService.create(body);

    return c.json({ success: true, data: newUsuario, message: 'Usuario creado exitosamente' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al crear el usuario' }, 500);
  }
});

// PUT /usuarios/:id - Actualizar un usuario (Solo Super Admin)
usuarios.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateUsuarioDTO>();
    const usuarioService = new UsuarioService(c.env?.DB);

    const updated = await usuarioService.update(id, body);
    if (!updated) {
      return c.json({ success: false, error: 'Usuario no encontrado para actualizar' }, 404);
    }

    return c.json({ success: true, data: updated, message: 'Usuario actualizado exitosamente' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al actualizar el usuario' }, 500);
  }
});

// DELETE /usuarios/:id - Eliminar un usuario (Solo Super Admin)
usuarios.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const usuarioService = new UsuarioService(c.env?.DB);

    const deleted = await usuarioService.delete(id);
    if (!deleted) {
      return c.json({ success: false, error: 'Usuario no encontrado para eliminar' }, 404);
    }

    return c.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al eliminar el usuario' }, 500);
  }
});

export default usuarios;
