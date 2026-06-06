export const adminUser = {
  email: 'admin@goride.com',
  name: 'GoRide Admin',
  role: 'admin',
  token: 'demo-admin-token',
  onboardingComplete: true,
}

export const roleCards = [
  {
    role: 'rider',
    title: 'Rider',
    copy: 'Book premium rides, track routes, and travel comfortably.',
    icon: 'pin',
  },
  {
    role: 'driver',
    title: 'Driver',
    copy: 'Accept trips, manage status, and grow your daily earnings.',
    icon: 'wheel',
  },
]

export const dashboardStats = {
  admin: [
    ['Total Users', '12,840', '+18% this month'],
    ['Total Drivers', '1,286', '+92 verified'],
    ['Total Bookings', '48,920', '1,420 today'],
  ],
  rider: [
    ['Available Drivers', '24', 'within 3 km'],
    ['Booking History', '18', 'completed rides'],
    ['Ride Confirmation', '2 min', 'avg response'],
  ],
  driver: [
    ['Availability Status', 'Online', 'accepting rides'],
    ['Assigned Rides', '7', 'today'],
    ['Earnings Overview', '$184', 'current week'],
  ],
}

export function dashboardTitle(role) {
  if (role === 'admin') return 'Control the GoRide operation center'
  if (role === 'driver') return 'Manage trips and grow your earnings'
  return 'Book faster rides with trusted drivers'
}
