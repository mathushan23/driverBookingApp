import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { BackgroundFX } from '../components/auth/AuthLayout'
import { AdminSidebar } from '../components/layout/AdminSidebar'
import { BrandText } from '../components/ui/BrandText'
import { api } from '../services/api'

const driverStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE']
const activeRideStatuses = ['ON_THE_WAY', 'STARTED', 'ACCEPTED']

export function AdminDashboard({ user, logout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const riders = useMemo(() => users.filter((item) => item.role === 'rider'), [users])
  const drivers = useMemo(() => users.filter((item) => item.role === 'driver'), [users])
  const filteredRiders = useMemo(() => filterUsers(riders, search), [riders, search])
  const filteredDrivers = useMemo(() => filterUsers(drivers, search), [drivers, search])
  const filteredBookings = useMemo(() => filterBookings(bookings, search), [bookings, search])
  const activeBookings = bookings.filter((booking) => activeRideStatuses.includes(booking.status))
  const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED')
  const canceledBookings = bookings.filter((booking) => booking.status === 'CANCELED')
  const pendingDrivers = drivers.filter((driver) => !driver.driverApproved)
  const revenue = completedBookings.reduce((total, booking) => total + Number(booking.price || 0), 0)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  const loadAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersResponse, bookingsResponse] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/bookings'),
      ])
      setUsers(usersResponse.data)
      setBookings(bookingsResponse.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load admin dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const updateDriverStatus = async (driverId, status) => {
    setError('')
    try {
      const { data } = await api.patch(`/admin/drivers/${driverId}/status`, { status })
      setUsers((current) => current.map((item) => item.id === driverId ? data : item))
      showToast(`Driver status changed to ${status}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update driver status.')
    }
  }

  const updateDriverApproval = async (driverId, approved) => {
    setError('')
    try {
      const { data } = await api.patch(`/admin/drivers/${driverId}/approval`, { approved })
      setUsers((current) => current.map((item) => item.id === driverId ? data : item))
      showToast(approved ? 'Driver approved' : 'Driver approval revoked')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update driver approval.')
    }
  }

  const cancelBooking = async (bookingId) => {
    setError('')
    try {
      const { data } = await api.patch(`/admin/bookings/${bookingId}/cancel`)
      setBookings((current) => current.map((booking) => booking.id === bookingId ? data : booking))
      await loadAdminData()
      showToast(`Booking #${bookingId} canceled`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not cancel booking.')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <Toast toast={toast} />

      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 lg:ml-72 lg:block lg:max-w-none">
        <AdminSidebar user={user} logout={logout} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="min-w-0 lg:px-6">
          <header className="mb-5 overflow-hidden rounded-[2.2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.13),rgba(15,23,42,.42))] p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl sm:p-7">
            <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr] xl:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">admin control center</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Manage <BrandText goClassName="text-blue-400" rideClassName="text-white" /> operations</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/70">Monitor riders, drivers, bookings, active trips, and driver availability from one workspace.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoPill label="Riders" value={riders.length} />
                <InfoPill label="Pending" value={pendingDrivers.length} />
                <InfoPill label="Bookings" value={bookings.length} />
              </div>
            </div>
          </header>

          <section className="mb-5 rounded-[1.7rem] border border-white/15 bg-white/[0.07] p-4 shadow-2xl shadow-blue-950/25 backdrop-blur-2xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {['overview', 'riders', 'drivers', 'bookings'].map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabClass(activeTab === tab)}>
                    {titleCase(tab)}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, booking, status..."
                  className="auth-input h-12 min-w-[280px] text-sm"
                />
              </div>
            </div>
          </section>

          {error && <p className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}

          {loading ? (
            <section className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-sm font-bold text-blue-100 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
              Loading admin data...
            </section>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewPanel
                  riders={riders}
                  drivers={drivers}
                  bookings={bookings}
                  activeBookings={activeBookings}
                  completedBookings={completedBookings}
                  canceledBookings={canceledBookings}
                  revenue={revenue}
                />
              )}
              {activeTab === 'riders' && <RidersPanel riders={filteredRiders} />}
              {activeTab === 'drivers' && <DriversPanel drivers={filteredDrivers} onStatusChange={updateDriverStatus} onApprovalChange={updateDriverApproval} />}
              {activeTab === 'bookings' && <BookingsPanel bookings={filteredBookings} onCancel={cancelBooking} />}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function OverviewPanel({ riders, drivers, bookings, activeBookings, completedBookings, canceledBookings, revenue }) {
  const availableDrivers = drivers.filter((driver) => driver.driverStatus === 'AVAILABLE')
  const pendingDrivers = drivers.filter((driver) => !driver.driverApproved)
  const pendingBookings = bookings.filter((booking) => booking.status === 'PENDING')

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Rides" value={activeBookings.length} tone="cyan" />
        <MetricCard label="Pending Requests" value={pendingBookings.length} tone="blue" />
        <MetricCard label="Pending Drivers" value={pendingDrivers.length} tone="amber" />
        <MetricCard label="Available Drivers" value={availableDrivers.length} tone="emerald" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.11),rgba(15,23,42,.38))] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">platform health</p>
          <h2 className="mt-2 text-3xl font-black">Today’s control view</h2>
          <div className="mt-5 grid gap-3">
            <StatusLine label="Total riders" value={riders.length} />
            <StatusLine label="Total drivers" value={drivers.length} />
            <StatusLine label="Approved drivers" value={drivers.length - pendingDrivers.length} />
            <StatusLine label="Completed bookings" value={completedBookings.length} />
            <StatusLine label="Canceled bookings" value={canceledBookings.length} />
            <StatusLine label="Revenue estimate" value={`LKR ${revenue.toFixed(0)}`} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.11),rgba(15,23,42,.38))] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">recent bookings</p>
          <h2 className="mt-2 text-3xl font-black">Latest ride activity</h2>
          <div className="mt-5 grid gap-3">
            {bookings.slice(0, 5).map((booking) => (
              <BookingMini key={booking.id} booking={booking} />
            ))}
            {!bookings.length && <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-blue-100/70">No bookings found.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}

function RidersPanel({ riders }) {
  return (
    <ManagementPanel eyebrow="rider management" title="Manage Riders" description="View registered riders, contact details, and onboarding status.">
      <div className="grid gap-3">
        {riders.map((rider) => (
          <UserRow key={rider.id} user={rider} />
        ))}
        {!riders.length && <EmptyState message="No riders match your search." />}
      </div>
    </ManagementPanel>
  )
}

function DriversPanel({ drivers, onStatusChange, onApprovalChange }) {
  return (
    <ManagementPanel eyebrow="driver management" title="Manage Drivers" description="View driver profiles, vehicle data, location, and availability.">
      <div className="grid gap-3">
        {drivers.map((driver) => (
          <DriverRow key={driver.id} driver={driver} onStatusChange={onStatusChange} onApprovalChange={onApprovalChange} />
        ))}
        {!drivers.length && <EmptyState message="No drivers match your search." />}
      </div>
    </ManagementPanel>
  )
}

function BookingsPanel({ bookings, onCancel }) {
  return (
    <ManagementPanel eyebrow="booking management" title="Manage Bookings" description="Track every booking and cancel active bookings when admin intervention is required.">
      <div className="grid gap-3">
        {bookings.map((booking) => (
          <BookingRow key={booking.id} booking={booking} onCancel={onCancel} />
        ))}
        {!bookings.length && <EmptyState message="No bookings match your search." />}
      </div>
    </ManagementPanel>
  )
}

function ManagementPanel({ eyebrow, title, description, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,.11),rgba(15,23,42,.38))] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black">{title}</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-blue-100/70">{description}</p>
      </div>
      {children}
    </motion.section>
  )
}

