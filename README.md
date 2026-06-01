## 📌 Project Overview
 
This system manages alumni records and projects for the institution. It supports multiple user roles with different levels of access to ensure proper data governance.
 
---
 
## 🗄️ Database Setup
 
**Database:** Supabase (PostgreSQL)  
**Schema file:** `database/supabase_schema.sql`

**Option A — Supabase SQL Editor:**
1. Open your Supabase project.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of `database/supabase_schema.sql`, then run it.

**Option B — psql (local/remote Postgres):**
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/postgres" -f database/supabase_schema.sql
```
 
---
 
## 👤 User Roles & Access
 
The system has **4 user roles** with the following permissions:
 
| Feature                        | Chairperson | OSAA Dean | OSAA Director | System Admin |
|-------------------------------|:-----------:|:---------:|:-------------:|:------------:|
| View Dashboard & Analytics    | ✅          | ✅        | ✅            | ✅           |
| View Alumni & Project Records | ✅          | ✅        | ✅            | ✅           |
| Add / Edit / Delete Alumni    | ✅          | ❌        | ❌            | ❌           |
| Add / Edit / Delete Projects  | ✅          | ❌        | ❌            | ❌           |
| Bulk Upload (Alumni/Projects) | ✅          | ❌        | ❌            | ❌           |
| Export Excel / PDF            | ✅          | ✅        | ✅            | ✅           |
| User Management               | ❌          | ✅        | ❌            | ✅           |
| User Activity Logs            | ❌          | ❌        | ❌            | ✅           |
| Change Own Password           | ✅          | ✅        | ✅            | ✅           |
 
---
 
## 🔐 Test Accounts
 
Use these credentials to log in and test each role:
 
| Role          | Email                  | Password    |
|---------------|------------------------|-------------|
| System Admin  | admin@psu.edu.ph       | admin123    |
| OSAA Dean     | edna@psu.edu.ph        | edna123     |
| OSAA Director | jeshua@psu.edu.ph      | jeshua123   |
| Chairperson   | caren@psu.edu.ph       | caren123    |
 
---
 
## 🚀 How to Run
 
1. **Backend (Flask)**
	 - From `backend/`, create a `.env` file and set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
	 - Install dependencies:
		 ```bash
		 pip install -r requirements.txt
		 ```
	 - Run the API server:
		 ```bash
		 python app.py
		 ```
		 The API listens on `http://localhost:5000`.

2. **Frontend (Vite + React)**
	 - From `frontend/`, install dependencies:
		 ```bash
		 npm install
		 ```
	 - Start the dev server:
		 ```bash
		 npm run dev
		 ```
		 Open `http://localhost:5173` in your browser.

> The Vite dev server proxies `/api` to `http://localhost:5000`. Set `VITE_API_URL` only if you want a custom API base URL.
---
 
## 🛠️ Tech Stack
 
- **Frontend:** React, Vite, Tailwind CSS, Chart.js
- **Backend:** Python, Flask, Flask-CORS, Supabase Python client, Gunicorn
- **Database:** Supabase (PostgreSQL)
- **Utilities:** Axios, jsPDF, html2canvas, SheetJS (xlsx)