## 1. Introduction
- What does this application do? What problem does it solve?
  - APPAS (Alumni Project Performance Analytics System) centralizes alumni profiles and capstone project records and provides dashboard analytics (KPIs, charts, trends) for institutional reporting. It includes CRUD for alumni and project records, bulk import (spreadsheet), exports (Excel and PDF via client-side generation), and an audit trail of user actions.
- Who is it for? (Reference the 4 roles: Chairperson, OSAA Dean, OSAA Director, System Admin)
  - Chairperson: primary data manager — can add/edit/delete alumni and project records and perform bulk uploads.
  - OSAA Dean: read-only consumer of records and analytics (UI indicates view-only for non-managers).
  - OSAA Director: read-only consumer of records and analytics.
  - System Admin (Admin): administrative access to user management and system logs.
- List all key features identifiable from the codebase
  - Authentication: email/password login and session stored in localStorage (frontend).
  - Password management: forgot-password request → email verification code → reset; in-app change password for signed-in users.
  - Alumni management: list, search, filter, create, edit, delete, export to Excel; bulk upload via spreadsheet.
  - Project management: list, search, filter, create, edit, delete, export to Excel; bulk upload.
  - Dashboard and Analytics: KPI cards, charts (projects per year, categories, employment trends), PDF export via html2canvas + jsPDF.
  - Upload tool: template download, parse/validate .xlsx/.csv/.xls, duplicate detection, bulk import endpoints.
  - User management: admin UI to list/create/update/delete users; random password generator; email of credentials on create.
  - Audit logging: backend writes audit entries to `audit_logs` table; UI shows recent activity and export to Excel.
  - Exports: client-side Excel exports for alumni/projects/logs and PDF report exports for dashboard/analytics.
  - Email sending: SMTP or Brevo (Sendinblue) supported for credential emails and password reset.
  - API: Flask backend with Supabase client (service key) for DB operations; endpoints for /api/auth, /api/alumni, /api/projects, /api/users, /api/analytics.
  - CORS and environment-driven origins support for Vercel preview domains.

## 2. System Requirements & Compatibility
- What browsers, OS, or environments are explicitly supported or referenced?
  - Not explicitly declared. Frontend built with React + Vite and common web libraries (Chart.js, html2canvas, jsPDF); expected to work in modern browsers (Chromium-based, Firefox, Safari). No platform-specific code found.
  - Backend is Python Flask — runs on any OS with Python.
- Is there a minimum Node/runtime version, or any environment variable requirements?
  - package.json lists dependencies compatible with modern Node; no explicit engines field. Use a recent Node (>=16 recommended for Vite v5).
  - Backend requires:
    - SUPABASE_URL
    - SUPABASE_SERVICE_KEY
    - Optionally: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_USE_TLS/SSL or BREVO_API_KEY
    - FRONTEND_ORIGINS (optional), PORT, FLASK_ENV, SYSTEM_URL
- Any specific browser APIs or dependencies the frontend relies on?
  - html2canvas and jsPDF for client-side PDF export (requires DOM/canvas support).
  - Chart.js via react-chartjs-2 for charts.
  - XLSX (SheetJS) for import and Excel export in the browser.
  - localStorage used for persisting logged-in user.
  - No service worker or WebAuthn/2FA found.

## 3. Getting Started
- What is the URL or entry point to access the application?
  - Dev frontend: http://localhost:5173 (Vite dev server). Backend: http://localhost:5000 (Flask). Frontend API base resolves to `/api` in dev (Vite proxy) or VITE_API_URL in env.
- Walk through the account creation flow (sign up, email verification, etc.) if it exists.
  - There is no public sign-up endpoint or sign-up UI. Users are created via the admin `POST /api/users/` endpoint (UI in UsersPage). On creation, backend calls `send_user_credentials_email` to send credentials if email config exists.
  - [TO CONFIRM: Is self-registration intentionally omitted?]
- Walk through the login flow, including any SSO or OAuth providers configured.
  - User submits email & password to frontend `login()` (AuthContext) → POST `/api/auth/login` → backend validates by matching plaintext password in `users` table and status 'Active'. On success, backend returns user object; frontend stores it in localStorage and populates `AuthContext.user`.
  - No SSO or OAuth providers are configured.
