-- ============================================================
-- SCHEMA S3A — Amigo Académico
-- Modelo: sesión compartida de sala + asistencias de estudiantes
-- ============================================================

-- ============================================================
-- TABLA: materias
-- Catálogo de materias universitarias
-- ============================================================
CREATE TABLE IF NOT EXISTS materias (
  id         TEXT PRIMARY KEY,
  codigo     TEXT NOT NULL UNIQUE,
  nombre     TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: usuarios
-- Roles: SUPER_ADMIN | DIRECTOR | AMIGO_ACADEMICO
-- NO existe autoregistro. Las cuentas las crea un Director o Super Admin.
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL,
  correo     TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,   -- hash bcrypt, NUNCA texto plano en producción
  tipo       TEXT NOT NULL CHECK(tipo IN ('SUPER_ADMIN', 'DIRECTOR', 'AMIGO_ACADEMICO')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: sesiones
-- Una sola sesión activa compartida para toda la sala.
-- Puede haber varios Amigos Académicos trabajando bajo la MISMA sesión.
-- ============================================================
CREATE TABLE IF NOT EXISTS sesiones (
  id            TEXT PRIMARY KEY,
  codigo        TEXT NOT NULL UNIQUE,  -- código corto legible (ej: "SALA-01") que genera el QR
  creada_por_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  estado        TEXT NOT NULL DEFAULT 'activa'
                  CHECK(estado IN ('activa', 'cerrada')),
  fecha_inicio  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre  DATETIME,              -- NULL mientras esté activa
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sesiones_codigo ON sesiones(codigo);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON sesiones(estado);

-- ============================================================
-- TABLA: asistencias
-- Registro de cada estudiante que firma en la sesión.
-- NO tiene amigo_academico_id: la atención es institucional de sala.
-- ============================================================
CREATE TABLE IF NOT EXISTS asistencias (
  id                 TEXT PRIMARY KEY,
  sesion_id          TEXT NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  materia_id         TEXT NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
  motivo             TEXT NOT NULL,   -- duda, parcial, taller, etc.
  nombre_estudiante  TEXT NOT NULL,
  codigo_estudiante  TEXT NOT NULL,   -- código institucional universitario
  firma_url          TEXT NOT NULL,   -- ruta del objeto en Cloudflare R2
  fecha_hora         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_asistencias_sesion  ON asistencias(sesion_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_materia ON asistencias(materia_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha   ON asistencias(fecha_hora);

-- ============================================================
-- DATOS SEMILLA (desarrollo / pruebas)
-- ⚠️  En producción las contraseñas DEBEN ser hashes bcrypt.
--     Estos valores en texto plano son SOLO para pruebas locales.
-- ============================================================
INSERT OR IGNORE INTO materias (id, codigo, nombre) VALUES
  ('mat-1', 'MAT-101', 'Cálculo Diferencial'),
  ('mat-2', 'INF-201', 'Estructuras de Datos'),
  ('mat-3', 'FIS-102', 'Física Mecánica'),
  ('mat-4', 'EST-301', 'Estadística Aplicada'),
  ('mat-5', 'ALG-102', 'Álgebra Lineal');

INSERT OR IGNORE INTO usuarios (id, nombre, correo, password, tipo) VALUES
  ('usr-1', 'Super Administrador', 'admin@ufps.edu.co',   'admin123',    'SUPER_ADMIN'),
  ('usr-2', 'Carlos Pérez',        'cperez@ufps.edu.co',  'director123', 'DIRECTOR'),
  ('usr-3', 'Ana Gómez',           'agomez@ufps.edu.co',  'amigo123',    'AMIGO_ACADEMICO');
