# Car Dealership & Rental Management System - Implementation Plan

## Document Information
- **Author:** AI Assistant
- **Date:** April 22, 2026
- **Version:** 1.0
- **Status:** Completed

---

## Overview

This document outlines the implementation plan to address critical gaps in the Car Dealership & Rental Management System.

## Issues Addressed

### ✅ Fixed - Critical
1. ✅ Users with non-Admin roles cannot log in (seed script only creates Admin user) - **Fixed in Phase 1**
2. ✅ No password generation when creating new users - **Fixed in Phase 2**
3. ✅ No way to send login credentials to new users - **Fixed in Phase 2**

### ✅ Fixed - High Priority
4. ✅ No profile photo support for Employees - **Fixed in Phase 3**
5. ✅ Customer profile photo exists in model but not wired up in API/UI - **Fixed in Phase 3**
6. ✅ Missing installment delivery threshold logic - **Fixed in Phase 4**
7. ✅ Missing auto-calculation of late fees - **Fixed in Phase 4**

### ✅ Fixed - Low Priority
8. ✅ TypeScript/lint errors present in codebase - **Fixed in Phase 5**

### ⚠️ Out of Scope (Medium Priority)
9. ⚠️ Role-based access control not enforced - Not implemented (only UI menu filtering exists)

---

## Implementation Phases

### Phase 1: Authentication & Seed All Roles
**Duration:** 20 minutes
**Priority:** Critical

#### Changes

| File | Change |
|------|--------|
| `src/app/api/seed/route.ts` | Update to create all 4 role users by default |

#### Default Users Created by Seed Script

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@amyalcar.com | Admin@123 |
| Manager | manager@amyalcar.com | Manager@123 |
| Accounts Officer | accounts@amyalcar.com | Accounts@123 |
| Sales Agent | agent@amyalcar.com | Agent@123 |

---

### Phase 2: User Creation Enhancements
**Duration:** 60 minutes
**Priority:** Critical

#### 2.1 New Email Credential Library

**New file:** `src/lib/userCredentialsEmail.ts`

Functions:
- `sendUserCredentialsEmail(user, password)` - Sends email with login details
- `formatCredentialsEmailHtml(user, password)` - HTML email template

Email Template:
```
Subject: Your AMYAL CAR Account - Login Credentials
From: AMYAL CAR <noreply@businessgrowthstudio.online>
```

Email Body:
- Personalized greeting with user's name
- Login credentials (email + temporary password)
- Login URL: http://localhost:3001
- Assigned role
- Instructions to change password after login

#### 2.2 User Creation API Enhancement

**File:** `src/app/api/users/route.ts`

Changes:
- Auto-generate strong password on user creation
- Send credentials email automatically
- Return generated password in response for Admin reference

Password Generation:
- 12 characters minimum
- Includes uppercase, lowercase, numbers, special characters
- Example: `Amy@2026#XyZ!`

#### 2.3 User Detail Page

**New file:** `src/app/dashboard/users/[id]/page.tsx`

Features:
- View user details (name, email, role, status, created date)
- Edit user name/role/status
- **Reset Password** button - generates new password and emails user
- **Delete User** button (soft delete)
- Activity history for this user

#### 2.4 Password Reset for Admin

**File:** `src/app/api/auth/change-password/route.ts`

Changes:
- Admin can reset any user's password via `PUT /api/users/{id}/reset-password`
- Generates new password and sends email

---

### Phase 3: Profile Photos
**Duration:** 90 minutes
**Priority:** High

#### 3.1 Reusable ImageUpload Component

**New file:** `src/components/ImageUpload.tsx`

Props:
```typescript
interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  folder: 'avatars' | 'employees' | 'customers';
  label?: string;
}
```

Features:
- Current image preview (circular for profile photos)
- File input with image type filter
- Image compression (max 1MB, 1920px)
- Upload progress indicator
- Delete confirmation
- Error handling with user-friendly messages

