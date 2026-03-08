import { useState } from 'react'
import { SearchBar } from '../components/SearchBar'
import { StatsRow } from '../components/StatsRow'
import { MarketOverview } from '../components/MarketOverview'
import { PublicFigures } from '../components/PublicFigures'
import { ResultSection } from '../components/ResultSection'

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'ticker' | 'investor'>('ticker')

  const handleSearch = (q: string, type: 'ticker' | 'investor') => {
    setSearchQuery(q)
    setSearchType(type)
  }

  return (
    <>
      <SearchBar onSearch={handleSearch} />
      <StatsRow />
      <MarketOverview onSearch={handleSearch} />
      <PublicFigures onSearch={handleSearch} />
      {searchQuery && (
        <ResultSection
          query={searchQuery}
          type={searchType}
          onClear={() => setSearchQuery('')}
        />
      )}
      <footer className="text-slate-500 dark:text-slate-400 text-md py-6 max-w-6xl mx-auto px-4">
        <div>2026 | Created by <a href="https://junkevin88.github.io/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2 transition-colors">Jun Kevin</a> 🦆</div>
      </footer>
    </>
  )
}
