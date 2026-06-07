import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackgroundFX } from '../components/auth/AuthLayout'
import { RoleIcon } from '../components/visuals/RideVisual'
import { api } from '../services/api'
import { setAuthSession, welcomePathFor } from '../services/authStorage'

const roles = [
  { role: 'rider', title: 'Rider', description: 'Book rides, view drivers, and track your trip from pickup to destination.' },
  { role: 'driver', title: 'Driver', description: 'Accept ride requests, update availability, and manage your trip earnings.' },
]

export function OnboardingPage({ user, saveUser }) {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: updatedUser } = await api.patch(`/users/${user.id}/onboarding`, {
        ...form,
        role: selectedRole,
      })
      setAuthSession(updatedUser)
      localStorage.setItem('firstLogin', 'false')
      saveUser(updatedUser)
      navigate(welcomePathFor(updatedUser.role), { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your role details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white">
      <BackgroundFX />
      <section className="relative z-10 grid min-h-[calc(100vh-4rem)] place-items-center">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-4xl rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/60 backdrop-blur-2xl sm:p-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">first-time setup</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">How do you want to use Ride Booking App?</h1>
            <p className="mt-4 text-sm leading-6 text-blue-100/80">Choose your role once. We will personalize your welcome page and dashboard from this selection.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {roles.map((item) => (
              <motion.button
                key={item.role}
                type="button"
                onClick={() => {
                  setSelectedRole(item.role)
                  setForm({})
                  setError('')
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-[1.7rem] border p-5 text-left transition ${selectedRole === item.role ? 'border-blue-300 bg-blue-500/20 shadow-2xl shadow-blue-500/20' : 'border-white/15 bg-white/10 hover:border-blue-300/60'}`}
              >
                <RoleIcon role={item.role} />
                <h2 className="mt-5 text-2xl font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-blue-100/75">{item.description}</p>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedRole && (
              <motion.form
                key={selectedRole}
                onSubmit={submit}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-6 overflow-hidden rounded-[1.7rem] border border-white/15 bg-slate-950/45 p-5"
              >
                <h3 className="text-xl font-black">{selectedRole === 'rider' ? 'Rider details' : 'Driver details'}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {selectedRole === 'rider' ? (
                    <AuthField label="Mobile Number" value={form.mobile || ''} onChange={update('mobile')} />
                  ) : (
                    <>
                      <AuthField label="NIC Number" value={form.nic || ''} onChange={update('nic')} />
                      <AuthField label="Phone Number" value={form.phone || ''} onChange={update('phone')} />
                      <SelectField label="Vehicle Type" value={form.vehicleType || ''} onChange={update('vehicleType')} />
                      <AuthField label="Vehicle Number" value={form.vehicleNumber || ''} onChange={update('vehicleNumber')} />
                    </>
                  )}
                </div>
                {error && <p className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}
                <button className="primary-action mt-5" disabled={loading}>{loading ? 'Saving...' : 'Continue'}</button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  )
}

function AuthField({ label, ...props }) {
  return (
    <label className="block text-sm font-bold text-blue-50">
      <span className="mb-2 block">{label}</span>
      <input required className="auth-input" {...props} />
    </label>
  )
}

function SelectField({ label, ...props }) {
  return (
    <label className="block text-sm font-bold text-blue-50">
      <span className="mb-2 block">{label}</span>
      <select required className="auth-input" {...props}>
        <option value="">Select vehicle type</option>
        <option value="motor bike">Motor Bike</option>
        <option value="three wheeler">Three Wheeler</option>
        <option value="car">Car</option>
        <option value="van">Van</option>
      </select>
    </label>
  )
}
