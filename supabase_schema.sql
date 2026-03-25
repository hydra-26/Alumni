-- ═══════════════════════════════════════════════
-- APPAS — Pangasinan State University
-- Supabase Database Schema
-- ═══════════════════════════════════════════════

-- USERS TABLE
create table if not exists users (
  id               bigserial primary key,
  first_name       text not null,
  last_name        text not null,
  username         text not null unique,
  email            text not null unique,
  password         text not null,  -- store bcrypt hash in production
  role             text not null check (role in ('Admin','Faculty')),
  last_login       timestamptz,
  status           text not null default 'Active' check (status in ('Active','Inactive')),
  created_at       timestamptz not null default now()
);

-- ALUMNI TABLE
create table if not exists alumni (
  id                bigserial primary key,
  first_name        text not null,
  last_name         text not null,
  batch_year        text not null,
  course            text not null check (course in ('BSIT','BSCS','BSIS')),
  email             text,
  contact           text,
  employment_status text not null default 'Seeking' check (employment_status in ('Employed','Self-Employed','Seeking','Studying')),
  company           text,
  skills            text,
  created_at        timestamptz not null default now()
);

-- PROJECTS TABLE
create table if not exists projects (
  id         bigserial primary key,
  title      text not null,
  category   text not null check (category in ('Web App','Mobile App','IoT System','Data Analytics','Desktop App')),
  year       text not null,
  adviser    text,
  members    text,
  status     text not null default 'In Progress' check (status in ('Implemented','In Progress','Proposed','Awarded')),
  award      text,
  abstract   text,
  created_at timestamptz not null default now()
);

-- AUDIT LOGS TABLE
create table if not exists audit_logs (
  id         bigserial primary key,
  action     text not null,
  actor      text not null,
  color      text default '#0a3d8f',
  created_at timestamptz not null default now()
);

-- ─── SEED: Default Admin User ───────────────────
insert into users (first_name, last_name, username, email, password, role, responsibility, status)
values
  ('Jonathan', 'Ablang',   'j.ablang',   'j.ablang@psu.edu.ph',   'admin123',   'Admin',   'Project Manager',     'Active'),
  ('George',   'Benito',   'g.benito',   'g.benito@psu.edu.ph',   'faculty123', 'Faculty', 'Database Developer',  'Active'),
  ('Shaila',   'Bautista', 's.bautista', 's.bautista@psu.edu.ph', 'faculty123', 'Faculty', 'UI/UX Designer',      'Active'),
  ('Jemima',   'Agaoid',   'j.agaoid',   'j.agaoid@psu.edu.ph',   'faculty123', 'Faculty', 'Analytics Lead',      'Active'),
  ('Ram',      'Canido',   'r.canido',   'r.canido@psu.edu.ph',   'faculty123', 'Faculty', 'Frontend Developer',  'Active'),
  ('Ethelyn',  'Dacanay',  'e.dacanay',  'e.dacanay@psu.edu.ph',  'faculty123', 'Faculty', 'QA & Documentation',  'Active')
on conflict (username) do nothing;

