import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { api } from '../../services/api'

export function RiderBookingWaitingPage({ user }) {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [booking, setBooking] = useState(location.state?.booking || null)
  const [error, setError] = useState('')
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    let active = true

    const loadBooking = async () => {
      try {
        if (!bookingId || bookingId === 'undefined') {
          throw new Error('Invalid booking id')
        }

        const { data } = await api.get(`/bookings/${bookingId}`)
        if (!active) return
        setBooking(data)
        setError('')
        if (data.status === 'ACCEPTED') {
          setTimeout(() => navigate('/rider/dashboard', { replace: true, state: { acceptedBooking: data } }), 1200)
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Retrying booking status...')
      }
    }

    loadBooking()
    const timer = setInterval(loadBooking, 3000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [bookingId, navigate])

  const cancelRide = async () => {
    setCanceling(true)
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/cancel`, null, { params: { riderId: user.id } })
      setBooking(data)
      setTimeout(() => navigate('/rider/dashboard', { replace: true }), 900)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not cancel this booking.')
    } finally {
      setCanceling(false)
    }
  }

  const accepted = booking?.status === 'ACCEPTED'
  const canceled = booking?.status === 'CANCELED'

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center">
        <motion.div initial={{ opacity: 0, y: 26, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full overflow-hidden rounded-[2.4rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.14),rgba(15,23,42,.58))] shadow-2xl shadow-blue-950/50 backdrop-blur-2xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative bg-slate-950/50 p-8 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">booking request</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
                {accepted ? 'Driver accepted your ride.' : canceled ? 'Ride canceled.' : 'Finding a nearby driver.'}
              </h1>
              <p className="mt-5 text-base leading-8 text-blue-100/75">
                {accepted
                  ? `${booking.driverName || 'A driver'} accepted your ride. You can return to your dashboard.`
                  : canceled
                    ? 'Your booking was canceled before a driver accepted it.'
                    : 'We are sending your request only to drivers within 5 km of your pickup location.'}
              </p>

              <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-200/70">Nearby drivers</p>
                <p className="mt-2 text-3xl font-black text-white">{booking?.nearbyDriverCount ?? 0}</p>
                <p className="mt-1 text-sm text-blue-100/70">Drivers currently eligible to receive this ride request.</p>
              </div>

              {error && <p className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100">{error}</p>}

              {!accepted && !canceled && (
                <button onClick={cancelRide} disabled={canceling} className="mt-6 w-full rounded-2xl border border-red-300/25 bg-red-500/10 px-5 py-4 text-sm font-black text-red-100 transition hover:bg-red-500/20 disabled:opacity-60">
                  {canceling ? 'Canceling...' : 'Cancel Ride Before Driver Accepts'}
                </button>
              )}
              {(accepted || canceled) && (
                <button onClick={() => navigate('/rider/dashboard', { replace: true })} className="primary-action mt-6">Back to Dashboard</button>
              )}
            </div>

            <div className="relative grid min-h-[420px] place-items-center overflow-hidden p-8">
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:42px_42px]" />
              <motion.div className="absolute h-72 w-72 rounded-full border border-blue-300/20" animate={{ scale: [1, 1.14, 1], opacity: [0.65, 0.2, 0.65] }} transition={{ duration: 2.2, repeat: Infinity }} />
              <motion.div className="absolute h-48 w-48 rounded-full border border-cyan-300/25" animate={{ scale: [1.2, 0.95, 1.2], opacity: [0.18, 0.55, 0.18] }} transition={{ duration: 2.8, repeat: Infinity }} />
              <motion.div className="relative grid h-36 w-36 place-items-center rounded-[2rem] bg-blue-500 text-5xl font-black shadow-2xl shadow-blue-500/40" animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }} transition={{ duration: 2.6, repeat: Infinity }}>
                {accepted ? 'OK' : canceled ? 'X' : 'CAR'}
              </motion.div>
              {!accepted && !canceled && (
                <motion.div className="absolute bottom-16 h-2 w-36 rounded-full bg-blue-400 shadow-[0_0_28px_rgba(96,165,250,.8)]" animate={{ x: [-180, 180, -180] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }} />
              )}
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
