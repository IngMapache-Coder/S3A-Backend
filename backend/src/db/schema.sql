-- Tabla Materias (Solo código y nombre)
CREATE TABLE IF NOT EXISTS materias (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Usuarios (Nombre, correo, tipo/rol, contraseña)
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  tipo TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Semilla de datos de prueba
INSERT OR IGNORE INTO materias (id, codigo, nombre) VALUES
('mat-1', 'MAT-101', 'Cálculo Diferencial'),
('mat-2', 'INF-201', 'Estructuras de Datos'),
('mat-3', 'FIS-102', 'Física Mecánica');

INSERT OR IGNORE INTO usuarios (id, nombre, correo, password, tipo) VALUES
('usr-1', 'Super Administrador', 'admin@s3a.edu.co', 'admin123', 'SUPER_ADMIN'),
('usr-2', 'Carlos Pérez', 'cperez@s3a.edu.co', 'director123', 'DIRECTOR'),
('usr-3', 'Ana Gómez', 'agomez@s3a.edu.co', 'amigo123', 'AMIGO_ACADEMICO');
