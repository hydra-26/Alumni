import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach user info from localStorage for audit context
api.interceptors.request.use(cfg => {
  try {
    const user = JSON.parse(localStorage.getItem('appas_user'))
    if (user) cfg.headers['X-User'] = user.email
  } catch {}
  return cfg
})

export default api
