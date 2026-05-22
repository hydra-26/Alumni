# APPAS User Manual

## 1. Project Overview
APPAS (Alumni Project Performance Analytics System) is a full-stack web app for tracking alumni profiles, capstone project records, and performance analytics for Pangasinan State University.

**What it does**
- Centralizes alumni records and project data.
- Provides dashboards and analytics (KPIs, charts, trends).
- Supports data import and export (Excel/PDF where implemented).
- Keeps an audit trail of key actions.

**Intended users**
- Department staff and administrators managing alumni and capstone data.
- Roles visible in the UI include `Chairperson`, `OSAA Dean`, and `OSAA Director` (see [frontend/src/pages/UsersPage.jsx](frontend/src/pages/UsersPage.jsx)).
- Admin-only sections exist for user management and system logs (see [frontend/src/App.jsx](frontend/src/App.jsx)).

**Key problems it solves**
- Scattered alumni/project records.
- Manual analytics for reporting.
- Lack of audit history for data changes.

## 2. Prerequisites and System Requirements
**Required software**
- `Python` (version not specified in codebase).
- `Node.js` and `npm` (version not specified in codebase).

**Required accounts or credentials**
- `Supabase` project with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (see [backend/supabase_client.py](backend/supabase_client.py)).
- Email delivery credentials if you want password reset and credential emails:
  - SMTP: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, or
  - Brevo: `BREVO_API_KEY` (see [backend/email_utils.py](backend/email_utils.py)).

**Supported operating systems**
WARNING: Not found in codebase -- please fill in manually.

## 3. Installation and Setup
### Step 1: Create the Supabase database
1. Create a project at `https://supabase.com`.
2. Open the SQL Editor in the Supabase dashboard.
3. Run the SQL in [supabase_schema.sql](supabase_schema.sql).

### Step 2: Backend setup (Flask)
1. Open a terminal and go to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   ```
   ```bash
   source venv/bin/activate
   ```
   On Windows:
   ```bash
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in [backend/.env](backend/.env).

### Step 3: Frontend setup (React and Vite)
1. Open a second terminal and go to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment variable configuration
**Backend environment variables** (loaded from [backend/.env](backend/.env), read in [backend/app.py](backend/app.py) and [backend/email_utils.py](backend/email_utils.py)):
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_KEY`: Supabase service role key.
- `FLASK_ENV`: Flask environment; `development` enables debug.
- `PORT`: Backend port (default `5000`).
- `FRONTEND_ORIGINS`: Comma-separated list of allowed frontend origins for CORS.
- `SYSTEM_URL`: Base URL used in password reset and credential emails (default `http://localhost:5173`).
- `SMTP_HOST`: SMTP host for email.
- `SMTP_PORT`: SMTP port (default `587`).
- `SMTP_USER`: SMTP username.
- `SMTP_PASS`: SMTP password.
- `SMTP_FROM`: From address (defaults to `SMTP_USER`).
- `SMTP_USE_TLS`: Use TLS for SMTP (default `true`).
- `SMTP_USE_SSL`: Use SSL for SMTP (default `false`).
- `EMAIL_DEBUG`: Print email debug logs (default `false`).
- `BREVO_API_KEY`: Brevo API key (optional alternative to SMTP).

**Frontend environment variables** (read in [frontend/src/utils/api.js](frontend/src/utils/api.js)):
- `VITE_API_URL`: Backend base URL (including `/api`). If not set:
  - Dev uses ` /api` via the Vite proxy.
  - Prod uses `https://alumni-rxma.onrender.com/api`.

### Post-install steps
- Run the SQL in [supabase_schema.sql](supabase_schema.sql) before starting the app.
- WARNING: Not found in codebase -- please fill in manually.

## 4. How to Run the Project
### Start in development mode
**Backend**
```bash
cd backend
python app.py
```

**Frontend**
```bash
cd frontend
npm run dev
```

Default addresses:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### Build for production
**Frontend**
```bash
cd frontend
npm run build
```

**Preview the production build**
```bash
npm run preview
```

**Backend production server**
WARNING: Not found in codebase -- please fill in manually.

### Run tests
WARNING: Not found in codebase -- please fill in manually.

### Other common scripts (lint, format, etc.)
WARNING: Not found in codebase -- please fill in manually.

## 5. Project Structure
**Root**
- [README.md](README.md): Project overview and setup notes.
- [supabase_schema.sql](supabase_schema.sql): Supabase schema and seed data.

