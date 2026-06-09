import { Link, useLocation } from 'react-router-dom'
import gorideLogo from '../../assets/goride-logo.png'

export function RiderSidebar({ user, logout }) {
  const location = useLocation()
  const isHistory = location.pathname.startsWith('/rider/history') || location.pathname.startsWith('/rider/rides')
  const isDashboard = location.pathname.startsWith('/rider/dashboard')

  return (
    <aside className="relative overflow-hidden border-b border-white/10 bg-[#061022]/95 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="absolute -right-20 top-14 h-44 w-44 rounded-full bg-blue-500/18 blur-3xl" />
      <div className="absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative flex min-h-full flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-blue-500/25">
            <img src={gorideLogo} alt="GoRide" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight text-white"><span className="text-sky-300">Go</span>Ride</p>
            <p className="text-xs font-bold text-blue-100/55">Rider workspace</p>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Rider</p>
          <h2 className="mt-2 truncate text-2xl font-black text-white">{user?.name || 'Rider'}</h2>
          <p className="mt-1 truncate text-sm font-semibold text-blue-100/58">{user?.email || 'Book smarter rides'}</p>
        </div>

        <nav className="mt-7 grid gap-3">
          <Link to="/rider/dashboard" className={navClass(isDashboard)}>
            <span>Book Ride</span>
          </Link>
          <Link to="/rider/history" className={navClass(isHistory)}>
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
      ? 'border-blue-300/40 bg-blue-500/20 text-blue-50 shadow-lg shadow-blue-500/10'
      : 'border-white/10 bg-white/[0.04] text-blue-100 hover:border-blue-300/35 hover:bg-blue-500/12'
  }`
}
