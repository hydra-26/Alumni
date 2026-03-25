# APPAS — Alumni Project Performance Analytics System
### Pangasinan State University · BSIT Department · Urdaneta Campus

---

## 📋 Project Overview

APPAS is a full-stack web application for tracking alumni profiles, capstone project records, and performance analytics.

| Stack     | Technology                     |
|-----------|-------------------------------|
| Frontend  | React 18, TailwindCSS 3, Vite |
| Backend   | Python Flask 3                |
| Database  | Supabase (PostgreSQL)         |
| Charts    | Chart.js 4 + react-chartjs-2  |
| Fonts     | Plus Jakarta Sans, DM Serif Display, JetBrains Mono |

---

## 📁 Project Structure

```
appas/
├── frontend/              # React + TailwindCSS app
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/    # AppLayout (sidebar + topbar)
│   │   │   └── ui/        # Shared UI primitives (KpiCard, Badge, Modal…)
│   │   ├── context/       # AuthContext, ToastContext
│   │   ├── pages/         # Dashboard, Analytics, AlumniPage, ProjectsPage…
│   │   └── utils/         # api.js (axios wrapper)
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/               # Python Flask API
│   ├── app.py             # Flask app entry point
│   ├── supabase_client.py # Supabase singleton client
│   ├── requirements.txt
│   ├── .env.example       # Copy to .env and fill in values
│   └── routes/
│       ├── auth.py        # POST /api/auth/login
│       ├── alumni.py      # CRUD /api/alumni
│       ├── projects.py    # CRUD /api/projects
│       ├── users.py       # CRUD /api/users
│       └── analytics.py   # GET  /api/analytics/*
│
└── supabase_schema.sql    # Run this in Supabase SQL editor first
```

---

## 🚀 Setup Instructions

### 1. Supabase Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Paste the contents of `supabase_schema.sql` and click **Run**
4. This creates all tables and seeds sample data (users, alumni, projects, audit logs)

### 2. Backend (Flask)

```bash
cd backend

# Copy env file and fill in your Supabase credentials
cp .env.example .env

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
# → Running on http://localhost:5000
```

### 3. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → Running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Default Credentials

| Role    | Username    | Password     |
|---------|-------------|-------------|
| Admin   | `j.ablang`  | `admin123`   |
| Faculty | `g.benito`  | `faculty123` |
| Faculty | `s.bautista`| `faculty123` |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint         | Description       |
|--------|------------------|-------------------|
| POST   | `/api/auth/login`| Login user        |

### Alumni
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| GET    | `/api/alumni`      | List alumni (filter: batch, status, course, q) |
| POST   | `/api/alumni`      | Create alumni       |
| PUT    | `/api/alumni/:id`  | Update alumni       |
| DELETE | `/api/alumni/:id`  | Delete alumni       |

### Projects
| Method | Endpoint             | Description           |
|--------|----------------------|-----------------------|
| GET    | `/api/projects`      | List projects (filter: category, status, year, q) |
| POST   | `/api/projects`      | Create project        |
| PUT    | `/api/projects/:id`  | Update project        |
| DELETE | `/api/projects/:id`  | Delete project        |

### Users
| Method | Endpoint           | Description    |
|--------|--------------------|----------------|
| GET    | `/api/users`       | List users     |
| POST   | `/api/users`       | Create user    |
| PUT    | `/api/users/:id`   | Update user    |
| DELETE | `/api/users/:id`   | Delete user    |

### Analytics
| Method | Endpoint                         | Description             |
|--------|----------------------------------|-------------------------|
| GET    | `/api/analytics/kpis`            | Dashboard KPI summary   |
| GET    | `/api/analytics/projects-per-year` | Bar chart data        |
| GET    | `/api/analytics/categories`      | Doughnut chart data     |
| GET    | `/api/analytics/employment-trend`| Line chart data         |
| GET    | `/api/analytics/audit-logs`      | Recent audit log entries|

---

## 🎨 Design System

### Colors
- **PSU Blue**: `#0a3d8f` (primary)
- **PSU Deep**: `#051f4a` (sidebar background)
- **Gold**: `#f5c518` / Dark: `#d4a800`

### Typography
- **Display**: DM Serif Display (headings, KPI values, page titles)
- **Body**: Plus Jakarta Sans (all UI text)
- **Mono**: JetBrains Mono (badges, codes, timestamps)

---

## 👥 Project Team

| Name                          | Role                 |
|-------------------------------|----------------------|
| Jonathan C. Ablang            | Project Manager      |
| George Christian V. Benito    | Database Developer   |
| Shaila Jane V. Bautista       | UI/UX Designer       |
| Jemima Victoria P. Agaoid     | Analytics Lead       |
| Ram Reniel M. Canido          | Frontend Developer   |
| Ethelyn P. Dacanay            | QA & Documentation   |

---

## ⚠️ Production Notes

- **Passwords** are stored in plaintext in this demo. In production, use `bcrypt` hashing.
- **Authentication** uses localStorage. In production, use JWT tokens with refresh logic.
- Enable **Row Level Security (RLS)** in Supabase for production deployments.
- Set `FLASK_ENV=production` and use a WSGI server (Gunicorn) in production.
