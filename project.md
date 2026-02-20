# Enterprise ISP Application System — Unified PRD

## 1. Objective
Build a dynamic, enterprise-grade web application that conditionally collects applicant data and mandatory supporting documents based on the selected internet plan and organization type. The system stores structured data and file paths in MariaDB, captures digital signatures, saves files locally (or S3-compatible storage if upgraded), and automatically maps data and signatures onto pre-existing PDF application forms for administrative download and packaging.

---

## 2. System Architecture & Technical Stack

**Framework**: Next.js (App Router, Server Actions)

**Database**: MariaDB

**ORM**: Prisma ORM  
- Strong typing
- Safe relational modeling
- Transaction support for file + DB consistency

**Form Engine**: React Hook Form + Zod  
- Conditional rendering and validation without performance penalties

**Digital Signature Capture**: react-signature-canvas  
- Outputs Base64 PNG

**File Handling & Storage**:
- Upload handling via Next.js `FormData` (Server Actions)
- Local storage via Node.js `fs/promises`
- Default directories:
  - `/var/www/uploads/signatures/`
  - `/var/www/uploads/documents/`

**PDF Manipulation**: pdf-lib  
- Load existing blank PDF templates (BCIF, FiberBiz, Affordaboost)
- Map text fields
- Embed signature images at exact coordinates
- Flatten PDFs before delivery

**Packaging**: archiver or jszip  
- Bundle generated PDFs + uploaded attachments into a single ZIP

---

## 3. Core Features & Business Logic

### 3.1 Dynamic Front-End Form Engine
The application form is driven by a state machine — never static HTML.

#### Trigger 1: Plan Selection
**Options**:
- SME FiberBiz 100Mbps
- SME FiberBiz 300Mbps
- Affordaboost 500Mbps

**Effect**:
- Determines the target PDF template used during generation

#### Trigger 2: Organization Type
**Options**:
- Sole Proprietorship
- Partnership
- Corporation
- Cooperative

**Effect**:
- Determines required text fields
- Determines mandatory document uploads

#### Required Fields (Common)
- Registered Business Name
- Trade Name
- Business Address
- Billing Address
- Authorized Signatory:
  - Full Name
  - Designation
  - Contact Number
  - Email
  - ID Type
  - ID Number

---

### 3.2 Conditional Document Requirements

#### IF Sole Proprietorship
- Mayor’s Permit
- DTI Registration
- Valid ID with 3 Specimen Signatures

#### IF Corporation
- SEC Registration
- Corporate Secretary’s Certificate / Board Resolution
- Valid ID with 3 Specimen Signatures

#### IF Cooperative
- CDA Registration
- Board Resolution
- Valid ID of Authorized Signatory with 3 Specimen Signatures

Validation is enforced both client-side (Zod) and server-side (Server Actions).

---

### 3.3 Digital Signature Capture

- Dedicated canvas for digital signature (for the PDF form itself)
- Clear/reset functionality
- Signature is captured as Base64 PNG

**Important Distinction**:
- Digital canvas signature ≠ uploaded ID with specimen signatures
- Canvas signature is embedded directly into the generated PDF

---

### 3.4 Data Submission & Storage Flow

1. User submits form (text + files + Base64 signature)
2. Next.js Server Action receives payload
3. Server validates conditional requirements

**Signature Processing**:
- Decode Base64 PNG
- Save to `/uploads/signatures/` using UUID filename

**File Upload Processing**:
- Sanitize and rename files:
  - `[APP_UUID]_[DOC_TYPE]_[TIMESTAMP].ext`
- Save to `/uploads/documents/`

**Database Transaction**:
- Single `prisma.$transaction`:
  1. Insert application
  2. Insert signatory
  3. Insert attachment rows
- If file write fails → DB rollback

---

## 4. Admin PDF Generation & Download Flow

### 4.1 Application PDF Generation

1. Admin opens protected route `/admin/applications`
2. Selects an application → clicks **Download Package**
3. Server:
   - Fetches application + signatory + attachments from MariaDB
   - Loads correct PDF template based on plan
   - Maps text fields to PDF form fields
   - Embeds digital signature PNG at fixed X/Y coordinates
   - Flattens PDF

---

### 4.2 ZIP Package Delivery

- Generated PDF
- All uploaded supporting documents

Packaged as:
```
Application-[BusinessName].zip
```

ZIP is streamed directly to the admin browser.

---

## 5. Database Schema (MariaDB)

### Table: `applications`
- `id` (UUID, PK)
- `plan_type` (ENUM: FIBERBIZ_100, FIBERBIZ_300, AFFORDABOOST_500)
- `org_type` (ENUM: SOLE_PROP, PARTNERSHIP, CORP, COOP)
- `business_name` (VARCHAR)
- `status` (ENUM: PENDING, APPROVED, REJECTED)
- `created_at` (TIMESTAMP)

### Table: `signatories`
- `id` (UUID, PK)
- `application_id` (FK → applications.id)
- `full_name` (VARCHAR)
- `designation` (VARCHAR)
- `digital_signature_path` (VARCHAR)

### Table: `attachments`
- `id` (UUID, PK)
- `application_id` (FK → applications.id)
- `doc_type` (ENUM: MAYORS_PERMIT, DTI, SEC, CDA, BOARD_RES, SEC_CERT, BIO_PAGE_ID, SPECIMEN_SIGS)
- `file_path` (VARCHAR)
- `original_filename` (VARCHAR)
- `uploaded_at` (TIMESTAMP)

---

## 6. Implementation Roadmap

### Phase 1: Backend & Database
- Initialize Next.js project
- Configure Prisma + MariaDB
- Create schema & migrations

### Phase 2: Dynamic Form Engine
- Build React Hook Form components
- Implement conditional Zod schemas
- Real-time field + upload toggling

### Phase 3: Signature & File Storage
- Implement signature canvas
- Decode and persist Base64 PNG
- Process and store uploaded documents

### Phase 4: PDF Automation
- Map PDF field coordinates
- Inject text + signature via pdf-lib
- Flatten and stream PDF

### Phase 5: Admin Dashboard
- Secure admin routes
- Application listing table
- Download Package (PDF + attachments ZIP)

---

## 7. Non-Negotiable Engineering Principles
- No static forms
- No blob storage in DB
- All writes are transactional
- PDF output must be non-editable
- Admin downloads must be one-click, zero manual assembly

