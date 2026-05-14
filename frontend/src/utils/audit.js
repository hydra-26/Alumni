import api from './api'

export const logAudit = async (action, color) => {
  if (!action) return
  try {
    await api.post('/analytics/audit-logs', { action, color })
  } catch {
    // Ignore logging failures to avoid blocking the main action.
  }
}
