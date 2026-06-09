import { Circle, GoogleMap, Marker, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import vehicleCarImage from '../../assets/vehicle-car.png'
import vehicleMotorBikeImage from '../../assets/vehicle-motor-bike.png'
import vehicleThreeWheelerImage from '../../assets/vehicle-three-wheeler.png'
import vehicleVanImage from '../../assets/vehicle-van.png'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { api } from '../../services/api'

const defaultMapCenter = { lat: 6.9271, lng: 79.8612 }
const mapLibraries = ['places']
const waitingMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#10203a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#061022' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c3358' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b1830' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#244a82' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#07162b' }] },
]

export function RiderBookingWaitingPage({ user }) {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [booking, setBooking] = useState(location.state?.booking || null)
  const [error, setError] = useState('')
  const [canceling, setCanceling] = useState(false)
  const [driverEta, setDriverEta] = useState('')

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
        if (isActiveRideStatus(data.status)) {
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

  useEffect(() => {
    if (
      booking?.status !== 'ACCEPTED' ||
      !booking.driverLatitude ||
      !booking.driverLongitude ||
      !booking.pickupLatitude ||
      !booking.pickupLongitude ||
      !window.google?.maps?.DirectionsService
    ) {
      return
    }

    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: { lat: booking.driverLatitude, lng: booking.driverLongitude },
        destination: { lat: booking.pickupLatitude, lng: booking.pickupLongitude },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result?.routes?.[0]?.legs?.[0]?.duration?.text) {
          setDriverEta(result.routes[0].legs[0].duration.text)
        }
      },
    )
  }, [booking])

  const displayDrivers = useMemo(() => nearbyDriversForDisplay(booking), [booking])

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
  const statusTitle = accepted ? 'Driver accepted your ride' : canceled ? 'Ride canceled' : 'Finding your driver'
  const statusText = accepted
    ? `${booking.driverName || 'A driver'} accepted your ride.`
    : canceled
      ? 'Your booking was canceled before a driver accepted it.'
      : 'We are notifying nearby drivers.'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b1a] px-4 py-4 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl place-items-center">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full overflow-hidden rounded-[2rem] border border-blue-300/20 bg-[linear-gradient(145deg,rgba(7,23,50,.96),rgba(2,9,24,.96))] shadow-2xl shadow-blue-950/60"
        >
          <div className="grid lg:grid-cols-[0.54fr_1fr]">
            <aside className="border-b border-blue-200/15 bg-slate-950/28 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.36em] text-blue-300">booking request</p>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{statusTitle}</h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-blue-100/72">{statusText}</p>

              <div className="mt-5 space-y-2">
                <RouteInfoCard tone="blue" label="Pickup Location" value={formatAddress(booking?.pickupAddress, 'Pickup not available')} />
                <RouteInfoCard tone="emerald" label="Drop Location" value={formatAddress(booking?.dropAddress, 'Drop not available')} />
                <RouteInfoCard tone="violet" label="Vehicle Type" value={formatVehicleType(booking?.vehicleType || booking?.driverVehicleType)} />
              </div>

              <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.06]">
                <div className="border-r border-white/10 p-3">
                  <p className="text-xs font-bold text-blue-100/60">Nearby Drivers</p>
                  <p className="mt-1 text-2xl font-black text-blue-300">{booking?.nearbyDriverCount ?? displayDrivers.length}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-100/55">Available</p>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-blue-100/60">Estimated Wait</p>
                  <p className="mt-1 text-xl font-black text-emerald-300">{accepted ? driverEta || 'Soon' : waitEstimate(displayDrivers.length)}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-100/55">Estimated time</p>
                </div>
              </div>

              {accepted && (
                <div className="mt-4 rounded-[1.35rem] border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-50">
                  <p>{booking.driverName}</p>
                  <p className="mt-1 text-emerald-100/75">{booking.driverPhone || 'Phone not available'}</p>
                  <p className="mt-1 text-emerald-100/75">{formatVehicleType(booking.driverVehicleType)} | {booking.driverVehicleNumber}</p>
                  <p className="mt-1 text-emerald-100/75">Price: LKR {Number(booking.price || 0).toFixed(0)}</p>
                </div>
              )}

              {error && <p className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100">{error}</p>}

              {!accepted && !canceled && (
                <button onClick={cancelRide} disabled={canceling} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/45 bg-red-500/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20 disabled:opacity-60">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-red-500/22 text-base leading-none">x</span>
                  <span>{canceling ? 'Canceling...' : 'Cancel Ride'}</span>
                </button>
              )}

              {(accepted || canceled) && (
                <button onClick={() => navigate('/rider/dashboard', { replace: true })} className="primary-action mt-6">Back to Dashboard</button>
              )}
            </aside>

            <section className="p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-bold text-blue-100/75">
                    {accepted ? 'Driver matched' : canceled ? 'Search stopped' : 'Searching for nearby drivers within'} {!accepted && !canceled && <span className="font-black text-blue-300">5 km</span>}
                  </p>
                </div>
                {!accepted && !canceled && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-blue-100">
                    Searching...
                  </div>
                )}
              </div>

              <DriverSearchMap accepted={accepted} canceled={canceled} drivers={displayDrivers} booking={booking} />

              <div className="mt-4 rounded-[1.2rem] border border-blue-300/15 bg-[linear-gradient(90deg,rgba(37,99,235,.16),rgba(15,23,42,.32))] p-4">
                <div>
                  <div>
                    <h2 className="text-lg font-black">Your safety is our priority</h2>
                    <p className="mt-1 text-sm font-semibold text-blue-100/65">We only match you with available drivers near your pickup location.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </section>
    </main>
  )
}