**Backend (Flask API)**
- [backend/app.py](backend/app.py): Flask app entry point and CORS setup.
- [backend/supabase_client.py](backend/supabase_client.py): Supabase client factory.
- [backend/audit.py](backend/audit.py): Audit logging helper.
- [backend/email_utils.py](backend/email_utils.py): Email sending for password reset and credentials.
- [backend/routes/auth.py](backend/routes/auth.py): Auth and password endpoints.
- [backend/routes/alumni.py](backend/routes/alumni.py): Alumni CRUD and bulk upload.
- [backend/routes/projects.py](backend/routes/projects.py): Projects CRUD and bulk upload.
- [backend/routes/users.py](backend/routes/users.py): Users CRUD.
- [backend/routes/analytics.py](backend/routes/analytics.py): KPI and analytics endpoints, audit logs, upload history.

**Frontend (React and Vite)**
- [frontend/index.html](frontend/index.html): HTML entry point.
- [frontend/src/main.jsx](frontend/src/main.jsx): React app entry.
- [frontend/src/App.jsx](frontend/src/App.jsx): Routing and protected routes.
- [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx): Login session state.
- [frontend/src/context/ToastContext.jsx](frontend/src/context/ToastContext.jsx): Toast notifications.
- [frontend/src/utils/api.js](frontend/src/utils/api.js): API client and base URL logic.
- [frontend/src/pages/](frontend/src/pages/): UI pages (Dashboard, Analytics, Alumni, Projects, Upload, Reports, Users, System).

**Entry points**
- Backend: [backend/app.py](backend/app.py)
- Frontend: [frontend/src/main.jsx](frontend/src/main.jsx)

## 6. Core Features and How to Use Them
### 6.1 Login, Logout, and Password Reset
**What it does**
- Authenticates users with email and password.
- Supports password reset via email verification.

**How to access**
- Open the app and go to the login page.

**Steps to sign in**
1. Enter your email and password.
2. Select **Sign In**.

**Password reset flow**
1. Select **Forgot Password**.
2. Request a verification code.
3. Enter the code from your email.
4. Set a new password that meets all requirements.

**Password rules**
- At least 8 characters.
- Must include uppercase, lowercase, number, and special character.

![Login screen with email and password fields](LoginScreen.img)
![Password reset modal with verification code and new password fields](PasswordResetModal.img)

**Default credentials** (from [README.md](README.md))
- Admin: `j.ablang` / `admin123`
- Faculty: `g.benito` / `faculty123`
- Faculty: `s.bautista` / `faculty123`

### 6.2 Dashboard (Performance Overview)
**What it does**
- Shows KPI cards (alumni count, projects, employment rate, award-winning, implemented rate).
- Shows charts for projects per year, categories, and employment trends.
- Provides a heatmap of monthly activity.
- Supports PDF export of selected dashboard sections.

**How to access**
- From the sidebar, select **Dashboard**.

**Steps**
1. Use the year filter to focus analytics.
2. Select **Export PDF** to choose sections and download a PDF.

![Dashboard showing KPI cards, charts, and export button](DashboardOverview.img)
![Dashboard export modal with selectable items](DashboardExportModal.img)

### 6.3 Analytics (Deep-Dive Charts)
**What it does**
- Project status chart.
- Implementation rate trend.
- Awards by project category.
- Employment status distribution.
- PDF export for selected charts.

**How to access**
- From the sidebar, select **Analytics**.

**Steps**
1. Select a batch or view all.
2. Select **Export PDF** and choose charts to include.

![Analytics page with charts and batch filter](AnalyticsScreen.img)
![Analytics export modal with chart selection](AnalyticsExportModal.img)

### 6.4 Alumni Records
**What it does**
- Lists alumni records with filters and search.
- Allows add, edit, view, delete (Chairperson only).
- Exports to Excel.

**How to access**
- From the sidebar, select **Alumni Records**.

**Steps**
1. Search by name or batch.
2. Filter by batch year or employment status.
3. Select a row to view details.
4. Use **Add Alumni** to create records (Chairperson only).
5. Use **Export** to download Excel.

![Alumni records list with filters and export button](AlumniListScreen.img)
![Add or Edit Alumni modal](AlumniEditModal.img)
![Alumni detail modal](AlumniDetailModal.img)

**Role restrictions**
- Only Chairperson can add, edit, or delete records.
- Admin role hides the Actions column in tables (see [frontend/src/pages/AlumniPage.jsx](frontend/src/pages/AlumniPage.jsx)).

### 6.5 Project Records
**What it does**
- Lists capstone projects with filters.
- Allows add, edit, view, delete (Chairperson only).
- Exports to Excel.

