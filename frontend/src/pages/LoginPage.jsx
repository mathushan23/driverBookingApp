import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/layout/AuthShell'
import { Button, FormHeader, Input } from '../components/ui/FormControls'
import { api } from '../services/api'
import { dashboardPathFor, setAuthSession } from '../services/authStorage'
import { useState } from 'react'

export function LoginPage({ saveUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: user } = await api.post('/auth/login', form)
      setAuthSession(user)
      saveUser(user)

      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (!user.onboardingComplete) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate(dashboardPathFor(user.role), { replace: true })
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell mode="login">
      <FormHeader title="Welcome Back" subtitle="Access your rides, routes, and bookings with GoRide." />
      {location.state?.message && <p className="form-success">{location.state.message}</p>}
      <form className="auth-form" onSubmit={submit}>
        <Input label="Email Address" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        {error && <p className="form-error">{error}</p>}
        <Button label={loading ? 'Signing in...' : 'Start Riding'} disabled={loading} />
      </form>
      <p className="auth-switch">
        New passenger or driver? <Link to="/signup">Create your GoRide account</Link>
      </p>
    </AuthShell>
  )
}