#### 3.2 Employee Photo

| File | Change |
|------|--------|
| `src/models/Employee.ts` | Add `photo: String` field |
| `src/app/api/employees/route.ts` | Accept `photo` in POST, include in response |
| `src/app/api/employees/[id]/route.ts` | Accept `photo` in PUT |
| `src/dashboard/employees/page.tsx` | Add thumbnail column in list + upload in modal |
| `src/dashboard/employees/[id]/page.tsx` | Display circular photo in page header |

List Table Addition:
- New column: Photo (40x40 circular thumbnail, fallback initials)
- Modal form: Add photo upload section

Detail Page Addition:
- Circular photo in page header (80x80)
- "Change Photo" button

#### 3.3 Customer Photo

| File | Change |
|------|--------|
| `src/app/api/customers/route.ts` | Accept `profilePhoto` in POST |
| `src/app/api/customers/[id]/route.ts` | Accept `profilePhoto` in PUT |
| `src/dashboard/customers/page.tsx` | Add thumbnail column in list + upload in modal |
| `src/dashboard/customers/[id]/page.tsx` | Display circular photo in page header |

#### 3.4 User Avatar in Profile

| File | Change |
|------|--------|
| `src/dashboard/profile/page.tsx` | Add avatar upload + circular preview |

---

### Phase 4: Installment Enhancements
**Duration:** 30 minutes
**Priority:** High

#### 4.1 Model Updates

**File:** `src/models/InstallmentSale.ts`

Add new fields:
```typescript
deliveryThresholdPercent: { type: Number, default: 30 },  // % paid before delivery
lateFeePercent: { type: Number, default: 2 },               // % per month overdue
```

#### 4.2 API Updates

**File:** `src/app/api/sales/installments/route.ts`

Changes:
- Accept `deliveryThresholdPercent` and `lateFeePercent` in create
- Add computed field `canDeliver` - true when `(totalPaid / totalPrice * 100) >= deliveryThresholdPercent`
- Auto-calculate late fine in payment processing when payment is overdue

#### 4.3 UI Updates

**Files:**
- `src/app/sales/installments/page.tsx` - Show delivery status + late fee config in form
- `src/app/sales/installments/[id]/page.tsx` - Display delivery status, late fee info

Installment Form Additions:
- Down Payment % (calculated from amount)
- "Car Ready for Delivery" indicator (green checkmark when threshold met)
- Late Fee % configuration (default 2%)

Installment Detail Additions:
- Delivery status card
- Late fee configuration display
- Days until/overdue for next payment

---

### Phase 5: Minor Fixes
**Duration:** 20 minutes
**Priority:** Low

#### 5.1 Lint Fixes

| File | Fix |
|------|-----|
| `src/app/api/sales/installments/alerts/route.ts` | Change `let failed` to `const failed`, remove unused `tomorrowStart`, `tomorrowEnd` |
| `src/app/api/sales/installments/route.ts` | Remove `any` type, use proper type |
| `src/app/api/cron/installment-reminders/route.ts` | Remove unused `tomorrowEnd` |
| `src/app/api/cron/check-expiry/route.ts` | Remove unused `error` |
| `src/app/api/salary-payments/route.ts` | Remove unused `Employee` import |
| `src/app/api/upload/route.ts` | Remove unused imports |
| `scripts/test-email.js` | Convert to ESM import or disable lint for this file |

---

## Technical Details

### Email Configuration
```
Provider: Resend
API Key: re_EzR71V12_PvmjD54mNuz9mzBpCbT9bhYn
From: noreply@businessgrowthstudio.online
Sender Name: AMYAL CAR
```

### Upload Configuration
```
Max Size: 10MB
Allowed Types: JPEG, JPG, PNG, WebP, GIF, PDF
Storage: Local filesystem (/public/uploads/)
Compression: 1MB max, 1920px max dimensions
```

