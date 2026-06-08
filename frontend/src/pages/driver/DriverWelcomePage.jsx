import { useNavigate } from 'react-router-dom'
import { PremiumWelcomePage } from '../../components/welcome/PremiumWelcomePage'

export function DriverWelcomePage() {
  const navigate = useNavigate()

  return (
    <PremiumWelcomePage
      mode="driver"
      title="Welcome to the driver's community."
      onNext={() => navigate('/driver/dashboard')}
    />
  )
}