- Describe the forgot password / password reset flow.
  - Steps:
    1. User requests reset in the login page: POST `/api/auth/password-reset/request` with email.
    2. Backend verifies active account, generates challenge_id and 6-digit verification code, stores in in-memory RESET_CHALLENGES, sends verification code email via SMTP or Brevo.
    3. User submits code to `/api/auth/password-reset/verify` with challenge_id and code; backend marks `verified`.
    4. User completes reset by POST `/api/auth/password-reset/complete` with challenge_id, password, confirm_password. Backend validates rules and updates `users.password`.
  - Password rules enforced server-side: min 8 chars, must include uppercase, lowercase, number, special character.
- Does the app support PWA installation (manifest.json, service workers)?
  - No manifest.json or service-worker files found. PWA not supported.
- How does a user log out?
  - Frontend calls `api.post('/auth/logout')` then clears `appas_user` from localStorage via `logout()` in `AuthContext`, and navigates to `/login`.

## 4. Interface Overview
- Describe the main navigation structure (menus, sidebar, top bar).
  - Sidebar (left) contains grouped navigation sections:
    - Overview: Dashboard, Analytics
    - Records: Alumni Records, Projects
    - Data Tools (if user is Chairperson): Upload Data
    - Administration (if isAdmin): User Management, User Activity Logs
  - Top bar shows welcome text and minimal controls; footer area of sidebar contains user avatar and profile menu (Change Password, Sign Out).
  - [SCREENSHOT: Main_Navigation.png]
- Describe the dashboard — what panels, widgets, or data does each role see?
  - Dashboard and Analytics both fetch KPIs and charts from `/analytics/*` and `/alumni` `/projects` endpoints.
  - Widgets:
    - KPI cards: total alumni, total projects, employment rate, award-winning count, implemented rate.
    - Charts: Projects per year (bar), Project categories (doughnut), Alumni trend and Employment trend (line).
    - Recent items panels for recent alumni and projects.
  - Role differences:
    - Chairperson: full access and "Add" buttons appear for records; upload tools available.
    - OSAA Dean/Director: view-only (no Add/Edit/Delete); UI shows informational messages and blocks actions.
    - Admin: can access Administration nav (Users, System logs).
  - [SCREENSHOT: Dashboard_Overview.png]
- Describe the user profile menu (what options are available).
  - Profile menu (bottom-left) shows:
    - Change Password (opens modal with password validation).
    - Sign Out (logs out).
- How do notifications work? What triggers them?
  - Toast notifications implemented by `ToastContext`; triggered on success/failure for operations (login, save, delete, export, uploads, API errors). They appear bottom-right for ~3.5s.
- Is there a global search feature? What does it search?
  - Each major list page (Users, Alumni, Projects) includes a search input that filters the current dataset client-side and also passes `q` to API list endpoints for server-side filtering. There is no single-site global search.

## 5. Core Features
For each major feature/module or page found:

- Dashboard (roles: Chairperson, OSAA Dean, OSAA Director, System Admin)
  - Access: Sidebar → Dashboard
  - Create/View/Edit/Delete: N/A (read-only analytics). Export PDF flows available.
  - Filters: Year/batch filters; select charts to export.
  - Screens:
    - [SCREENSHOT: Dashboard_Page.png]

- Analytics (roles: Chairperson, OSAA Dean, OSAA Director, System Admin)
  - Access: Sidebar → Analytics
  - Functionality: Detailed charts, export selected charts to PDF (client-side html2canvas + jsPDF).
  - Filters: Batch/year filter.
  - Screens:
    - [SCREENSHOT: Analytics_Page.png]

- Alumni Records (roles: Chairperson (manage), OSAA Dean (view-only), OSAA Director (view-only), Admin (view-only unless Admin is also Chairperson))
  - Access: Sidebar → Alumni Records
  - Create: Chairperson clicks "+ Add Alumni", fills modal form, save → POST /api/alumni/.
  - View: Click row → details modal (contact, record info).
  - Edit: Chairperson clicks Edit → update modal → PUT /api/alumni/:id.
  - Delete: Chairperson uses Delete modal → DELETE /api/alumni/:id.
  - Filters/Search: search by name or batch, dropdown filters for batch and employment status; pagination.
  - Exports: Excel export via client `exportAlumniToExcel`.
  - Screens:
    - [SCREENSHOT: Alumni_List_Page.png]
    - [SCREENSHOT: Alumni_AddEdit_Modal.png]
    - [SCREENSHOT: Alumni_Detail_Modal.png]

- Project Records (roles: Chairperson manage; OSAA Dean/Director view-only; Admin view-only)
  - Access: Sidebar → Projects
  - Create/Edit/Delete: similar flows to Alumni (POST /api/projects/, PUT /api/projects/:id, DELETE /api/projects/:id). Bulk upload supported via `/api/projects/bulk`.
  - Filters/Search: category, status, year, search by title/adviser.
  - Export: Excel via `exportProjectsToExcel`.
  - Screens:
    - [SCREENSHOT: Projects_List_Page.png]
    - [SCREENSHOT: Project_AddEdit_Modal.png]
    - [SCREENSHOT: Project_Detail_Modal.png]

