# 🚗 Car Dealership & Rental Management System
## Development Roadmap — Waterfall SDLC Model

> **Project Scope:** Solo Developer · 2-Week Vibe Coding Sprint · Web-Based Platform
> **Extensions in Scope:** SMS/WhatsApp API (Twilio) · VPS File Storage
> **Methodology:** Waterfall (Sequential, Phase-Gated)

---

## Confirmed Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| Backend | Next.js API Routes |
| Database | MongoDB |
| ODM | Mongoose |
| Auth | NextAuth.js |
| UI | Tailwind CSS + Shadcn/ui |
| File Storage | VPS Filesystem (local `/uploads` directory) |
| SMS & WhatsApp | Twilio |
| Email | SendGrid API |
| Hosting | VPS (e.g. DigitalOcean, Hetzner, Linode) |
| Cron Jobs | node-cron (running on VPS) |

> ⚠️ **Email Decision Pending:** SendGrid API is assumed. Confirm and obtain API key before Day 1 ends.

---

## Overview of Waterfall Phases

| # | Phase | Duration |
|---|-------|----------|
| 1 | Requirements Analysis | Day 1 |
| 2 | System Design | Day 2 |
| 3 | Implementation | Days 3–11 |
| 4 | Testing & QA | Days 12–13 |
| 5 | Deployment | Day 14 |

> ⚠️ **Waterfall Rule:** Each phase must be fully completed before the next begins. Requirements and design decisions are frozen once their phase ends — no backtracking during implementation.

---

## Phase 1 — Requirements Analysis
**Duration:** Day 1 (Full Day)
**Deliverable:** Finalized Requirements Specification, all API accounts created

### 1.1 Functional Requirements Checklist

**Car Purchase Management**
- Record new car purchases with supplier name, contact, purchase price, and date
- Upload images showing car condition at time of purchase (stored on VPS)
- Upload purchase documents (PDF/image, stored on VPS)
- Fields: Car ID, supplier name & contact, purchase price & date, brand, model, year, engine number, chassis number, notes

**Repair & Maintenance Tracking**
- Add repair records linked to a specific car
- Upload before/after repair images (stored on VPS)
- Fields: Car ID, repair description, parts replaced, labor cost, repair date
- Auto-calculate total repair cost per car across all repair records

**Inventory / Stock Management**
- Real-time car list with status badge per vehicle
- Status types: `In Stock`, `Under Repair`, `Reserved`, `Sold`, `Rented`
- Photo gallery per car (uploaded to VPS)
- Search and filter by status, brand, model, year

**Vehicle Documentation Management**
- Track Insurance, Road Permit, and Registration Card per vehicle
- Store issue date, expiry date, and scanned document file (VPS)
- Dashboard alerts at 30, 15, and 7 days before expiry
- Alert channels: SMS (Twilio), Email (SendGrid), Dashboard notification

**Car Sales — Cash Purchase**
- Record full cash sale with discount, agent commission
- Generate and download invoice (PDF)
- Auto-update car status to `Sold`

**Car Sales — Installment (Kisti)**
- Create installment plan: total price, down payment percentage, number of months
- Auto-generate monthly payment schedule
- Record each payment against the schedule
- Apply late payment fines on overdue installments
- Send payment reminders automatically
- Delivery gated on payment threshold (20% or 30% configurable per plan)

**Car Sales — Rental**
- Create rental contract: customer, car, start/end date, daily rate
- Auto-calculate total rental cost from duration × daily rate
- Track active rentals; close contract on car return
- Auto-update car status to `Rented` / back to `In Stock`

**Customer Management**
- Customer profiles: name, National ID, driving license, phone, email, emergency contact
- Full history: cash purchases, installment plans, rental contracts, outstanding payments
- Document storage per customer (ID scan, license scan — VPS)

**Automated Messaging**
- Cash sale: send thank-you SMS + email to customer
- Installment plan creation: send confirmation message
- Installment due reminder: send WhatsApp/SMS day before due date
- Installment overdue: send late notice with fine amount
- Rental confirmation: send contract summary to customer
- Document expiry alert: send SMS + email to admin/manager

**Accounting & Financial Management**
- Expense entry: categories — Purchase, Repair, Salary, Operations
- Income auto-aggregated from: Cash Sales, Installment Payments, Rental Contracts
- Profit per car = Sale Price − Purchase Cost − Total Repair Costs
- Reports: Monthly profit/loss, sales report, expense breakdown, rental revenue

