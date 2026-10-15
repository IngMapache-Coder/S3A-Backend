-- ========================================================
-- SEED: Usuarios de prueba para S3A
-- Generado: 2026-10-08T14:13:53.586Z
-- ========================================================
-- NOTA: Las contraseñas están hasheadas con PBKDF2-SHA256
--       100.000 iteraciones, igual que passwordHash.ts
-- ========================================================

-- Usuario: Super Admin | Rol: SUPER_ADMIN
-- Correo: admin@ufps.edu.co  |  Contraseña: Admin2025!
INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at)
  VALUES (
    'usr-seed-001',
    'Super Admin',
    'admin@ufps.edu.co',
    'pbkdf2:100000:2c584d6bd25314bea6699701a8a5691e:efd402a5eb3b768bc688b1dba0b1899663ba02578787efb38b3c569cf3490ffd',
    'SUPER_ADMIN',
    0,
    '2026-10-08T14:13:53.626Z',
    '2026-10-08T14:13:53.626Z'
  );

-- Usuario: Director de Programa | Rol: DIRECTOR
-- Correo: director@ufps.edu.co  |  Contraseña: Director2025!
INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at)
  VALUES (
    'usr-seed-002',
    'Director de Programa',
    'director@ufps.edu.co',
    'pbkdf2:100000:4d9a4dec3002eaae4cd60194adfcc7b4:182c96b3330f40e3eddde008b97c1c1d22678f47d341b92ededee4fb4dc3f861',
    'DIRECTOR',
    0,
    '2026-10-08T14:13:53.654Z',
    '2026-10-08T14:13:53.654Z'
  );

-- Usuario: Amigo Académico Prueba | Rol: AMIGO_ACADEMICO
-- Correo: amigo@ufps.edu.co  |  Contraseña: Amigo2025!
INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at)
  VALUES (
    'usr-seed-003',
    'Amigo Académico Prueba',
    'amigo@ufps.edu.co',
    'pbkdf2:100000:3f3e90d57d65406eff18d4d92e6188ad:dc78f5708ea526062707e420969bdd6e67200b50f49ca58fd6a3e2aaf5668fd0',
    'AMIGO_ACADEMICO',
    0,
    '2026-10-08T14:13:53.689Z',
    '2026-10-08T14:13:53.689Z'
  );

-- ========================================================
-- SEED: Materias de prueba
-- ========================================================

INSERT INTO materias (id, codigo, nombre, created_at, updated_at) VALUES
  ('mat-seed-001', 'MAT-101', 'Cálculo Diferencial',             '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-002', 'MAT-102', 'Cálculo Integral',                '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-003', 'MAT-201', 'Álgebra Lineal',                  '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-004', 'MAT-202', 'Cálculo Vectorial',               '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-005', 'MAT-301', 'Ecuaciones Diferenciales',        '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-006', 'SIS-101', 'Fundamentos de Programación',     '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-007', 'SIS-102', 'Programación Orientada a Objetos','2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-008', 'SIS-201', 'Estructuras de Datos',            '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-009', 'SIS-202', 'Bases de Datos I',                '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-010', 'SIS-203', 'Bases de Datos II',               '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-011', 'SIS-301', 'Análisis de Algoritmos',          '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-012', 'SIS-302', 'Ingeniería de Software I',        '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-013', 'SIS-303', 'Ingeniería de Software II',       '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-014', 'SIS-401', 'Redes de Computadores',           '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-015', 'SIS-402', 'Sistemas Operativos',             '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-016', 'FIS-101', 'Física Mecánica',                 '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-017', 'FIS-102', 'Física Eléctrica',                '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-018', 'HUM-101', 'Ética Profesional',               '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-019', 'EST-101', 'Probabilidad y Estadística',      '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z'),
  ('mat-seed-020', 'SIS-501', 'Proyecto de Grado',               '2026-10-08T14:13:54.000Z', '2026-10-08T14:13:54.000Z');
