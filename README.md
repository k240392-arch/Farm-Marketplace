# 🌿 Farm Produce Marketplace
### CPRO306 Capstone Project — Kent Institute Australia

A full-stack web application connecting Australian farmers directly with consumers.

**Tech Stack:** React.js | Node.js + Express | MySQL | OpenAI API | Stripe

---

## ⚡ QUICK SETUP (Follow Every Step)

### STEP 1 — Install Required Tools
Download and install these if you haven't already:
- **Node.js LTS** → https://nodejs.org
- **MySQL** → https://dev.mysql.com/downloads/installer
- **VS Code** → https://code.visualstudio.com

---

### STEP 2 — Set Up the Database
1. Open **MySQL Workbench** (installed with MySQL)
2. Connect to your local MySQL server
3. Open the file: `server/db/schema.sql`
4. Click the **⚡ Execute** button (lightning bolt)
5. You should see: `Database setup complete!`

OR use the terminal:
```bash
mysql -u root -p < server/db/schema.sql
```

---

### STEP 3 — Configure Environment Variables
1. Go into the `server/` folder
2. Rename `.env.example` to `.env`
3. Open `.env` and fill in:
   - `DB_PASSWORD` = your MySQL root password
   - `OPENAI_API_KEY` = from https://platform.openai.com/api-keys
   - `STRIPE_SECRET_KEY` = from https://dashboard.stripe.com/test/apikeys
   - `STRIPE_PUBLISHABLE_KEY` = from same page (starts with `pk_test_`)

---

### STEP 4 — Install & Run the Backend
Open a terminal in VS Code (`Ctrl + ~`) and run:
```bash
cd server
npm install
npm run dev
```
You should see:
```
✅ MySQL connected successfully
✅ Server running on http://localhost:5001
```

---

### STEP 5 — Install & Run the Frontend
Open a **second terminal** and run:
```bash
cd client
npm install
npm start
```
The browser will automatically open: http://localhost:3000

---

## 🎯 Demo Accounts (already in database)

| Role   | Email             | Password    |
|--------|-------------------|-------------|
| Farmer | farmer@demo.com   | Password123 |
| Buyer  | buyer@demo.com    | Password123 |
| Admin  | admin@demo.com    | Password123 |

---

## 📁 Project Structure
```
farm-marketplace/
├── client/                  ← React.js Frontend
│   └── src/
│       ├── components/      ← Navbar, ProductCard, ChatBot
│       ├── pages/           ← Home, Listings, Login, Cart, Dashboards
│       ├── context/         ← AuthContext, CartContext
│       └── services/        ← api.js (Axios)
└── server/                  ← Node.js + Express Backend
    ├── routes/              ← auth, listings, orders, ai, payments, admin
    ├── middleware/          ← authMiddleware (JWT)
    ├── config/              ← db.js
    └── db/                  ← schema.sql
```

---

## 🔑 Key Features
- ✅ User registration & login (Farmer / Buyer / Admin)
- ✅ JWT authentication with bcrypt password hashing
- ✅ Product listings with image upload (Multer)
- ✅ Search & filter by category, price, keyword
- ✅ Shopping cart (persists in localStorage)
- ✅ Order placement with stock management
- ✅ OpenAI chatbot (FarmBot AI assistant)
- ✅ OpenAI product description generator
- ✅ Stripe payment integration
- ✅ Farmer dashboard with CRUD
- ✅ Admin dashboard with user management & stats

---

## 🔒 Security Features
- bcrypt password hashing (12 salt rounds)
- JWT tokens (24h expiry)
- Role-based access control (RBAC)
- Input validation (express-validator)
- Rate limiting on AI endpoints
- CORS restricted to frontend URL
- SQL injection prevention (parameterised queries)

---

## 🧪 Test the API (using Postman or browser)
- Health check: http://localhost:5001/api/health
- All listings: http://localhost:5001/api/listings
- Categories:   http://localhost:5001/api/categories