**Employee & Salary Management**
- Employee profiles: name, role, join date, salary structure
- Record monthly salary payments, bonuses, commissions
- Payment history per employee

**Dashboard**
- KPIs: total in stock, sold, rented, pending installments, upcoming document expiries, monthly revenue & profit
- Recent activity feed
- Document expiry alert panel

**User Roles & Access Control**

| Role | Access |
|------|--------|
| Admin | Full access to all modules |
| Manager | Inventory, Sales, Rental management |
| Accounts Officer | Accounting, Salary management |
| Sales Agent | Customer management, Sales entry only |

**Security**
- Secure login via NextAuth.js (credentials provider)
- Role-based route protection via middleware
- Activity log for all critical actions
- File uploads validated by type and size before saving to VPS

---

### 1.2 Non-Functional Requirements

- TypeScript strict mode throughout the codebase
- All API routes protected — unauthenticated requests return 401
- File uploads: images max 10MB, documents max 20MB; validated server-side
- VPS `/uploads` directory served as a static path with restricted public access
- All secrets in `.env.local` — never committed to version control
- SendGrid API key confirmed and tested before Day 2

### 1.3 External Integrations

| Integration | Provider | Purpose |
|-------------|---------|---------|
| SMS | Twilio | Installment reminders, expiry alerts |
| WhatsApp | Twilio WhatsApp API | Installment due/overdue notices |
| Email | SendGrid | Sale confirmations, expiry alerts |
| File Storage | VPS Filesystem | Car images, repair photos, documents |
| Cron Scheduling | node-cron (on VPS) | Daily alert jobs |

### 1.4 Day 1 Exit Criteria

- [x] All functional requirements reviewed and confirmed
- [x] Twilio account created, phone number purchased, WhatsApp sender approved (apply early — approval can take 24–48 hrs)
- [x] SendGrid account created, sender email verified
- [x] VPS provisioned and SSH access confirmed
- [x] `.env.local` template file created with all required variable names

---

## Phase 2 — System Design
**Duration:** Day 2 (Full Day)
**Deliverable:** Mongoose schemas, folder structure, API route map, messaging flow diagram

### 2.1 Project Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx               ← Sidebar + top bar
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   │   └── [id]/
│   │   ├── purchases/new/
│   │   ├── repairs/new/
│   │   ├── documents/
│   │   ├── sales/
│   │   │   ├── cash/new/
│   │   │   ├── installment/new/
│   │   │   └── installment/[id]/
│   │   ├── rentals/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── customers/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── accounting/
│   │   ├── employees/
│   │   └── reports/
├── app/api/
│   ├── auth/[...nextauth]/
│   ├── cars/
│   ├── purchases/
│   ├── repairs/
│   ├── documents/
│   ├── sales/cash/
│   ├── sales/installment/
│   ├── rentals/
│   ├── customers/
│   ├── accounting/
│   ├── employees/
│   ├── reports/
│   └── upload/
├── lib/
│   ├── db.ts                        ← Mongoose connection
│   ├── auth.ts                      ← NextAuth config
│   ├── twilio.ts                    ← Twilio client
│   ├── sendgrid.ts                  ← SendGrid client
│   └── cron.ts                      ← node-cron jobs
├── models/                          ← All Mongoose models
├── components/                      ← Shadcn/ui + custom components
├── middleware.ts                    ← Route protection by role
├── types/                           ← Shared TypeScript types
└── uploads/                         ← VPS file storage (gitignored)
```

### 2.2 Mongoose Schema Design

```typescript
// Car
{
  brand, model, year: Number,
  engineNumber, chassisNumber,
  status: enum['in_stock','under_repair','reserved','sold','rented'],
  notes,
  images: [{ url: String, label: String }],
  createdAt, updatedAt
}

// CarPurchase
{
  carId: ObjectId → Car,
  supplierName, supplierContact,
  purchasePrice: Number,
  purchaseDate: Date,
  documentUrl: String,        // VPS path
  notes
}

// RepairRecord
{
  carId: ObjectId → Car,
  description, partsReplaced,
  laborCost: Number,
  repairDate: Date,
  beforeImages: [String],     // VPS paths
  afterImages: [String]
}

// VehicleDocument
{
  carId: ObjectId → Car,
  type: enum['insurance','road_permit','registration'],
  issueDate, expiryDate: Date,
  fileUrl: String,            // VPS path
  alertsSent: [Number]        // e.g. [30, 15] — days already alerted
}

