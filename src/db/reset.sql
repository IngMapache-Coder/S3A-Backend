-- ========================================================
-- RESET: Limpia completamente la base de datos S3A
-- ========================================================
-- ⚠️  ADVERTENCIA: Esto elimina TODOS los datos.
--     Úsalo solo en desarrollo. Nunca en producción.
-- ========================================================
-- El orden importa: primero las tablas con FK dependientes,
-- luego las tablas referenciadas.
-- ========================================================

-- 1. Borrar índices
DROP INDEX IF EXISTS idx_asistencias_eventos_fecha;
DROP INDEX IF EXISTS idx_asistencias_eventos_evento;
DROP INDEX IF EXISTS idx_eventos_estado;
DROP INDEX IF EXISTS idx_eventos_codigo;
DROP INDEX IF EXISTS idx_asistencias_fecha;
DROP INDEX IF EXISTS idx_asistencias_materia;
DROP INDEX IF EXISTS idx_asistencias_sesion;
DROP INDEX IF EXISTS idx_sesiones_estado;
DROP INDEX IF EXISTS idx_sesiones_codigo;

-- 2. Borrar tablas (orden: hijos antes que padres)
DROP TABLE IF EXISTS asistencias_eventos;
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS asistencias;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS materias;

