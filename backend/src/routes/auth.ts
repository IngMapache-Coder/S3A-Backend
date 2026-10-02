import { Hono } from 'hono';
import { signJWT, authMiddleware } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';
import type { LoginDTO } from '../types/index.js';
import { verifyPassword, hashPassword } from '../utils/passwordHash.js';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginDTO>();

    if (!body.correo || !body.password) {
      return c.json({ success: false, error: 'correo y password son obligatorios' }, 400);
    }

    try {
      await c.env.DB.prepare('ALTER TABLE usuarios ADD COLUMN debe_cambiar_password INTEGER DEFAULT 1').run();
    } catch {}

    const usuario = await c.env.DB
      .prepare(
        `SELECT id, nombre, correo, password, tipo,
                CASE WHEN tipo = 'SUPER_ADMIN' THEN 0 ELSE COALESCE(debe_cambiar_password, 1) END as debe_cambiar_password
         FROM usuarios
         WHERE correo = ?`
      )
      .bind(body.correo)
      .first<{ id: string; nombre: string; correo: string; password: string; tipo: 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO'; debe_cambiar_password: number }>();

    if (!usuario) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401);
    }

    const passwordValida = await verifyPassword(body.password, usuario.password);
    if (!passwordValida) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401);
    }

    const debeCambiar = usuario.tipo === 'SUPER_ADMIN' ? false : Boolean(usuario.debe_cambiar_password);

    const token = await signJWT(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipo: usuario.tipo,
        debeCambiarPassword: debeCambiar,
      },
      c.env.JWT_SECRET
    );

    return c.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipo: usuario.tipo,
        debeCambiarPassword: debeCambiar,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en login';
    return c.json({ success: false, error: msg }, 500);
  }
});

auth.get('/me', authMiddleware, async (c) => {
  const tokenUser = c.get('user')!;
  try {
    const row = await c.env.DB
      .prepare(
        `SELECT id, nombre, correo, tipo,
                CASE WHEN tipo = 'SUPER_ADMIN' THEN 0 ELSE COALESCE(debe_cambiar_password, 1) END as debe_cambiar_password
         FROM usuarios WHERE id = ?`
      )
      .bind(tokenUser.id)
      .first<{ id: string; nombre: string; correo: string; tipo: 'SUPER_ADMIN' | 'DIRECTOR' | 'AMIGO_ACADEMICO'; debe_cambiar_password: number }>();

    if (row) {
      const debeCambiar = row.tipo === 'SUPER_ADMIN' ? false : Boolean(row.debe_cambiar_password);
      return c.json({
        success: true,
        user: {
          id: row.id,
          nombre: row.nombre,
          correo: row.correo,
          tipo: row.tipo,
          debeCambiarPassword: debeCambiar,
        },
      });
    }
  } catch {}

  return c.json({ success: true, user: tokenUser });
});

auth.post('/cambiar-password', authMiddleware, async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json<{ passwordActual?: string; passwordNueva?: string }>();

    if (!body.passwordActual || !body.passwordNueva) {
      return c.json(
        { success: false, error: 'Debe ingresar la contraseña actual y la nueva contraseña' },
        400
      );
    }

    if (body.passwordNueva.length < 6) {
      return c.json(
        { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        400
      );
    }

    const usuario = await c.env.DB
      .prepare('SELECT id, password FROM usuarios WHERE id = ?')
      .bind(user.id)
      .first<{ id: string; password: string }>();

    if (!usuario) {
      return c.json(
        { success: false, error: 'La contraseña actual ingresada es incorrecta' },
        401
      );
    }

    const passwordActualValida = await verifyPassword(body.passwordActual, usuario.password);
    if (!passwordActualValida) {
      return c.json(
        { success: false, error: 'La contraseña actual ingresada es incorrecta' },
        401
      );
    }

    const nuevoHash = await hashPassword(body.passwordNueva);

    await c.env.DB
      .prepare('UPDATE usuarios SET password = ?, debe_cambiar_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(nuevoHash, user.id)
      .run();

    return c.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
      user: {
        ...user,
        debeCambiarPassword: false,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al cambiar la contraseña';
    return c.json({ success: false, error: msg }, 500);
  }
});

export default auth;