- Upload Data (roles: Chairperson only — UI blocks others)
  - Access: Sidebar → Upload Data (visible if `canManageData` true)
  - Flow:
    1. Choose dataset (Alumni or Projects).
    2. Download template.
    3. Choose or drop file (.xlsx/.xls/.csv).
    4. Client parses with SheetJS, validates headers and enumerated values, shows preview and duplicate detection against existing rows via API fetch.
    5. Upload uses `/alumni/bulk` or `/projects/bulk` with header `X-File-Name` for tracking; backend inserts and logs upload history to `upload_history`.
  - Screens:
    - [SCREENSHOT: Upload_Page.png]
    - [SCREENSHOT: Upload_Preview_Modal.png]
    - [SCREENSHOT: Upload_Validation_Errors.png]

- Reports / Export Reports (roles: Chairperson, OSAA Dean, OSAA Director, System Admin)
  - Access: Sidebar → Export Reports
  - Flow: Choose report options, export PDF or Excel. Client-side triggers toast and audit log calls; specific server-side scheduled exports not found.
  - Screens:
    - [SCREENSHOT: Reports_Page.png]

- User Management (roles: System Admin; creation UI exists also)
  - Access: Sidebar → User Management (Admin only)
  - Create: Admin clicks "+ Add User", fills form (First, Last, Username, Email, Role), can generate random password; POST /api/users/.
  - Edit: PUT /api/users/:id (password not overwritten unless provided).
  - Delete: DELETE /api/users/:id.
  - Exports: Not explicit, but activity and user lists can be exported via table export utilities.
  - Screens:
    - [SCREENSHOT: Users_Page.png]
    - [SCREENSHOT: User_AddEdit_Modal.png]
    - [SCREENSHOT: User_Detail_Modal.png]

- System / Activity Logs (roles: System Admin)
  - Access: Sidebar → User Activity Logs
  - Functionality: Fetches `/api/analytics/audit-logs` and `upload-history`; shows recent logs, supports Excel export via client util.
  - Screens:
    - [SCREENSHOT: System_Logs_Page.png]

## 6. User Settings & Account Management
- What profile fields can a user edit?
  - No full profile-edit screen found. User can change password via profile menu Change Password modal (current password, new password, confirm). User details shown are name, username, email and role; editing those is admin-only via UsersPage.
  - [SCREENSHOT: Profile_Settings.png]
- How does a user change their password?
  - Via profile menu → Change Password modal. Frontend validates password rules locally; POST `/auth/password-change` sends current_password, password, confirm_password; backend verifies current and updates `users.password`.
- What notification preferences are available and how are they configured?
  - No granular notification preference settings found. Toast notifications are UI-only and not configurable per user.
- Are there language, timezone, or regional settings?
  - None found. Dates are displayed using `toLocaleString()` (client locale) but no user-selectable timezone or language settings.
- What third-party accounts or integrations can a user connect from their profile?
  - None found. Email sending uses SMTP or Brevo, but these are admin/backend configurations.

## 7. Roles & Permissions
The system uses role checks in frontend and role values in backend. Known role strings in code include: `Chairperson`, `Admin`, `OSAA Dean`, `OSAA Director`. Supabase schema seeds use `Admin` and `Faculty`; frontend role options include Chairperson/OSAA roles — mapping may vary per deployment.

For each role — accessible pages and permissions inferred from code:

- Chairperson
  - Pages accessible: Dashboard, Analytics, Alumni, Projects, Upload Data, Reports (and Users/System depending on Admin flag).
  - Actions permitted:
    - Create, Edit, Delete Alumni and Projects (UI gates via `canManageData`).
    - Bulk uploads for Alumni/Projects.
    - Export Excel/PDF.
  - Hidden/restricted:
    - Admin-only pages (User Management, User Activity Logs) are shown only if `isAdmin` true.
- OSAA Dean
  - Pages accessible: Dashboard, Analytics, Alumni, Projects, Reports.
  - Actions permitted:
    - Read-only: view records and charts; cannot add/edit/delete (UI blocks add/edit/delete and upload).
  - Hidden/restricted: Upload Data and per-record Add/Edit/Delete actions.
- OSAA Director
  - Same as OSAA Dean (view-only).
