# Development Guide -- Modo Playa API

---

## 🔧 Requisitos

- Node.js 22+
- MongoDB
- Cuenta en Resend (para envío de emails)
- Bucket en Cloudflare R2 (S3 compatible) para media (imágenes)

---

## 🔐 Variables de entorno

Crear archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

En PowerShell (Windows):

```powershell
Copy-Item .env.example .env
```

Completar especialmente:

- MongoDB / JWT / Resend
- Variables de Cloudflare R2 (`R2_*`)
- `MEDIA_PUBLIC_BASE_URL` (dominio público/custom domain o URL pública de R2)
- `SUPERADMIN_OWNER_ID` (opcional, para habilitar rol `SUPERADMIN` por ownerId)

Ejemplo mínimo:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/modo-playa
SECRET_KEY=your_secret_key
BCRYPT_ROUNDS=12
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=your_email
CORS_ORIGIN=http://localhost:4200

R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_BUCKET=modo-playa-media
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_REGION=auto
R2_SIGNED_URL_EXPIRES_SECONDS=600
MEDIA_PUBLIC_BASE_URL=https://media.example.com
```

---

## ▶️ Ejecutar la API

```bash
npm install
npm run start:dev
```

Disponible en:

http://localhost:3000/api

Notas:

- `GET /api/admin/dashboard/summary` expone métricas y alertas operativas para el owner autenticado.
- `recentActivity` dentro del dashboard usa `source=timestamps` para indicar que el bloque se deriva desde `createdAt/updatedAt`; no es una auditoría persistida.
- `GET /api/destinations` y `GET /api/destinations/:id/context` son endpoints públicos de destinos.
- `POST /api/admin/lodging-image-uploads/upload-url` y `POST /api/admin/lodging-image-uploads/confirm` resuelven imágenes iniciales antes de crear el lodging.
- `POST /api/admin/lodgings` puede asociar `pendingImageIds` + `uploadSessionId` en la misma operación de alta.
- `POST /api/admin/lodgings/:lodgingId/images/upload-url` y `POST /api/admin/lodgings/:lodgingId/images/confirm` gestionan imágenes de lodgings ya existentes.
- `POST /api/auth/me/profile-image/upload-url` y `POST /api/auth/me/profile-image/confirm` gestionan la imagen propia del usuario autenticado y solo aplican a `OWNER`.
- `GET /api/admin/media/health` permite validar conexión con R2 (requiere JWT).
- El flujo canonico de media es `signed upload + confirmacion backend`.
- Los uploads firmados browser requieren CORS habilitado en el bucket de R2 para los origenes reales de `modo-playa-admin` y `modo-playa-app`.
- El preflight minimo del bucket debe aceptar `OPTIONS, PUT`, permitir `Content-Type` y exponer `ETag`.
- La validación global rechaza campos no definidos en DTOs (`whitelist + forbidNonWhitelisted`).
  Ejemplo: en `POST /api/admin/contacts` no enviar `id` en el body.
- Los errores de contrato y dominio exponen `code` estables y explícitos. Para consumidores, usar `code` como discriminador principal y no solo `message`.

---

## 🧪 Tests

```bash
npm run test
```

Todos los módulos poseen tests unitarios.

Lint:

```bash
npm run lint
```

---

## 🏗️ Consideraciones

- Arquitectura modular
- Multi-tenant con ownerId
- API stateless
- Media en Cloudflare R2 (S3 compatible) con normalización de imágenes en backend
- Lista para dockerización y despliegue
