import { createContext, useContext, useState, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('appas_user')) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data.user)
    localStorage.setItem('appas_user', JSON.stringify(data.user))
    return data.user
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('appas_user')
  }, [])

  const isChairperson = user?.role === 'Chairperson'
  const isAdmin = user?.role === 'Admin'

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, canManageData: isChairperson }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
