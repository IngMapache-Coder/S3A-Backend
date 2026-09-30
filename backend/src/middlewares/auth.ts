import type { Context, Next, MiddlewareHandler } from 'hono';
import type { AuthUserPayload, Role, Variables } from '../types/index.js';

/**
 * Middleware para extraer información del usuario autenticado.
 */
export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  const customRoleHeader = c.req.header('X-User-Role') as Role | undefined;
  const customEmailHeader = c.req.header('X-User-Email');
  const customIdHeader = c.req.header('X-User-Id');
  const customNombreHeader = c.req.header('X-User-Nombre');

  let userPayload: AuthUserPayload = {
    id: customIdHeader || 'usr-1',
    nombre: customNombreHeader || 'Super Administrador',
    correo: customEmailHeader || 'admin@s3a.edu.co',
    tipo: customRoleHeader || 'SUPER_ADMIN',
  };

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim().toLowerCase();
    if (token === 'director') {
      userPayload = {
        id: 'usr-2',
        nombre: 'Carlos Pérez',
        correo: 'cperez@s3a.edu.co',
        tipo: 'DIRECTOR',
      };
    } else if (token === 'amigo_academico' || token === 'amigo') {
      userPayload = {
        id: 'usr-3',
        nombre: 'Ana Gómez',
        correo: 'agomez@s3a.edu.co',
        tipo: 'AMIGO_ACADEMICO',
      };
    } else if (token === 'super_admin' || token === 'admin') {
      userPayload = {
        id: 'usr-1',
        nombre: 'Super Administrador',
        correo: 'admin@s3a.edu.co',
        tipo: 'SUPER_ADMIN',
      };
    }
  }

  c.set('user', userPayload);
  await next();
}

/**
 * Middleware para restringir el acceso según el tipo/rol del usuario.
 */
export function requireRole(...allowedRoles: Role[]): MiddlewareHandler<{ Variables: Variables }> {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'No autenticado. Token o sesión no válida.' }, 401);
    }

    if (!allowedRoles.includes(user.tipo)) {
      return c.json(
        {
          error: `Acceso prohibido. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}. Tu tipo de usuario actual es: ${user.tipo}`,
        },
        403
      );
    }

    await next();
  };
}
