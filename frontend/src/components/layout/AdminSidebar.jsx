import gorideLogo from '../../assets/goride-logo.png'
import { BrandText } from '../ui/BrandText'

export function AdminSidebar({ user, logout, activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'riders', label: 'Riders' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'bookings', label: 'Bookings' },
  ]

  return (
    <aside className="relative overflow-hidden border-b border-white/10 bg-[#061022]/95 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="absolute -right-20 top-14 h-44 w-44 rounded-full bg-cyan-500/16 blur-3xl" />
      <div className="absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative flex min-h-full flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-cyan-500/25">
            <img src={gorideLogo} alt="GoRide" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight"><BrandText goClassName="text-cyan-300" rideClassName="text-white" /></p>
            <p className="text-xs font-bold text-blue-100/55">Admin workspace</p>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Admin</p>
          <h2 className="mt-2 truncate text-2xl font-black text-white">{user?.name || 'Admin'}</h2>
          <p className="mt-1 truncate text-sm font-semibold text-blue-100/58">
            {user?.email || <>Manage <BrandText goClassName="text-cyan-300" rideClassName="text-white" /></>}
          </p>
        </div>

        <nav className="mt-5 grid gap-3">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={navClass(activeTab === tab.id)}>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={logout} className="relative mt-7 rounded-2xl border border-red-300/30 bg-red-500/16 px-4 py-3 text-sm font-black text-red-50 shadow-xl shadow-red-950/25 transition hover:bg-red-500/28 lg:mt-auto">
          Logout
        </button>
      </div>
    </aside>
  )
}

function navClass(active) {
  return `flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
    active
      ? 'border-cyan-300/40 bg-cyan-500/18 text-cyan-50 shadow-lg shadow-cyan-500/10'
      : 'border-white/10 bg-white/[0.04] text-blue-100 hover:border-cyan-300/35 hover:bg-cyan-500/12'
  }`
}