- System Admin (role value `Admin`)
  - Pages accessible: All pages including Administration (Users, System).
  - Actions permitted:
    - Manage users (create/edit/delete), view system logs, export logs.
    - Note: user creation sends credential email via backend if email configured.

Permissions matrix (major features vs roles)
- Columns: Chairperson | OSAA Dean | OSAA Director | System Admin
- Alumni CRUD: Create/Edit/Delete = Chairperson: Yes; OSAA Dean: No; OSAA Director: No; System Admin: (Yes if Admin also given Chairperson rights) [TO CONFIRM: whether Admin can manage data by default]
- Projects CRUD: Chairperson: Yes; OSAA Dean: No; OSAA Director: No; System Admin: [TO CONFIRM]
- Bulk Uploads: Chairperson: Yes; others: No
- Export Excel/PDF: Chairperson: Yes; OSAA Dean/Director: Yes (exports visible); System Admin: Yes
- User Management: Chairperson: No UI unless Admin; OSAA Dean/Director: No; System Admin: Yes
- Activity Logs: Chairperson: No; OSAA Dean/Director: No; System Admin: Yes
- Change Password (self): All signed-in users: Yes

[TO CONFIRM: exact role strings stored in production Supabase (schema uses 'Admin'/'Faculty', UI uses Chairperson/OSAA roles).]

## 8. Reports & Data Export
- What reports or data summaries are available, and to which roles?
  - Dashboard and Analytics exports (PDF) are available to signed-in users; exports are triggered client-side and produce a PDF containing selected widgets.
  - Reports page provides PDF/Excel exports for Alumni summaries and Project analytics; appears available to all signed-in users (subject to visibility).
  - User Activity Logs Excel export accessible to System Admin via System page.
- What filters or parameters can be applied to reports?
  - Date / batch year filters, project type/category, include options (profiles, employment, skills), per-page selection of charts for PDF.
- What export formats are supported (CSV, PDF, Excel)?
  - Excel (.xlsx) via SheetJS for Alumni, Projects, Audit Logs.
  - PDF via html2canvas + jsPDF for Dashboard and Analytics.
  - CSV not explicitly exported (but .csv import supported).
  - [SCREENSHOT: Reports_Page.png]
- Is there a scheduled or automated report feature?
  - No server-side scheduled exports found. System page shows a `schedule` state with default text but no backend scheduler. Therefore: no automated scheduled reporting implemented.
  - [TO CONFIRM: whether scheduled export is intended]

## 9. Integrations
- What third-party services, APIs, or external tools are integrated?
  - Supabase (Postgres) for DB via service role key.
  - Brevo (Sendinblue) API supported for sending emails if `BREVO_API_KEY` set.
  - SMTP via configured host/credentials for sending emails.
  - Chart.js for charts, SheetJS (xlsx) for import/export, html2canvas + jsPDF for PDF export.
- How does a user or admin connect/configure each integration?
  - Admin provides environment variables in backend `.env`:
    - SUPABASE_URL, SUPABASE_SERVICE_KEY
    - SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_USE_TLS/SMTP_USE_SSL or BREVO_API_KEY
    - SYSTEM_URL for links in emails
- Is there a public-facing API? If so, how does a user obtain credentials?
  - The Flask API is the backend API; public endpoints exist but there is no token-based auth or API key provisioning in code. Supabase service key must be provided to the backend (server-side). No mechanism exists to issue API credentials for external API consumers.

## 10. Troubleshooting & Support
- List of error messages, validation messages, or status codes from codebase (plain-English):
  - "Email and password are required" — login missing fields (400).
  - "Invalid credentials" — login failed (401).
  - "No active account found for that email" — password reset request for unknown/inactive email (404).
  - "Unable to send verification email" — email sending failed (500).
  - "Reset request expired or not found" — password reset challenge missing/expired (404).
  - "Invalid verification code" — wrong code (400).
  - "Email has not been verified" — attempting reset complete without verification (400).
  - "Passwords do not match" — password/confirmation mismatch (400).
  - "Password must be at least 8 characters..." — password complexity violation (400).
  - "Current user not found" — change-password actor not found (404).
  - "Current password is incorrect" — wrong current password (400).
  - "No records provided" — bulk upload with empty payload (400).
  - "Unable to update password", "Unable to update" — DB update failure (500).
