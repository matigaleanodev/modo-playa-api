# Development Guide -- Modo Playa API

---

## 🔧 Requisitos

- Node.js 22+
- MongoDB
- Cuenta en Resend (para envío de emails)

---

## 🔐 Variables de entorno

Crear archivo `.env`:

```env
PORT=3000 MONGO_URI=mongodb://localhost:27017/modo-playa
SECRET_KEY=your_secret_key BCRYPT_ROUNDS=12
RESEND_API_KEY=your_resend_key RESEND_FROM_EMAIL=your_email
CORS_ORIGIN=http://localhost:4200
```

---

## ▶️ Ejecutar la API

npm install npm run start:dev

Disponible en:

http://localhost:3000/api

---

## 🧪 Tests

npm run test

Todos los módulos poseen tests unitarios.

---

## 🏗️ Consideraciones

- Arquitectura modular
- Multi-tenant con ownerId
- API stateless
- Lista para dockerización y despliegue en AWS
