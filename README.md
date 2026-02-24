<p align="center">
  <img src="docs/assets/modo_playa_transparente.png" alt="Foodly Notes" width="200" />
</p>

# Modo Playa -- API

🌐 English version: [README.en.md](./README.en.md)

**Modo Playa API** es el backend de una plataforma de catálogo de
alojamientos pensada para alquileres turísticos (ej. cabañas, casas,
departamentos).

Está diseñada como una API **multi-tenant**, donde cada propietario
(OWNER) gestiona exclusivamente sus propios recursos (usuarios,
contactos y alojamientos), garantizando aislamiento de datos a nivel de
aplicación.

---

## 🧩 Arquitectura General

- **Framework**: NestJS
- **Base de datos**: MongoDB + Mongoose
- **Autenticación**: JWT (ownerId incluido en el payload)
- **Email transaccional**: Resend
- **Storage de media**: Cloudflare R2 (S3 compatible)
- **Validación**: class-validator + ValidationPipe global
- **Testing**: Jest (services y controllers con cobertura unitaria)

---

## 🏢 Multi-Tenant

La API implementa un modelo multi-tenant basado en:

- `ownerId` almacenado en cada entidad relevante
- `ownerId` embebido en el JWT
- Filtros automáticos por `ownerId` en endpoints administrativos
- Separación estricta entre endpoints públicos y privados

Cada OWNER: - Solo puede ver y modificar sus propios contactos - Solo
puede ver y modificar sus propios alojamientos - Solo puede gestionar
sus propios usuarios

---

## 📦 Módulos principales

### 🔐 Auth

- Activación de cuenta
- Login
- Refresh token
- Cambio de contraseña
- Recuperación de contraseña por código
- Reset de contraseña

### 👥 Users

- Creación de usuarios por propietario
- Listado por owner
- Actualización y desactivación
- Imagen de perfil con upload directo a R2 + confirmación backend

### 📇 Contacts

- CRUD de contactos
- Contacto por defecto por propietario
- Soft delete
- Validación multi-tenant

### 🏠 Lodgings

- CRUD administrativo
- Endpoint público con búsqueda y filtros por tags
- Paginación
- Rango de disponibilidad validado
- Relación con Contact
- Gestión de imágenes (hasta 5) con imagen predeterminada
- Upload directo a R2 con URL firmada + confirmación y normalización a WebP

### ✉️ Mail

- Envío de código de recuperación
- Notificación de cambio de contraseña

---

## 🌍 Endpoints

Todos los endpoints están bajo:

/api

Ejemplos:

- `POST /api/auth/login`
- `GET /api/lodgings`
- `GET /api/admin/lodgings`
- `POST /api/admin/contacts`

La API también incluye endpoints administrativos para gestión de media
(health de R2, imágenes de alojamientos e imagen de perfil de usuario).

---

## 🧪 Testing

- Cobertura unitaria en servicios y controllers
- Mocks tipados
- Sin uso de `any` innecesario
- Aislamiento por módulo

---

## 🧑‍💻 Desarrollo

Ver guía completa en:

👉 [DEVELOPMENT.md](./DEVELOPMENT.md)

Variables de entorno de ejemplo:

👉 [`.env.example`](./.env.example)
