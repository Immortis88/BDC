# SKIT Blood Donation Campaign (BDC) — Platform

A full-stack platform for the **Swami Keshvanand Institute of Technology (SKIT) Blood Donation Campaign (BDC)**. Preserves the authentic public website aesthetic, typography, animations, and layouts while connecting to a real Node.js/Express backend and local MySQL database (`bdc`).

---

## 1. Local Quick-Start Guide

### Prerequisites
- **Node.js** (v18+ recommended, v24 verified)
- **MySQL 8.0+** running locally on port 3306

### Step 1: Database Setup
1. In MySQL Workbench or CLI, create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS bdc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Import schema:
   ```bash
   mysql -u root -p bdc < database/bdc-schema.sql
   ```
3. Seed baseline live camp, team members, sponsors, gallery photos, and CMS content:
   ```bash
   cd backend
   node scripts/seed-initial-data.js
   ```

### Step 2: Backend Server
```bash
cd backend
npm install
node src/server.js
```
The API server starts on **`http://localhost:4000`**.

### Step 3: Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server starts on **`http://localhost:5173`**.
Vite automatically proxies `/api` and `/media` requests to `http://localhost:4000`.

---

## 2. Administrator Access Credentials

Login page: **`http://localhost:5173/admin/login`**

| Field | Value | Notes |
|---|---|---|
| **Email** | `nss@skit.ac.in` | Super Admin account |
| **Password** | `Skit@12345` | Default Super Admin password |
| **Role** | `SUPER_ADMIN` | Full global & camp permissions |

> **Note:** Administrators can change their password at any time via the self-service modal in the user account dropdown or at `/admin/change-password`.

---

## 3. Environment Configuration (`backend/.env`)

```env
PORT=4000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=bdc
DB_CONNECTION_LIMIT=10

# Security & Sessions
SESSION_SECRET=bdc_super_secure_session_secret_key_change_in_production_2026
SESSION_TTL_HOURS=24
FINGERPRINT_KEY=bdc_hmac_fingerprint_secret_key_32bytes_skit_2026

# Storage Paths
MEDIA_ROOT=C:\Users\bhara\Downloads\BDC\backend\asset\Image
PUBLIC_BASE_URL=http://localhost:4000
```

---

## 4. Key Workflows & Features

### Public Website (`/`, `/about`, `/register`, `/team`, `/gallery`, `/supporters`, `/faq`, `/contact`)
- **Live Camp Detection:** Always displays whichever camp is marked Live in `site_state.live_camp_id`.
- **Donor Registration:** Instant duplicate detection via HMAC fingerprinting, atomic sequential ID generation (`skitbdc{year}_{sequence}`), and printable confirmation slips.
- **Dynamic Content:** Team, partners/sponsors, gallery photos, and FAQ items load dynamically from the active camp database.
- **Inquiry Submission:** Public inquiries in `/contact` write directly to `contact_messages` and appear in the Admin Inbox.

### Admin Workspace (`/admin`)
- **Navigation:** Top header with direct links to **Camps**, **Website CMS**, and **Inbox**. Administrator Management is Super Admin only and accessed via **Admin Settings** in the profile menu.
- **Camp Management:**
  - One camp per year rule enforced at database and API levels.
  - Setting a camp Live automatically closes registration on any outgoing live camp.
  - Media directories auto-provisioned: `backend/asset/Image/BDC Camp {year}/{team,gallery,sponsors}`.
- **Website CMS:**
  - Independent draft revision tracking and publishing for `HOMEPAGE`, `SECTIONS`, `NOTICES`, `FAQ`, and `CONTACT`.
  - Built-in interactive **Draft Preview Modal** with Desktop and Mobile viewport toggles before publishing live.
- **Registrations Table:**
  - Server-side filtering by name, registration code, blood group, role, and branch.
  - Server-side pagination.
  - Safe CSV export with formula injection sanitization.
- **Inbox:**
  - Read-only tracking with per-admin `first_read_at` read state indicators.

---

## 5. Verification Commands

```bash
# Build frontend for production (zero errors)
cd frontend
npm run build

# Run database seed check
cd backend
node scripts/seed-initial-data.js
```
