# Development Guide -- Modo Playa API

---

## 🔧 Requirements

- Node.js 22+
- MongoDB
- Resend account for transactional emails

---

## 🔐 Environment Variables

Create a `.env` file:

```env
PORT=3000 MONGO_URI=mongodb://localhost:27017/modo-playa
SECRET_KEY=your_secret_key BCRYPT_ROUNDS=12
RESEND_API_KEY=your_resend_key RESEND_FROM_EMAIL=your_email
CORS_ORIGIN=http://localhost:4200
```

---

## ▶️ Run the API

npm install npm run start:dev

Available at:

http://localhost:3000/api

---

## 🧪 Testing

npm run test

All modules are unit tested.

---

## 🏗️ Production Notes

- Modular architecture
- Multi-tenant using ownerId isolation
- Stateless API
- Ready for containerization and AWS deployment
