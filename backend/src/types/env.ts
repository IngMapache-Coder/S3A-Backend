/**
 * Tipos del entorno de Cloudflare Workers para S3A.
 *
 * Este archivo define la interfaz `Env` que representa todos los bindings
 * declarados en wrangler.jsonc. Hono usa este tipo para dar autocompletado
 * y type-safety al acceder a `c.env` dentro de los handlers.
 *
 * ─── USO ────────────────────────────────────────────────────
 *  import type { Env } from '../types/env.js';
 *  const app = new Hono<{ Bindings: Env }>();
 *
 *  app.get('/ejemplo', (c) => {
 *    const db     = c.env.DB;           // D1Database
 *    const bucket = c.env.FIRMAS_BUCKET; // R2Bucket
 *    const secret = c.env.JWT_SECRET;   // string
 *  });
 * ────────────────────────────────────────────────────────────
 */
export interface Env {
  /**
   * Binding a Cloudflare D1 (SQLite en el edge).
   * Nombre del binding en wrangler.jsonc: "DB"
   *
   * Métodos principales:
   *   db.prepare(sql)          → D1PreparedStatement
   *   stmt.bind(...values)     → D1PreparedStatement
   *   stmt.first<T>()          → Promise<T | null>
   *   stmt.all<T>()            → Promise<D1Result<T>>
   *   stmt.run()               → Promise<D1Result>
   *   db.batch([...stmts])     → Promise<D1Result[]>
   *   db.exec(sql)             → Promise<D1ExecResult>   (solo DDL)
   *
   * Ejemplo:
   *   const row = await c.env.DB
   *     .prepare('SELECT * FROM usuarios WHERE correo = ?')
   *     .bind(correo)
   *     .first<Usuario>();
   */
  DB: D1Database;

  /**
   * Binding a Cloudflare R2 (object storage para imágenes de firmas).
   * Nombre del binding en wrangler.jsonc: "FIRMAS_BUCKET"
   *
   * Métodos principales:
   *   bucket.put(key, value, options?)  → Promise<R2Object>
   *   bucket.get(key)                   → Promise<R2ObjectBody | null>
   *   bucket.delete(key)                → Promise<void>
   *   bucket.list(options?)             → Promise<R2Objects>
   *
   * Convención de claves:
   *   firmas/<sesion_id>/<registro_id>.webp
   *
   * Ejemplo:
   *   await c.env.FIRMAS_BUCKET.put(
   *     `firmas/${sesionId}/${registroId}.webp`,
   *     imageBuffer,
   *     { httpMetadata: { contentType: 'image/webp' } }
   *   );
   */
  FIRMAS_BUCKET: R2Bucket;

  /**
   * Secreto para firmar y verificar JSON Web Tokens.
   *
   * ⚠️  En LOCAL (desarrollo):  definido en wrangler.jsonc > "vars"
   * ⚠️  En PRODUCCIÓN:          NO lo pongas en vars (texto plano).
   *     Usa: npx wrangler secret put JWT_SECRET
   *
   * Valor mínimo recomendado: 32 caracteres aleatorios (256 bits).
   * Puedes generar uno con:  openssl rand -hex 32
   */
  JWT_SECRET: string;
}

export type { Variables } from './index.js';
