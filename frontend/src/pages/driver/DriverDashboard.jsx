import { DirectionsRenderer, GoogleMap, Marker, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import vehicleCarImage from '../../assets/vehicle-car.png'
import vehicleMotorBikeImage from '../../assets/vehicle-motor-bike.png'
import vehicleThreeWheelerImage from '../../assets/vehicle-three-wheeler.png'
import vehicleVanImage from '../../assets/vehicle-van.png'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { DriverSidebar } from '../../components/layout/DriverSidebar'
import { LocationPicker } from '../../components/location/LocationPicker'
import { api } from '../../services/api'
import { setAuthSession } from '../../services/authStorage'

const defaultMapCenter = { lat: 6.9271, lng: 79.8612 }
const mapLibraries = ['places']
const darkMapStyles = [
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

export function DriverDashboard({ user, saveUser, logout }) {
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

  const hasActiveRide = isActiveRideStatus(acceptedRide?.status)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  const persistUser = (updatedUser) => {
    setAuthSession(updatedUser)
    saveUser?.(updatedUser)
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
      const activeRide = data.find((ride) => isActiveRideStatus(ride.status))
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
      persistUser(updatedUser)
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
      persistUser(updatedUser)
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
      const { data } = await api.patch(`/bookings/${acceptedRide.id}/driver-status`, null, { params: { driverId: user.id, status: 'COMPLETED' } })
      setCompletedRide(data)
      setAcceptedRide(data)
      setStatus('AVAILABLE')
      showToast('Ride completed successfully')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not complete this ride.')
    }
  }

  const updateRideStage = async (nextRideStatus) => {
    if (!acceptedRide?.id) return
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${acceptedRide.id}/driver-status`, null, { params: { driverId: user.id, status: nextRideStatus } })
      setAcceptedRide(data)
      showToast(`Ride status changed to ${formatRideStatus(data.status)}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update ride status.')
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

      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 lg:ml-72 lg:block lg:max-w-none">
        <DriverSidebar user={user} logout={logout} status={status} hasActiveRide={hasActiveRide} onStatusChange={updateStatus} />

        <div className="min-w-0 lg:px-6">
          <header className="mb-5 overflow-hidden rounded-[2.2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.13),rgba(15,23,42,.42))] p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl sm:p-7">
            <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr] xl:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">driver control center</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Ready for nearby rides</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/70">Save your live location, switch to AVAILABLE, and accept matching ride requests within your pickup radius.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoPill label="Status" value={status} />
                <InfoPill label="Vehicle" value={`${formatVehicleType(user?.vehicleType)} ${user?.vehicleNumber ? `| ${user.vehicleNumber}` : ''}`} />
                <InfoPill label="Active Ride" value={hasActiveRide ? `#${acceptedRide.id}` : 'None'} />
              </div>
            </div>
          </header>

          <section className="mb-5 overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.11),rgba(15,23,42,.38))] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl sm:p-6">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">location setup</p>
              <h2 className="mt-2 text-2xl font-black">Save Current Location</h2>
              <p className="mt-2 text-sm font-semibold text-blue-100/65">Saved: {savedAddress}</p>
            </div>
            <LocationPicker
              label="Driver Location"
              value={driverLocation}
              allowCurrentLocation
              onChange={setDriverLocation}
              actions={
                <button type="button" onClick={saveLocation} disabled={saving} className="rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-blue-400 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Location'}
                </button>
              }
            />
          </section>

          {error && <p className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}

          <section className="rounded-[2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.11),rgba(15,23,42,.38))] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">incoming requests</p>
                <h2 className="mt-2 text-3xl font-black">Ride Requests</h2>
              </div>
              <p className="max-w-xl text-sm text-blue-100/70">Only AVAILABLE drivers receive matching rides within 5 km and matching vehicle type.</p>
            </div>

            {acceptedRide && <AcceptedRideCard ride={acceptedRide} onStart={() => updateRideStage('STARTED')} onComplete={() => setCompleteModalOpen(true)} />}

            <div className="mt-5 grid gap-4">
              {loadingRequests && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">Checking nearby ride requests...</p>}
              {!loadingRequests && requests.length === 0 && !hasActiveRide && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">No nearby pending ride requests. Set status AVAILABLE and save your current location.</p>}
              {requests.map((request, index) => (
                <RideRequestCard key={request.id} request={request} index={index} user={user} driverLocation={driverLocation} hasActiveRide={hasActiveRide} onAccept={acceptRide} onDecline={declineRide} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function RideRequestCard({ request, index, user, driverLocation, hasActiveRide, onAccept, onDecline }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-[1.9rem] border border-blue-300/15 bg-[linear-gradient(145deg,rgba(10,28,62,.92),rgba(3,11,30,.92))] shadow-2xl shadow-blue-950/35"
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.8fr)]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-blue-500 text-2xl font-black text-white shadow-xl shadow-blue-500/30">
                {(request.riderName || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Incoming Request</p>
                <h3 className="mt-1 text-3xl font-black text-white">New Ride Request</h3>
                <p className="mt-1 text-sm font-semibold text-blue-100/65">Rider: {request.riderName || 'Rider'} {request.riderMobile ? `| ${request.riderMobile}` : ''}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-300/20 bg-slate-950/38 px-4 py-3 text-left sm:text-right">
              <p className="text-sm font-black text-emerald-200">{formatVehicleType(request.vehicleType)}</p>
              <p className="mt-1 text-xl font-black text-white">LKR {Number(request.price || 0).toFixed(0)}</p>
              <p className="mt-1 text-xs font-bold text-blue-100/55">Estimated fare</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-slate-950/28 p-4">
            <MapAddress label="Pickup" address={request.pickupAddress} lat={request.pickupLatitude} lng={request.pickupLongitude} compact />
            <MapAddress label="Drop" address={request.dropAddress} lat={request.dropLatitude} lng={request.dropLongitude} compact />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Distance to pickup" value={distanceBetween(driverLocation.lat, driverLocation.lng, request.pickupLatitude, request.pickupLongitude)} />
            <MiniMetric label="Trip distance" value={`${request.distanceKm || '--'} km`} />
            <MiniMetric label="Cash fare" value={`LKR ${Number(request.price || 0).toFixed(0)}`} highlight />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={() => onDecline(request.id)} className="rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/20">Decline</button>
            <button onClick={() => onAccept(request.id)} disabled={hasActiveRide} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">Accept Ride</button>
          </div>
        </div>

        <RideRequestMap request={request} user={user} driverLocation={driverLocation} />
      </div>
    </motion.article>
  )
}

function RideRequestMap({ request, user, driverLocation }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [route, setRoute] = useState({ loading: false, directions: null, error: '' })
  const driver = driverLocation?.lat && driverLocation?.lng ? { lat: driverLocation.lat, lng: driverLocation.lng } : user?.latitude && user?.longitude ? { lat: user.latitude, lng: user.longitude } : null
  const pickup = request.pickupLatitude && request.pickupLongitude ? { lat: request.pickupLatitude, lng: request.pickupLongitude } : null
  const drop = request.dropLatitude && request.dropLongitude ? { lat: request.dropLatitude, lng: request.dropLongitude } : null
  const center = driver && pickup
    ? { lat: (driver.lat + pickup.lat) / 2, lng: (driver.lng + pickup.lng) / 2 }
    : driver || pickup || defaultMapCenter
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || 'missing-key',
    libraries: mapLibraries,
  })

  useEffect(() => {
    if (!driver || !pickup || !window.google?.maps?.DirectionsService) {
      setRoute({ loading: false, directions: null, error: '' })
      return
    }

    let active = true
    setRoute({ loading: true, directions: null, error: '' })
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: driver,
        destination: pickup,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (!active) return
        if (status !== 'OK' || !result?.routes?.length) {
          setRoute({ loading: false, directions: null, error: 'Route unavailable' })
          return
        }
        setRoute({ loading: false, directions: result, error: '' })
      },
    )

    return () => {
      active = false
    }
  }, [driver?.lat, driver?.lng, pickup?.lat, pickup?.lng])

  return (
    <aside className="border-t border-white/10 bg-slate-950/28 p-4 xl:border-l xl:border-t-0">
      <div className="relative min-h-[360px] overflow-hidden rounded-[1.35rem] border border-blue-300/15 bg-slate-950">
        {isLoaded && apiKey ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '360px' }}
            center={center}
            zoom={driver && pickup ? 12 : 11}
            options={{
              styles: darkMapStyles,
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
              gestureHandling: 'greedy',
            }}
          >
            {route.directions && (
              <DirectionsRenderer
                directions={route.directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#2683ff',
                    strokeWeight: 5,
                    strokeOpacity: 0.95,
                  },
                }}
              />
            )}
            {driver && (
              <OverlayView position={driver} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-white bg-blue-600 shadow-2xl shadow-blue-500/35">
                    <img src={vehicleImageForType(user?.vehicleType || request.vehicleType)} alt={formatVehicleType(user?.vehicleType || request.vehicleType)} className="h-12 w-12 rounded-full object-cover" />
                    <span className="absolute h-3.5 w-3.5 translate-x-7 translate-y-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
                  </div>
                  <div className="mx-auto mt-2 w-20 rounded-xl bg-blue-600 px-3 py-1 text-center text-xs font-black text-white shadow-xl">You</div>
                </div>
              </OverlayView>
            )}
            {pickup && (
              <>
                <Marker position={pickup} label={{ text: 'P', color: '#ffffff', fontWeight: '900' }} />
                <OverlayView position={pickup} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div className="translate-x-[16px] translate-y-[-42px] whitespace-nowrap rounded-xl bg-emerald-950/95 px-3 py-2 text-xs font-black text-emerald-200 shadow-xl ring-1 ring-emerald-300/25">
                    Pickup
                  </div>
                </OverlayView>
              </>
            )}
            {drop && <Marker position={drop} label={{ text: 'D', color: '#ffffff', fontWeight: '900' }} />}
          </GoogleMap>
        ) : (
          <div className="grid h-[360px] place-items-center px-6 text-center text-sm font-bold text-blue-100">Add VITE_GOOGLE_MAPS_API_KEY to show request map.</div>
        )}
      </div>
    </aside>
  )
}

