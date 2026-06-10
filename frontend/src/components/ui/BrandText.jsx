export function BrandText({ className = '', goClassName = 'text-blue-500', rideClassName = 'text-white' }) {
  return (
    <span className={className}>
      <span className={goClassName}>Go</span>
      <span className={rideClassName}>Ride</span>
    </span>
  )
}
