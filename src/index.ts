import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.js';
import usuarios from './routes/usuarios.js';
import materias from './routes/materias.js';
import sesiones from './routes/sesiones.js';
import asistencias from './routes/asistencias.js';
import firmas from './routes/firmas.js';
import reportes from './routes/reportes.js';
import eventos from './routes/eventos.js';
import type { Env, Variables } from './types/env.js';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => {
  return c.json({
    message: 'API Backend S3A (Sistema de Asistencia Digital "Amigo Académico") activa',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      usuarios: '/usuarios',
      materias: '/materias',
      sesiones: '/sesiones',
      asistencias: '/asistencias',
      firmas: '/firmas',
      reportes: '/reportes',
      eventos: '/eventos',
    }
  });
});

app.get('/api', (c) => {
  return c.json({
    name: 'S3A API Backend',
    version: '1.0.0',
    status: 'Online',
    endpoints: ['/auth', '/usuarios', '/materias', '/sesiones', '/asistencias', '/firmas', '/reportes', '/eventos'],
  });
});

app.route('/auth', auth);
app.route('/usuarios', usuarios);
app.route('/materias', materias);
app.route('/sesiones', sesiones);
app.route('/asistencias', asistencias);
app.route('/firmas', firmas);
app.route('/reportes', reportes);
app.route('/eventos', eventos);

export default app;