// Customer
{
  name, phone, email,
  nationalId, drivingLicense,
  emergencyContact: { name, phone },
  idScanUrl, licenseScanUrl,  // VPS paths
  createdAt
}

// CashSale
{
  carId: ObjectId → Car,
  customerId: ObjectId → Customer,
  agentId: ObjectId → Employee,
  salePrice, discount, agentCommission: Number,
  saleDate: Date,
  invoiceUrl: String          // generated PDF path on VPS
}

// InstallmentPlan
{
  carId: ObjectId → Car,
  customerId: ObjectId → Customer,
  totalPrice, downPayment: Number,
  months: Number,
  monthlyAmount: Number,      // auto-calculated
  deliveryThresholdPct: Number,
  deliveryGranted: Boolean,
  status: enum['active','completed','defaulted']
}

// InstallmentPayment
{
  planId: ObjectId → InstallmentPlan,
  dueDate, paidDate: Date,
  amount, fineAmount: Number,
  status: enum['pending','paid','overdue']
}

// RentalContract
{
  carId: ObjectId → Car,
  customerId: ObjectId → Customer,
  startDate, endDate: Date,
  dailyRate, totalCost: Number,
  status: enum['active','closed']
}

// Employee
{
  name, role, phone, email,
  joinDate: Date,
  baseSalary: Number
}

// SalaryPayment
{
  employeeId: ObjectId → Employee,
  month: String,              // e.g. "2025-01"
  amount, bonus, commission: Number,
  paidDate: Date
}

// Expense
{
  category: enum['purchase','repair','salary','operations'],
  amount: Number,
  description,
  date: Date
}

// MessageLog
{
  customerId: ObjectId → Customer,
  channel: enum['sms','whatsapp','email'],
  messageType,
  sentAt: Date,
  status: enum['sent','failed']
}

// ActivityLog
{
  userId: ObjectId → User,
  action, entity, entityId,
  timestamp: Date
}

// User (NextAuth)
{
  name, email, passwordHash,
  role: enum['admin','manager','accounts_officer','sales_agent']
}
```

### 2.3 API Route Map

| Method | Route | Description | Roles Allowed |
|--------|-------|-------------|---------------|
| POST | `/api/cars` | Create car record | Admin, Manager |
| GET | `/api/cars` | List all cars (filterable) | All |
| GET | `/api/cars/[id]` | Car detail | All |
| PATCH | `/api/cars/[id]/status` | Update car status | Admin, Manager |
| POST | `/api/purchases` | Add purchase record | Admin, Manager |
| POST | `/api/repairs` | Add repair record | Admin, Manager |
| GET | `/api/repairs/[carId]` | Get repairs for a car | All |
| POST | `/api/documents` | Add vehicle document | Admin, Manager |
| GET | `/api/documents/expiring` | Get documents expiring soon | Admin, Manager |
| POST | `/api/sales/cash` | Record cash sale | Admin, Manager, Sales Agent |
| POST | `/api/sales/installment` | Create installment plan | Admin, Manager |
| GET | `/api/sales/installment/[id]` | Get plan + schedule | All |
| POST | `/api/sales/installment/[id]/pay` | Record a payment | Admin, Accounts Officer |
| POST | `/api/rentals` | Create rental contract | Admin, Manager |
| PATCH | `/api/rentals/[id]/close` | Close rental / return car | Admin, Manager |
| POST | `/api/customers` | Create customer | All |
| GET | `/api/customers/[id]` | Customer profile + history | All |
| POST | `/api/accounting/expense` | Add expense | Admin, Accounts Officer |
| GET | `/api/reports/profit` | Profit per car report | Admin, Accounts Officer |
| GET | `/api/reports/monthly` | Monthly P&L report | Admin, Accounts Officer |
| POST | `/api/employees` | Add employee | Admin |
| POST | `/api/employees/[id]/salary` | Record salary payment | Admin, Accounts Officer |
| POST | `/api/upload` | Upload file to VPS | All (authenticated) |

### 2.4 Messaging & Cron Architecture

```
node-cron — runs on VPS alongside Next.js

Daily 08:00 — Document Expiry Check
  └── Query VehicleDocuments where expiryDate within 30/15/7 days
        └── Skip if day already in alertsSent[]
        └── Send SMS via Twilio → admin phone
        └── Send Email via SendGrid → admin email
        └── Push dashboard notification
        └── Update alertsSent[] in DB

