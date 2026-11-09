import Dashboard from '@/components/Dashboard'
import { currentWeekLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default function Home() {
  return <Dashboard initialWeekLabel={currentWeekLabel()} />
}
