import { Hono } from 'hono';
import { signJWT, authMiddleware } from '../middlewares/auth.js';
import type { Env, Variables } from '../types/env.js';
import type { LoginDTO } from '../types/index.js';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /auth/login
 * Login para SUPER_ADMIN, DIRECTOR y AMIGO_ACADEMICO.
 * Retorna un JWT con los datos del usuario.
 *
 * Body: { correo: string, password: string }
 */
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginDTO>();

    if (!body.correo || !body.password) {
      return c.json({ success: false, error: 'correo y password son obligatorios' }, 400);
    }

    // ⚠️  En producción las contraseñas están hasheadas con bcrypt.
    //     Aquí se compara en texto plano sólo para desarrollo local (datos semilla).
    //     Cuando se implemente bcrypt (usando wasm o similar), reemplazar esta línea.
    const usuario = await c.env.DB
      .prepare(
        `SELECT id, nombre, correo, password, tipo
         FROM usuarios
         WHERE correo = ?`
      )
      .bind(body.correo)
      .first<{ id: string; nombre: string; correo: string; password: string; tipo: string }>();

    if (!usuario || usuario.password !== body.password) {
      return c.json({ success: false, error: 'Credenciales inválidas' }, 401);
    }

    const token = await signJWT(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipo: usuario.tipo,
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
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en login';
    return c.json({ success: false, error: msg }, 500);
  }
});

/**
 * GET /auth/me
 * Retorna la información del usuario autenticado actual.
 */
auth.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ success: true, user });
});

/**
 * POST /auth/cambiar-password
 * Permite al usuario actualmente autenticado cambiar su propia contraseña.
 *
 * Body: { passwordActual: string, passwordNueva: string }
 */
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

    if (!usuario || usuario.password !== body.passwordActual) {
      return c.json(
        { success: false, error: 'La contraseña actual ingresada es incorrecta' },
        401
      );
    }

    await c.env.DB
      .prepare('UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(body.passwordNueva, user.id)
      .run();

    return c.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al cambiar la contraseña';
    return c.json({ success: false, error: msg }, 500);
  }
});

export default auth;


