import { Link, useLocation } from 'react-router-dom'
import gorideLogo from '../../assets/goride-logo.png'
import { BrandText } from '../ui/BrandText'

export function DriverSidebar({ user, logout, status, hasActiveRide, onStatusChange }) {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/driver/dashboard')
  const isHistory = location.pathname.startsWith('/driver/history') || location.pathname.startsWith('/driver/rides')

  return (
    <aside className="relative overflow-hidden border-b border-white/10 bg-[#061022]/95 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="absolute -right-20 top-14 h-44 w-44 rounded-full bg-emerald-500/16 blur-3xl" />
      <div className="absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative flex min-h-full flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-emerald-500/25">
            <img src={gorideLogo} alt="GoRide" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight"><BrandText goClassName="text-emerald-300" rideClassName="text-white" /></p>
            <p className="text-xs font-bold text-blue-100/55">Driver workspace</p>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Driver</p>
          <h2 className="mt-2 truncate text-2xl font-black text-white">{user?.name || 'Driver'}</h2>
          <p className="mt-1 truncate text-sm font-semibold text-blue-100/58">{user?.email || 'Ready for rides'}</p>
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
          <label className="block text-xs font-black uppercase tracking-[0.2em] text-blue-200/70">
            Driver Status
            <select
              className="auth-input mt-2 h-12 text-sm"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              disabled={hasActiveRide}
              title={hasActiveRide ? 'Status is locked while a ride is active' : 'Change driver status'}
            >
              {['AVAILABLE', 'BUSY', 'OFFLINE'].map((item) => (
                <option key={item} value={item} disabled={hasActiveRide && item !== 'BUSY'}>{item}</option>
              ))}
            </select>
          </label>
          {hasActiveRide && <p className="mt-2 text-xs font-bold text-emerald-200/70">Locked while ride is active.</p>}
        </div>

        <nav className="mt-7 grid gap-3">
          <Link to="/driver/dashboard" className={navClass(isDashboard)}>
            <span>Dashboard</span>
          </Link>
          <Link to="/driver/history" className={navClass(isHistory)}>
            <span>Ride History</span>
          </Link>
        </nav>

        <button onClick={logout} className="relative mt-7 rounded-2xl border border-red-300/30 bg-red-500/16 px-4 py-3 text-sm font-black text-red-50 shadow-xl shadow-red-950/25 transition hover:bg-red-500/28 lg:mt-auto">
          Logout
        </button>
      </div>
    </aside>
  )
}

function navClass(active) {
  return `flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition ${
    active
      ? 'border-emerald-300/40 bg-emerald-500/18 text-emerald-50 shadow-lg shadow-emerald-500/10'
      : 'border-white/10 bg-white/[0.04] text-blue-100 hover:border-emerald-300/35 hover:bg-emerald-500/12'
  }`
}
