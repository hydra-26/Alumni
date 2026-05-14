// import axios from 'axios'

// const api = axios.create({ baseURL: '/api' })

// // Attach user info from localStorage for audit context
// api.interceptors.request.use(cfg => {
//   try {
//     const user = JSON.parse(localStorage.getItem('appas_user'))
//     if (user) cfg.headers['X-User'] = user.email
//   } catch {}
//   return cfg
// })

// export default api

import axios from 'axios'

// Use env API URL when set; in dev fall back to the Vite proxy, otherwise keep Render API.
const envBase = import.meta.env.VITE_API_URL
const defaultBase = import.meta.env.DEV ? '/api' : 'https://alumni-rxma.onrender.com/api'
const apiBase = ((envBase && envBase.trim()) ? envBase : defaultBase).replace(/\/+$/, '')
const api = axios.create({ baseURL: apiBase })

// Attach user info from localStorage for audit context
api.interceptors.request.use(cfg => {
  try {
    const user = JSON.parse(localStorage.getItem('appas_user'))
    if (user) cfg.headers['X-User'] = user.email
  } catch {}
  return cfg
})

export default api