- Likely causes & solutions:
  - Email sending failures: missing SMTP or BREVO config — set SMTP_* env vars or BREVO_API_KEY; toggle EMAIL_DEBUG to diagnose.
  - Invalid login: passwords are stored plaintext in demo — ensure you use seeded credentials or correct record; production should use hashed passwords.
  - CORS errors: ensure FRONTEND_ORIGINS includes frontend URL or use default localhost origins; Vite proxy may mask during dev.
  - Bulk upload failures: ensure spreadsheet headers match expected template; check validation errors in preview; ensure `X-File-Name` header sent (frontend handles it).
  - Supabase connection failure: ensure SUPABASE_URL and SUPABASE_SERVICE_KEY env vars are present and correct.
- What support channels are configured?
  - No dedicated support email or chat widget found in the codebase. The README lists team members, but no programmatic support channel.
  - [TO CONFIRM: desired support contact info to include in manual]

## 11. Security & Privacy
- What authentication method is used (JWT, sessions, OAuth)?
  - Simple email/password authentication with no tokens. Backend returns user object on login; frontend stores user info in `localStorage` (no JWT). Audit logs use `X-User` header from localStorage for context.
- Is two-factor authentication (2FA) implemented? If so, what methods?
  - No 2FA found.
- How are sessions managed — timeouts, token expiry, multi-device handling?
  - Sessions are client-side "session" by presence of `appas_user` in localStorage. No server-side sessions, tokens, or expiry enforcement found. No multi-device handling.
- What data encryption or security libraries are in use?
  - No encryption libraries found. Passwords stored plaintext in DB schema (explicitly noted as insecure in README). Supabase service key must be kept secret; code uses create_client with service key.
- Is there GDPR, data retention, or privacy policy handling in the code?
  - No privacy policy handling, consent or data retention configuration found.
  - [TO CONFIRM: organization-level privacy/compliance requirements]

## 12. Glossary
- APPAS: Alumni Project Performance Analytics System — the application.
- Admin / System Admin: role with access to user management and system logs.
- Chairperson: role with full data-management privileges (create/edit/delete/upload).
- OSAA: Office of the Student and Alumni Affairs.
- OSAA Dean: role (view-only) within OSAA.
- OSAA Director: role (view-only) within OSAA.
- KPI: Key Performance Indicator (total alumni, employment rate, total projects, implemented rate).
- Audit Log: `audit_logs` table entries recording actions, actor, and color.
- Upload History: `upload_history` table recording dataset, rows_count, actor, file_name.
- Supabase: hosted Postgres backend used as DB; backend accesses via server-side service key.
- html2canvas/jsPDF: client libraries used to render UI elements to image and then PDF.
- SheetJS / XLSX: library used to parse and write Excel files client-side.

## 13. Appendices

### Appendix A: Keyboard Shortcuts
- No custom keyboard shortcuts found in frontend code. Standard browser shortcuts apply.

### Appendix B: Changelog / Release Notes
- package.json version: `1.0.0` (frontend).
- No CHANGELOG.md or git tags available in repository files inspected.
  - [TO CONFIRM: provide git tags or changelog if present]

### Appendix C: Compliance & Certifications
- No explicit compliance libraries or certifications present in code (e.g., GDPR modules, SOC2 indicators).
- Note: Demo stores plaintext passwords and lacks RLS / row-level security — production must enable Supabase RLS and password hashing.

### Appendix D: Accessibility
- Accessibility notes observed:
  - Use of semantic HTML form controls and labels in forms/modals.
  - Buttons and inputs include placeholders and aria-label usage (e.g., password toggle uses aria-label).
  - Modals appear to manage focus visually but no explicit focus-trap library detected.
  - Some SVG icons include accessible fallbacks; some elements lack explicit `aria-*` attributes.
  - Color contrast: theme uses colored backgrounds and text, but no explicit contrast checks found.
  - Keyboard navigation: sidebar and profile menu handle Escape key to close; the layout registers keydown event for Escape (good). No explicit skip-links or full ARIA menu implementations seen.
  - Recommendations: add ARIA roles to modal dialogs, ensure focus trap on modals, and confirm color contrast ratios.
  - [TO CONFIRM: any accessibility testing artifacts or requirements]

Notes & Outstanding Confirmations:
- [TO CONFIRM: whether Admin should have Chairperson data-management rights by default or roles are distinct.]
- [TO CONFIRM: whether self-registration is intended; codebase lacks a public sign-up feature.]
- [TO CONFIRM: production deployment config and expected Node/Python minimal versions.]
- [TO CONFIRM: support contact or policy documents to include in manual.]
- [TO CONFIRM: scheduled report feature intent — UI shows a schedule string but no backend scheduler.]

Would you like me to:
- convert this into a printable PDF/Markdown file in the repo, or
- generate separate per-page screenshots placeholders with suggested capture areas (desktop/mobile)?
