import type { Context, Next, MiddlewareHandler } from 'hono';
import type { AuthUserPayload, Role, Variables } from '../types/index.js';
import type { Env } from '../types/env.js';

// ─────────────────────────────────────────────────────────────
// JWT mínimo para Cloudflare Workers (sin librerías externas)
// Cloudflare Workers expone la Web Crypto API nativa.
// ─────────────────────────────────────────────────────────────

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Genera un JWT firmado con HMAC-SHA256.
 */
export async function signJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 86400 // 24 horas
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));

  return `${signingInput}.${base64urlEncode(sig)}`;
}

/**
 * Verifica y decodifica un JWT. Lanza error si es inválido o expirado.
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado');

  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) {
    throw new Error('Token malformado');
  }

  const signingInput = `${headerB64}.${payloadB64}`;

  const enc = new TextEncoder();
  const key = await importKey(secret);
  const sigBytes = base64urlDecode(sigB64);

  const valid = await crypto.subtle.verify('HMAC', key, sigBytes as unknown as BufferSource, enc.encode(signingInput));
  if (!valid) throw new Error('Firma del token inválida');

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expirado');
  }

  return payload;
}

// ─────────────────────────────────────────────────────────────
// Middleware de autenticación — extrae y valida el JWT
// ─────────────────────────────────────────────────────────────

/**
 * Middleware para verificar el JWT en el header Authorization.
 * Popula c.var.user con los datos del usuario autenticado.
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  const tokenQuery = c.req.query('token');

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (tokenQuery) {
    token = tokenQuery.trim();
  }

  if (!token) {
    return c.json({ error: 'No autenticado. Se requiere token Bearer o parametro token.' }, 401);
  }

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    const user: AuthUserPayload = {
      id: payload['id'] as string,
      nombre: payload['nombre'] as string,
      correo: payload['correo'] as string,
      tipo: payload['tipo'] as Role,
    };

    c.set('user', user);
    await next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token inválido';
    return c.json({ error: message }, 401);
  }
}

// ─────────────────────────────────────────────────────────────
// Guard de roles
// ─────────────────────────────────────────────────────────────

/**
 * Middleware para restringir el acceso según el rol del usuario.
 * Debe usarse DESPUÉS de authMiddleware.
 */
export function requireRole(
  ...allowedRoles: Role[]
): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'No autenticado.' }, 401);
    }

    if (!allowedRoles.includes(user.tipo)) {
      return c.json(
        {
          error: `Acceso prohibido. Roles permitidos: ${allowedRoles.join(', ')}. Tu rol: ${user.tipo}`,
        },
        403
      );
    }

    await next();
  };
}
