# Enterprise ISP Application System

A Next.js application designed to streamline the ISP application process for enterprise clients. It features dynamic form generation, digital signature capturing, automated PDF mapping/generation, and an admin dashboard for pipeline management and configuration.

## Key Features

*   **Dynamic Application Forms**: Interactive forms with conditional fields and document uploads using React Hook Form and Zod validation.
*   **Digital Signatures**: Built-in signature canvas to capture client signatures as base64 images securely.
*   **Automated PDF Generation**: Maps form responses onto official ISP PDF templates (like BCIF) using `pdf-lib`.
*   **Interactive PDF Mapper UI**: A dedicated admin interface (`/admin/graph`) to visually drag, drop, and map field coordinates onto new PDF form templates and save configurations dynamically.
*   **Admin Dashboard**: Manage applications, download completed forms with zipped attachments, and manage PDF mappings.

## Technology Stack

*   **Framework**: Next.js (App Router)
*   **Database**: MariaDB with Prisma ORM
*   **Forms & Validation**: React Hook Form, Zod
*   **PDF Manipulation**: `pdf-lib`
*   **Styling**: Tailwind CSS

## Project Status

**Completed Phases:**
1.  **Backend & Database**: Next.js initialized, Prisma + MariaDB configured, schemas and migrations established.
2.  **Dynamic Form Engine**: React Hook Form components built, conditional schemas implemented, real-time toggling active.
3.  **Signature & File Storage**: Signature canvas implemented, Base64 PNG decoding working, document upload processing active.
4.  **PDF Automation**: PDF field coordinates mapped, text and signature injected via `pdf-lib`, flatten and stream functions verified.
5.  **Admin Dashboard**: Admin routes secured, application listing table built, package download (PDF + ZIP) implemented.
6.  **PDF Coordinate Mapper UI**: `/admin/graph` interactive UI created, drag-and-drop coordinate mapping live, visual form checkbox support added, save/load API integrations functioning.

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**: `npm install`
3.  **Set up Database**: Ensure a local MariaDB is running and set the `DATABASE_URL` in your `.env` file.
4.  **Run Migrations**: `npx prisma db push` or `npx prisma migrate dev`
5.  **Start Development Server**: `npm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