function MiniMetric({ label, value, highlight = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-xs font-bold text-blue-100/55">{label}</p>
      <p className={`mt-1 text-lg font-black ${highlight ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function AcceptedRideCard({ ride, onStart, onComplete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mt-5 overflow-hidden rounded-[1.9rem] border border-emerald-300/20 bg-[linear-gradient(145deg,rgba(10,28,62,.95),rgba(3,11,30,.95))] shadow-2xl shadow-emerald-950/25">
      <div className="grid gap-0 xl:grid-cols-[0.43fr_1fr]">
        <aside className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Active Ride
            </p>
            <p className="text-xs font-bold text-blue-100/55">Booking #{ride.id}</p>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-blue-500 text-2xl font-black text-white shadow-xl shadow-blue-500/30">
              {(ride.riderName || 'R').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-black">{ride.riderName || 'Rider'}</h3>
              <p className="mt-1 text-sm font-semibold text-blue-100/65">{ride.riderMobile || 'Mobile not available'}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-slate-950/28 p-4">
            <MapAddress label="Pickup Location" address={ride.pickupAddress} lat={ride.pickupLatitude} lng={ride.pickupLongitude} />
            <MapAddress label="Drop Location" address={ride.dropAddress} lat={ride.dropLatitude} lng={ride.dropLongitude} />
          </div>

          <div className="mt-5 grid gap-3">
            <StatusRow label="Vehicle Type" value={formatVehicleType(ride.vehicleType)} />
            <StatusRow label="Payment Method" value="Cash" />
            <StatusRow label="Fare" value={`LKR ${Number(ride.price || 0).toFixed(0)}`} />
            <StatusRow label="Distance" value={`${ride.distanceKm || '--'} km`} />
            <StatusRow label="Status" value={formatRideStatus(ride.status)} />
          </div>

          <div className="mt-5 grid gap-3">
            {(ride.status === 'ON_THE_WAY' || ride.status === 'ACCEPTED') && <button onClick={onStart} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400">Start Ride</button>}
            {ride.status === 'STARTED' && <button onClick={onComplete} className="primary-action">Complete Ride</button>}
          </div>
        </aside>

        <RideNavigationMap ride={ride} />
      </div>
    </motion.div>
  )
}

function RideNavigationMap({ ride }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [route, setRoute] = useState({ loading: false, directions: null, error: '' })
  const driver = ride?.driverLatitude && ride?.driverLongitude ? { lat: ride.driverLatitude, lng: ride.driverLongitude } : null
  const pickup = ride?.pickupLatitude && ride?.pickupLongitude ? { lat: ride.pickupLatitude, lng: ride.pickupLongitude } : null
  const drop = ride?.dropLatitude && ride?.dropLongitude ? { lat: ride.dropLatitude, lng: ride.dropLongitude } : null
  const destination = ride?.status === 'STARTED' ? drop : pickup
  const center = driver && destination
    ? { lat: (driver.lat + destination.lat) / 2, lng: (driver.lng + destination.lng) / 2 }
    : driver || destination || defaultMapCenter
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || 'missing-key',
    libraries: mapLibraries,
  })

  useEffect(() => {
    if (!driver || !destination || !window.google?.maps?.DirectionsService) {
      setRoute({ loading: false, directions: null, error: '' })
      return
    }

    let active = true
    setRoute({ loading: true, directions: null, error: '' })
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: driver,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (!active) return
        if (status !== 'OK' || !result?.routes?.length) {
          setRoute({ loading: false, directions: null, error: 'Route unavailable' })
          return
        }
        setRoute({ loading: false, directions: result, error: '' })
      },
    )

    return () => {
      active = false
    }
  }, [driver?.lat, driver?.lng, destination?.lat, destination?.lng])

  return (
    <section className="p-4">
      <div className="relative min-h-[620px] overflow-hidden rounded-[1.45rem] border border-blue-300/15 bg-slate-950">
        {isLoaded && apiKey ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '620px' }}
            center={center}
            zoom={driver && destination ? 12 : 11}
            options={{
              styles: darkMapStyles,
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
              gestureHandling: 'greedy',
            }}
          >
            {route.directions && (
              <DirectionsRenderer
                directions={route.directions}
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
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-white bg-blue-600 shadow-2xl shadow-blue-500/35">
                    <img src={vehicleImageForType(ride.vehicleType)} alt={formatVehicleType(ride.vehicleType)} className="h-12 w-12 rounded-full object-cover" />
                  </div>
                  <div className="mx-auto mt-2 rounded-xl bg-blue-600 px-3 py-1 text-center text-xs font-black text-white shadow-xl">You</div>
                </div>
              </OverlayView>
            )}
            {pickup && <Marker position={pickup} label={{ text: 'P', color: '#ffffff', fontWeight: '900' }} />}
            {drop && <Marker position={drop} label={{ text: 'D', color: '#ffffff', fontWeight: '900' }} />}
          </GoogleMap>
        ) : (
          <div className="grid h-[620px] place-items-center px-6 text-center text-sm font-bold text-blue-100">Add VITE_GOOGLE_MAPS_API_KEY to show active ride navigation.</div>
        )}
      </div>
    </section>
  )
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100/55">{label}</p>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
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

function isActiveRideStatus(status) {
  return status === 'ON_THE_WAY' || status === 'STARTED' || status === 'ACCEPTED'
}

function formatRideStatus(status = '') {
  if (status === 'ON_THE_WAY' || status === 'ACCEPTED') return 'On the way'
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

function distanceBetween(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return '-- km'

  const earthRadiusKm = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const rLat1 = toRadians(lat1)
  const rLat2 = toRadians(lat2)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2
  const distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return `${distanceKm.toFixed(1)} km`
}

function toRadians(value) {
  return value * (Math.PI / 180)
}