-- ─── SEED: Sample Alumni ────────────────────────
insert into alumni (first_name, last_name, batch_year, course, email, contact, employment_status, company, skills) values
  ('Maria',   'Santos',    '2025', 'BSIT', 'maria.santos@email.com',   '+63 912 345 6789', 'Employed',      'TechCorp PH',     'React, Node.js, MySQL'),
  ('Juan',    'Dela Cruz', '2025', 'BSCS', 'juan.delacruz@email.com',  '+63 917 123 4567', 'Employed',      'Accenture PH',    'Python, Django, PostgreSQL'),
  ('Ana',     'Reyes',     '2024', 'BSIT', 'ana.reyes@email.com',      '+63 918 987 6543', 'Self-Employed', 'Freelance',       'Laravel, Vue.js, Firebase'),
  ('Carlo',   'Mendoza',   '2024', 'BSIS', 'carlo.mendoza@email.com',  '+63 919 234 5678', 'Seeking',       '',                'Java, Spring Boot, MySQL'),
  ('Luz',     'Villanueva','2023', 'BSIT', 'luz.villanueva@email.com', '+63 920 456 7890', 'Employed',      'Globe Telecom',   'React, TypeScript, AWS'),
  ('Marco',   'Torres',    '2023', 'BSCS', 'marco.torres@email.com',   '+63 921 567 8901', 'Employed',      'IBM Philippines', 'AI/ML, TensorFlow, Python'),
  ('Iris',    'Garcia',    '2022', 'BSIT', 'iris.garcia@email.com',    '+63 922 678 9012', 'Employed',      'Concentrix',      'React Native, Firebase'),
  ('Paolo',   'Ramos',     '2022', 'BSIS', 'paolo.ramos@email.com',    '+63 923 789 0123', 'Self-Employed', 'Digital Agency',  'WordPress, PHP, MySQL'),
  ('Kira',    'Flores',    '2021', 'BSCS', 'kira.flores@email.com',    '+63 924 890 1234', 'Employed',      'Cisco PH',        'Networking, Python, Bash'),
  ('Dani',    'Cruz',      '2021', 'BSIT', 'dani.cruz@email.com',      '+63 925 901 2345', 'Studying',      'PSU Graduate',    'R, SPSS, Data Analytics')
on conflict do nothing;

-- ─── SEED: Sample Projects ──────────────────────
insert into projects (title, category, year, adviser, members, status, award, abstract) values
  ('BarangayIS v2',      'Web App',       '2025', 'Prof. Ablang',   'Santos, Dela Cruz',   'Implemented', '',                     'A barangay information system for digital governance.'),
  ('Smart Farm Monitor', 'IoT System',    '2025', 'Prof. Benito',   'Reyes, Mendoza',       'Awarded',     'Best in Capstone 2025','IoT-based farm monitoring with real-time sensor data.'),
  ('EduTrack Mobile',    'Mobile App',    '2024', 'Prof. Bautista', 'Villanueva, Torres',   'Implemented', '',                     'A mobile learning tracker for students and teachers.'),
  ('HealthLink Portal',  'Web App',       '2024', 'Prof. Agaoid',   'Garcia, Ramos',        'In Progress', '',                     'Centralized health record management for clinics.'),
  ('AgriData Analytics', 'Data Analytics','2023', 'Prof. Canido',   'Flores, Cruz',         'Implemented', '',                     'Analytics dashboard for agricultural production data.'),
  ('LibraryMS Pro',      'Desktop App',   '2023', 'Prof. Dacanay',  'Santos, Flores',       'Implemented', '',                     'A desktop library management system with RFID.'),
  ('Campus Navigator',   'Mobile App',    '2022', 'Prof. Ablang',   'Torres, Ramos',        'Awarded',     'Regional IT Fair 2022','AR-based campus navigation for new students.'),
  ('DataSense IoT',      'IoT System',    '2022', 'Prof. Benito',   'Garcia, Cruz',         'Implemented', '',                     'Environmental data collection using Arduino.'),
  ('SchoolBridge',       'Web App',       '2021', 'Prof. Bautista', 'Villanueva, Mendoza',  'Implemented', '',                     'Parent-teacher communication platform.'),
  ('ML Grade Predictor', 'Data Analytics','2021', 'Prof. Agaoid',   'Reyes, Dela Cruz',     'Awarded',     'Best Research 2021',  'Machine learning model predicting student academic performance.')
on conflict do nothing;

-- ─── SEED: Audit Logs ───────────────────────────
insert into audit_logs (action, actor, color) values
  ('Alumni record added: Maria Santos',          'j.ablang',  '#0a3d8f'),
  ('Project submitted: Smart Farm Monitor',      'g.benito',  '#d4a800'),
  ('User account created: s.bautista',           'j.ablang',  '#0a3d8f'),
  ('Alumni record updated: Carlo Mendoza',       's.bautista','#0a3d8f'),
  ('Export report generated (PDF)',              'j.agaoid',  '#0d8a5e'),
  ('Project awarded: Campus Navigator',          'j.ablang',  '#d4a800'),
  ('Backup created successfully',                'system',    '#0d8a5e'),
  ('User login: r.canido',                       'r.canido',  '#0077b6')
on conflict do nothing;
