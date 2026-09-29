import { Hono } from 'hono';
import { MateriaService } from '../services/materiaService.js';
import type { CreateMateriaDTO, UpdateMateriaDTO } from '../types/index.js';

const materias = new Hono<{ Bindings: { DB?: D1Database } }>();

// GET /materias - Obtener todas las materias (código y nombre)
materias.get('/', async (c) => {
  try {
    const materiaService = new MateriaService(c.env?.DB);
    const list = await materiaService.getAll();
    return c.json({ success: true, data: list, count: list.length });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al obtener materias' }, 500);
  }
});

// GET /materias/:id - Obtener una materia por ID
materias.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const materiaService = new MateriaService(c.env?.DB);
    const materia = await materiaService.getById(id);

    if (!materia) {
      return c.json({ success: false, error: 'Materia no encontrada' }, 404);
    }

    return c.json({ success: true, data: materia });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al obtener la materia' }, 500);
  }
});

// POST /materias - Crear una nueva materia (requiere código y nombre)
materias.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateMateriaDTO>();

    if (!body.codigo || !body.nombre) {
      return c.json(
        {
          success: false,
          error: 'Los campos código y nombre son obligatorios',
        },
        400
      );
    }

    const materiaService = new MateriaService(c.env?.DB);
    const newMateria = await materiaService.create(body);

    return c.json({ success: true, data: newMateria, message: 'Materia creada exitosamente' }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al crear la materia' }, 500);
  }
});

// PUT /materias/:id - Actualizar una materia
materias.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateMateriaDTO>();
    const materiaService = new MateriaService(c.env?.DB);

    const updated = await materiaService.update(id, body);
    if (!updated) {
      return c.json({ success: false, error: 'Materia no encontrada para actualizar' }, 404);
    }

    return c.json({ success: true, data: updated, message: 'Materia actualizada exitosamente' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al actualizar la materia' }, 500);
  }
});

// DELETE /materias/:id - Eliminar una materia
materias.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const materiaService = new MateriaService(c.env?.DB);

    const deleted = await materiaService.delete(id);
    if (!deleted) {
      return c.json({ success: false, error: 'Materia no encontrada para eliminar' }, 404);
    }

    return c.json({ success: true, message: 'Materia eliminada exitosamente' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Error al eliminar la materia' }, 500);
  }
});

export default materias;
