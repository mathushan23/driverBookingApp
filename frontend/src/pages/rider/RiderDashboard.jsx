import { DirectionsRenderer, GoogleMap, Marker, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import defaultUserImage from '../../assets/default-user.png'
import vehicleCarImage from '../../assets/vehicle-car.png'
import vehicleMotorBikeImage from '../../assets/vehicle-motor-bike.png'
import vehicleThreeWheelerImage from '../../assets/vehicle-three-wheeler.png'
import vehicleVanImage from '../../assets/vehicle-van.png'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { RiderSidebar } from '../../components/layout/RiderSidebar'
import { LocationPicker } from '../../components/location/LocationPicker'
import { BrandText } from '../../components/ui/BrandText'
import { api } from '../../services/api'

const assignedDriver = { name: 'Nimal Perera', vehicle: 'Toyota Aqua', eta: '3 min', rating: '4.9' }
const vehicleTypes = [
  { value: 'motor bike', label: 'Motor Bike', image: vehicleMotorBikeImage, seats: 'Fast solo ride' },
  { value: 'three wheeler', label: 'Three Wheeler', image: vehicleThreeWheelerImage, seats: 'City ride' },
  { value: 'car', label: 'Car', image: vehicleCarImage, seats: 'Comfort ride' },
  { value: 'van', label: 'Van', image: vehicleVanImage, seats: 'Group ride' },
]
const confettiPieces = Array.from({ length: 32 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 13) % 84)}%`,
  delay: (index % 8) * 0.12,
  duration: 2.4 + (index % 5) * 0.18,
  color: ['#3b82f6', '#22c55e', '#f97316', '#eab308', '#a855f7', '#fb7185'][index % 6],
  rotate: (index * 37) % 180,
}))
const defaultMapCenter = { lat: 6.9271, lng: 79.8612 }
const mapLibraries = ['places']
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#10203a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#061022' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c3358' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b1830' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#244a82' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#07162b' }] },
]

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
  const [completedRide, setCompletedRide] = useState(null)
  const [routeInfo, setRouteInfo] = useState({ loading: false, distance: null, duration: null, directions: null, error: '' })
  const activeRideIdRef = useRef(location.state?.acceptedBooking?.id || null)
  const completedRideShownRef = useRef(null)

  const loadCurrentRide = async () => {
    if (!user?.id) return
    setLoadingCurrentRide(true)
    try {
      const { data } = await api.get(`/bookings/rider-history/${user.id}`)
      const activeRide = data.find((ride) => isActiveRideStatus(ride.status))
      const justCompletedRide = activeRideIdRef.current
        ? data.find((ride) => ride.id === activeRideIdRef.current && ride.status === 'COMPLETED')
        : null

      if (activeRide) {
        activeRideIdRef.current = activeRide.id
      } else if (justCompletedRide && completedRideShownRef.current !== justCompletedRide.id) {
        completedRideShownRef.current = justCompletedRide.id
        activeRideIdRef.current = null
        setCompletedRide(justCompletedRide)
      }

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
        setRouteInfo({ loading: false, distance: null, duration: null, directions: null, error: '' })
        return
      }

      if (!window.google?.maps?.DirectionsService) {
        setRouteInfo({ loading: false, distance: null, duration: null, directions: null, error: 'Google route unavailable' })
        return
      }

      setRouteInfo({ loading: true, distance: null, duration: null, directions: null, error: '' })
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
            setRouteInfo({ loading: false, distance: null, duration: null, directions: null, error: 'Route not found' })
            return
          }

          const meters = result.routes[0].legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0)
          const seconds = result.routes[0].legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0)
          setRouteInfo({
            loading: false,
            distance: (meters / 1000).toFixed(1),
            duration: formatDuration(seconds),
            directions: result,
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
      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 lg:ml-72 lg:block lg:max-w-none">
        <RiderSidebar user={user} logout={logout} />

        <div className="min-w-0 lg:px-6">
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
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="min-w-0 p-5 sm:p-8">
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

                <div className="grid gap-4">
                  <VehicleTypeSelector value={booking.vehicleType} onChange={(vehicleType) => setBooking({ ...booking, vehicleType })} />
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
              <RideSummaryMap booking={booking} routeInfo={routeInfo} />

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
        </div>
      </section>
      <AnimatePresence>
        {completedRide && (
          <RideCompletedModal
            ride={completedRide}
            onClose={() => {
              setCompletedRide(null)
              setBookingFormOpened(true)
              setShowBookingForm(true)
            }}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

function VehicleTypeSelector({ value, onChange }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-blue-50">Vehicle Type</span>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-200/55">Choose one</span>
      </div>
      <div className="max-w-full overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-3">
        {vehicleTypes.map((vehicle) => {
          const selected = value === vehicle.value
          return (
            <motion.button
              key={vehicle.value}
              type="button"
              onClick={() => onChange(vehicle.value)}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`group min-w-[220px] flex-[0_0_220px] overflow-hidden rounded-[1.35rem] border text-left transition sm:min-w-[240px] sm:flex-[0_0_240px] ${selected ? 'border-blue-300 bg-blue-500/18 shadow-2xl shadow-blue-500/20' : 'border-white/10 bg-slate-950/35 hover:border-blue-300/45 hover:bg-white/10'}`}
            >
              <div className="relative h-28 overflow-hidden bg-slate-900 sm:h-32">
                <img src={vehicle.image} alt={vehicle.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/18 to-transparent" />
                {selected && <div className="absolute inset-0 ring-2 ring-inset ring-blue-300" />}
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-black text-white">{vehicle.label}</p>
                  <p className="mt-1 text-xs font-bold text-blue-100/58">{vehicle.seats}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
        </div>
      </div>
    </div>
  )
}

function RideSummaryMap({ booking, routeInfo }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const hasPickup = Boolean(booking.pickup?.lat && booking.pickup?.lng)
  const hasDrop = Boolean(booking.drop?.lat && booking.drop?.lng)
  const pickup = hasPickup ? { lat: booking.pickup.lat, lng: booking.pickup.lng } : null
  const drop = hasDrop ? { lat: booking.drop.lat, lng: booking.drop.lng } : null
  const mapCenter = pickup && drop
    ? { lat: (pickup.lat + drop.lat) / 2, lng: (pickup.lng + drop.lng) / 2 }
    : pickup || drop || defaultMapCenter
  const viewMapHref = pickup && drop
    ? `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${drop.lat},${drop.lng}&travelmode=driving`
    : 'https://www.google.com/maps'

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || 'missing-key',
    libraries: mapLibraries,
  })

  return (
    <div className="relative mt-6 overflow-hidden rounded-[1.8rem] border border-blue-300/15 bg-slate-950/70 shadow-2xl shadow-blue-950/30">
      <div className="relative h-[360px] overflow-hidden bg-slate-900">
        {isLoaded && apiKey ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={pickup && drop ? 11 : 12}
            options={{
              styles: darkMapStyles,
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
              gestureHandling: 'greedy',
            }}
          >
            {routeInfo.directions && (
              <DirectionsRenderer
                directions={routeInfo.directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#1479ff',
                    strokeWeight: 5,
                    strokeOpacity: 0.95,
                  },
                }}
              />
            )}
            {pickup && <Marker position={pickup} label={{ text: 'P', color: '#ffffff', fontWeight: '900' }} />}
            {drop && <Marker position={drop} label={{ text: 'D', color: '#ffffff', fontWeight: '900' }} />}
          </GoogleMap>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-sm font-bold text-blue-100">
            Add `VITE_GOOGLE_MAPS_API_KEY` to show the route map.
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.06),rgba(2,6,23,.18))]" />
        <a href={viewMapHref} target="_blank" rel="noreferrer" className="absolute right-4 top-4 rounded-xl border border-blue-300/25 bg-slate-950/72 px-4 py-2 text-xs font-black text-white shadow-xl backdrop-blur-xl transition hover:bg-blue-600">
          View on map
        </a>

        {pickup && (
          <div className="absolute left-5 top-20 rounded-xl bg-slate-950/80 px-3 py-2 text-xs font-black text-white shadow-xl backdrop-blur-xl">
            {formatPlaceName(booking.pickup.address) || 'Pickup'}
          </div>
        )}
        {drop && (
          <div className="absolute bottom-20 right-5 rounded-xl bg-slate-950/80 px-3 py-2 text-xs font-black text-white shadow-xl backdrop-blur-xl">
            {formatPlaceName(booking.drop.address) || 'Drop'}
          </div>
        )}
      </div>

      <div className="grid border-t border-white/10 bg-slate-950/82 sm:grid-cols-3">
        <SummaryMetric icon="km" label="Distance" value={formatRouteDistance(routeInfo)} />
        <SummaryMetric icon="time" label="Est. Time" value={formatRouteDuration(routeInfo)} />
        <SummaryMetric icon="fare" label="Ride Price" value={formatPrice(routeInfo)} />
      </div>
    </div>
  )
}

function SummaryMetric({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/14 text-[0.62rem] font-black uppercase text-blue-300 ring-1 ring-blue-300/18">{icon}</span>
      <div>
        <p className="text-xs font-black text-blue-100/58">{label}</p>
        <p className="mt-1 text-base font-black text-white">{value}</p>
      </div>
    </div>
  )
}

function CurrentRidePanel({ ride, loading, onBookAnother }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [driverRoute, setDriverRoute] = useState({ loading: false, directions: null, duration: '', distance: '', error: '' })
  const pickup = ride?.pickupLatitude && ride?.pickupLongitude ? { lat: ride.pickupLatitude, lng: ride.pickupLongitude } : null
  const drop = ride?.dropLatitude && ride?.dropLongitude ? { lat: ride.dropLatitude, lng: ride.dropLongitude } : null
  const driver = ride?.driverLatitude && ride?.driverLongitude ? { lat: ride.driverLatitude, lng: ride.driverLongitude } : null
  const trackingDestination = ride?.status === 'STARTED' ? drop : pickup
  const mapCenter = driver && trackingDestination
    ? { lat: (driver.lat + trackingDestination.lat) / 2, lng: (driver.lng + trackingDestination.lng) / 2 }
    : trackingDestination || driver || defaultMapCenter
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || 'missing-key',
    libraries: mapLibraries,
  })

  useEffect(() => {
    if (!driver || !trackingDestination || !window.google?.maps?.DirectionsService) {
      setDriverRoute({ loading: false, directions: null, duration: '', distance: '', error: '' })
      return
    }

    let active = true
    setDriverRoute({ loading: true, directions: null, duration: '', distance: '', error: '' })
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: driver,
        destination: trackingDestination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (!active) return
        const leg = result?.routes?.[0]?.legs?.[0]
        if (status !== 'OK' || !leg) {
          setDriverRoute({ loading: false, directions: null, duration: '', distance: '', error: 'Route unavailable' })
          return
        }
        setDriverRoute({
          loading: false,
          directions: result,
          duration: leg.duration?.text || '',
          distance: leg.distance?.text || '',
          error: '',
        })
      },
    )

    return () => {
      active = false
    }
  }, [driver?.lat, driver?.lng, trackingDestination?.lat, trackingDestination?.lng])

  if (loading && !ride) {
    return <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-sm font-bold text-blue-100 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">Loading current ride...</div>
  }

  if (!ride) {
    return null
  }

  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2rem] border border-blue-300/20 bg-[linear-gradient(145deg,rgba(6,18,43,.98),rgba(2,8,23,.98))] shadow-2xl shadow-blue-950/50">
      <div className="grid lg:grid-cols-[0.42fr_1fr]">
        <aside className="border-b border-blue-200/15 p-6 lg:border-b-0 lg:border-r">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/12 px-3 py-2 text-sm font-black text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Driver Accepted
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight">{ride.status === 'STARTED' ? 'Your ride has started!' : 'Your driver is on the way!'}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-blue-100/70">{ride.status === 'STARTED' ? 'You are currently heading to your destination.' : 'Sit tight. Your driver is heading to your pickup location.'}</p>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center gap-4">
              <img src={defaultUserImage} alt="Driver profile" className="h-20 w-20 rounded-full border border-blue-300/20 object-cover shadow-xl shadow-blue-950/40" />
              <div>
                <p className="text-2xl font-black text-white">{ride.driverName || 'Assigned driver'}</p>
                <p className="mt-2 text-sm font-bold text-blue-100/70">{ride.driverPhone || 'Phone not available'}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <a href={ride.driverPhone ? `tel:${ride.driverPhone}` : undefined} className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white shadow-xl shadow-blue-500/25 transition hover:bg-blue-500">Call Driver</a>
              <button type="button" className="rounded-2xl border border-blue-300/25 bg-slate-950/40 px-4 py-3 text-sm font-black text-blue-100 transition hover:bg-blue-500/15">Message</button>
            </div>
          </div>

          <div className="mt-5 rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-4">
            <p className="text-sm font-black text-blue-100/70">Vehicle Details</p>
            <div className="mt-4 flex items-center gap-4">
              <img src={vehicleImageForType(ride.vehicleType || ride.driverVehicleType)} alt={formatVehicleType(ride.vehicleType || ride.driverVehicleType)} className="h-20 w-28 rounded-2xl object-cover" />
              <div>
                <p className="text-xl font-black text-white">{formatVehicleType(ride.vehicleType || ride.driverVehicleType)}</p>
                <p className="mt-1 text-sm font-bold text-blue-100/60">{ride.driverVehicleNumber || 'Vehicle number pending'}</p>
                <p className="mt-2 inline-flex rounded-lg bg-white/10 px-3 py-1 text-xs font-black text-blue-100">LKR {Number(ride.price || 0).toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[0.75fr_1fr] overflow-hidden rounded-[1.35rem] border border-blue-300/15 bg-white/[0.05]">
            <div className="border-r border-white/10 p-4">
              <p className="text-xs font-bold text-blue-100/60">ETA</p>
              <p className="mt-1 text-2xl font-black text-white">{driverRoute.loading ? '...' : driverRoute.duration || '--'}</p>
              <p className="mt-1 text-xs font-semibold text-blue-100/55">{driverRoute.distance || 'Distance pending'}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-blue-100/60">Status</p>
              <p className="mt-1 text-sm font-black text-white">{formatRideStatus(ride.status)}</p>
            </div>
          </div>

          <button onClick={onBookAnother} className="mt-5 w-full rounded-[1.35rem] border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 transition hover:bg-white/15">Book Another Ride</button>
        </aside>

        <section className="p-5">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-blue-300/15 bg-slate-950 shadow-2xl shadow-blue-950/35">
            {isLoaded && apiKey ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '500px' }}
                center={mapCenter}
                zoom={driver && pickup ? 13 : 12}
                options={{
                  styles: darkMapStyles,
                  disableDefaultUI: true,
                  zoomControl: true,
                  clickableIcons: false,
                  gestureHandling: 'greedy',
                }}
              >
                {driverRoute.directions && (
                  <DirectionsRenderer
                    directions={driverRoute.directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#2683ff',
                        strokeWeight: 6,
                        strokeOpacity: 0.95,
                      },
                    }}
                  />
                )}
                {driver && (
                  <OverlayView position={driver} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div className="-translate-x-1/2 -translate-y-1/2">
                      <div className="w-24 rounded-xl bg-blue-950/90 px-3 py-2 text-center text-xs font-black leading-tight text-blue-100 shadow-xl ring-1 ring-blue-300/25">
                        Driver
                        <p className="mt-1 whitespace-nowrap text-blue-300">{driverRoute.distance || '-- km'}</p>
                      </div>
                      <div className="mx-auto mt-2 grid h-16 w-16 place-items-center rounded-full border-2 border-white bg-slate-950/95 shadow-2xl shadow-blue-500/35">
                        <img src={vehicleImageForType(ride.vehicleType || ride.driverVehicleType)} alt={formatVehicleType(ride.vehicleType || ride.driverVehicleType)} className="h-12 w-12 rounded-full object-cover" />
                        <span className="absolute h-3.5 w-3.5 translate-x-7 translate-y-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
                      </div>
                    </div>
                  </OverlayView>
                )}
                {pickup && (
                  <>
                    <Marker position={pickup} label={{ text: 'P', color: '#ffffff', fontWeight: '900' }} />
                    <OverlayView position={pickup} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                      <div className="translate-x-[-50%] translate-y-[24px] rounded-xl bg-blue-600 px-3 py-1 text-xs font-black text-white shadow-xl">You</div>
                    </OverlayView>
                  </>
                )}
                {drop && <Marker position={drop} label={{ text: 'D', color: '#ffffff', fontWeight: '900' }} />}
              </GoogleMap>
            ) : (
              <div className="grid h-[500px] place-items-center px-6 text-center text-sm font-bold text-blue-100">Add VITE_GOOGLE_MAPS_API_KEY to show live driver tracking.</div>
            )}
          </div>
          <div className="mt-4 grid gap-4 rounded-[1.35rem] border border-blue-300/15 bg-white/[0.05] p-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <RouteMini label="Pickup Location" address={ride.pickupAddress} tone="blue" />
            <div className="hidden h-px w-44 bg-gradient-to-r from-transparent via-blue-400 to-transparent md:block" />
            <RouteMini label="Drop Location" address={ride.dropAddress} tone="emerald" />
          </div>
        </section>
      </div>
    </motion.section>
  )
}

function RouteMini({ label, address, tone }) {
  const toneClass = tone === 'emerald' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-blue-500/18 text-blue-300'
  return (
    <div className="flex items-center gap-4">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${toneClass}`}>PIN</div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-blue-100/65">{label}</p>
        <p className="mt-1 truncate text-xl font-black text-white">{formatPlaceName(address) || address || 'Not available'}</p>
        <p className="mt-1 truncate text-sm font-semibold text-blue-100/55">{address}</p>
      </div>
    </div>
  )
}

