# Development Guide -- Modo Playa API

---

## 🔧 Requirements

- Node.js 22+
- MongoDB
- Resend account for transactional emails
- Cloudflare R2 bucket (S3-compatible) for media/images

---

## 🔐 Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

On PowerShell (Windows):

```powershell
Copy-Item .env.example .env
```

Make sure to fill in:

- MongoDB / JWT / Resend settings
- Cloudflare R2 variables (`R2_*`)
- `MEDIA_PUBLIC_BASE_URL` (custom/public media domain)
- `SUPERADMIN_OWNER_ID` (optional, to enable `SUPERADMIN` role by ownerId)

Minimal example:

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

## ▶️ Run the API

```bash
npm install
npm run start:dev
```

Available at:

http://localhost:3000/api

Notes:

- `GET /api/admin/dashboard/summary` returns owner-scoped metrics and operational alerts.
- `recentActivity` inside dashboard uses `source=timestamps` to indicate that the block is derived from `createdAt/updatedAt`; it is not a persisted audit log.
- `GET /api/destinations` and `GET /api/destinations/:id/context` are public destinations endpoints.
- `POST /api/admin/lodging-image-uploads/upload-url` and `POST /api/admin/lodging-image-uploads/confirm` handle initial images before the lodging exists.
- `POST /api/admin/lodgings` can associate `pendingImageIds` + `uploadSessionId` in the same create operation.
- `POST /api/admin/lodgings/:lodgingId/images/upload-url` and `POST /api/admin/lodgings/:lodgingId/images/confirm` manage images for existing lodgings.
- `POST /api/auth/me/profile-image/upload-url` and `POST /api/auth/me/profile-image/confirm` manage the authenticated user's own profile image and are restricted to `OWNER`.
- `GET /api/admin/media/health` validates R2 connectivity (JWT required).
- The canonical media flow is `signed upload + backend confirmation`.
- Global validation rejects undefined DTO fields (`whitelist + forbidNonWhitelisted`).
  Example: do not send `id` in `POST /api/admin/contacts` body.
- Contract and domain errors expose stable explicit `code` values. Consumers should branch on `code`, not only on `message`.

---

## 🧪 Testing

```bash
npm run test
```

All modules are unit tested.

Lint:

```bash
npm run lint
```

---

## 🏗️ Production Notes

- Modular architecture
- Multi-tenant using ownerId isolation
- Stateless API
- Media stored in Cloudflare R2 (S3-compatible) with backend image normalization
- Ready for containerization and deployment
