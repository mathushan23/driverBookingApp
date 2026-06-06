import { CarIcon } from '../icons/GoRideIcons'

export function Illustration({ type }) {
  return (
    <div className={`mini-illustration ${type}`}>
      <div className="person" />
      <div className="vehicle">
        <CarIcon />
      </div>
      <div className="route-line" />
      <div className="coin" />
    </div>
  )
}