function RideCompletedModal({ ride, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-slate-950/88 p-4 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {confettiPieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-[-24px] h-4 w-2 rounded-full"
          style={{ left: piece.left, backgroundColor: piece.color }}
          initial={{ y: -30, opacity: 0, rotate: piece.rotate }}
          animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: piece.rotate + 420 }}
          transition={{ duration: piece.duration, delay: piece.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 170, damping: 18 }}
        className="relative w-full max-w-xl overflow-hidden rounded-[2.2rem] border border-blue-300/20 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,.22),transparent_36%),linear-gradient(145deg,rgba(7,23,50,.98),rgba(2,8,23,.98))] px-6 py-10 text-center shadow-2xl shadow-blue-950/70"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(34,197,94,.18),transparent_30%)]" />

        <div className="relative mx-auto grid h-36 w-36 place-items-center">
          {[0, 0.35, 0.7].map((delay) => (
            <motion.span
              key={delay}
              className="absolute inset-0 rounded-full border border-emerald-300/30 bg-emerald-400/5"
              initial={{ scale: 0.58, opacity: 0.8 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 2.1, delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="relative grid h-24 w-24 place-items-center rounded-full bg-emerald-400 shadow-[0_0_50px_rgba(34,197,94,.72)] ring-8 ring-emerald-300/20"
            initial={{ scale: 0.4, rotate: -16 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 14 }}
          >
            <motion.svg width="54" height="54" viewBox="0 0 54 54" fill="none">
              <motion.path
                d="M14 28.5L23 37L41 17"
                stroke="white"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.35, duration: 0.45, ease: 'easeOut' }}
              />
            </motion.svg>
          </motion.div>
        </div>

        <div className="relative">
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white">Ride Completed!</h2>
          <p className="mt-3 text-base font-semibold text-blue-100/70">Thank you for riding with <BrandText goClassName="text-blue-400" rideClassName="text-white" />.</p>
          <div className="mx-auto mt-6 grid max-w-sm gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-4 text-left">
            <p className="text-sm font-bold text-blue-100/65">Trip fare</p>
            <p className="text-3xl font-black text-white">LKR {Number(ride?.price || 0).toFixed(0)}</p>
            <p className="text-sm font-semibold text-blue-100/60">{formatPlaceName(ride?.pickupAddress) || 'Pickup'} to {formatPlaceName(ride?.dropAddress) || 'Drop'}</p>
          </div>
          <button onClick={onClose} className="primary-action mx-auto mt-7 max-w-xs">Book Another Ride</button>
        </div>
      </motion.div>
    </motion.div>
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

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  )
}

function formatVehicleType(type) {
  if (!type) return 'Vehicle'
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function isActiveRideStatus(status) {
  return status === 'ON_THE_WAY' || status === 'STARTED' || status === 'ACCEPTED'
}

function formatRideStatus(status = '') {
  if (status === 'ON_THE_WAY' || status === 'ACCEPTED') return 'Driver is heading to your location'
  if (status === 'STARTED') return 'Ride started'
  if (status === 'COMPLETED') return 'Completed'
  return status || 'Unknown'
}

function vehicleImageForType(type = '') {
  if (type === 'motor bike') return vehicleMotorBikeImage
  if (type === 'three wheeler') return vehicleThreeWheelerImage
  if (type === 'van') return vehicleVanImage
  return vehicleCarImage
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

function formatPlaceName(address = '') {
  return address.split(',')[0]?.trim()
}

function formatDuration(totalSeconds) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60))
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
}
