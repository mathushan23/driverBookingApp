import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { LocationPicker } from '../../components/location/LocationPicker'
import { api } from '../../services/api'
import { setAuthSession } from '../../services/authStorage'

const statuses = ['AVAILABLE', 'BUSY', 'OFFLINE']

export function DriverDashboard({ user, logout }) {
  const [status, setStatus] = useState(user?.driverStatus || 'OFFLINE')
  const [driverLocation, setDriverLocation] = useState({
    address: user?.address || '',
    lat: user?.latitude || null,
    lng: user?.longitude || null,
  })
  const [savedAddress, setSavedAddress] = useState(user?.address || 'No location saved yet')
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [acceptedRide, setAcceptedRide] = useState(null)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [completedRide, setCompletedRide] = useState(null)

  const hasActiveRide = acceptedRide?.status === 'ACCEPTED'

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  const loadRequests = async () => {
    if (!user?.id || hasActiveRide) return
    setLoadingRequests(true)
    try {
      const { data } = await api.get(`/bookings/driver-requests/${user.id}`)
      setRequests(data)
    } catch {
      setRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  const loadActiveRide = async () => {
    if (!user?.id) return
    try {
      const { data } = await api.get(`/bookings/driver-history/${user.id}`)
      const activeRide = data.find((ride) => ride.status === 'ACCEPTED')
      if (activeRide) {
        setAcceptedRide(activeRide)
        setStatus('BUSY')
        setRequests([])
      } else {
        setAcceptedRide(null)
        setStatus(user?.driverStatus || 'OFFLINE')
      }
    } catch {
      setAcceptedRide(null)
    }
  }

  useEffect(() => {
    loadActiveRide()
  }, [user?.id])

  useEffect(() => {
    loadRequests()
    const timer = setInterval(loadRequests, 5000)
    return () => clearInterval(timer)
  }, [user?.id, hasActiveRide])

  const saveLocation = async () => {
    setError('')

    if (!driverLocation.lat || !driverLocation.lng) {
      setError('Please choose a location using suggestions, GPS, or map before saving.')
      return
    }

    setSaving(true)
    try {
      const { data: updatedUser } = await api.patch(`/users/${user.id}/driver-location`, {
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        address: driverLocation.address,
      })
      setAuthSession(updatedUser)
      setSavedAddress(updatedUser.address)
      showToast('Location saved successfully')
      loadRequests()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save driver location.')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (nextStatus) => {
    if (hasActiveRide) return
    setStatus(nextStatus)
    setError('')
    try {
      const { data: updatedUser } = await api.patch(`/users/${user.id}/driver-status`, { status: nextStatus })
      setAuthSession(updatedUser)
      showToast(`Status changed to ${nextStatus}`)
      loadRequests()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update driver status.')
    }
  }

  const acceptRide = async (bookingId) => {
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/accept`, null, { params: { driverId: user.id } })
      setAcceptedRide(data)
      setStatus('BUSY')
      setRequests([])
      showToast('Ride accepted. Navigate to pickup location.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not accept this ride.')
    }
  }

  const declineRide = (bookingId) => {
    setRequests((current) => current.filter((request) => request.id !== bookingId))
    showToast('Ride request hidden', 'info')
  }

  const completeRide = async () => {
    if (!acceptedRide?.id) return
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${acceptedRide.id}/complete`, null, { params: { driverId: user.id } })
      setCompletedRide(data)
      setAcceptedRide(data)
      setStatus('AVAILABLE')
      showToast('Ride completed successfully')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not complete this ride.')
    }
  }

  const closeCompletionModal = () => {
    setCompleteModalOpen(false)
    if (completedRide) {
      setAcceptedRide(null)
      setCompletedRide(null)
      loadRequests()
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <Toast toast={toast} />
      <CompletionModal open={completeModalOpen} completedRide={completedRide} onClose={closeCompletionModal} onConfirm={completeRide} />

      <section className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-4 overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(37,99,235,.24),rgba(255,255,255,.09)_48%,rgba(14,165,233,.18))] p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">driver control center</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Driver Dashboard</h1>
              <div className="mt-4 grid gap-3 text-sm font-bold text-blue-100/80 sm:grid-cols-3">
                <InfoPill label="Driver" value={user?.name || 'Driver'} />
                <InfoPill label="Email" value={user?.email || 'No email'} />
                <InfoPill label="Vehicle" value={`${formatVehicleType(user?.vehicleType)} ${user?.vehicleNumber ? `| ${user.vehicleNumber}` : ''}`} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[180px_130px_120px] lg:min-w-[460px]">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-blue-200/70">
                Driver Status
                <select
                  className="auth-input mt-2 h-12 text-sm"
                  value={status}
                  onChange={(event) => updateStatus(event.target.value)}
                  disabled={hasActiveRide}
                  title={hasActiveRide ? 'Status is locked while a ride is active' : 'Change driver status'}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item} disabled={hasActiveRide && item !== 'BUSY'}>{item}</option>
                  ))}
                </select>
              </label>
              <Link to="/driver/history" className="self-end rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center text-sm font-black text-blue-100 hover:bg-white/15">History</Link>
              <button onClick={logout} className="self-end rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Logout</button>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-[1.6rem] border border-white/15 bg-white/10 p-4 shadow-xl shadow-blue-950/25 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px] lg:items-end">
            <div>
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black">Save Current Location</h2>
                <p className="text-xs font-bold text-blue-100/65">Saved: {savedAddress}</p>
              </div>
              <LocationPicker label="Driver Location" value={driverLocation} allowCurrentLocation onChange={setDriverLocation} />
            </div>
            <button type="button" onClick={saveLocation} disabled={saving} className="primary-action h-13">{saving ? 'Saving...' : 'Save Location'}</button>
          </div>
        </section>

        {error && <p className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}

        <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-black">Ride Requests</h2>
            <p className="mt-2 text-sm text-blue-100/70">Only AVAILABLE drivers receive matching rides within 5 km and matching vehicle type.</p>
          </div>

          {acceptedRide && <AcceptedRideCard ride={acceptedRide} onComplete={() => setCompleteModalOpen(true)} />}

          <div className="mt-5 grid gap-4">
            {loadingRequests && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">Checking nearby ride requests...</p>}
            {!loadingRequests && requests.length === 0 && !hasActiveRide && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">No nearby pending ride requests. Set status AVAILABLE and save your current location.</p>}
            {requests.map((request, index) => (
              <motion.article key={request.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black">Booking #{request.id}</p>
                    <p className="mt-1 text-sm text-blue-100/70">Rider: {request.riderName || 'Rider'} {request.riderMobile ? `| ${request.riderMobile}` : ''}</p>
                    <MapAddress label="Pickup" address={request.pickupAddress} lat={request.pickupLatitude} lng={request.pickupLongitude} compact />
                    <MapAddress label="Drop" address={request.dropAddress} lat={request.dropLatitude} lng={request.dropLongitude} compact />
                  </div>
                  <div className="text-right font-black text-blue-300">
                    <p>{formatVehicleType(request.vehicleType)}</p>
                    <p>LKR {Number(request.price || 0).toFixed(0)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => acceptRide(request.id)} disabled={hasActiveRide} className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-black text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">Accept</button>
                  <button onClick={() => declineRide(request.id)} className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-blue-100 hover:bg-white/15">Decline</button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function AcceptedRideCard({ ride, onComplete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mt-5 overflow-hidden rounded-[1.8rem] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,.18),rgba(255,255,255,.08))] shadow-2xl shadow-emerald-950/20">
      <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100/70">Active assignment</p>
          <h3 className="mt-2 text-3xl font-black">{ride.riderName || 'Rider'}</h3>
          <div className="mt-4 grid gap-3">
            <DetailPill label="Mobile" value={ride.riderMobile || 'Not available'} />
            <DetailPill label="Vehicle" value={formatVehicleType(ride.vehicleType)} />
            <DetailPill label="Price" value={`LKR ${Number(ride.price || 0).toFixed(0)}`} />
            <DetailPill label="Status" value={ride.status} />
          </div>
          {ride.status === 'ACCEPTED' && <button onClick={onComplete} className="primary-action mt-5">Complete Ride</button>}
        </div>
        <div className="p-5">
          <h4 className="text-xl font-black">Route Details</h4>
          <div className="mt-4 space-y-4">
            <MapAddress label="Pickup Location" address={ride.pickupAddress} lat={ride.pickupLatitude} lng={ride.pickupLongitude} />
            <div className="ml-3 h-10 w-px bg-emerald-200/25" />
            <MapAddress label="Drop Location" address={ride.dropAddress} lat={ride.dropLatitude} lng={ride.dropLongitude} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CompletionModal({ open, completedRide, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.94 }} className="w-full max-w-md rounded-[2rem] border border-white/15 bg-slate-950 p-6 text-center shadow-2xl shadow-blue-950/60">
            {completedRide ? (
              <>
                <motion.div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-400 text-4xl font-black text-slate-950" initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ duration: 0.55 }}>OK</motion.div>
                <h3 className="mt-5 text-3xl font-black">Ride Completed</h3>
                <p className="mt-3 text-sm leading-6 text-blue-100/70">Assignment closed successfully. Your status is now AVAILABLE.</p>
                <button onClick={onClose} className="primary-action mt-6">Continue</button>
              </>
            ) : (
              <>
                <motion.div className="mx-auto h-20 w-20 rounded-full border-4 border-blue-300/30 border-t-blue-300" animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} />
                <h3 className="mt-5 text-3xl font-black">Complete this ride?</h3>
                <p className="mt-3 text-sm leading-6 text-blue-100/70">This will close the assignment and unlock your driver status dropdown.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button onClick={onClose} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Not Yet</button>
                  <button onClick={onConfirm} className="primary-action">Complete Ride</button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.96 }} className={`fixed right-4 top-4 z-50 rounded-2xl border px-5 py-4 text-sm font-black shadow-2xl backdrop-blur-xl ${toast.type === 'info' ? 'border-blue-300/30 bg-blue-500/20 text-blue-50' : 'border-emerald-300/30 bg-emerald-500/20 text-emerald-50'}`}>
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MapAddress({ label, address, lat, lng, compact = false }) {
  const href = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`group block rounded-2xl border border-white/10 bg-white/10 ${compact ? 'mt-2 p-3' : 'p-4'} transition hover:border-blue-300/40 hover:bg-blue-500/10`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/60">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-white/90 group-hover:text-blue-100">{address}</p>
      <p className="mt-1 text-xs font-black text-blue-300">Open in Google Maps</p>
    </a>
  )
}

function DetailPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-emerald-100/60">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-blue-200/60">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  )
}

function formatVehicleType(type = '') {
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Vehicle'
}
