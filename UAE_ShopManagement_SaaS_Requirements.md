# 📋 Requirements Engineering Document
## UAE Shop Management SaaS Platform

> **Version:** 1.0  
> **Date:** April 2026  
> **Target Market:** United Arab Emirates (All 7 Emirates)  
> **Delivery Mode:** Cloud-only SaaS · Web Browser · Flat Monthly Subscription  
> **Sprint Target:** 20-Day Vibe Coding MVP  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Research & Context](#2-market-research--context)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [User Personas](#4-user-personas)
5. [Business Requirements](#5-business-requirements)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [UAE-Specific Compliance Requirements](#8-uae-specific-compliance-requirements)
9. [System Architecture Overview](#9-system-architecture-overview)
10. [Module Breakdown](#10-module-breakdown)
11. [Monetization & Pricing Model](#11-monetization--pricing-model)
12. [MVP Scope (20-Day Sprint)](#12-mvp-scope-20-day-sprint)
13. [Post-MVP Roadmap](#13-post-mvp-roadmap)
14. [Risk Register](#14-risk-register)
15. [Glossary](#15-glossary)

---

## 1. Executive Summary

This document defines the complete requirements for a **cloud-based, full-ERP Shop Management SaaS** tailored for UAE shop owners across all retail verticals — grocery, fashion, electronics, F&B, and pharmacy. The platform will serve businesses of all sizes (solo kiosks to multi-branch chains) and operate entirely in a web browser with bilingual Arabic/English support and full UAE regulatory compliance (VAT, FTA, WPS, Corporate Tax).

The UAE retail sector was valued at **USD 30.17 billion in 2023** and is projected to grow at **6.2% CAGR through 2029**, making it a high-opportunity market for a localized, modern SaaS solution. The platform will be monetized via flat monthly subscriptions tiered by feature depth and number of branches.

---

## 2. Market Research & Context

### 2.1 UAE Retail Market Snapshot

| Metric | Value |
|---|---|
| Retail Market Size (2023) | USD 30.17 Billion |
| Projected CAGR (2025–2029) | 6.2% |
| Digital Payment Preference (2025) | 68% of consumers |
| Contactless Transaction Share | 84% of all in-store transactions |
| Mobile Wallet Penetration | 46% of population (2024) |
| Cash Share at POS | ~17% (down from 67% in 2019) |
| UAE Cashless Economy Target | 2030 |

### 2.2 Payment Landscape

UAE consumers use a diverse set of payment methods that the platform must support tracking for:

| Method | Share / Notes |
|---|---|
| Credit / Debit Cards | 37–38% POS share; dominant today |
| Digital Wallets | Apple Pay, Google Pay, Samsung Pay, Careem Pay, Payit, Klip — fastest growing |
| Cash | ~17% POS; still used in souks, small vendors, and street shops |
| Bank Transfer | ~11% (common for B2B) |
| BNPL (Buy Now Pay Later) | Tabby, Tamara — triple-digit growth; growing fast |
| Crypto | Early adoption; used in some Dubai real estate and premium retail |

> **Key Insight:** By 2027, digital wallets are projected to become the leading payment method both online and in-store. The platform must be ready to record and report on all of these.

### 2.3 Competitor Landscape in UAE

| Competitor | Weakness / Gap |
|---|---|
| PACT RevenU | Expensive, enterprise-focused, complex onboarding |
| Focus Softnet ERP | Heavy ERP not suited for small shops |
| RetailersPOS | Limited ERP depth (no HR/payroll) |
| TallyPrime | Offline-first; poor UX; India-centric |
| Zoho Books | Not a full shop management tool; lacks POS |
| SowaanERP | Good features but poor UX for non-tech owners |

> **Opportunity:** No single UAE-native SaaS product covers all shop types, all sizes, in a modern web-first UX with full Arabic RTL support, FTA compliance, and built-in HR/payroll at an SME-friendly price point.

### 2.4 Key UAE Market Challenges

- **Diverse workforce:** Shops are staffed by a highly multinational workforce (South Asian, Filipino, Arab, Western). HR must handle multi-nationality payroll rules.
- **Multi-emirate operations:** Businesses often have branches in multiple emirates with different municipal fee structures.
- **Tourism traffic:** High tourist volume means multi-currency recording at POS is important even if settlement is in AED.
- **Ramadan / seasonal patterns:** Significant sales spikes during Ramadan, DSF (Dubai Shopping Festival), and national holidays require promotional tooling.
- **Expat-owned businesses:** Many shop owners are expats unfamiliar with UAE tax rules — the software must guide them, not just comply silently.

---

## 3. Stakeholder Analysis

| Stakeholder | Role | Interest | Influence |
|---|---|---|---|
| Shop Owner | Primary User | Full visibility into business | High |
| Shop Manager | Daily Operator | Operational efficiency | High |
| Cashier / Sales Staff | POS User | Simple, fast checkout | High |
| Accountant / Bookkeeper | Financial User | VAT reports, reconciliation | Medium |
| HR Manager | Admin User | Payroll, attendance | Medium |
| FTA (Federal Tax Authority) | Regulator | VAT & tax compliance | High |
| UAE Ministry of HR | Regulator | WPS compliance | Medium |
| Customers (shoppers) | End Beneficiary | Fast service, receipts | Low |
| SaaS Team (us) | Builder | Adoption, revenue | High |

---

## 4. User Personas

### Persona 1 — Ahmed Al Mansoori, Solo Grocery Owner (Dubai)
- **Age:** 42 | **Tech level:** Low–Medium
- Runs a small grocery in Al Quoz. Has 3 staff, all South Asian. Speaks Arabic primarily.
- **Needs:** Simple billing, inventory alerts, basic VAT invoicing, WhatsApp receipt sharing.
- **Pain:** Currently uses a mix of Excel and a paper ledger. Scared of losing data.

### Persona 2 — Priya Sharma, Fashion Boutique Owner (Sharjah)
- **Age:** 34 | **Tech level:** Medium–High
- Owns two fashion stores. Has 8 staff. Sells online via Instagram too.
- **Needs:** Multi-branch view, loyalty program, staff scheduling, sales reports, social commerce tracking.
- **Pain:** Can't see consolidated reports across both branches. Instagram orders tracked separately.

### Persona 3 — James O'Brien, Electronics Chain GM (Abu Dhabi)
- **Age:** 51 | **Tech level:** High
- Manages 5 electronics stores. Reports to board monthly.
- **Needs:** Full ERP — procurement, HR, payroll, detailed analytics, role-based access, audit logs.
- **Pain:** Current ERP is expensive, slow, and support team is overseas.

### Persona 4 — Fatima Hassan, Pharmacy Manager (Ajman)
- **Age:** 38 | **Tech level:** Medium
- Manages a pharmacy. Handles expiry tracking, controlled medications log, and insurance billing.
- **Needs:** Expiry date tracking, batch/serial number management, supplier management.
- **Pain:** Stock nearly expired twice. No alerts system.

---

## 5. Business Requirements

### BR-01 — Market Coverage
The system must serve all UAE retail verticals: grocery/supermarket, fashion & apparel, electronics, restaurants & F&B, and pharmacy.

### BR-02 — Size Scalability
The system must support single-location micro-businesses (1 user) and scale to multi-branch enterprises (100+ users, 50+ locations).

### BR-03 — Language
Full bilingual support in Arabic (RTL layout) and English (LTR layout), switchable per user session.

### BR-04 — Regulatory Compliance
Must be compliant with: UAE VAT (5%), FTA audit requirements, UAE Corporate Tax, WPS (Wage Protection System), and PDPL (Personal Data Protection Law).

### BR-05 — Subscription Revenue
Monetize via flat monthly subscriptions tiered by features and branch count. No per-transaction fees.

### BR-06 — Web-Only Delivery
Accessible via any modern web browser (Chrome, Safari, Firefox, Edge). No native app required for MVP.

### BR-07 — UAE Currency
All financial figures must be denominated in AED (UAE Dirham) by default. Support display of multi-currency for reference (tourist transactions, imports).

---

## 6. Functional Requirements

### 6.1 Point of Sale (POS)

| ID | Requirement |
|---|---|
| F-POS-01 | Process sales transactions with product search by name, barcode, or SKU |
| F-POS-02 | Support cash, card, digital wallet, split payment, and credit (store account) payment methods |
| F-POS-03 | Apply item-level and cart-level discounts (percentage or flat amount) |
| F-POS-04 | Issue FTA-compliant VAT invoices (simplified and full tax invoices) |
| F-POS-05 | Support VAT-inclusive and VAT-exclusive pricing display |
| F-POS-06 | Print receipts via thermal printer or share via WhatsApp / email |
| F-POS-07 | Process refunds and exchanges with reason codes |
| F-POS-08 | End-of-day cash drawer reconciliation report |
| F-POS-09 | Hold / park a sale and resume it later |
| F-POS-10 | Apply loyalty points at checkout |
| F-POS-11 | Support multi-currency recording (display in foreign currency, settle in AED) |
| F-POS-12 | Quick keys / favorites for fast-moving products |

### 6.2 Inventory Management

| ID | Requirement |
|---|---|
| F-INV-01 | Add, edit, and categorize products with name, SKU, barcode, category, unit of measure |
| F-INV-02 | Real-time stock level tracking per product per branch |
| F-INV-03 | Low-stock and out-of-stock alerts (configurable threshold per product) |
| F-INV-04 | Expiry date and batch/lot number tracking (critical for pharmacy & F&B) |
| F-INV-05 | Serial number tracking for high-value items (electronics) |
| F-INV-06 | Stock transfer between branches |
| F-INV-07 | Stocktake / physical count reconciliation tool |
| F-INV-08 | Automatic purchase order generation on reorder trigger |
| F-INV-09 | Product variants (size, color, weight) |
| F-INV-10 | Barcode generation and printing |
| F-INV-11 | FIFO / LIFO / weighted average cost methods |
| F-INV-12 | Import products in bulk via CSV/Excel |

### 6.3 Purchase & Supplier Management

| ID | Requirement |
|---|---|
| F-PUR-01 | Maintain a supplier database (name, contact, TRN number, payment terms) |
| F-PUR-02 | Create, send, and track Purchase Orders (POs) |
| F-PUR-03 | Receive goods against POs with partial delivery support |
| F-PUR-04 | Record supplier invoices and match to POs (3-way match) |
| F-PUR-05 | Track supplier payments and outstanding balances |
| F-PUR-06 | Record input VAT on purchases for FTA reclaim |
| F-PUR-07 | Supplier performance reporting (lead times, order accuracy) |

### 6.4 Customer Relationship Management (CRM)

| ID | Requirement |
|---|---|
| F-CRM-01 | Customer database with name, contact, nationality, birthday, purchase history |
| F-CRM-02 | Loyalty points program (earn on purchase, redeem at POS) |
| F-CRM-03 | Customer segmentation by spend, frequency, nationality, or location |
| F-CRM-04 | Send promotional SMS / WhatsApp / email campaigns to customer segments |
| F-CRM-05 | Gift voucher creation and redemption |
| F-CRM-06 | Track customer complaints and service requests |
| F-CRM-07 | Customer credit / store account management |
| F-CRM-08 | Birthday and anniversary automated messages |

### 6.5 Accounting & Finance

| ID | Requirement |
|---|---|
| F-ACC-01 | Double-entry bookkeeping ledger |
| F-ACC-02 | Chart of accounts customizable to business type |
| F-ACC-03 | Automated VAT calculation on all sales and purchases |
| F-ACC-04 | VAT Return report generation (ready for FTA submission) |
| F-ACC-05 | Profit & Loss statement (monthly, quarterly, annual) |
| F-ACC-06 | Balance Sheet generation |
| F-ACC-07 | Cash flow statement |
| F-ACC-08 | Accounts Receivable & Payable aging reports |
| F-ACC-09 | Bank reconciliation tool |
| F-ACC-10 | Expense tracking and categorization |
| F-ACC-11 | Multi-branch consolidated financial reports |
| F-ACC-12 | UAE Corporate Tax report support |
| F-ACC-13 | FTA-compliant tax invoice numbering (sequential, no gaps) |
| F-ACC-14 | Export financial data to Excel / PDF |

### 6.6 HR & Employee Management

| ID | Requirement |
|---|---|
| F-HR-01 | Employee profiles (name, nationality, visa/Emirates ID, role, department, joining date) |
| F-HR-02 | Work schedule and shift management |
| F-HR-03 | Attendance tracking (manual or via integration with biometric device) |
| F-HR-04 | Leave management (annual, sick, emergency leave types) |
| F-HR-05 | Performance tracking and notes |
| F-HR-06 | Document storage (visa, passport, contract scans) |
| F-HR-07 | Visa and permit expiry alerts |
| F-HR-08 | Role-based access control (owner, manager, cashier, accountant, HR admin) |

### 6.7 Payroll

| ID | Requirement |
|---|---|
| F-PAY-01 | Monthly payroll run with basic salary, allowances, and deductions |
| F-PAY-02 | Overtime calculation |
| F-PAY-03 | End of Service Gratuity (EOSB) calculation per UAE Labour Law |
| F-PAY-04 | WPS (Wage Protection System) compatible SIF file export |
| F-PAY-05 | Payslip generation (PDF, shareable via email/WhatsApp) |
| F-PAY-06 | Payroll history and audit trail |
| F-PAY-07 | Commission calculation for sales staff |

### 6.8 Reporting & Analytics

| ID | Requirement |
|---|---|
| F-RPT-01 | Real-time sales dashboard (today, this week, this month) |
| F-RPT-02 | Sales by product, category, branch, staff member, time period |
| F-RPT-03 | Top-selling and slow-moving products report |
| F-RPT-04 | Inventory valuation report |
| F-RPT-05 | Customer purchase behavior analytics |
| F-RPT-06 | Staff performance report (sales per cashier) |
| F-RPT-07 | Promotional campaign performance report |
| F-RPT-08 | Profit margin analysis by product and category |
| F-RPT-09 | Seasonal / Ramadan sales comparison report |
| F-RPT-10 | Export all reports to PDF and Excel |

### 6.9 Multi-Branch Management

| ID | Requirement |
|---|---|
| F-MB-01 | Add and manage unlimited branches from a single admin panel |
| F-MB-02 | Branch-level access control (staff only see their branch) |
| F-MB-03 | Head-office view: consolidated reports across all branches |
| F-MB-04 | Inter-branch stock transfers with approval workflow |
| F-MB-05 | Branch-specific pricing and promotions |

### 6.10 Promotions & Discounts

| ID | Requirement |
|---|---|
| F-PRO-01 | Create time-bound promotions (e.g., Ramadan sale, DSF discounts) |
| F-PRO-02 | Buy-X-get-Y offers |
| F-PRO-03 | Bundle pricing |
| F-PRO-04 | Discount approval workflow (cashier requests, manager approves) |
| F-PRO-05 | Coupon/voucher code management |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement |
|---|---|
| NF-PERF-01 | POS checkout must complete in under 2 seconds |
| NF-PERF-02 | Dashboard must load in under 3 seconds for up to 10,000 products |
| NF-PERF-03 | System must support 500 concurrent users per tenant without degradation |
| NF-PERF-04 | Reports for 12-month data range must generate in under 10 seconds |

### 7.2 Reliability & Availability

| ID | Requirement |
|---|---|
| NF-REL-01 | 99.9% uptime SLA (max ~8.7 hours downtime/year) |
| NF-REL-02 | Automatic daily database backups with 30-day retention |
| NF-REL-03 | Data hosted in UAE or GCC region (data residency compliance) |
| NF-REL-04 | Graceful error handling — no data loss on browser crash or network drop |

### 7.3 Security

| ID | Requirement |
|---|---|
| NF-SEC-01 | All data encrypted at rest (AES-256) and in transit (TLS 1.3) |
| NF-SEC-02 | Multi-factor authentication (MFA) for owner and admin roles |
| NF-SEC-03 | Role-based access control — no user sees data beyond their permission scope |
| NF-SEC-04 | Full audit log of all data changes (who changed what and when) |
| NF-SEC-05 | Automatic session timeout after 30 minutes of inactivity |
| NF-SEC-06 | PDPL (UAE Personal Data Protection Law) compliant data handling |
| NF-SEC-07 | Penetration testing before production launch |

### 7.4 Usability

| ID | Requirement |
|---|---|
| NF-USE-01 | Full RTL (right-to-left) layout when Arabic is selected |
| NF-USE-02 | POS interface operable by a new cashier within 15 minutes of training |
| NF-USE-03 | WCAG 2.1 AA accessibility compliance |
| NF-USE-04 | Responsive design supporting screen sizes from 13" laptop to 27" desktop |
| NF-USE-05 | All UI labels, tooltips, error messages, and reports in both Arabic and English |

### 7.5 Scalability

| ID | Requirement |
|---|---|
| NF-SCL-01 | Architecture must support horizontal scaling as tenant count grows |
| NF-SCL-02 | Multi-tenant SaaS design with strict data isolation between tenants |
| NF-SCL-03 | Product catalog must support up to 1 million SKUs per tenant |

### 7.6 Integrations

| ID | Requirement |
|---|---|
| NF-INT-01 | REST API for third-party integrations |
| NF-INT-02 | Webhook support for real-time event notifications |
| NF-INT-03 | Thermal receipt printer support (ESC/POS protocol) |
| NF-INT-04 | Barcode scanner support (USB HID) |
| NF-INT-05 | Payment terminal integration (network-based, for card/NFC) |
| NF-INT-06 | WhatsApp Business API for receipt and marketing messages |
| NF-INT-07 | E-commerce platform connectors (Shopify, WooCommerce) — Phase 2 |
| NF-INT-08 | UAE banking API for bank reconciliation — Phase 2 |

---

## 8. UAE-Specific Compliance Requirements

### 8.1 VAT (Value Added Tax)

- **Rate:** 5% standard rate on most goods and services
- **Registration Threshold:** AED 375,000 annual taxable turnover (mandatory); AED 187,500 (voluntary)
- **Filing:** Quarterly VAT return via FTA's EmaraTax portal (due 28 days after period end)
- **Invoicing:**
  - **Simplified Tax Invoice:** for transactions under AED 10,000 (retail common)
  - **Full Tax Invoice:** for B2B transactions over AED 10,000; must include seller TRN, buyer TRN, itemized VAT
  - Both must be available in Arabic or with Arabic translation
  - Invoice numbers must be sequential with no gaps
- **Record Keeping:** All invoices and tax records must be retained for **minimum 5 years**
- **FTA Penalties:** Late filing = 2% of unpaid tax; failure to keep records = up to AED 20,000

**System Requirements:**
- Auto-calculate VAT on each line item at POS and on purchase invoices
- Generate VAT Return summary report (Output Tax, Input Tax, Net VAT payable)
- Lock and archive finalized VAT return periods
- Support VAT-exempt and zero-rated product categories
- Display TRN on all invoices

### 8.2 UAE Corporate Tax (CT)

- **Rate:** 9% on taxable income above AED 375,000 (effective June 2023)
- **Free Zone Entities:** May qualify for 0% rate under qualifying income rules
- System must support generating income data in CT-report-ready format

### 8.3 Wage Protection System (WPS)

- UAE Central Bank mandate requiring private sector salaries paid via CBUAE-approved channels
- System must generate a **SIF (Salary Information File)** in the standard WPS format for bank submission
- SIF fields: Employee ID, Emirates ID, Bank Account, Salary Amount, Payment Date

### 8.4 UAE Labour Law — Gratuity

- Employees completing 1+ year are entitled to End of Service Gratuity (EOSB)
- Calculation: 21 days' basic salary per year for first 5 years; 30 days per year thereafter
- System must auto-calculate and accrue EOSB per employee

### 8.5 PDPL (Personal Data Protection Law)

- Consent must be captured before storing customer personal data
- Customers have the right to request data deletion
- Data breach notification required within 72 hours
- System must log all access to personal data

### 8.6 Bilingual Legal Requirements

- Tax invoices must be available in Arabic or with certified Arabic translation
- VAT reports must be accepted in Arabic or English by the FTA
- System must produce all compliance documents in both languages

---

## 9. System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Web Browser (Client)               │
│         React / Next.js · RTL/LTR Switching          │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS / REST / WebSocket
┌───────────────────────▼─────────────────────────────┐
│                   API Gateway / BFF                  │
│          Auth · Rate Limiting · Tenant Routing       │
└──┬──────────────┬────────────┬───────────────────────┘
   │              │            │
┌──▼───┐    ┌────▼────┐  ┌────▼──────┐
│ POS  │    │  ERP    │  │  Reporting│
│Service│   │Services │  │  Service  │
└──┬───┘    └────┬────┘  └────┬──────┘
   │              │            │
┌──▼──────────────▼────────────▼──────────────────────┐
│          PostgreSQL (per-tenant schema)               │
│   + Redis (cache/sessions) + S3 (file storage)       │
└─────────────────────────────────────────────────────┘
```

**Tech Stack Recommendation (for 20-day sprint):**

| Layer | Recommended Stack |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS + shadcn/ui (RTL via `dir="rtl"`) |
| Backend | Node.js + Express or Fastify |
| Database | PostgreSQL (Supabase for rapid development) |
| Auth | Supabase Auth or Clerk (MFA built-in) |
| File Storage | Supabase Storage or AWS S3 |
| Hosting | Vercel (frontend) + Railway or Supabase (backend) |
| Email/SMS | Resend (email) + Twilio or WhatsApp Business API |
| Payments (for subscriptions) | Stripe |

---

## 10. Module Breakdown

### Priority Tiers

| Tier | Modules | Sprint |
|---|---|---|
| 🔴 Core (Must Have) | POS, Inventory, VAT Invoicing, Basic Reporting, Auth & Multi-user | 20-Day MVP |
| 🟡 Important (Should Have) | Accounting, CRM, Supplier/Purchase, Multi-Branch, HR | Phase 2 (Month 2–3) |
| 🟢 Advanced (Nice to Have) | Payroll/WPS, Advanced Analytics, E-commerce Integration, Loyalty | Phase 3 (Month 4–6) |

---

## 11. Monetization & Pricing Model

### Flat Monthly Subscription Tiers

| Tier | Name | Price (AED/month) | Target | Key Limits |
|---|---|---|---|---|
| 1 | **Starter** | 99 | Solo kiosk / 1 branch | 1 user, 1 branch, POS + basic inventory |
| 2 | **Growth** | 299 | Small shops 2–10 staff | 5 users, 1 branch, + CRM + accounting |
| 3 | **Pro** | 699 | Medium shops / 2–5 branches | 20 users, 5 branches, full ERP except payroll |
| 4 | **Enterprise** | Custom | Chains / 5+ branches | Unlimited users & branches, payroll, WPS, dedicated support |

**Additional Revenue Streams:**
- Setup / onboarding fee: AED 500 one-time (optional)
- WhatsApp messaging credits (usage-based, on top of subscription)
- Premium support package: AED 200/month

**Free Trial:** 14-day free trial on any tier, no credit card required.

---

## 12. MVP Scope (20-Day Sprint)

> Focus: Get a working, sellable core product live. Cut everything that isn't essential for a shop owner to replace pen-and-paper on day one.

### ✅ IN SCOPE for 20-Day MVP

**Authentication & Onboarding**
- Sign up with email + password
- Business setup wizard (name, type, currency AED, VAT TRN entry)
- Invite team members with roles (Owner, Manager, Cashier)

**POS**
- Product search and add to cart
- Cash and card payment recording
- Apply discount (percentage)
- FTA-compliant receipt (simplified tax invoice) — print and/or share link
- End-of-day summary

**Inventory**
- Add/edit/delete products (name, SKU, price, VAT rate, stock quantity)
- Low stock alert (email notification)
- Basic stock adjustment (manual correction)

**VAT & Invoicing**
- Auto-apply 5% VAT on taxable items
- Simplified and full tax invoice PDF generation
- VAT summary report (output tax for the period)

**Basic Reporting Dashboard**
- Today's sales total
- This month's sales total
- Top 5 selling products
- Current stock value

**Settings**
- Business profile (name, logo, address, TRN)
- User management
- Language toggle (Arabic / English)

### ❌ OUT OF SCOPE for MVP (Phase 2+)
- Accounting ledger & full financials
- CRM & loyalty program
- Supplier & purchase orders
- HR & payroll / WPS
- Multi-branch management
- Advanced analytics
- E-commerce integrations
- Promotions engine

---

## 13. Post-MVP Roadmap

| Phase | Months | Deliverables |
|---|---|---|
| **Phase 2** | Month 2–3 | Full accounting, CRM, purchase management, multi-branch, customer database |
| **Phase 3** | Month 4–5 | HR module, payroll, WPS SIF export, EOSB calculator, employee self-service |
| **Phase 4** | Month 5–6 | Loyalty program, promotions engine, WhatsApp marketing |
| **Phase 5** | Month 6–9 | E-commerce integrations, mobile PWA, open REST API, banking integrations |
| **Phase 6** | Month 9–12 | AI-powered demand forecasting, auto-reordering, AI-based sales insights |

---

## 14. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | FTA changes VAT rules or invoice format | Medium | High | Subscribe to FTA RSS/newsletter; modular invoicing engine |
| R-02 | Competitor launches similar product | High | Medium | Move fast; focus on UX and Arabic-first experience |
| R-03 | Data breach / PDPL violation | Low | Very High | End-to-end encryption, audit logs, penetration testing |
| R-04 | 20-day sprint produces buggy POS | High | High | Define MVP scope ruthlessly; build POS first; test daily |
| R-05 | Low Arabic RTL quality | Medium | High | Use proven RTL-ready component libraries; test with native Arabic users |
| R-06 | Stripe not available in UAE | Low | High | Use Stripe Atlas or PayTabs / Telr as payment gateway alternative |
| R-07 | Shops require offline mode | Medium | Medium | Communicate cloud-only clearly at signup; add offline mode in Phase 5 |
| R-08 | WPS SIF file format changes | Low | Medium | Version-controlled SIF exporter; monitor Central Bank announcements |

---

## 15. Glossary

| Term | Definition |
|---|---|
| **AED** | UAE Dirham — official currency of the UAE |
| **FTA** | Federal Tax Authority — UAE government body overseeing VAT and corporate tax |
| **TRN** | Tax Registration Number — unique identifier for VAT-registered UAE businesses |
| **VAT** | Value Added Tax — 5% consumption tax introduced in UAE January 2018 |
| **WPS** | Wage Protection System — UAE Central Bank system mandating electronic salary payments |
| **SIF** | Salary Information File — WPS-standard file format for payroll submission |
| **EOSB** | End of Service Benefit (Gratuity) — statutory payment to employees upon contract end |
| **PDPL** | Personal Data Protection Law — UAE data privacy regulation |
| **RTL** | Right-to-Left — text direction for Arabic language rendering |
| **POS** | Point of Sale — the system and interface used to process retail transactions |
| **SKU** | Stock Keeping Unit — unique product identifier |
| **DSF** | Dubai Shopping Festival — major annual retail event with heavy discounting |
| **BNPL** | Buy Now Pay Later — deferred payment schemes like Tabby and Tamara |
| **CBUAE** | Central Bank of the UAE |
| **Multi-tenant** | SaaS architecture where multiple customers share the same infrastructure with strict data isolation |
| **SaaS** | Software as a Service — cloud-hosted subscription software model |

---

*Document prepared for internal product development. All market figures sourced from Worldpay, Mastercard, Statista, and UAE Federal Tax Authority publications (2024–2026).*
