import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail'))

  function login(accessToken, email) {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('userEmail', email)
    setToken(accessToken)
    setUserEmail(email)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    setToken(null)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider value={{ token, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