**How to access**
- From the sidebar, select **Projects**.

**Steps**
1. Search by project title or adviser.
2. Filter by category, status, and year.
3. Select a row to view details.
4. Use **Add Project** to create records (Chairperson only).
5. Use **Export** to download Excel.

![Project records list with filters and export button](ProjectsListScreen.img)
![Add or Edit Project modal](ProjectEditModal.img)
![Project detail modal](ProjectDetailModal.img)

### 6.6 Upload Data (Bulk Import)
**What it does**
- Imports alumni or project data from spreadsheet files.
- Validates columns and allowed values.
- Shows upload history.

**How to access**
- From the sidebar, select **Upload Data** (Chairperson only).

**Steps**
1. Select a dataset (Alumni or Projects).
2. Download the template.
3. Fill in the spreadsheet using the expected columns.
4. Upload and preview.
5. Fix missing or invalid values and re-upload.
6. Select **Validate and Upload** to import.

![Upload data page with dataset selection and drop zone](UploadDataScreen.img)
![Upload preview modal showing column validation](UploadPreviewModal.img)
![Upload validation errors modal](UploadValidationErrors.img)

**Expected columns**
- Alumni: `batch_year`, `first_name`, `last_name`, `email`, `contact`, `employment_status`, `company`
- Projects: `title`, `category`, `year`, `adviser`, `members`, `status`, `award`, `project_link`, `abstract`

**Allowed values**
- `employment_status`: `Seeking`, `Self-Employed`, `Employed`, `Studying`
- `category`: `Web App`, `Mobile App`, `IoT System`, `Data Analytics`, `Desktop App`
- `status`: `Implemented`, `In Progress`, `Proposed`, `Awarded`

### 6.7 Reports (Export Reports)
**What it does**
- Shows report filters and export buttons.

**How to access**
- From the sidebar, select **Export Reports**.

WARNING: Not found in codebase -- please fill in manually.

![Reports page with report options and export buttons](ReportsScreen.img)

### 6.8 User Management (Admin only)
**What it does**
- Create, edit, and delete users.
- Generates a random password for new users.
- Displays user details.

**How to access**
- From the sidebar, select **User Management** (Admin only).

**Steps**
1. Select **Add User**.
2. Fill in name, username, email, role, and password.
3. Select **Generate** to create a random password if needed.
4. Save the user.

![User management table with add user button](UsersManagementScreen.img)
![Add or Edit User modal](UserEditModal.img)
![User detail modal](UserDetailModal.img)

### 6.9 User Activity Logs (Admin only)
**What it does**
- Shows recent audit logs.
- Exports logs to Excel.

**How to access**
- From the sidebar, select **User Activity Logs** (Admin only).

**Steps**
1. Review the recent log entries.
2. Select **Export Logs** to download Excel.

![User activity logs screen with export button](ActivityLogsScreen.img)

### 6.10 Change Password (In-app)
**What it does**
- Allows signed-in users to change their password.

**How to access**
- Select your profile in the top bar, then select **Change Password**.

**Steps**
1. Enter the current password.
2. Enter the new password and confirm it.
3. Select **Update**.

![Change password modal with rules checklist](ChangePasswordModal.img)

## 7. API and CLI Reference
### Base URL
- Dev (via Vite proxy): `http://localhost:5173/api`
- Direct backend: `http://localhost:5000/api`

### Authentication
- No token-based auth found in backend routes.
- `X-User` header is used for audit logging only (see [backend/audit.py](backend/audit.py)).

### Common headers
- `Content-Type: application/json`
- `X-User: user@email` (optional audit context)
- `X-File-Name: filename.xlsx` (for bulk upload tracking)

### Auth endpoints
**POST** `/api/auth/login`

Body:
```json
{ "email": "user@psu.edu.ph", "password": "password123" }
```

Response:
```json
{ "user": { "id": 1, "first_name": "Jane", "last_name": "Doe", "name": "Jane Doe", "email": "user@psu.edu.ph", "role": "Admin" } }
```

**POST** `/api/auth/logout`

**POST** `/api/auth/password-reset/request`

Body:
```json
{ "email": "user@psu.edu.ph" }
```

**POST** `/api/auth/password-reset/verify`

Body:
```json
{ "challenge_id": "abc...", "code": "123456" }
```

**POST** `/api/auth/password-reset/complete`

Body:
```json
{ "challenge_id": "abc...", "password": "NewPass!1", "confirm_password": "NewPass!1" }
```

**POST** `/api/auth/password-change`

