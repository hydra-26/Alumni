import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const AppLayout = lazy(() => import('./components/layout/AppLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const AlumniPage = lazy(() => import('./pages/AlumniPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const SystemPage = lazy(() => import('./pages/SystemPage'))

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500 text-sm font-medium">Loading page...</div>
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="alumni"    element={<AlumniPage />} />
        <Route path="projects"  element={<ProjectsPage />} />
        <Route path="reports"   element={<ReportsPage />} />
        <Route path="users"     element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
        <Route path="system"    element={<ProtectedRoute adminOnly><SystemPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<RouteLoader />}>
          <AppRoutes />
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  )
}
