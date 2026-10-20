CREATE TABLE IF NOT EXISTS materias (
  id         TEXT PRIMARY KEY,
  codigo     TEXT NOT NULL UNIQUE,
  nombre     TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id                    TEXT PRIMARY KEY,
  nombre                TEXT NOT NULL,
  correo                TEXT NOT NULL UNIQUE,
  password              TEXT NOT NULL,
  tipo                  TEXT NOT NULL CHECK(tipo IN ('SUPER_ADMIN', 'DIRECTOR', 'AMIGO_ACADEMICO')),
  debe_cambiar_password INTEGER NOT NULL DEFAULT 1,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sesiones (
  id            TEXT PRIMARY KEY,
  codigo        TEXT NOT NULL UNIQUE,
  creada_por_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  estado        TEXT NOT NULL DEFAULT 'activa'
                  CHECK(estado IN ('activa', 'cerrada')),
  fecha_inicio  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre  DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sesiones_codigo ON sesiones(codigo);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON sesiones(estado);

CREATE TABLE IF NOT EXISTS asistencias (
  id                 TEXT PRIMARY KEY,
  sesion_id          TEXT NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  materia_id         TEXT NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
  motivo             TEXT NOT NULL,
  nombre_estudiante  TEXT NOT NULL,
  codigo_estudiante  TEXT NOT NULL,
  firma_url          TEXT NOT NULL,
  fecha_hora         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_asistencias_sesion  ON asistencias(sesion_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_materia ON asistencias(materia_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha   ON asistencias(fecha_hora);

