import { Link } from 'react-router-dom'
import { UserManagement } from '../components/UserManagement'

export function DashboardPage() {
  return (
    <div className="home__narrow">
      <header className="header dashboard-intro">
        <p className="eyebrow">Dashboard</p>
        <h1>Overview</h1>
        <p className="lede">
          This area can grow with admin tools (projects, uploads). For now,
          session details live below.
        </p>
        <p className="dashboard-back">
          <Link to="/home">&larr; Back to site</Link>
        </p>
      </header>
      <main>
        <UserManagement layout="card" />
      </main>
    </div>
  )
}
