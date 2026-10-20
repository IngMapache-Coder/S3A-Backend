# S3A — Sistema de Asistencia Digital "Amigo Académico"

Plataforma web para digitalizar, controlar y auditar la asistencia de estudiantes a las tutorías y asesorías universitarias del programa **Amigo Académico** (UFPS).

Sustituye por completo las planillas en papel por un flujo dinámico basado en un **único código QR de sala** y **firma digital manuscrita en pantalla (Signature Pad)** desde el celular del estudiante.

---

## 🚀 Despliegue en Cloudflare

### 1. Frontend (Cloudflare Pages)

El frontend está optimizado para desplegarse como Single Page Application (SPA) en **Cloudflare Pages**:

- **Reglas de enrutamiento:** Archivo `public/_redirects` (`/* /index.html 200`) para evitar errores 404 en rutas profundas.
- **Cabeceras de seguridad:** Archivo `public/_headers` con directivas de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) y caché inmutable de assets.
- **Configuración en el panel de Cloudflare Pages:**
  - **Framework preset:** `Vite`
  - **Root directory:** `/` (o `/frontend` si se enlaza directamente esa subcarpeta)
  - **Build command:** `pnpm --filter frontend build` (o `pnpm run build` si el root directory es `frontend`)
  - **Build output directory:** `frontend/dist` (o `dist` si el root directory es `frontend`)
  - **Variables de entorno (Production & Preview):**
    - `VITE_API_URL`: URL del backend en Cloudflare Workers (ej: `https://backend-s3a.tu-subdominio.workers.dev`). Si se deja vacío, consumirá rutas relativas (ideal para proxy o desarrollo local).

### 2. Backend (Cloudflare Workers)

El backend corre sobre Cloudflare Workers con base de datos Cloudflare D1 y almacenamiento de firmas en Cloudflare R2:

```bash
cd backend
# Ejecutar migraciones en local o remoto
pnpm run db:migrate:local
# pnpm run db:migrate:remote

# Desplegar worker
pnpm run deploy
```

---

## 🛠️ Características Principales Implementadas

1. **Exportación a Excel (.xlsx) con Firmas Incrustadas:**
   - La exportación genera archivos nativos `.xlsx` incorporando la imagen real de la firma manuscrita digital dentro de cada fila correspondiente en la columna de firmas, con celdas dimensionadas adecuadamente y estilos institucionales UFPS.
2. **Listas de Asistencia Completas:**
   - Visualización y exportación con las 8 columnas requeridas:
     `N° Registro`, `Código Materia`, `Nombre Materia`, `Nombre y Apellido Estudiante`, `Código Estudiante`, `Temas / Motivo`, `Fecha y Hora (Colombia)`, `Firma`.
3. **Gestión de Cuentas por Super Admin y Directores:**
   - El **Super Administrador** puede aprovisionar tanto cuentas de **Directores de Programa** como de **Amigos Académicos**, con filtros por rol y estado.
   - El **Director de Programa** administra exclusivamente las cuentas de **Amigos Académicos**.
4. **Actualización Obligatoria de Contraseña:**
   - Al iniciar sesión con credenciales temporales como Amigo Académico o Director, el sistema intercepta el acceso y exige el cambio de contraseña antes de habilitar el uso de la plataforma.
5. **Firmas en Tinta Negra:**
   - El Signature Pad del estudiante dibuja y captura las firmas exclusivamente en color negro (`#000000`) para máxima fidelidad institucional.

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Iniciar backend (Worker local en puerto 8787)
pnpm run dev:backend

# Iniciar frontend (Vite en puerto 3000)
pnpm run dev:frontend

# Construcción de prueba para producción
pnpm run build
```