function RouteInfoCard({ tone, label, value }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.05] p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-blue-100/65">{label}</p>
        <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
      </div>
    </div>
  )
}

function DriverSearchMap({ accepted, canceled, drivers, booking }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || 'missing-key',
    libraries: mapLibraries,
  })
  const pickup = booking?.pickupLatitude && booking?.pickupLongitude
    ? { lat: booking.pickupLatitude, lng: booking.pickupLongitude }
    : null
  const drop = booking?.dropLatitude && booking?.dropLongitude
    ? { lat: booking.dropLatitude, lng: booking.dropLongitude }
    : null
  const acceptedDriver = accepted && booking?.driverLatitude && booking?.driverLongitude
    ? [{
        id: booking.driverId || 'accepted-driver',
        name: booking.driverName || 'Driver',
        vehicleType: booking.driverVehicleType || booking.vehicleType,
        latitude: booking.driverLatitude,
        longitude: booking.driverLongitude,
        distanceKm: driverDistanceFromBooking(booking),
      }]
    : []
  const mapDrivers = (accepted ? acceptedDriver : drivers).filter((driver) => driver.latitude && driver.longitude)
  const center = pickup || mapDrivers[0] && { lat: mapDrivers[0].latitude, lng: mapDrivers[0].longitude } || defaultMapCenter

  return (
    <div className="relative min-h-[455px] overflow-hidden rounded-[1.35rem] border border-blue-300/20 bg-[#071832] shadow-2xl shadow-blue-950/40">
      {isLoaded && apiKey ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '455px' }}
          center={center}
          zoom={pickup ? 13 : 12}
          options={{
            styles: waitingMapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            gestureHandling: 'greedy',
          }}
        >
          {pickup && (
            <>
              <Circle
                center={pickup}
                radius={5000}
                options={{
                  strokeColor: '#2f80ff',
                  strokeOpacity: 0.75,
                  strokeWeight: 2,
                  fillColor: '#2f80ff',
                  fillOpacity: 0.1,
                }}
              />
              <Marker position={pickup} label={{ text: 'YOU', color: '#ffffff', fontWeight: '900' }} />
              {!accepted && !canceled && (
                <OverlayView position={pickup} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div className="pointer-events-none relative h-24 w-24 -translate-x-1/2 -translate-y-1/2">
                    {[0, 0.6, 1.2].map((delay) => (
                      <motion.span
                        key={delay}
                        className="absolute inset-0 rounded-full border-2 border-blue-300 bg-blue-500/10 shadow-[0_0_35px_rgba(59,130,246,.8)]"
                        initial={{ opacity: 0.72, scale: 0.35 }}
                        animate={{ opacity: 0, scale: 1.65 }}
                        transition={{ duration: 2.2, delay, repeat: Infinity, ease: 'easeOut' }}
                      />
                    ))}
                    <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_22px_rgba(96,165,250,1)]" />
                  </div>
                </OverlayView>
              )}
              <OverlayView position={pickup} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <div className="translate-x-[-50%] translate-y-[24px] rounded-xl bg-blue-600 px-3 py-1 text-xs font-black text-white shadow-xl">
                  Pickup
                </div>
              </OverlayView>
            </>
          )}

          {drop && <Marker position={drop} label={{ text: 'D', color: '#ffffff', fontWeight: '900' }} />}

          {!canceled && mapDrivers.map((driver) => {
            const position = { lat: driver.latitude, lng: driver.longitude }
            return (
              <MarkerGroup key={driver.id || `${driver.name}-${driver.latitude}-${driver.longitude}`}>
                <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div className="-translate-x-1/2 -translate-y-1/2">
                    <div className="relative grid h-20 w-20 place-items-center rounded-full border-2 border-white bg-slate-950/92 shadow-2xl shadow-blue-500/35">
                      <img src={vehicleIconForType(driver.vehicleType || booking?.vehicleType)} alt={formatVehicleType(driver.vehicleType || booking?.vehicleType)} className="h-14 w-14 rounded-full object-cover" />
                      <span className="absolute -right-1 top-2 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
                    </div>
                    <div className="ml-10 mt-1 whitespace-nowrap rounded-xl bg-blue-950/95 px-3 py-2 text-xs font-black text-blue-200 shadow-xl ring-1 ring-blue-300/25">
                      {Number(driver.distanceKm || 0).toFixed(1)} km
                    </div>
                  </div>
                </OverlayView>
              </MarkerGroup>
            )
          })}
        </GoogleMap>
      ) : (
        <div className="grid h-[455px] place-items-center px-6 text-center text-sm font-bold text-blue-100">
          Add VITE_GOOGLE_MAPS_API_KEY to show exact locations on Google Maps.
        </div>
      )}

      {!canceled && !mapDrivers.length && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-blue-300/20 bg-slate-950/80 px-4 py-3 text-sm font-bold text-blue-100 shadow-xl backdrop-blur-md">
          Waiting for nearby driver locations...
        </div>
      )}

      {canceled && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/45 text-center backdrop-blur-[2px]">
          <div className="rounded-[1.5rem] border border-red-300/25 bg-red-500/10 px-8 py-6">
            <p className="text-3xl font-black text-red-100">Ride canceled</p>
            <p className="mt-2 text-sm font-bold text-red-100/70">No driver search is active.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function MarkerGroup({ children }) {
  return children
}

function nearbyDriversForDisplay(booking) {
  if (booking?.nearbyDrivers?.length) {
    return booking.nearbyDrivers.slice(0, 5)
  }

  const count = Math.min(booking?.nearbyDriverCount || 0, 5)
  return Array.from({ length: count }, (_, index) => ({
    id: `nearby-${index}`,
    name: `Driver ${index + 1}`,
    vehicleType: booking?.vehicleType,
    latitude: null,
    longitude: null,
    distanceKm: [1.2, 1.9, 2.6, 3.4, 4.1][index],
  }))
}

function driverDistanceFromBooking(booking) {
  if (!booking?.driverLatitude || !booking?.driverLongitude || !booking?.pickupLatitude || !booking?.pickupLongitude) {
    return 0
  }

  const earthRadiusKm = 6371
  const dLat = toRadians(booking.pickupLatitude - booking.driverLatitude)
  const dLng = toRadians(booking.pickupLongitude - booking.driverLongitude)
  const lat1 = toRadians(booking.driverLatitude)
  const lat2 = toRadians(booking.pickupLatitude)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

function toRadians(value) {
  return value * (Math.PI / 180)
}

function waitEstimate(count) {
  if (!count) return 'Waiting'
  if (count <= 2) return '3 - 6 mins'
  return '2 - 5 mins'
}

function vehicleIconForType(type = '') {
  if (type === 'motor bike') return vehicleMotorBikeImage
  if (type === 'three wheeler') return vehicleThreeWheelerImage
  if (type === 'van') return vehicleVanImage
  return vehicleCarImage
}

function isActiveRideStatus(status) {
  return status === 'ON_THE_WAY' || status === 'STARTED' || status === 'ACCEPTED'
}

function formatAddress(address, fallback) {
  return address?.split(',')?.[0]?.trim() || fallback
}

function formatVehicleType(type = '') {
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Vehicle'
}
