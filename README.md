# Car Dealership Management System

A full-stack web application for managing vehicle inventory, repairs, documents, and user activity in a car dealership. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Seeding the Database](#seeding-the-database)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [User Roles & Permissions](#user-roles--permissions)

---

## Features

- **Car Inventory Management** – Add, edit, delete, and track vehicles with details such as brand, model, year, engine/chassis numbers, purchase price, and supplier information.
- **Car Status Tracking** – Track cars as *In Stock*, *Under Repair*, *Reserved*, *Sold*, or *Rented*.
- **Repair Management** – Record vehicle repairs with labour and parts cost tracking, before/after images, and status (*Pending*, *In Progress*, *Completed*).
- **Document Management** – Track important car documents (Insurance, Road Permit, Registration Card) with expiry dates and file uploads.
- **Expiry Alerts** – Automatic alerts for documents expiring within 7, 15, or 30 days.
- **User Management** – Multi-role user system with Admin, Car Manager, Accountant, Finance Manager, and Sales Person roles.
- **Activity Audit Logging** – Complete audit trail of all user actions with timestamps and IP addresses.
- **Dashboard Statistics** – Overview of total cars, repairs, documents, and overall system health.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Database | [MongoDB](https://www.mongodb.com/) via [Mongoose 9](https://mongoosejs.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Authentication | JWT ([jose](https://github.com/panva/jose) + [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) |
| Password Hashing | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| File Uploads | [Multer](https://github.com/expressjs/multer) |

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (comes with Node.js)
- A running **MongoDB** instance (local or cloud, e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))

---

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/amnahid/car-dealership.git
   cd car-dealership
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables)):

   ```bash
   cp .env.example .env.local   # if an example file exists, otherwise create it manually
   ```

4. **Seed the database** (creates the initial Admin user)

   ```bash
   # Start the dev server first, then run:
   curl -X POST http://localhost:3000/api/seed
   ```

   See [Seeding the Database](#seeding-the-database) for details.

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Required | Description | Default |
|---|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/car-dealership` |
| `JWT_SECRET` | Yes (production) | Secret key used to sign JWT tokens | `fallback-secret-change-in-production` |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of the application (used for client-side API calls) | `http://localhost:3000` |

> **Warning:** Always set a strong, unique `JWT_SECRET` in production. The built-in fallback value is intentionally insecure and will cause the app to throw an error if `NODE_ENV=production` and the variable is missing.

Example `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/car-dealership
JWT_SECRET=your-very-long-random-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Running the Application

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server (requires a build) |
| `npm run lint` | Run ESLint on the codebase |
| `npm run migrate:roles` | Migrate legacy user roles to the current role set |

---

## Seeding the Database

You can seed demo data in two ways:

1. API seeder (requires app running):

   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

2. Script seeder (comprehensive fixture dataset):

   ```bash
   npm run seed
   ```

Default credentials from `/api/seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@amyalcar.com` | `Admin@123` |
| Car Manager | `car-manager@amyalcar.com` | `CarManager@123` |
| Accountant | `accountant@amyalcar.com` | `Accountant@123` |
| Finance Manager | `finance-manager@amyalcar.com` | `FinanceManager@123` |
| Sales Person | `sales-person@amyalcar.com` | `SalesPerson@123` |

> **Security:** Change all default passwords immediately in production.

If your database still contains legacy role values (`Manager`, `Accounts Officer`, `Sales Agent`), run:

```bash
npm run migrate:roles
```

Preview the migration without applying changes:

```bash
npm run migrate:roles -- --dry-run
```

---

## Project Structure

```
car-dealership/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── login/          # Login page
│   │   ├── dashboard/
│   │   │   ├── cars/           # Car listing, create, view, edit pages
│   │   │   ├── documents/      # Document listing, upload, view pages
│   │   │   ├── repairs/        # Repair listing, create, view pages
│   │   │   ├── users/          # User management pages
│   │   │   └── activity-logs/  # Audit log page
│   │   └── api/
│   │       ├── auth/           # login, logout, me endpoints
│   │       ├── cars/           # Car CRUD + [id] routes
│   │       ├── documents/      # Document CRUD + expiring endpoint
│   │       ├── repairs/        # Repair CRUD + [id] routes
│   │       ├── users/          # User CRUD + [id] routes
│   │       ├── activity-logs/  # Activity log retrieval
│   │       ├── dashboard/      # Dashboard statistics
│   │       └── seed/           # Database seeder (dev only)
│   ├── components/
│   │   ├── forms/
│   │   │   ├── CarForm.tsx
│   │   │   ├── DocumentForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RepairForm.tsx
│   │   ├── ExpiryAlert.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── activityLogger.ts   # Logs user actions to the database
│   │   ├── apiAuth.ts          # Auth helpers and role-based access control
│   │   ├── auth.ts             # JWT signing/verification and password hashing
│   │   └── db.ts               # MongoDB connection with pooling
│   ├── models/
│   │   ├── ActivityLog.ts
│   │   ├── Car.ts
│   │   ├── Document.ts
│   │   ├── Repair.ts
│   │   └── User.ts
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   └── middleware.ts           # Route protection middleware
├── public/                     # Static assets
├── .env.local                  # Local environment variables (not committed)
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## API Reference

All endpoints except the auth and seed routes require a valid `auth-token` cookie.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Log in and receive a session cookie |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Get the currently authenticated user |

### Cars

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cars` | List all cars |
| `POST` | `/api/cars` | Create a new car |
| `GET` | `/api/cars/[id]` | Get a single car |
| `PUT` | `/api/cars/[id]` | Update a car |
| `DELETE` | `/api/cars/[id]` | Delete a car |

### Repairs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/repairs` | List all repairs |
| `POST` | `/api/repairs` | Create a new repair record |
| `GET` | `/api/repairs/[id]` | Get a single repair |
| `PUT` | `/api/repairs/[id]` | Update a repair |
| `DELETE` | `/api/repairs/[id]` | Delete a repair |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents` | List all documents |
| `POST` | `/api/documents` | Upload a new document |
| `GET` | `/api/documents/[id]` | Get a single document |
| `PUT` | `/api/documents/[id]` | Update a document |
| `DELETE` | `/api/documents/[id]` | Delete a document |
| `GET` | `/api/documents/expiring` | List documents expiring soon |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create a new user |
| `GET` | `/api/users/[id]` | Get a single user |
| `PUT` | `/api/users/[id]` | Update a user |
| `DELETE` | `/api/users/[id]` | Delete a user |

### Other

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/activity-logs` | Retrieve the audit log |
| `GET` | `/api/dashboard/stats` | Get dashboard statistics |
| `POST` | `/api/seed` | Seed demo users and sample data |

---

## User Roles & Permissions

| Role | Description |
|---|---|
| **Admin** | Full system access across all modules |
| **Car Manager** | Manage cars, purchases, repairs, suppliers, and documents |
| **Sales Person** | Manage customers and sales workflows (cash, installment, rental, returns) |
| **Accountant** | Manage transactions, salary payments, finance records, and operational finance views |
| **Finance Manager** | Access finance reports and audit-level views (activity and notification logs) |
