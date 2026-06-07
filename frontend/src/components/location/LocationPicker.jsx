import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

const libraries = ['places']
const defaultCenter = { lat: 6.9271, lng: 79.8612 }

export function LocationPicker({ label, value, onChange, allowCurrentLocation = false }) {
  const [autocomplete, setAutocomplete] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState(value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : defaultCenter)
  const [mapSelection, setMapSelection] = useState(value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : null)
  const [previewAddress, setPreviewAddress] = useState(value?.address || '')
  const [detecting, setDetecting] = useState(false)
  const [resolvingMap, setResolvingMap] = useState(false)
  const [error, setError] = useState('')

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || 'missing-key',
    libraries,
  })

  const updateAddress = (address) => {
    onChange({ ...value, address })
  }

  const applyPlace = (place) => {
    if (!place?.geometry?.location) return
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const address = place.formatted_address || place.name || value?.address || ''
    onChange({ address, lat, lng })
    setMapCenter({ lat, lng })
    setMapSelection({ lat, lng })
    setPreviewAddress(address)
  }

  const reverseGeocode = ({ lat, lng }, callback = onChange) => {
    if (!window.google?.maps?.Geocoder) {
      const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      callback({ address, lat, lng })
      return
    }

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const address = status === 'OK' && results?.[0]?.formatted_address ? results[0].formatted_address : `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      callback({ address, lat, lng })
    })
  }

  const useCurrentLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setMapCenter(coords)
        setMapSelection(coords)
        reverseGeocode(coords)
        setDetecting(false)
      },
      () => {
        setError('Could not detect current location. Check browser permission.')
        setDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const openMap = () => {
    setError('')
    const center = value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : defaultCenter
    setMapCenter(center)
    setMapSelection(value?.lat && value?.lng ? center : null)
    setPreviewAddress(value?.address || '')
    setMapOpen(true)
  }

  const selectFromMap = (event) => {
    const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() }
    setMapSelection(coords)
    setMapCenter(coords)
    setResolvingMap(true)
    reverseGeocode(coords, (location) => {
      setPreviewAddress(location.address)
      setResolvingMap(false)
    })
  }

  const confirmMapSelection = () => {
    if (!mapSelection) {
      setError('Click a point on the map before using this location.')
      return
    }

    onChange({
      address: previewAddress || `${mapSelection.lat.toFixed(6)}, ${mapSelection.lng.toFixed(6)}`,
      lat: mapSelection.lat,
      lng: mapSelection.lng,
    })
    setMapOpen(false)
  }

  const input = (
    <input
      required
      className="auth-input pr-28"
      value={value?.address || ''}
      placeholder={`Enter ${label.toLowerCase()}`}
      onChange={(event) => updateAddress(event.target.value)}
    />
  )

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-blue-50">
        <span className="mb-2 block">{label}</span>
        <div className="relative">
          {isLoaded && apiKey ? (
            <Autocomplete onLoad={setAutocomplete} onPlaceChanged={() => applyPlace(autocomplete?.getPlace())}>
              {input}
            </Autocomplete>
          ) : input}
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
            {allowCurrentLocation && (
              <button type="button" title="Use Current Location" onClick={useCurrentLocation} className="location-icon-btn">
                {detecting ? <span className="location-pulse" /> : 'GPS'}
              </button>
            )}
            <button type="button" title="Select from Map" onClick={openMap} className="location-icon-btn">Map</button>
          </div>
        </div>
      </label>
      {error && <p className="text-xs font-bold text-red-200">{error}</p>}
      {!apiKey && <p className="text-xs font-semibold text-amber-100/80">Add VITE_GOOGLE_MAPS_API_KEY to enable Google suggestions and map.</p>}

      <AnimatePresence>
        {mapOpen && (
          <motion.div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/88 p-3 backdrop-blur-xl sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 26, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 shadow-2xl shadow-blue-950/70"
              >
                <div className="grid lg:grid-cols-[340px_1fr]">
                  <aside className="relative border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,.30),transparent_34%),linear-gradient(180deg,rgba(15,23,42,.98),rgba(2,6,23,.98))] p-5 text-white lg:border-b-0 lg:border-r">
                    <button type="button" onClick={() => setMapOpen(false)} className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-blue-100 hover:bg-white/15">Close</button>
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-300">map selection</p>
                    <h3 className="mt-3 max-w-64 text-3xl font-black leading-tight">Choose {label}</h3>
                    <p className="mt-3 text-sm leading-6 text-blue-100/72">Click on the map to drop the marker. We will convert the point into a readable address automatically.</p>

                    <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/10 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">Selected address</p>
                      <p className="mt-2 min-h-14 text-sm font-bold leading-6 text-white/90">
                        {resolvingMap ? 'Finding address...' : previewAddress || 'No point selected yet'}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                        <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-blue-200/60">Latitude</p>
                        <p className="mt-1 text-sm font-black">{mapSelection ? mapSelection.lat.toFixed(5) : '--'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                        <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-blue-200/60">Longitude</p>
                        <p className="mt-1 text-sm font-black">{mapSelection ? mapSelection.lng.toFixed(5) : '--'}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      {allowCurrentLocation && (
                        <button type="button" onClick={useCurrentLocation} className="rounded-2xl border border-blue-300/25 bg-blue-500/15 px-5 py-3 text-sm font-black text-blue-50 hover:bg-blue-500/25">
                          {detecting ? 'Detecting location...' : 'Use Current Location'}
                        </button>
                      )}
                      <button type="button" onClick={confirmMapSelection} className="primary-action">Use Selected Location</button>
                    </div>
                  </aside>

                  <section className="bg-slate-900 p-3 sm:p-4">
                    <div className="relative h-[66vh] min-h-[420px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-800 shadow-inner shadow-black/40">
                      {isLoaded && apiKey ? (
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={mapCenter}
                          zoom={14}
                          onClick={selectFromMap}
                          options={{
                            clickableIcons: true,
                            fullscreenControl: false,
                            mapTypeControl: true,
                            streetViewControl: false,
                            zoomControl: true,
                          }}
                        >
                          {mapSelection && <Marker position={mapSelection} animation={window.google?.maps?.Animation?.DROP} />}
                        </GoogleMap>
                      ) : (
                        <div className="grid h-full place-items-center px-6 text-center text-blue-100">Google Maps needs VITE_GOOGLE_MAPS_API_KEY.</div>
                      )}
                      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-md">
                        Click a road, landmark, or building to select it
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