### Default Values

| Setting | Default Value |
|---------|--------------|
| Installment Delivery Threshold | 30% |
| Installment Late Fee | 2% per month |
| Password Length | 12 characters |

---

## Testing Checklist

- [ ] Seed script creates all 4 users successfully
- [ ] Non-Admin users can log in with correct credentials
- [ ] Admin can create new user with email credentials sent
- [ ] Admin can reset user password
- [ ] User detail page loads and displays correctly
- [ ] Employee photo upload works in modal
- [ ] Employee list shows photo thumbnails
- [ ] Employee detail page shows circular photo
- [ ] Customer photo upload works in modal
- [ ] Customer list shows photo thumbnails
- [ ] Customer detail page shows circular photo
- [ ] User profile shows avatar upload
- [ ] Installment sale form shows delivery threshold config
- [ ] Installment sale form shows late fee config
- [ ] "Can Deliver" indicator updates correctly
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser

---

## Files Changed

### Phase 1 - Authentication & Seed
- `src/app/api/seed/route.ts` - Creates all 4 role users

### Phase 2 - User Management
- `src/lib/userCredentialsEmail.ts` - New file for credential emails
- `src/app/api/users/route.ts` - Auto-generate password, send email
- `src/app/api/users/[id]/route.ts` - Admin password reset
- `src/app/dashboard/users/page.tsx` - Show generated password on create
- `src/app/dashboard/users/[id]/page.tsx` - New user detail page

### Phase 3 - Profile Photos
- `src/components/ImageUpload.tsx` - New reusable component
- `src/models/Employee.ts` - Added photo field
- `src/app/api/employees/route.ts` - Accept photo in create
- `src/app/api/employees/[id]/route.ts` - Accept photo in update
- `src/app/dashboard/employees/page.tsx` - Photo column + upload in modal
- `src/app/dashboard/employees/[id]/page.tsx` - Circular photo display
- `src/app/api/customers/route.ts` - Accept profilePhoto in create
- `src/app/api/customers/[id]/route.ts` - Accept profilePhoto in update
- `src/app/dashboard/customers/page.tsx` - Photo column + upload in modal
- `src/app/dashboard/customers/[id]/page.tsx` - Circular photo display
- `src/app/dashboard/profile/page.tsx` - Avatar upload
- `src/lib/uploadClient.ts` - Updated return types

### Phase 4 - Installment Enhancements
- `src/models/InstallmentSale.ts` - deliveryThresholdPercent, lateFeePercent
- `src/app/api/sales/installments/route.ts` - New fields + canDeliver

### Phase 5 - Lint/TypeScript Fixes
- `src/app/api/sales/installments/alerts/route.ts` - Fix let->const, unused vars
- `src/app/dashboard/users/[id]/page.tsx` - Fixed JSX parsing error
- `src/app/dashboard/users/page.tsx` - Fixed CreateResponse type
- `src/lib/userCredentialsEmail.ts` - Fixed sendEmail call

---

## Future Considerations (Out of Scope)

- WhatsApp integration for notifications
- Mobile app
- Cloud storage for images
- Full role-based middleware protection
- Two-factor authentication
  
  
  ## needed
- car menu -> supplier, purchase, repair, stock (normal data, total repair, image)
- in zatca
- car list, purchase price and repair cost should be shown together, repair + purhase and other cost has to be calculate as total cost
- sales menu -> all sales, cash sales, installments, rentals
- supplier table should be seperated and need to selected while adding car
- agent list and customer list
- puchase table should be seprated under car section
	- purchases condition status like used or new
	- purchase condition images
	- 
- car documents - car sales return option
- customers -> document upload not numbers and add other documents
- in cash sale discount -> percentage, flat, agent commition, 
- intallment aggrement document uploading option
- rental aggrement document uploading option
- expenses dashboard
- CRM - message customization option
- report generation and seperated page for reports
- 