Daily 09:00 — Installment Due Reminder
  └── Query InstallmentPayments where dueDate = tomorrow, status = pending
        └── Send WhatsApp via Twilio → customer.phone
        └── Send SMS as fallback if WhatsApp fails
        └── Log to MessageLog

Daily 10:00 — Overdue Installment Detection
  └── Query InstallmentPayments where dueDate < today, status = pending
        └── Calculate fine, update status to overdue
        └── Send overdue notice via SMS + Email to customer
        └── Log to MessageLog

Event Triggers (fired from API routes)
  ├── POST /api/sales/cash       → Send thank-you SMS + Email to customer
  ├── POST /api/sales/installment → Send plan confirmation to customer
  └── POST /api/rentals          → Send rental confirmation to customer
```

### 2.5 File Storage Convention (VPS)

```
/uploads/
├── cars/
│   └── [carId]/
│       ├── purchase/         ← purchase images + documents
│       ├── repairs/          ← before/after repair images
│       └── stock/            ← general stock photos
└── customers/
    └── [customerId]/
        ├── national-id.jpg
        └── driving-license.jpg
```

> All upload paths stored in MongoDB as relative strings (e.g. `/uploads/cars/abc123/stock/photo1.jpg`). Served via Nginx static file serving on the VPS.

### 2.6 Day 2 Exit Criteria

- [x] All Mongoose schemas written and saved in `/models/`
- [x] Full API route map finalized — no new routes added during implementation
- [x] Folder structure scaffolded on local machine
- [x] Messaging and cron flow finalized
- [x] VPS `/uploads` directory created with correct write permissions
- [x] `.env.local` filled with all real keys (Twilio, SendGrid, MongoDB URI, NextAuth secret)

---

## Phase 3 — Implementation
**Duration:** Days 3–11 (9 Days)
**Deliverable:** Fully coded, locally running application

> Each day has a clear goal and an end-of-day checkpoint. Do not move to the next day's tasks until the checkpoint passes.

---

### Day 3 — Project Scaffold, DB Connection & Auth

**Goal:** Running Next.js app with login, role-based routing, and Mongoose connected

- [x] `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- [x] Install dependencies: `mongoose`, `next-auth`, `node-cron`, `twilio`, `@sendgrid/mail`, `bcryptjs`, `formidable` (file uploads), `sharp` (image compression)
- [x] Initialize Shadcn/ui (`npx shadcn-ui@latest init`)
- [x] Create `lib/db.ts` — Mongoose connection with singleton pattern (prevent hot-reload reconnections)
- [x] Create all Mongoose models in `/models/` from schemas designed on Day 2
- [x] Set up NextAuth.js with Credentials Provider — store hashed password + role in User document, encode role into JWT
- [x] Create `middleware.ts` — protect all `/dashboard/*` and `/api/*` routes; redirect unauthenticated to `/login`
- [x] Implement role-check utility: `hasRole(session, ['admin', 'manager'])` used inside API routes
- [x] Build base dashboard layout — Shadcn sidebar, top bar with user name/role badge and logout button
- [x] Seed one Admin user directly in MongoDB for testing
- [x] Create `POST /api/upload` route — accepts multipart form data via `formidable`, optionally compresses images with `sharp`, saves to VPS `/uploads/[entity]/[id]/`, returns relative file path

**End-of-Day Checkpoint:** Log in as Admin → see dashboard shell with sidebar. Upload API accepts an image and returns a path.

---

### Day 4 — Car Purchase & Inventory

**Goal:** Cars can be added via purchase form, viewed in inventory, and filtered by status

- [x] Build `POST /api/cars` and `POST /api/purchases` API routes (create car + purchase in one transaction)
- [x] Build `GET /api/cars` with query params: `status`, `brand`, `model`, `year`, `page`
- [x] Build `GET /api/cars/[id]` — full car detail populated with purchase info and images
- [x] Build `PATCH /api/cars/[id]/status` — update car status with validation
- [x] Build `/purchases/new` page — form with all fields, multi-image upload, single document upload
- [x] Reusable file upload component: drag-and-drop or click, shows preview, calls `/api/upload`, stores path in form state
- [x] Build `/inventory` page — Shadcn DataTable with status color badges, search bar, filter dropdowns
- [x] Build `/inventory/[id]` page — image gallery, purchase info card, status badge, tabs: Repairs / Documents / Sales History (tabs wired in later days)

