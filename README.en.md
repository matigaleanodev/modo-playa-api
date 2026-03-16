<p align="center">
  <img src="docs/assets/modo_playa_transparente.png" alt="Modo Playa" width="200" />
</p>
# Modo Playa -- API

🌎 Versión en español: [README.md](./README.md)

**Modo Playa API** is the backend for a lodging catalog platform
designed for vacation rentals (cabins, houses, apartments).

It is built as a **multi-tenant API**, where each property owner (OWNER)
manages only their own resources (users, contacts, lodgings), ensuring
strict data isolation.

---

## 🧩 Architecture

- **Framework**: NestJS
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (ownerId embedded in payload)
- **Transactional Email**: Resend
- **Media Storage**: Cloudflare R2 (S3-compatible)
- **Validation**: class-validator + global ValidationPipe
- **Testing**: Jest (unit-tested services and controllers)

---

## 🏢 Multi-Tenant Design

Multi-tenancy is implemented through:

- `ownerId` stored in each relevant entity
- `ownerId` embedded in JWT
- Automatic owner filtering in admin endpoints
- Clear separation between public and private routes

- Can only access their own contacts.
- Can only manage their own lodgings.
- Can only manage their own users.

---

## 📦 Main Modules

### 🔐 Auth

- Account activation
- Login
- Token refresh
- Password change
- Password recovery via code
- Password reset

### 👥 Users

- Owner-based user creation
- Owner-based listing
- Update and deactivation
- Own profile image managed with backend-only multipart upload

### 📇 Contacts

- CRUD operations
- Default contact per owner
- Soft delete
- Tenant validation

### 🏠 Lodgings

- Admin CRUD
- Public listing with search & tag filters
- Pagination
- Availability range validation
- Contact relation
- Image management (up to 5) with default image
- Create flow with initial images through pending uploads + final association in `create`
- Backend WebP normalization for uploaded images

### 📊 Dashboard

- Consolidated admin summary
- Lodgings, contacts, and users metrics
- Prioritized operational alerts (for example, create a contact before lodgings)
- Recent activity heuristically derived from `createdAt/updatedAt` (`source=timestamps`), not a persisted audit log

### 🌤️ Destinations

- Public list of supported destinations
- Destination context (current weather, short forecast, sunrise/sunset, and curated points of interest with outbound Google Maps links)

### ✉️ Mail

- Password reset code email
- Password changed notification

---

## 🧪 Testing

- Unit tests for services and controllers
- Typed mocks
- Strict TypeScript usage
- Modular isolation

---

## ⚙️ Operations

- The backend currently operates with `MongoDB`, `Cloudflare R2`, and `Resend` as real production runtime dependencies.
- Swagger UI is served at `/docs` and the OpenAPI contract at `/openapi.json`.
- Minimum post-deploy smoke checks and the environment runtime contract live in [DEVELOPMENT.en.md](./DEVELOPMENT.en.md).

---

## 🌍 Endpoints

All endpoints are under:

`/api`

Examples:

- `POST /api/auth/login`
- `POST /api/auth/me/profile-image`
- `GET /api/lodgings`
- `GET /api/admin/lodgings`
- `POST /api/admin/contacts`
- `POST /api/admin/lodging-image-uploads`
- `POST /api/admin/lodgings/:lodgingId/images`
- `GET /api/admin/dashboard/summary`
- `GET /api/destinations`
- `GET /api/destinations/:id/context`

Global validation uses `whitelist + forbidNonWhitelisted`, so undefined
fields in DTOs are rejected (for example, do not send `id` in
`POST /api/admin/contacts`).

The interactive Swagger UI documentation is available at:

`/docs`

The OpenAPI JSON document is available at:

`/openapi.json`

Contract and domain errors expose explicit response `code` values (for
example `INVALID_DESTINATION_ID`, `INVALID_TARGET_OWNER_ID`,
`INVALID_PRICE_RANGE`, `PROFILE_IMAGE_FORBIDDEN_FOR_SUPERADMIN`) so
clients do not need to rely only on `message` text.

`auth/me/profile-image` is restricted to the authenticated `OWNER`.
`SUPERADMIN` cannot manage user profile images through that endpoint.

---

## 🧑‍💻 Development

See full guide:

👉 [DEVELOPMENT.en.md](./DEVELOPMENT.en.md)

Example environment variables:

👉 [`.env.example`](./.env.example)
