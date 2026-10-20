-- ========================================================
-- SEED: Usuarios iniciales del sistema S3A
-- Generado: 2026-10-19
-- ========================================================
-- Contraseñas hasheadas con PBKDF2-SHA256, 100.000 iter.
-- Todos los usuarios deben cambiar su contraseña al
-- primer ingreso (debe_cambiar_password = 1).
-- Contraseña temporal de todos: Ufps@Temporal2026
-- ========================================================

-- SUPER_ADMIN: Marco Antonio Adarme Jaimes
INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at)
  VALUES (
    'usr-001',
    'Marco Antonio Adarme Jaimes',
    'madarme@ufps.edu.co',
    'pbkdf2:100000:a735053f8db9e920c6ebf0fb76af3d17:7a17588104427b9d361f21d20847284e43bfa6ebf1594d7afcba5bf0585026ae',
    'SUPER_ADMIN',
    1,
    '2026-10-19T20:07:00.000Z',
    '2026-10-19T20:07:00.000Z'
  );

-- AMIGO_ACADEMICO: Jesus Daniel Lozano Erazo
INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at)
  VALUES (
    'usr-002',
    'Jesus Daniel Lozano Erazo',
    'jesusdanielle@ufps.edu.co',
    'pbkdf2:100000:f2368e28072075115221c42bdebf85cf:ba8caf72a85ee65483082688a8ce21ecc431a3dc3be0ab535d2b5ccdd0be3d94',
    'AMIGO_ACADEMICO',
    1,
    '2026-10-19T20:07:00.000Z',
    '2026-10-19T20:07:00.000Z'
  );

-- AMIGO_ACADEMICO: Laura Isabella Correa Nieto
INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at)
  VALUES (
    'usr-003',
    'Laura Isabella Correa Nieto',
    'lauraisabellacn@ufps.edu.co',
    'pbkdf2:100000:624d0cabb1a25cf2aacbab45dd5f062f:8d0e982fb6e91ff4e9af529e3bd220b3758ff1ab063cb6feb08aa25acd9fe71f',
    'AMIGO_ACADEMICO',
    1,
    '2026-10-19T20:07:00.000Z',
    '2026-10-19T20:07:00.000Z'
  );

-- ========================================================
-- SEED: Materias del programa Ingeniería de Sistemas
-- ========================================================

INSERT INTO materias (id, codigo, nombre, created_at, updated_at) VALUES
  ('mat-001', '1154101', 'Cálculo Diferencial',                   '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-002', '1154201', 'Cálculo Integral',                      '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-003', '1154301', 'Cálculo Vectorial',                     '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-004', '1154202', 'Álgebra Lineal',                        '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-005', '1154305', 'Matemáticas Discretas',                 '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-006', '1154203', 'Física Mecánica',                       '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-007', '1154303', 'Física Electromagnética',               '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-008', '1154104', 'Fundamentos de Programación',           '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-009', '1154204', 'Programación Orientada a Objetos',      '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-010', '1154304', 'Estructura de Datos',                   '2026-10-20T19:12:00.000Z', '2026-10-20T19:12:00.000Z'),
  ('mat-011', '1154105', 'Introducción a la Ingeniería de Sistemas','2026-10-20T19:12:00.000Z','2026-10-20T19:12:00.000Z');
