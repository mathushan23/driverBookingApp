import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { LocationPicker } from '../../components/location/LocationPicker'
import { api } from '../../services/api'

const assignedDriver = { name: 'Nimal Perera', vehicle: 'Toyota Aqua', eta: '3 min', rating: '4.9' }
const vehicleTypes = ['motor bike', 'three wheeler', 'car', 'van']

export function RiderDashboard({ user, logout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [booking, setBooking] = useState({
    pickup: { address: '', lat: null, lng: null },
    drop: { address: '', lat: null, lng: null },
    vehicleType: 'car',
    specialNote: '',
  })
  const [confirmation, setConfirmation] = useState(location.state?.acceptedBooking || null)
  const [currentRide, setCurrentRide] = useState(location.state?.acceptedBooking || null)
  const [showBookingForm, setShowBookingForm] = useState(!location.state?.acceptedBooking)
  const [bookingFormOpened, setBookingFormOpened] = useState(false)
  const [loadingCurrentRide, setLoadingCurrentRide] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [routeInfo, setRouteInfo] = useState({ loading: false, distance: null, duration: null, error: '' })

  const loadCurrentRide = async () => {
    if (!user?.id) return
    setLoadingCurrentRide(true)
    try {
      const { data } = await api.get(`/bookings/rider-history/${user.id}`)
      const activeRide = data.find((ride) => ride.status === 'ACCEPTED')
      setCurrentRide(activeRide || null)
      setConfirmation(activeRide || null)
      setShowBookingForm(activeRide && !bookingFormOpened ? false : true)
    } finally {
      setLoadingCurrentRide(false)
    }
  }

  useEffect(() => {
    loadCurrentRide()
    const timer = setInterval(loadCurrentRide, 5000)
    return () => clearInterval(timer)
  }, [user?.id, bookingFormOpened])

  useEffect(() => {
    let active = true

    const calculateRouteDistance = () => {
      if (!booking.pickup?.lat || !booking.pickup?.lng || !booking.drop?.lat || !booking.drop?.lng) {
        setRouteInfo({ loading: false, distance: null, duration: null, error: '' })
        return
      }

      if (!window.google?.maps?.DirectionsService) {
        setRouteInfo({ loading: false, distance: null, duration: null, error: 'Google route unavailable' })
        return
      }

      setRouteInfo({ loading: true, distance: null, duration: null, error: '' })
      const directionsService = new window.google.maps.DirectionsService()

      directionsService.route(
        {
          origin: { lat: booking.pickup.lat, lng: booking.pickup.lng },
          destination: { lat: booking.drop.lat, lng: booking.drop.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (!active) return

          if (status !== 'OK' || !result?.routes?.[0]?.legs?.length) {
            setRouteInfo({ loading: false, distance: null, duration: null, error: 'Route not found' })
            return
          }

          const meters = result.routes[0].legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0)
          const seconds = result.routes[0].legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0)
          setRouteInfo({
            loading: false,
            distance: (meters / 1000).toFixed(1),
            duration: formatDuration(seconds),
            error: '',
          })
        },
      )
    }

    calculateRouteDistance()

    return () => {
      active = false
    }
  }, [booking.pickup?.lat, booking.pickup?.lng, booking.drop?.lat, booking.drop?.lng])

  const confirmRide = async (event) => {
    event.preventDefault()
    setError('')

    if (!booking.pickup.lat || !booking.drop.lat) {
      setError('Please select both pickup and drop locations from suggestions, GPS, or map.')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post('/bookings', {
        riderId: user.id,
        pickupLatitude: booking.pickup.lat,
        pickupLongitude: booking.pickup.lng,
        pickupAddress: booking.pickup.address,
        dropLatitude: booking.drop.lat,
        dropLongitude: booking.drop.lng,
        dropAddress: booking.drop.address,
        rideType: booking.vehicleType,
        distanceKm: routeInfo.distance ? Number(routeInfo.distance) : null,
        specialNote: booking.specialNote,
      })
      navigate(`/rider/booking/${data.id}`, { replace: true, state: { booking: data } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not confirm booking. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(37,99,235,.24),rgba(255,255,255,.09)_44%,rgba(14,165,233,.16))] p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ride booking app</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Rider Dashboard</h1>
            <p className="mt-2 text-blue-100/75">Welcome {user?.name || 'Rider'}, choose your route and vehicle.</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="rounded-2xl border border-blue-300/20 bg-blue-500/15 px-4 py-3 text-sm font-black text-blue-100">
              Live map booking
            </div>
            <Link to="/rider/history" className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center text-sm font-black text-blue-100 hover:bg-white/15">Ride History</Link>
            <button onClick={logout} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Logout</button>
          </div>
        </header>

        {!showBookingForm && (
          <CurrentRidePanel
            ride={currentRide}
            loading={loadingCurrentRide}
            onBookAnother={() => {
              setBookingFormOpened(true)
              setShowBookingForm(true)
            }}
          />
        )}

        {showBookingForm && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-[2.2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.13),rgba(15,23,42,.42))] shadow-2xl shadow-blue-950/40 backdrop-blur-2xl"
        >
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-5 sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-300">book a ride</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Where are you going?</h2>
                <p className="mt-2 text-sm leading-6 text-blue-100/70">Use autocomplete, GPS, or pick locations directly from the interactive map.</p>
              </div>

              <form className="space-y-4" onSubmit={confirmRide}>
                <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/35 p-4">
                  <LocationPicker label="Pickup Location" value={booking.pickup} allowCurrentLocation onChange={(pickup) => setBooking({ ...booking, pickup })} />
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/35 p-4">
                  <LocationPicker label="Drop Location" value={booking.drop} onChange={(drop) => setBooking({ ...booking, drop })} />
                </div>

                <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                  <label className="block text-sm font-bold text-blue-50">
                    <span className="mb-2 block">Vehicle Type</span>
                    <select className="auth-input capitalize" value={booking.vehicleType} onChange={(event) => setBooking({ ...booking, vehicleType: event.target.value })}>
                      {vehicleTypes.map((type) => <option key={type} value={type}>{formatVehicleType(type)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-bold text-blue-50">
                    <span className="mb-2 block">Special Note (Optional)</span>
                    <input className="auth-input" value={booking.specialNote} onChange={(event) => setBooking({ ...booking, specialNote: event.target.value })} placeholder="Gate number, luggage, payment note..." />
                  </label>
                </div>

                {error && <p className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}
                <button className="primary-action" disabled={saving}>{saving ? 'Finding driver...' : 'Confirm Ride'}</button>
              </form>
            </div>

            <aside className="relative border-t border-white/10 bg-[radial-gradient(circle_at_70%_10%,rgba(56,189,248,.25),transparent_28%),rgba(2,6,23,.58)] p-5 sm:p-8 lg:border-l lg:border-t-0">
              <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute bottom-8 left-8 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
              <h3 className="relative text-2xl font-black">Ride Summary</h3>
              <div className="relative mt-6 rounded-[1.7rem] border border-white/10 bg-white/10 p-5">
                <SummaryRow label="Pickup" value={booking.pickup.address || 'Select pickup location'} dot="bg-blue-300" />
                <div className="ml-[7px] h-10 w-px bg-blue-300/30" />
                <SummaryRow label="Drop" value={booking.drop.address || 'Select drop location'} dot="bg-emerald-300" />
              </div>
              <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <MetricCard label="Vehicle" value={formatVehicleType(booking.vehicleType)} />
                <MetricCard label="Total Distance" value={formatRouteDistance(routeInfo)} />
                <MetricCard label="Estimated Ride Time" value={formatRouteDuration(routeInfo)} />
                <MetricCard label="Ride Price" value={formatPrice(routeInfo)} />
              </div>

              {confirmation && (
                <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative mt-6 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-emerald-50">
                  <p className="text-lg font-black">Booking confirmed</p>
                  <p className="mt-2 text-sm leading-6">{confirmation.driverName || confirmation.driver?.name || assignedDriver.name} accepted your ride.</p>
                  <div className="mt-4 rounded-2xl bg-slate-950/45 p-4 text-sm">
                    <p className="font-black text-white">{confirmation.driverVehicleType || confirmation.driver?.vehicle || 'Vehicle assigned'}</p>
                    <p className="text-emerald-100/80">Booking #{confirmation.id || confirmation.booking?.id}</p>
                  </div>
                </motion.div>
              )}
            </aside>
          </div>
        </motion.section>
        )}
      </section>
    </main>
  )
}

function CurrentRidePanel({ ride, loading, onBookAnother }) {
  if (loading && !ride) {
    return <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-sm font-bold text-blue-100 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">Loading current ride...</div>
  }

  if (!ride) {
    return null
  }

  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2.2rem] border border-emerald-300/20 bg-[linear-gradient(145deg,rgba(16,185,129,.16),rgba(15,23,42,.62))] p-6 shadow-2xl shadow-emerald-950/30 backdrop-blur-2xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-200/80">current ride</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Your driver accepted the ride</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75">Keep this screen open to follow the active ride status. You can book another ride only if you choose to open the booking form.</p>

          <div className="mt-6 space-y-4">
            <RouteCard label="Pickup Location" address={ride.pickupAddress} lat={ride.pickupLatitude} lng={ride.pickupLongitude} />
            <div className="ml-4 h-10 w-px bg-emerald-200/25" />
            <RouteCard label="Drop Location" address={ride.dropAddress} lat={ride.dropLatitude} lng={ride.dropLongitude} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={onBookAnother} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 transition hover:bg-white/15">Book Another Ride</button>
          </div>
        </div>

        <aside className="rounded-[1.8rem] border border-white/10 bg-slate-950/35 p-5">
          <h3 className="text-2xl font-black">Ride Details</h3>
          <div className="mt-5 grid gap-3">
            <MetricCard label="Status" value={ride.status} />
            <MetricCard label="Driver" value={ride.driverName || 'Assigned driver'} />
            <MetricCard label="Driver Phone" value={ride.driverPhone || 'Not available'} />
            <MetricCard label="Vehicle" value={`${formatVehicleType(ride.vehicleType)} ${ride.driverVehicleNumber ? `| ${ride.driverVehicleNumber}` : ''}`} />
            <MetricCard label="Distance" value={`${ride.distanceKm || '--'} km`} />
            <MetricCard label="Price" value={`LKR ${Number(ride.price || 0).toFixed(0)}`} />
          </div>
        </aside>
      </div>
    </motion.section>
  )
}

