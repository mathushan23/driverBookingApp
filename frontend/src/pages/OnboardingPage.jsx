import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PinIcon, WheelIcon } from '../components/icons/GoRideIcons'
import { BrandLockup } from '../components/layout/BrandLockup'
import { CityBackground } from '../components/layout/CityBackground'
import { Button, Input } from '../components/ui/FormControls'
import { Illustration } from '../components/ui/Illustration'
import { roleCards } from '../data/gorideData'
import { api } from '../services/api'

export function OnboardingPage({ user, saveUser }) {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const complete = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: updatedUser } = await api.patch(`/users/${user.id}/onboarding`, {
        ...form,
        role: selectedRole,
      })

      api.defaults.headers.common.Authorization = `Bearer ${updatedUser.token}`
      saveUser(updatedUser)
      navigate('/welcome')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="onboarding-page">
      <CityBackground />
      <motion.section
        className="role-modal"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <BrandLockup centered />
        <div className="modal-heading">
          <h1>Welcome to GoRide</h1>
          <p>How would you like to use GoRide?</p>
        </div>
        <div className="role-grid">
          {roleCards.map((card, index) => (
            <motion.button
              className={`role-card ${selectedRole === card.role ? 'is-selected' : ''}`}
              key={card.role}
              type="button"
              onClick={() => {
                setSelectedRole(card.role)
                setForm({})
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Illustration type={card.role} />
              <span className="role-icon">{card.icon === 'pin' ? <PinIcon /> : <WheelIcon />}</span>
              <strong>{card.title}</strong>
              <small>{card.copy}</small>
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {selectedRole && (
            <motion.form
              className="role-form"
              onSubmit={complete}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {selectedRole === 'rider' ? (
                <Input label="Mobile Number" value={form.mobile || ''} onChange={(mobile) => setForm({ mobile })} />
              ) : (
                <>
                  <Input label="NIC Number" value={form.nic || ''} onChange={(nic) => setForm({ ...form, nic })} />
                  <Input label="Phone Number" value={form.phone || ''} onChange={(phone) => setForm({ ...form, phone })} />
                  <Input label="Vehicle Type" value={form.vehicleType || ''} onChange={(vehicleType) => setForm({ ...form, vehicleType })} />
                  <Input label="Vehicle Number" value={form.vehicleNumber || ''} onChange={(vehicleNumber) => setForm({ ...form, vehicleNumber })} />
                </>
              )}
              {error && <p className="form-error">{error}</p>}
              <Button label={loading ? 'Saving...' : 'Continue'} disabled={loading} />
            </motion.form>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  )
}