Body:
```json
{ "current_password": "OldPass!1", "password": "NewPass!1", "confirm_password": "NewPass!1" }
```

### Alumni endpoints
**GET** `/api/alumni` (query params: `batch`, `status`, `q`)

**GET** `/api/alumni/:id`

**POST** `/api/alumni`

Body:
```json
{ "first_name": "", "last_name": "", "batch_year": "", "email": "", "contact": "", "employment_status": "", "company": "" }
```

**POST** `/api/alumni/bulk` (array of alumni records)

**PUT** `/api/alumni/:id`

**DELETE** `/api/alumni/:id`

### Project endpoints
**GET** `/api/projects` (query params: `category`, `status`, `year`, `q`)

**GET** `/api/projects/:id`

**POST** `/api/projects`

Body:
```json
{ "title": "", "category": "", "year": "", "adviser": "", "members": "", "status": "", "award": "", "abstract": "", "project_link": "" }
```

**POST** `/api/projects/bulk` (array of project records)

**PUT** `/api/projects/:id`

**DELETE** `/api/projects/:id`

### Users endpoints
**GET** `/api/users` (query params: `role`, `q`)

**POST** `/api/users`

Body:
```json
{ "first_name": "", "last_name": "", "username": "", "email": "", "role": "", "password": "" }
```

**PUT** `/api/users/:id` (password is ignored on update)

**DELETE** `/api/users/:id`

### Analytics endpoints
**GET** `/api/analytics/kpis`

**GET** `/api/analytics/projects-per-year`

**GET** `/api/analytics/categories`

**GET** `/api/analytics/employment-trend`

**GET** `/api/analytics/audit-logs`

**POST** `/api/analytics/audit-logs`

Body:
```json
{ "action": "Export dashboard (PDF)", "actor": "user@psu.edu.ph", "color": "#0d8a5e" }
```

**GET** `/api/analytics/upload-history` (query param: `dataset`)

### Health endpoint
**GET** `/api/health`

### CLI
WARNING: Not found in codebase -- please fill in manually.

## 8. Configuration Reference
**Backend config**
- CORS allows `http://localhost:5173`, `http://localhost:3000`, optional `FRONTEND_ORIGINS`, and Vercel preview domains (see [backend/app.py](backend/app.py)).
- Debug mode is enabled when `FLASK_ENV` is `development`.
- API server binds to `PORT` (default `5000`).

**Frontend config**
- API base URL logic is in [frontend/src/utils/api.js](frontend/src/utils/api.js).
- In dev, requests use `/api` (Vite proxy). See [frontend/vite.config.js](frontend/vite.config.js).
- In prod, the default base is `https://alumni-rxma.onrender.com/api` unless `VITE_API_URL` is set.

**Session storage**
- Logged-in user is saved in `localStorage` under key `appas_user` (see [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)).

## 9. Troubleshooting and FAQs
- **Backend error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env**
  - Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in [backend/.env](backend/.env).

- **Login says Invalid credentials**
  - Confirm the user exists in the `users` table and has `status = Active`.

- **Password reset email not sent**
  - Provide SMTP settings (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) or `BREVO_API_KEY`.

- **Password change or reset fails**
  - Password must be at least 8 characters and include uppercase, lowercase, number, and special character.

- **CORS errors in the browser**
  - Add your frontend domain to `FRONTEND_ORIGINS`.

- **Upload validation errors**
  - Ensure spreadsheet columns match the expected column names and allowed values.

- **Reports page does not download files**
  - The export buttons only trigger toast messages and audit logs.
  - WARNING: Not found in codebase -- please fill in manually.

- **Role mismatch issues (access denied)**
  - Database schema enforces `Admin` and `Faculty` roles, while the UI lists `Chairperson`, `OSAA Dean`, and `OSAA Director`.
  - Align roles in the database and UI before deploying (see [supabase_schema.sql](supabase_schema.sql) and [frontend/src/pages/UsersPage.jsx](frontend/src/pages/UsersPage.jsx)).

- **SQL schema seed errors**
  - [supabase_schema.sql](supabase_schema.sql) inserts columns `responsibility` and `skills` that are not defined in the tables.
  - Update the SQL to match the table definitions before running it.

## 10. Glossary
- **Alumni**: Graduates whose profiles and employment status are tracked.
- **Batch Year**: Graduation year for alumni or project cohort year.
- **KPI**: Key Performance Indicator (summary metric like employment rate).
- **Audit Log**: A record of important actions (logins, exports, uploads).
- **Chairperson**: Role that can manage alumni/projects and upload data.
- **Admin**: Role that can manage users and view system logs.