function UserRow({ user }) {
  return (
    <article className="grid gap-4 rounded-[1.45rem] border border-white/10 bg-slate-950/35 p-4 lg:grid-cols-[1fr_0.85fr_0.45fr] lg:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">#{user.id} {user.role}</p>
        <h3 className="mt-1 text-2xl font-black text-white">{user.name}</h3>
        <p className="mt-1 text-sm font-semibold text-blue-100/60">{user.email}</p>
      </div>
      <div className="grid gap-2 text-sm font-bold text-blue-100/70">
        <p>Mobile: {user.mobile || user.phone || 'Not provided'}</p>
        <p>NIC: {user.nic || 'Not provided'}</p>
      </div>
      <StatusBadge status={user.onboardingComplete ? 'ONBOARDED' : 'PENDING'} />
    </article>
  )
}

function DriverRow({ driver, onStatusChange, onApprovalChange }) {
  const hasLocation = driver.latitude && driver.longitude

  return (
    <article className="grid gap-4 rounded-[1.45rem] border border-white/10 bg-slate-950/35 p-4 xl:grid-cols-[1fr_0.75fr_0.55fr_0.45fr_0.45fr] xl:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Driver #{driver.id}</p>
        <h3 className="mt-1 text-2xl font-black text-white">{driver.name}</h3>
        <p className="mt-1 text-sm font-semibold text-blue-100/60">{driver.email}</p>
        <div className="mt-3">
          <StatusBadge status={driver.driverApproved ? 'Approved' : 'Pending Approval'} />
        </div>
      </div>
      <div className="grid gap-2 text-sm font-bold text-blue-100/70">
        <p>{formatVehicleType(driver.vehicleType)} {driver.vehicleNumber ? `| ${driver.vehicleNumber}` : ''}</p>
        <p>{driver.phone || driver.mobile || 'Phone not provided'}</p>
        <p>NIC: {driver.nic || 'Not provided'}</p>
      </div>
      <div className="text-sm font-bold text-blue-100/70">
        <p>{hasLocation ? compactAddress(driver.address) : 'No saved location'}</p>
        {hasLocation && <p className="mt-1 text-xs text-blue-200/50">{driver.latitude?.toFixed?.(4)}, {driver.longitude?.toFixed?.(4)}</p>}
      </div>
      <select
        value={driver.driverStatus || 'OFFLINE'}
        onChange={(event) => onStatusChange(driver.id, event.target.value)}
        disabled={!driver.driverApproved}
        className="auth-input h-12 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {driverStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <button
        type="button"
        onClick={() => onApprovalChange(driver.id, !driver.driverApproved)}
        className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
          driver.driverApproved
            ? 'border-red-300/35 bg-red-500/12 text-red-100 hover:bg-red-500/22'
            : 'border-emerald-300/35 bg-emerald-500/14 text-emerald-100 hover:bg-emerald-500/24'
        }`}
      >
        {driver.driverApproved ? 'Revoke' : 'Approve'}
      </button>
    </article>
  )
}

function BookingRow({ booking, onCancel }) {
  const canCancel = !['COMPLETED', 'CANCELED'].includes(booking.status)

  return (
    <article className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-slate-950/35">
      <div className="grid gap-4 p-4 xl:grid-cols-[0.8fr_1fr_0.75fr_0.45fr] xl:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">Booking #{booking.id}</p>
          <h3 className="mt-1 text-2xl font-black text-white">LKR {Number(booking.price || 0).toFixed(0)}</h3>
          <p className="mt-1 text-sm font-semibold text-blue-100/60">{formatVehicleType(booking.vehicleType)}</p>
        </div>
        <div className="grid gap-2 text-sm font-bold text-blue-100/70">
          <p>Pickup: {compactAddress(booking.pickupAddress)}</p>
          <p>Drop: {compactAddress(booking.dropAddress)}</p>
        </div>
        <div className="grid gap-2 text-sm font-bold text-blue-100/70">
          <p>Rider: {booking.riderName || `#${booking.riderId}`}</p>
          <p>Driver: {booking.driverName || 'Not assigned'}</p>
        </div>
        <div className="grid gap-2">
          <StatusBadge status={formatRideStatus(booking.status)} />
          {canCancel && (
            <button type="button" onClick={() => onCancel(booking.id)} className="rounded-xl border border-red-300/35 bg-red-500/12 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/22">
              Cancel
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function BookingMini({ booking }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-black text-white">Booking #{booking.id} | {booking.riderName || 'Rider'}</p>
        <p className="mt-1 text-xs font-bold text-blue-100/58">{compactAddress(booking.pickupAddress)} to {compactAddress(booking.dropAddress)}</p>
      </div>
      <StatusBadge status={formatRideStatus(booking.status)} />
    </div>
  )
}

function MetricCard({ label, value, tone }) {
  const toneClass = {
    cyan: 'text-cyan-200 shadow-cyan-500/10',
    blue: 'text-blue-200 shadow-blue-500/10',
    emerald: 'text-emerald-200 shadow-emerald-500/10',
    amber: 'text-amber-200 shadow-amber-500/10',
  }[tone]

  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[1.7rem] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100/55">{label}</p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </motion.article>
  )
}

function StatusLine({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
      <p className="text-sm font-bold text-blue-100/65">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/60">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase()
  const tone = normalized.includes('COMPLETED') || normalized.includes('AVAILABLE') || normalized.includes('ONBOARDED')
    ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-100'
    : normalized.includes('CANCELED') || normalized.includes('OFFLINE')
      ? 'border-red-300/30 bg-red-500/12 text-red-100'
      : 'border-blue-300/30 bg-blue-500/12 text-blue-100'

  return <span className={`inline-flex w-fit items-center justify-center rounded-full border px-3 py-1.5 text-xs font-black ${tone}`}>{status}</span>
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed right-5 top-5 z-50 rounded-2xl border px-4 py-3 text-sm font-black shadow-2xl backdrop-blur-xl ${
      toast.type === 'error'
        ? 'border-red-300/30 bg-red-500/18 text-red-50'
        : 'border-emerald-300/30 bg-emerald-500/18 text-emerald-50'
    }`}>
      {toast.message}
    </div>
  )
}

function EmptyState({ message }) {
  return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-blue-100/70">{message}</p>
}

function filterUsers(users, search) {
  const term = search.trim().toLowerCase()
  if (!term) return users
  return users.filter((user) => [
    user.name,
    user.email,
    user.mobile,
    user.phone,
    user.nic,
    user.vehicleType,
    user.vehicleNumber,
    user.driverStatus,
    user.driverApproved ? 'approved' : 'pending approval',
  ].some((value) => String(value || '').toLowerCase().includes(term)))
}

function filterBookings(bookings, search) {
  const term = search.trim().toLowerCase()
  if (!term) return bookings
  return bookings.filter((booking) => [
    booking.id,
    booking.status,
    booking.riderName,
    booking.driverName,
    booking.pickupAddress,
    booking.dropAddress,
    booking.vehicleType,
  ].some((value) => String(value || '').toLowerCase().includes(term)))
}

function tabClass(active) {
  return `rounded-2xl border px-4 py-3 text-sm font-black transition ${
    active
      ? 'border-cyan-300/40 bg-cyan-500/18 text-cyan-50 shadow-lg shadow-cyan-500/10'
      : 'border-white/10 bg-white/[0.04] text-blue-100 hover:border-cyan-300/35 hover:bg-cyan-500/12'
  }`
}

function compactAddress(address = '') {
  return address?.split(',')?.[0]?.trim() || 'Not available'
}

function titleCase(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatVehicleType(type = '') {
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Vehicle'
}

function formatRideStatus(status = '') {
  if (status === 'ON_THE_WAY') return 'On The Way'
  if (status === 'STARTED') return 'Started'
  if (status === 'COMPLETED') return 'Completed'
  if (status === 'CANCELED') return 'Canceled'
  if (status === 'PENDING') return 'Pending'
  if (status === 'ACCEPTED') return 'Accepted'
  return status || 'Unknown'
}
