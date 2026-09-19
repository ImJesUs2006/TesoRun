# TESORUN

Tesorería gamificada para el grupo universitario. Lleva el control de cuotas semanales ($20), deudas, rachas, morosos y gastos con una estética **neobrutalista** y sin dramas.

## Características

- **Página pública** (`/`): podio de héroes, carrusel "se busca" (deslizable), lista negra, clase completa, muro de gastos y tablón de comentarios con máximo 3 al día por persona.
- **Deuda calculada en vivo**: se deriva de la fecha de inicio de recolección y las semanas pagadas; cambias la fecha y todo se recalcula solo. La semana en curso también cuenta (fecha "hoy" = 1 semana de deuda).
- **Muro de gastos** público y **reporte Excel** descargable (texto plano con colores, sin fotos).
- **Panel de tesorero** (`/admin-teso`): alta/baja de alumnos, cobrar +$20 (bloqueado si no hay deuda), deshacer pagos, editar fecha de inicio, gestionar anuncios y comentarios, foto por archivo (Base64).
- **Login estilizado** con PIN (contraseña), compatible con Basic Auth.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + Framer Motion + lucide-react + canvas-confetti
- Prisma 6 + PostgreSQL
- exceljs

## Requisitos

- Node.js **18.18+** o **20+** (probado con v20+)
- PostgreSQL **14+** (local, Docker o remoto)
- npm (viene con Node)

## Instalación paso a paso

### 1. Clonar el proyecto

```bash
git clone <repositorio> tesorun
cd tesorun
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el ejemplo y edítalo:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Edita `.env`:

```env
# Conexión a PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/tesorun?schema=public"

# PIN del tesorero (el que se pide en el login del panel)
ADMIN_PASSWORD="elige-un-pin-secreto"

# Meta mensual de recaudación en pesos
META_MENSUAL_PESOS=2000
```

Crea la base de datos si no existe (PSQL):

```sql
CREATE DATABASE tesorun;
```

### 4. Preparar la base de datos (migraciones)

```bash
# Aplica todas las migraciones (recomendado)
npx prisma migrate deploy
```

> En desarrollo también puedes usar `npm run db:migrate` (crea migraciones nuevas interactivamente).

### 5. Cargar datos de demostración (opcional)

```bash
npm run db:seed
```

Crea 6 alumnos, pagos, gastos, anuncios y comentarios de ejemplo.

### 6. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Acceso al panel del tesorero

1. Ve a [http://localhost:3000/admin-teso](http://localhost:3000/admin-teso).
2. Te pedirá el **PIN** (el valor de `ADMIN_PASSWORD`). El nombre es opcional.
3. Listo: cobrar +$20, dar de alta alumnos, editar la fecha de inicio, etc.

> Compatible también con Basic Auth: `curl -u "cualquier:TU_PIN" http://localhost:3000/admin-teso`.

## Comandos útiles

| Comando                | Qué hace                                            |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo                              |
| `npm run build`        | Compilación de producción                           |
| `npm start`            | Servir la build de producción (tras `build`)        |
| `npm run typecheck`    | Verificación de tipos (TypeScript)                  |
| `npm run db:migrate`   | Crear/aplicar migraciones de Prisma                 |
| `npm run db:seed`      | Datos de demostración                               |
| `npm run db:studio`    | Interfaz visual de la base de datos                 |

## Despliegue en producción (resumen)

1. `npm run build`
2. Servir con `npm start` (puerto por defecto 3000). Reconoce `PORT` si quieres otro: `npm start -- -p 8080`.
3. Aplica migraciones una sola vez: `npx prisma migrate deploy`.
4. Configura en el servidor las variables de entorno del paso 3.

## Seguridad y notas

- El PIN vive en el servidor (`ADMIN_PASSWORD`); el login firma una cookie HTTP-only. Cambiar el PIN invalida todas las sesiones.
- Sin `ADMIN_PASSWORD` configurado, el panel responde 500 y nadie entra *(fail-closed)*.
- Los comentarios públicos se purgan solos al cumplir 21 días.
- El historial de pagos se conserva aunque elimines a un alumno.

## Estructura

```
app/
  page.tsx          # Cancha pública
  admin-teso/       # Panel del tesorero (+ server actions)
  login/            # Página de login
  api/reporte-excel # Genera el .xlsx
  api/logout        # Cierra sesión
components/         # UI neobrutal (público + admin)
lib/                # Lógica (deuda, badges, auth, prisma)
prisma/             # Esquema, migraciones y seed
```