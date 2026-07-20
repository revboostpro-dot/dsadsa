# QR Worker Management PWA

A production-ready mobile-first Progressive Web Application (PWA) for managing QR workers. Designed to feel like a native Android application and optimized for mobile screens (360px–430px width).

## Technology Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL, Socket.IO, JWT Authentication, bcryptjs, Helmet, Zod.
- **Frontend**: React, Vite, TailwindCSS v3, Zustand, Axios, Lucide React, Socket.IO client, Vite PWA.

---

## Features

- **Mobile-First Glassmorphic Design**: Clean dark UI with green accents, responsive rounded cards, micro-animations, swipe-friendly navigation.
- **Live Updating Dashboard**: Cards and active batches sync instantly via Socket.IO without page reloads.
- **Robust Batch Logic**: Start batch, increment/decrement progress, cancel/finish, lock status auto-expires in 15 minutes.
- **Cooldown & Locks**: Automatic 24-hour cooldown after batch completion, automatic locks on active batches.
- **Payment & History**: Record payments, check balances, track lifetime earnings, and view a complete history feed.
- **Reports**: Generate and download Daily, Weekly, and Payroll reports as CSV.
- **Admin Control**: Add/remove supervisors, force-unlock workers, reset cooldowns, configure global system settings (Pay per QR, Cooldown Hours, etc.) stored in DB.

---

## Running Locally

### Step 1: Clone & Setup Env
Create a `.env` file in the `backend/` directory following `backend/.env` (or copy from the root `.env.example`).

### Step 2: Database Setup
Make sure PostgreSQL is running locally, then run the database migration and seed:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
```

### Step 3: Run Backend
Start the backend development server:
```bash
npm run dev
```
The server will run on `http://localhost:3001`.

### Step 4: Run Frontend
Install dependencies and run the frontend development server:
```bash
cd ../frontend
npm install
npm run dev
```
The application will open on `http://localhost:5173`.

---

## Seed Credentials
- **Admin**: Phone: `9000000000` | Password: `password123`
- **Supervisor**: Phone: `9111111111` | Password: `password123`

---

## PWA Capabilities
The application is configure as a Progressive Web Application. When deployed to a HTTPS environment, it is installable on mobile devices (Android/iOS) directly from the browser.
