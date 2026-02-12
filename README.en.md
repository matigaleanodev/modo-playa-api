<p align="center">
  <img src="docs/assets/modo_playa_tentativo.png" alt="Foodly Notes" width="200" />
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
- **Validation**: class-validator + global ValidationPipe
- **Testing**: Jest (unit-tested services and controllers)

---

## 🏢 Multi-Tenant Design

Multi-tenancy is implemented through:

- `ownerId` stored in each relevant entity
- `ownerId` embedded in JWT
- Automatic owner filtering in admin endpoints
- Clear separation between public and private routes

Each OWNER: - Can only access their own contacts - Can only manage their
own lodgings - Can only manage their own users

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

## 🧑‍💻 Development

See full guide:

👉 [DEVELOPMENT.en.md](./DEVELOPMENT.en.md)