**End-of-Day Checkpoint:** Add a car purchase with images → car appears in inventory with correct status → click through to detail page, images visible.

---

### Day 5 — Repairs & Vehicle Documents

**Goal:** Repair records tracked per car; documents tracked with color-coded expiry warnings

**Repairs**
- [x] Build `POST /api/repairs` and `GET /api/repairs/[carId]` routes
- [x] Build `/repairs/new` page — car selector, repair fields, before/after image uploads
- [x] Wire Repairs tab on `/inventory/[id]` — list repairs, show summed total cost
- [x] Auto-update car status to `Under Repair` when a repair is added (if currently `In Stock`)

**Vehicle Documents**
- [x] Build `POST /api/documents` and `GET /api/documents/expiring` routes
- [x] Build `/documents` page — full document list with color-coded expiry badges (green / amber / red)
- [x] Add Documents tab on `/inventory/[id]` — add Insurance, Road Permit, Registration with file upload
- [x] Expiry badge component: shows days remaining; color threshold: green > 30 days, amber 8–30 days, red ≤ 7 days, grey = expired
- [x] Dashboard alert panel: query VehicleDocuments expiring within 30 days, render warning cards

**End-of-Day Checkpoint:** Add repair with images → total cost appears on car detail. Add a document with near expiry → badge appears on `/documents` and dashboard alert panel.

---

### Day 6 — Customer Management & Cash Sales

**Goal:** Customer profiles created; cash sales recorded with PDF invoice and confirmation messages

**Customer Management**
- [x] Build `POST /api/customers`, `GET /api/customers`, `GET /api/customers/[id]` routes
- [x] Build `/customers` page — searchable, paginated list
- [x] Build `/customers/new` page — full profile form with National ID and driving license image uploads
- [x] Build `/customers/[id]` page — profile detail with tabbed history (Purchases / Installments / Rentals — tabs populated in later days)

**Cash Sales**
- [x] Build `POST /api/sales/cash` route — create CashSale, update car status to `Sold`, trigger messages
- [x] Build `/sales/cash/new` page — customer picker, car picker (only `in_stock` cars), price/discount/commission fields
- [x] Invoice generation: use `pdfkit` to generate PDF server-side, save to `/uploads/invoices/[saleId].pdf`, return download URL
- [x] Messaging trigger on sale: call `lib/twilio.ts → sendSMS()` and `lib/sendgrid.ts → sendEmail()` with thank-you template
- [x] Log message result to `MessageLog` collection

**End-of-Day Checkpoint:** Create customer → record cash sale → car status = Sold → invoice PDF downloads correctly → SMS and email received (verify in Twilio/SendGrid logs).

---

### Day 7 — Installment Sales (Kisti)

**Goal:** Full installment plan lifecycle — creation, schedule generation, payments, fines, delivery gate

- [x] Build `POST /api/sales/installment` — create InstallmentPlan, auto-generate all InstallmentPayment documents for each month
- [x] Monthly amount: `(totalPrice - downPayment) / months` rounded to 2 decimal places
- [x] Build `GET /api/sales/installment/[id]` — plan detail with full populated payment schedule
- [x] Build `POST /api/sales/installment/[id]/pay` — record payment on a specific InstallmentPayment, check delivery threshold, update statuses
- [x] Delivery gate: `(totalPaid / totalPrice) >= deliveryThresholdPct` → set `deliveryGranted: true`
- [x] Fine logic: if `paidDate > dueDate` → apply configurable fine (flat or percentage, set in `.env`)
- [x] Build `/sales/installment/new` page — plan creator form with threshold selector
- [x] Build `/sales/installment/[id]` page — payment schedule table, pay button per row, delivery status indicator, fine display
- [x] Wire Installments tab on `/customers/[id]`
- [x] Messaging trigger: send plan confirmation on creation

**End-of-Day Checkpoint:** Create installment plan → schedule auto-generated with correct amounts → record on-time payment → record a late payment → fine applied → delivery status unlocks at threshold.

---

### Day 8 — Rental System

**Goal:** Rental contracts created, tracked, and closed; car status managed automatically

