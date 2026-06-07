import { BackgroundFX } from '../components/auth/AuthLayout'

export function AdminDashboard({ user, logout }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto max-w-5xl rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">backend predefined admin</p>
        <h1 className="mt-3 text-4xl font-black">Admin Dashboard</h1>
        <p className="mt-3 text-blue-100/75">Welcome {user?.name || 'Admin'}. Admin is only available through predefined backend login.</p>
        <button onClick={logout} className="mt-6 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Logout</button>
      </section>
    </main>
  )
}
