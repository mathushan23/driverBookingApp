import { motion } from 'framer-motion'
import { BrandLockup } from '../components/layout/BrandLockup'
import { BrandText } from '../components/ui/BrandText'
import { Button, Input } from '../components/ui/FormControls'
import { dashboardStats, dashboardTitle } from '../data/gorideData'

export function DashboardPage({ user, logout }) {
  const role = user?.role || 'rider'
  const cards = dashboardStats[role]

  return (
    <main className="dashboard-page">
      <aside className="dashboard-nav">
        <BrandLockup />
        <nav>
          {dashboardLinks(role).map((item) => (
            <a href={`#${item.toLowerCase().replaceAll(' ', '-')}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
        <button className="ghost-button" type="button" onClick={logout}>
          Logout
        </button>
      </aside>
      <section className="dashboard-main">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">{role} dashboard</p>
            <h1>{renderDashboardTitle(role)}</h1>
          </div>
          <div className="status-pill">{role === 'driver' ? 'Online' : 'Live platform'}</div>
        </div>
        <div className="metric-grid">
          {cards.map(([label, value, note], index) => (
            <motion.article
              className="metric-card"
              key={label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </motion.article>
          ))}
        </div>
        <DashboardWorkspace role={role} />
      </section>
    </main>
  )
}

function renderDashboardTitle(role) {
  if (role === 'admin') {
    return <>Control the <BrandText goClassName="text-blue-300" rideClassName="text-white" /> operation center</>
  }

  return dashboardTitle(role)
}

function dashboardLinks(role) {
  if (role === 'admin') return ['Overview', 'Manage Drivers', 'View Users', 'View Bookings']
  if (role === 'driver') return ['Overview', 'Assigned Rides', 'Earnings', 'Update Status']
  return ['Overview', 'Book Ride', 'Available Drivers', 'Booking History']
}

function DashboardWorkspace({ role }) {
  if (role === 'admin') {
    return (
      <section className="workspace-grid">
        <Panel title="Manage Drivers" items={['Review pending driver profiles', 'Approve vehicle information', 'Monitor live availability']} />
        <Panel title="View Users" items={['Segment riders by activity', 'Review account health', 'Export user insights']} />
        <Panel title="View Bookings" items={['Track active city demand', 'Audit completed trips', 'Resolve booking issues']} />
      </section>
    )
  }

  if (role === 'driver') {
    return (
      <section className="workspace-grid">
        <Panel title="Availability Status" items={['Accepting ride requests', 'Downtown route preference', 'Next refresh in 30 seconds']} />
        <Panel title="Assigned Rides" items={['Pickup at Lake Road', 'Drop at Central Station', 'Fare estimate $18.40']} />
        <Panel title="Update Status" items={['Arrived at pickup', 'Passenger onboard', 'Ride completed']} />
      </section>
    )
  }

  return (
    <section className="workspace-grid">
      <Panel title="Available Drivers" items={['Nimal Perera - 4.9 rating', 'Asha Fernando - 3 min away', 'Kamal Silva - sedan']} />
      <form className="ride-form">
        <h2>Book Ride Form</h2>
        <Input label="Pickup Location" value="" onChange={() => {}} />
        <Input label="Destination" value="" onChange={() => {}} />
        <Button label="Confirm Ride" />
      </form>
      <Panel title="Booking History" items={['Colombo Fort to Nugegoda', 'Kandy Road to Airport', 'Galle Face to Union Place']} />
    </section>
  )
}

function Panel({ title, items }) {
  return (
    <article className="content-panel">
      <h2>{title}</h2>
      {items.map((item) => (
        <div className="panel-row" key={item}>
          <span />
          <p>{item}</p>
        </div>
      ))}
    </article>
  )
}
