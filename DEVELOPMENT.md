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

Completar especialmente:

- MongoDB / JWT / Resend
- Variables de Cloudflare R2 (`R2_*`)
- `MEDIA_PUBLIC_BASE_URL` (dominio público/custom domain o URL pública de R2)

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

- `GET /api/admin/media/health` permite validar conexión con R2 (requiere JWT).
- Las imágenes de lodgings y perfil usan upload directo a R2 con confirmación backend.

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
