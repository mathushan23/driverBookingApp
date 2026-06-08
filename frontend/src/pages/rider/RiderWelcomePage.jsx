import { useNavigate } from 'react-router-dom'
import { PremiumWelcomePage } from '../../components/welcome/PremiumWelcomePage'

export function RiderWelcomePage() {
  const navigate = useNavigate()

  return (
    <PremiumWelcomePage
      mode="rider"
      title="Enjoy your ride with us."
      onNext={() => navigate('/rider/dashboard')}
    />
  )
}
