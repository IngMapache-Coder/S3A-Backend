import { Hono } from 'hono';
import { cors } from 'hono/cors';
import materias from './routes/materias.js';
import usuarios from './routes/usuarios.js';

const app = new Hono();

// CORS middleware para permitir llamadas del frontend
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Email', 'X-User-Id'],
}));

// Ruta raíz y API Root
app.get('/', (c) => {
  return c.json({
    message: '🚀 API Backend S3A activa y conectada con Hono',
    version: '1.0.0',
    endpoints: {
      materias: '/materias',
      usuarios: '/usuarios',
      status: '/api'
    }
  });
});

app.get('/api', (c) => {
  return c.json({
    name: 'S3A API Backend',
    version: '1.0.0',
    status: 'Online',
    endpoints: ['/materias', '/usuarios'],
  });
});

// Rutas principales
app.route('/materias', materias);
app.route('/usuarios', usuarios);

export default app;