- [x] Build `POST /api/rentals` — create RentalContract, update car to `Rented`, trigger confirmation message
- [x] Build `PATCH /api/rentals/[id]/close` — close contract, update car back to `In Stock`
- [x] Build `GET /api/rentals` — list active and past rentals
- [x] Auto-calculate `totalCost = dailyRate × Math.max(1, daysBetween(startDate, endDate))`
- [x] Build `/rentals/new` page — customer picker, car picker (`in_stock` only), date range picker, daily rate input
- [x] Build `/rentals/[id]` page — contract detail card, return car button (with confirmation dialog)
- [x] Wire Rentals tab on `/customers/[id]`
- [x] Add active rentals count to dashboard KPI cards
- [x] Messaging trigger: send rental confirmation on contract creation

**End-of-Day Checkpoint:** Create rental → car status = Rented → car absent from sale/rental pickers → close contract → car = In Stock → confirmation message received.

---

### Day 9 — Accounting & Financial Reports

**Goal:** All expenses logged; income auto-aggregated from existing collections; profit reports accurate

- [x] Build `POST /api/accounting/expense` — log expense with category, amount, description, date
- [x] Build `GET /api/reports/profit` — per-car: sale price − purchase price − sum of all repair costs
- [x] Build `GET /api/reports/monthly` — monthly P&L: income (CashSales + InstallmentPayments paid + RentalContracts closed) − Expenses (all categories)
- [x] Build `GET /api/reports/sales` — cash sales list with date range filter
- [x] Build `GET /api/reports/expenses` — expense breakdown by category with totals
- [x] Build `/accounting` page — expense entry form + recent expenses table grouped by category
- [x] Build `/reports` page — tabs for each report, date range filter, print-friendly CSS
- [x] Add total revenue and current month profit to dashboard KPI section

