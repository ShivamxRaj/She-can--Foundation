# She Can Foundation — Contact & Volunteer Portal

A full-stack, secure, and accessible contact, volunteer, and inquiry application custom-built for **She Can Foundation** — a registered NGO (under the Indian Society Act, 1860) founded by **Reeta Mishra**, dedicated to empowering women and girls through technology education, mentorship, and support networks.

---

## 🔍 Gap Analysis: Original vs. This Application
The original `shecanfoundation.org` website is built using standard builder templates and leaves several critical functional gaps. This application solves these:

| Feature | Original Site Status | This Implementation |
| :--- | :--- | :--- |
| **Contact Form** | 🔴 None (only simple mailto links) | ✅ Fully integrated responsive form |
| **Volunteering/Join Team** | 🔴 No way to sign up online | ✅ Form category dedicated to "Volunteer / Join Our Team" |
| **Input Validation** | 🔴 None | ✅ Instant client-side validation + backend regex safeguards |
| **Spam Protection** | 🔴 None | ✅ Front-end 30s button lock + Backend persistent IP rate limiter |
| **Submissions Database** | 🔴 None (messages lost/not persisted) | ✅ Persistent SQLite storage |
| **Admin Panel** | 🔴 None | ✅ Token-protected dashboard at `/admin` with live search & CSV export |
| **Design Customization** | 🟡 Generic builder templates | ✅ Warm earth tones (terracotta, rose, cream), clean typography, custom graphics, and featured pull-quotes for founder Reeta Mishra |

---

## Tech Stack
- **Frontend**: HTML5 (Semantic, SEO schema-enabled), Custom CSS (Warm Terracotta/Rose/Cream palette), and JavaScript (ES6+ for interactive validation and cooldowns).
- **Backend**: Node.js + Express.js.
- **Database**: SQLite3 (persistent file-based database).
- **Security**: Helmet, custom CSP headers, and input XSS sanitization.

---

## Key Features

### 1. Advanced Form & Cooldown Rate Limiter
- **Form Fields**: Full Name (required), Email (required), Phone (optional), Subject Dropdown (General Inquiry / Volunteer / Donate / Partnership), and Message (required, min 20 chars).
- **Anti-Spam Client Cooldown**: When a user submits, their timestamp is saved in local storage and the submit button is locked for **30 seconds** with an active countdown timer.
- **IP-Based Backend Rate Limiting**: The server enforces a maximum of **3 submissions per IP address per hour**, queried directly against the database to remain persistent if the server restarts.

### 2. Micro-interactions & Accessible Design (a11y)
- **Fluid Success Card**: Submitting dynamically replaces the active card with a congratulations and summary interface.
- **A11y Compliant**: Keyboard focus indicators, skip navigation links, and screen reader announcements (`role="alert"`) are mapped to input controls. Contrast ratios are WCAG AA compliant.

### 3. Protected Dashboard & Exporter (`/admin`)
- Accessible only with valid authentication.
- **Live Search & Filter**: Instant, character-by-character search across Name, Email, Phone, Subject, and Messages.
- **CSV Download**: Downloads all submissions in an Excel-readable `.csv` file format.
- **Delete Entries**: Admins can safely clean up records directly from the UI.

---

## Directory Structure
```text
she-can-foundation/
├── admin/
│   └── index.html      # Token-protected admin panel frontend
├── assets/
│   └── hero.png        # Theme-aligned vector graphic asset
├── db/
│   ├── database.js     # SQLite connection, promise wrappers, and migrations
│   └── contacts.sqlite # SQLite database (created on startup)
├── routes/
│   ├── contact.js      # Express API routes (contact submit, login, list, delete)
│   └── formHandler.js  # Decoupled core validation & rate limit checker (MCP-ready)
├── index.html          # Main landing page & contact interface
├── styles.css          # Design tokens & styling sheet
├── server.js           # Server runner and Helmet configurations
├── package.json        # Manifest file
└── README.md           # This documentation file
```

---

## Local Setup & Run Instructions

### Prerequisites
- Node.js (v16.0.0 or higher) installed on your system.

### Steps
1. Navigate to the project folder:
   ```bash
   cd she-can-foundation
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the application:
   - **User Landing Page**: [http://localhost:3000](http://localhost:3000)
   - **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Admin Credentials
To access the Admin Dashboard (`/admin`), use these hardcoded credentials:

- **Username**: `admin`
- **Password**: `shecan2024`
