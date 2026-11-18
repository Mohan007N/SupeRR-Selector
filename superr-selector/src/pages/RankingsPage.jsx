import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import FilterBar from '../components/layout/FilterBar.jsx'
import Leaderboard from '../components/tables/Leaderboard.jsx'
import { useDemo } from '../context/DemoContext.jsx'

export default function RankingsPage() {
  const demo = useDemo()
  return (
    <>
      <PageHeader
        eyebrow="Player rankings"
        title="Most reliable under pressure"
        description="Two leaderboards, one for batters and one for bowlers. A player must clear a minimum pressure-ball sample, and every row shows how much to trust it."
      />
      {demo.isDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/[0.06] p-4 text-[13px] text-fg-soft" role="note">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-warn">Demo rankings.</strong> These leaderboards are computed from synthetic data with an
            unvalidated rating formula. They are not verified results and must not be read as real player selections.
          </p>
        </div>
      ) : null}
      <FilterBar controls={['competition', 'season']} />
      <div className="space-y-6">
        <Leaderboard type="batting" title="Top 10 batters" sectionId="batters-board" />
        <Leaderboard type="bowling" title="Top 10 bowlers" sectionId="bowlers-board" />
      </div>
    </>
  )
}
