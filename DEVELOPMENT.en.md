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

Make sure to fill in:

- MongoDB / JWT / Resend settings
- Cloudflare R2 variables (`R2_*`)
- `MEDIA_PUBLIC_BASE_URL` (custom/public media domain)

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

- `GET /api/admin/media/health` validates R2 connectivity (JWT required).
- Lodging/profile images use direct upload to R2 plus backend confirmation.

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