function RouteCard({ label, address, lat, lng }) {
  const href = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:border-blue-300/40 hover:bg-blue-500/10">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-white">{address}</p>
      <p className="mt-2 text-xs font-black text-blue-300">Open in Google Maps</p>
    </a>
  )
}

function SummaryRow({ label, value, dot }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-1.5 h-4 w-4 rounded-full ${dot} shadow-lg shadow-blue-400/40`} />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-white/90">{value}</p>
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  )
}

function formatVehicleType(type) {
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function formatRouteDistance(routeInfo) {
  if (routeInfo.loading) return 'Calculating...'
  if (routeInfo.error) return routeInfo.error
  if (routeInfo.distance) return `${routeInfo.distance} km`
  return 'Select route'
}

function formatRouteDuration(routeInfo) {
  if (routeInfo.loading) return 'Calculating...'
  if (routeInfo.error) return routeInfo.error
  return routeInfo.duration || 'Select route'
}

function formatPrice(routeInfo) {
  if (routeInfo.loading) return 'Calculating...'
  if (routeInfo.error) return routeInfo.error
  if (!routeInfo.distance) return 'Select route'
  return `LKR ${(Number(routeInfo.distance) * 100).toFixed(0)}`
}

function formatDuration(totalSeconds) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60))
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
}
