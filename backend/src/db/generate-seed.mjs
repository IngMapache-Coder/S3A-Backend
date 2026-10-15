/**
 * Script para generar el SQL de seed con usuarios de prueba.
 * Usa la misma lógica PBKDF2 que passwordHash.ts
 *
 * Ejecución: node src/db/generate-seed.mjs
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const ALGORITHM = 'SHA-256';

function bufferToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(plain) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: ALGORITHM },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return `pbkdf2:${ITERATIONS}:${bufferToHex(salt.buffer)}:${bufferToHex(derivedBits)}`;
}

const usuarios = [
  {
    id: 'usr-seed-001',
    nombre: 'Super Admin',
    correo: 'admin@s3a.edu.co',
    password: 'Admin2025!',
    tipo: 'SUPER_ADMIN',
    debe_cambiar_password: 0,
  },
  {
    id: 'usr-seed-002',
    nombre: 'Director de Programa',
    correo: 'director@s3a.edu.co',
    password: 'Director2025!',
    tipo: 'DIRECTOR',
    debe_cambiar_password: 0,
  },
  {
    id: 'usr-seed-003',
    nombre: 'Amigo Académico Prueba',
    correo: 'amigo@s3a.edu.co',
    password: 'Amigo2025!',
    tipo: 'AMIGO_ACADEMICO',
    debe_cambiar_password: 0,
  },
];

console.log('-- ========================================================');
console.log('-- SEED: Usuarios de prueba para S3A');
console.log('-- Generado:', new Date().toISOString());
console.log('-- ========================================================');
console.log('');

for (const u of usuarios) {
  const hash = await hashPassword(u.password);
  const now = new Date().toISOString();
  console.log(`-- Usuario: ${u.nombre} | Rol: ${u.tipo}`);
  console.log(`-- Correo: ${u.correo}  |  Contraseña: ${u.password}`);
  console.log(
    `INSERT INTO usuarios (id, nombre, correo, password, tipo, debe_cambiar_password, created_at, updated_at) VALUES ('${u.id}', '${u.nombre}', '${u.correo}', '${hash}', '${u.tipo}', ${u.debe_cambiar_password}, '${now}', '${now}');`
  );
  console.log('');
}

