# S3A Backend — API REST del Sistema de Asistencia Digital "Amigo Académico"

Servicio backend serverless construido con **Hono** y **TypeScript**, desplegado en **Cloudflare Workers**. Provee la API REST para el control, auditoría y registro de asistencias de las tutorías universitarias del programa **Amigo Académico** (UFPS), gestionando la autenticación, sesiones compartidas de sala, catálogo de materias, base de datos relacional (Cloudflare D1) y almacenamiento de firmas manuscritas digitales (Cloudflare R2).

---

## 🛠️ Stack Tecnológico

- **Runtime:** [Cloudflare Workers](https://workers.cloudflare.com/) (Edge computing serverless impulsado por V8 / `workerd`).
- **Framework Web:** [Hono v4](https://hono.dev/) (Framework ligero y de alto rendimiento optimizado para Workers).
- **Base de Datos:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (Base de datos relacional serverless basada en SQLite).
- **Almacenamiento de Objetos:** [Cloudflare R2](https://developers.cloudflare.com/r2/) (Storage compatible con S3 para guardar las firmas digitales capturadas en pantalla).
- **Seguridad & Criptografía:** Web Crypto API con hashing de contraseñas mediante **PBKDF2-SHA256** (100.000 iteraciones + salt aleatorio) y emisión/verificación de tokens **JWT**.
- **Lenguaje:** TypeScript (con chequeo estricto de tipos).
- **Gestor de Paquetes:** `pnpm`.

---

## 📁 Estructura del Repositorio

```text
S3A-Backend/
├── src/
│   ├── index.ts                # Entrada principal del Worker, configuración CORS y montaje de rutas
│   ├── db/
│   │   ├── schema.sql          # Estructura DDL de tablas e índices D1
│   │   ├── seed.sql            # Datos iniciales (usuarios semilla y materias institucionales)
│   │   └── reset.sql           # Limpieza y reseteo completo de la base de datos
│   ├── middlewares/
│   │   └── auth.ts             # Validación de JWT y control de acceso basado en roles
│   ├── routes/
│   │   ├── auth.ts             # Rutas de autenticación y cambio obligatorio de contraseña
│   │   ├── usuarios.ts         # Aprovisionamiento y administración de directores y tutores
│   │   ├── materias.ts         # CRUD del catálogo de asignaturas
│   │   ├── sesiones.ts         # Gestión del ciclo de vida de la sesión única de sala
│   │   ├── asistencias.ts      # Registro y consulta de asistencias
│   │   ├── firmas.ts           # Entrega de imágenes de firmas digitales desde R2
│   │   └── reportes.ts         # Consulta filtrada para exportación institucional
│   ├── services/
│   │   ├── usuarioService.ts   # Lógica de usuarios y control de contraseñas
│   │   ├── materiaService.ts   # Lógica de asignaturas
│   │   ├── sesionService.ts    # Lógica de códigos de sala y estados de sesión
│   │   └── firmaService.ts     # Procesamiento base64, guardado en R2 y registro en D1
│   ├── types/
│   │   ├── env.ts              # Tipado de Bindings (D1, R2, JWT_SECRET)
│   │   └── index.ts            # DTOs, entidades y modelos de datos
│   └── utils/
│       └── passwordHash.ts     # Utilidades criptográficas PBKDF2 y comparación de contraseñas
├── tsconfig.json               # Configuración del compilador TypeScript
├── wrangler.jsonc              # Configuración de bindings, variables y despliegue en Cloudflare
└── package.json                # Scripts y dependencias del backend
```

---

## 🔒 Modelo de Roles y Permisos

| Rol | Alcance y Capacidades |
|---|---|
| **SUPER_ADMIN** | Configuración general del sistema, aprovisionamiento de Directores de Programa y Amigos Académicos. |
| **DIRECTOR** | Aprovisionamiento y administración de Amigos Académicos, gestión del catálogo de materias y auditoría/exportación de asistencias. |
| **AMIGO_ACADEMICO** | Apertura/cierre de la sesión única compartida de sala, proyección del código QR y monitoreo de asistencias en tiempo real. |
| **ESTUDIANTE** | Acceso público sin credenciales exclusivamente para registrar su asistencia y firma mediante el código QR de sala. |

---

## 📡 Endpoints de la API

### Autenticación (`/auth`)
- `POST /auth/login`: Autentica un usuario institucional con correo y contraseña. Retorna token JWT y perfil.
- `GET /auth/me`: Retorna los datos del usuario autenticado actual a partir del Bearer token.
- `POST /auth/cambiar-password`: Permite actualizar la contraseña obligatoria temporal o voluntaria.

### Usuarios (`/usuarios`)
- `GET /usuarios`: Lista todos los usuarios registrados (requiere `SUPER_ADMIN` o `DIRECTOR`).
- `POST /usuarios`: Crea un nuevo usuario institucional (valida jerarquía de roles).
- `PATCH /usuarios/:id`: Actualiza datos o restablece el estado de un usuario.

### Materias (`/materias`)
- `GET /materias`: Obtiene el catálogo completo de materias activas (acceso público para el selector de asistencia).
- `POST /materias`: Registra una nueva materia en el catálogo (requiere rol de gestión).
- `PUT /materias/:id`: Actualiza el código o nombre de una materia existente.
- `DELETE /materias/:id`: Elimina una materia del catálogo.

### Sesiones de Sala (`/sesiones`)
- `GET /sesiones/activa`: Consulta la sesión activa de la sala compartida (o retorna `{ sesion: null }`).
- `POST /sesiones/iniciar`: Inicia la sesión compartida de la sala y genera el código único de 4 caracteres.
- `POST /sesiones/cerrar`: Finaliza la sesión activa de la sala.

### Asistencias y Firmas (`/asistencias` & `/firmas`)
- `POST /asistencias`: Registra la asistencia del alumno, decodifica y persiste la firma en Cloudflare R2 y guarda la relación en D1. (Ruta pública para estudiantes con QR).
- `GET /asistencias/sesion/:codigo`: Consulta en tiempo real las asistencias registradas en una sesión activa.
- `GET /firmas/:asistenciaId`: Entrega el binario de la imagen de la firma almacenada en el bucket R2.

### Reportes (`/reportes`)
- `GET /reportes/asistencias`: Consulta con filtros por rango de fechas, materia o sesión para generación y auditoría de planillas.

---

## ⚙️ Configuración y Variables de Entorno

La configuración del worker y sus recursos se encuentra en `wrangler.jsonc`:

```jsonc
{
  "name": "backend",
  "main": "src/index.ts",
  "compatibility_date": "2026-09-26",
  "vars": {
    "JWT_SECRET": "<clave-secreta-para-firma-de-tokens>"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "db-sd3-d1",
      "database_id": "<d1-database-uuid>"
    }
  ],
  "r2_buckets": [
    {
      "binding": "FIRMAS_BUCKET",
      "bucket_name": "db-sd3-r2"
    }
  ]
}
```

---

## 💻 Comandos de Desarrollo y Base de Datos

### Instalación de dependencias
```bash
pnpm install
```

### Ejecución en servidor local
Inicia el entorno de desarrollo local con emulación de Cloudflare Workers, D1 y R2 en el puerto `8787`:
```bash
pnpm run dev
# o
pnpm start
```

### Verificación de tipos TypeScript
```bash
pnpm run typecheck
```

### Gestión de Base de Datos D1

| Comando | Acción |
|---|---|
| `pnpm run db:migrate:local` | Aplica el esquema (`schema.sql`) en el entorno SQLite local. |
| `pnpm run db:migrate:remote` | Aplica el esquema (`schema.sql`) en la base de datos D1 remota en Cloudflare. |
| `pnpm run db:seed:local` | Inserta usuarios y catálogo inicial (`seed.sql`) en local. |
| `pnpm run db:seed:remote` | Inserta usuarios y catálogo inicial (`seed.sql`) en remoto. |
| `pnpm run db:reset:local` | Borra tablas e índices (`reset.sql`) en local. |
| `pnpm run db:reset:remote` | Borra tablas e índices (`reset.sql`) en producción. |

---

## 🚀 Despliegue en Cloudflare Workers

### 1. Despliegue Automático Continuo (CI/CD con GitHub Actions)
Cada vez que se hace `git push` o merge hacia la rama `main`, el workflow [deploy.yml](.github/workflows/deploy.yml) compila, valida los tipos y despliega automáticamente la API en Cloudflare Workers.

Para que el workflow funcione, configura estos **Secrets** en tu repositorio de GitHub (**Settings > Secrets and variables > Actions > Repository secrets**):

| Secret | Descripción |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token de API de Cloudflare con permisos de edición para Cloudflare Workers, D1 y R2. |
| `CLOUDFLARE_ACCOUNT_ID` | ID de tu cuenta de Cloudflare (visible en la URL o barra lateral del Dashboard). |

### 2. Despliegue Manual desde la Terminal
```bash
pnpm run deploy
```