**End-of-Day Checkpoint:** Enter expenses in each category → view profit per car (manually verify one car's math) → monthly P&L reflects all income and expenses correctly.

---

### Day 10 — Employee Management & Messaging Finalization

**Goal:** Salary management complete; all messaging utilities solid and fully tested end-to-end

**Employee Module**
- [x] Build `POST /api/employees`, `GET /api/employees`, `GET /api/employees/[id]`, `POST /api/employees/[id]/salary` routes
- [x] Build `/employees` page — list with role badges
- [x] Build `/employees/[id]` page — profile card, salary history table, record payment form

**Messaging — Finalize & Harden**
- [x] `lib/twilio.ts` — `sendSMS(to: string, body: string)` and `sendWhatsApp(to: string, body: string)` with try/catch, return success/failure
- [x] `lib/sendgrid.ts` — `sendEmail(to: string, subject: string, html: string)` with try/catch
- [x] All message templates extracted into a `lib/messageTemplates.ts` constants file — no hardcoded strings in routes
- [x] Verify all triggers from Days 6–8 send real messages end-to-end
- [x] All messages logged to `MessageLog` with `sent`/`failed` status
- [x] Build `/settings/notifications` page — paginated view of recent `MessageLog` entries

**End-of-Day Checkpoint:** All event-triggered messages (sale, installment, rental) send real SMS/WhatsApp/email. Employee salary payment recorded. MessageLog populated correctly.

---

### Day 11 — Cron Jobs, Dashboard Polish & Security Hardening

**Goal:** Scheduled alerts running; dashboard fully complete; all role restrictions confirmed; activity logging in place

**Cron Jobs (`lib/cron.ts`)**
- [x] Initialize `node-cron` in a custom Next.js server file or standalone VPS process
- [x] 08:00 daily — Document expiry check: query expiring docs, skip days already in `alertsSent[]`, send SMS + email, update `alertsSent[]`
- [x] 09:00 daily — Installment due tomorrow: query pending payments due tomorrow, send WhatsApp + SMS fallback
- [x] 10:00 daily — Overdue detection: query pending payments past due date, calculate fine, update to `overdue`, send overdue notice

**Dashboard — Complete All Panels**
- [x] KPI cards: In Stock count, Sold count, Rented count, Pending Installments count + outstanding total, Monthly Revenue, Monthly Profit
- [x] Document expiry alert panel: cards for docs expiring within 30 days, sorted by urgency
- [x] Recent activity feed: last 10 entries from `ActivityLog`

**Security Hardening**
- [x] Test `middleware.ts` for every role — confirm no unauthorized route accessible
- [x] Add server-side role check inside every sensitive API route (not just middleware)
- [x] File upload: validate MIME type against allowlist (`image/jpeg`, `image/png`, `application/pdf`) before saving
- [x] `ActivityLog` writes confirmed on: every sale, rental creation, payment, employee edit, document add
- [x] Run `tsc --noEmit` — zero TypeScript errors
- [x] Confirm no secrets appear anywhere in `.ts` source files

**End-of-Day Checkpoint:** Manually invoke each cron function → messages received. Dashboard KPIs load with correct live data. Log in as each role → restricted pages blocked. TypeScript compiles clean.

---

## Phase 4 — Testing & QA
**Duration:** Days 12–13
**Deliverable:** Verified system with zero critical bugs

### Day 12 — Full Functional Testing

| Module | Key Test Scenarios |
|--------|-------------------|
| Auth & RBAC | Login all 4 roles; verify blocked routes return 401/redirect |
| Car Purchase | Add car with images + document; verify in inventory |
| Repairs | Add repair with before/after images; verify total cost on car page |
| Documents | Add document with near expiry; verify badge + dashboard warning |
| Cash Sale | Complete sale; download invoice PDF; verify car → Sold; SMS/email received |
| Installment | Create plan; verify schedule; record on-time payment; record late payment → fine applied; delivery gate unlocks |
| Rental | Create contract; car → Rented; close contract → In Stock; message received |
| Customers | Create customer; verify all history tabs populate after sale, installment, rental |
| Accounting | Enter expenses in all categories; verify profit calculation per car |
| Employees | Add employee; record salary; verify payment history |
| Messaging | Manually call each cron function; verify SMS, WhatsApp, email received |
| Reports | Generate each report; cross-check figures manually |
| Activity Log | Perform actions as each role; verify log entries created |

### Day 13 — Bug Fixes, Edge Cases & Pre-Deploy Checks

**Bug Fixing**
- [x] Fix all issues discovered on Day 12

**Edge Cases**
- [x] Rental: start date = end date → should charge minimum 1 day, not 0
- [x] Installment: down payment equals total price → handle 0-month plan gracefully
- [x] Car already Sold or Rented → must not appear in sale/rental car picker
- [x] Document with expiry already past → display as "Expired", not just red
- [x] Cron: document already alerted at 30 days → must not re-alert at 30 on next run
- [x] File upload: `.exe` with renamed `.jpg` extension → must be rejected by MIME check

**Pre-Deploy Checks**
- [x] Test all API routes via Postman without a session → must return 401
- [x] Verify no `console.log` statements leak sensitive data (passwords, API keys)
- [x] Run `tsc --noEmit` — zero errors
- [x] Test on Chrome, Firefox, and a mobile viewport (375px width)

**End-of-Day Checkpoint:** Zero critical bugs. TypeScript compiles clean. All role restrictions verified. All messages sending in test environment.

---

## Phase 5 — Deployment
**Duration:** Day 14
**Deliverable:** Live production system running on VPS

### 5.1 VPS Setup

- [x] SSH into VPS; `apt update && apt upgrade`
- [x] Install Node.js v18+ LTS via `nvm`
- [x] Install PM2 globally: `npm install -g pm2`
- [x] Install Nginx as reverse proxy
- [x] Clone repository onto VPS
- [x] Create `.env.local` on VPS with all production values (MongoDB Atlas URI or local Mongo, Twilio, SendGrid, NextAuth secret)
- [x] Create `/uploads` directory with write permissions for the Node process: `mkdir -p /uploads && chown -R nodeuser:nodeuser /uploads`
- [x] `npm install && npm run build`
- [x] Start with PM2: `pm2 start npm --name "dealership" -- start`
- [x] Enable PM2 auto-restart: `pm2 startup && pm2 save`

### 5.2 Nginx Configuration

- [x] Create Nginx server block: proxy `localhost:3000` for app routes, serve `/uploads` as static path directly
- [x] Install SSL via Certbot + Let's Encrypt: `certbot --nginx -d yourdomain.com`
- [x] Verify HTTPS works; HTTP → HTTPS redirect active
- [x] Add security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

### 5.3 Cron Jobs on VPS

- [x] Confirm `node-cron` initializes correctly when PM2 starts the app
- [x] Manually invoke each cron function once on production → verify messages send
- [x] If in-process cron is unreliable, add system `crontab` entries as backup to hit internal API endpoints

### 5.4 Production Smoke Test

- [x] Log in as all 4 roles on production URL
- [x] Add a car, upload images → verify images load from VPS
- [x] Record a cash sale → invoice downloads, SMS/email received
- [x] Create an installment plan → schedule generated
- [x] Create a rental contract → confirmation message sent
- [x] Trigger document expiry cron manually → alert received
- [x] Reboot VPS → confirm PM2 restarts app automatically

### 5.5 Final Exit Criteria

- [x] Application live at domain or VPS IP
- [x] HTTPS enforced, HTTP redirects correctly
- [x] All 4 user roles functional
- [x] File uploads saving to and serving from VPS correctly
- [x] Cron jobs confirmed running in production
- [x] SMS, WhatsApp, and email confirmed sending from production
- [x] PM2 process survives a server reboot

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Twilio WhatsApp sender approval delay (24–48 hrs) | High | High | Apply on Day 1 immediately; use SMS-only fallback until approved |
| VPS disk fills up from uncompressed image uploads | Medium | Medium | Compress images with `sharp` in upload API; add file size hard limit |
| node-cron stops after PM2 restart | Medium | High | Test cron on Day 14 first; keep system `crontab` as backup |
| MongoDB connection drops on VPS | Low | High | Use Mongoose reconnect options; add connection health check in `lib/db.ts` |
| TypeScript errors discovered late | Medium | Medium | Run `tsc --noEmit` at end of each implementation day |
| Scope creep during vibe coding | High | High | Requirements frozen after Day 1 — no new features during Days 3–11 |

---

## Module Completion Tracker

| Module | Status | Notes |
|--------|--------|-------|
| Auth & RBAC | [x] | NextAuth with role-based access |
| Car Purchase | [x] | Full CRUD, purchase price tracking |
| Inventory | [x] | Status filtering, car gallery |
| Repairs | [x] | Soft delete, before/after images, auto cost calc |
| Documents & Alerts | [x] | Expiry badges, dashboard alerts |
| Customer Management | [x] | Soft delete, edit modal, history tabs |
| Cash Sales | [x] | CRUD, PDF invoice generation, SMS/email notifications |
| Installment Sales | [x] | Full payment tracking, delivery threshold |
| Rental System | [x] | Close returns car to stock, SMS/email notifications |
| Accounting & Reports | [x] | Transactions, financial reports |
| Employee & Salary | [x] | CRUD, salary payment UI, payment history |
| SMS / WhatsApp / Email | [x] | Document expiry alerts, sale/rental notifications |
| Cron Jobs | [x] | API endpoints ready for external cron trigger |
| Dashboard | [x] | KPIs, charts, alerts, activity feed |
| File Upload API | [x] | VPS file upload with validation |

---

## Current Development Gaps

All development gaps have been resolved. The system is complete and ready for production.

### Priority 1 - Critical (All Resolved ✓)
- [x] Customers: Soft delete ✅
- [x] Rentals: Auto-update car status on return ✅
- [x] Cash Sales: Add invoice PDF generation ✅
- [x] Employees: Add salary payment UI to employee detail page ✅

### Priority 2 - Important (All Resolved ✓)
- [x] Sales: Wire thank-you SMS/email notifications ✅
- [x] Rentals: Wire confirmation SMS/email notifications ✅
- [x] Installment: Wire payment reminder notifications ✅

### Priority 3 - Nice to Have (All Resolved ✓)
- [x] File Upload API: Implement VPS file upload endpoint ✅
- [x] File Upload: Integrate with CarForm, DocumentForm, RepairForm ✅
- [x] Image Compression: Add client-side compression ✅

---

*Document version 2.7 — Updated: April 2026 | Progress: 100% Complete - ALL FEATURES COMPLETE*

## Testing Results (Phase 4 QA - April 2026)

### Test Execution Summary
- **Total Tests**: 26
- **Passed**: 26 ✅
- **Failed**: 0 ❌

### Test Coverage
| Phase | Tests | Status |
|-------|-------|--------|
| Authentication & RBAC | 5 | ✅ All Pass |
| Core Modules (Cars, Customers, Employees, Documents) | 5 | ✅ All Pass |
| Sales Modules (Cash, Installment, Rental) | 7 | ✅ All Pass |
| Accounting & Reports | 4 | ✅ All Pass |
| Edge Cases | 5 | ✅ All Pass |

### Test Users Created
- `admin@dealership.com` / `admin123` - Admin
- `manager@test.com` / `test123` - Manager
- `accounts@test.com` / `test123` - Accounts Officer
- `sales@test.com` / `test123` - Sales Agent

### Test Data Created
- 5 Cars (various statuses)
- 2 Customers
- 2 Employees
- 1 Document (expiring in 7 days)
