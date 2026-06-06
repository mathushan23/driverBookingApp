import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SignupPage } from './pages/SignupPage'
import { WelcomePage } from './pages/WelcomePage'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('goride:user')
    return saved ? JSON.parse(saved) : null
  })

  const saveUser = (nextUser) => {
    localStorage.setItem('goride:user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem('goride:user')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        <Route path="/signup" element={<SignupPage saveUser={saveUser} />} />
        <Route path="/login" element={<LoginPage saveUser={saveUser} />} />
        <Route
          path="/onboarding"
          element={
            <Protected user={user}>
              <OnboardingPage user={user} saveUser={saveUser} />
            </Protected>
          }
        />
        <Route
          path="/welcome"
          element={
            <Protected user={user}>
              <WelcomePage user={user} />
            </Protected>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Protected user={user}>
              <DashboardPage user={user} logout={logout} />
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" />
  if (!user.onboardingComplete && user.role !== 'admin') return <Navigate to="/onboarding" />
  return children
}

export default App
