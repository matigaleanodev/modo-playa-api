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

Swagger UI:

http://localhost:3000/docs

OpenAPI JSON:

http://localhost:3000/openapi.json

Notas:

- `GET /api/admin/dashboard/summary` expone métricas y alertas operativas para el owner autenticado.
- `recentActivity` dentro del dashboard usa `source=timestamps` para indicar que el bloque se deriva desde `createdAt/updatedAt`; no es una auditoría persistida.
- `GET /api/destinations` y `GET /api/destinations/:id/context` son endpoints públicos de destinos.
- `GET /api/destinations/:id/context` expone `pointsOfInterest` curados con links salientes a Google Maps; no existen endpoints publicos adicionales para este feature.
- `POST /api/admin/lodging-image-uploads` recibe la imagen inicial por multipart, la sube a R2 desde backend y la deja lista antes de crear el lodging.
- `POST /api/admin/lodgings` puede asociar `pendingImageIds` + `uploadSessionId` en la misma operación de alta.
- `POST /api/admin/lodgings/:lodgingId/images` gestiona altas de imágenes de lodgings ya existentes por multipart backend-only.
- `POST /api/auth/me/profile-image` gestiona la imagen propia del usuario autenticado por multipart backend-only y solo aplica a `OWNER`.
- `GET /api/admin/media/health` permite validar conexión con R2 (requiere JWT).
- El flujo canonico de media es `multipart backend-only`: el frontend entrega archivos a la API y solo el backend interactúa con R2.
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

## 🚀 Contrato Operativo por Ambiente

Estado actual:

- la operacion vigente ya esta orientada a produccion
- `Mongo`, `R2` y `Resend` son dependencias runtime reales, no integraciones opcionales para este backend

MongoDB:

- `MONGO_URI` es obligatorio en todos los ambientes donde la API deba resolver auth, usuarios, contacts, lodgings y dashboard
- la base de datos es la fuente de verdad operacional del producto
- cualquier deploy invalido sin conectividad a Mongo debe considerarse bloqueante

Cloudflare R2:

- `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_REGION` y `MEDIA_PUBLIC_BASE_URL` forman el contrato minimo para media
- el flujo canonico es backend-only multipart: el cliente sube archivos a la API y solo el backend interactua con R2
- si R2 no esta disponible, deben considerarse degradados los flujos de imagen de lodging y profile image

Resend:

- `RESEND_API_KEY` y `RESEND_FROM_EMAIL` forman el contrato minimo para emails transaccionales
- auth depende de Resend para activacion y recuperacion de password
- si Resend no esta disponible, el deploy puede responder para lectura y auth ya iniciada, pero los flujos que requieren envio de email quedan funcionalmente degradados

---

## 🔎 Smoke Checks Post-Deploy

Minimos recomendados despues de cada deploy a produccion:

1. `GET /api/health` debe responder `200`
2. `GET /docs` debe responder y publicar Swagger UI
3. `GET /openapi.json` debe responder y reflejar el contrato publico vigente
4. `GET /api/destinations` debe responder `200`
5. `GET /api/lodgings` debe responder `200`
6. `GET /api/admin/media/health` con JWT valido debe confirmar conectividad efectiva con R2
7. ejecutar un flujo controlado de auth que requiera email solo cuando el deploy toque auth o mail

Notas:

- si el release modifica contratos publicos, el smoke debe incluir al menos un request real a cada endpoint afectado
- si el release modifica media, el smoke debe incluir `media/health` y un upload controlado en ambiente seguro

---

## 🏗️ Consideraciones

- Arquitectura modular
- Multi-tenant con ownerId
- API stateless
- Media en Cloudflare R2 (S3 compatible) con normalización de imágenes en backend
- Lista para dockerización y despliegue
