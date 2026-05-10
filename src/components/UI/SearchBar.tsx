import { useState, useRef, useEffect } from 'react'
import Fuse from 'fuse.js'
import { useMapStore } from '../../store/useMapStore'
import countryIndex from '../../data/country-index.json'

interface CountryEntry { id: string; iso2: string; name: string; region: string }
const entries = countryIndex as CountryEntry[]
const fuse = new Fuse(entries, { keys: ['name', 'id'], threshold: 0.35 })

function flag(iso2: string) {
  return iso2.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join('')
}

export default function SearchBar() {
  const { selectCountry } = useMapStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CountryEntry[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 1) { setResults([]); return }
    setResults(fuse.search(query).slice(0, 8).map(r => r.item))
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(c: CountryEntry) {
    selectCountry(c.id)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-64">
      <div className="flex items-center gap-2 bg-[#0E1525] border border-[#1E2D4A] rounded-lg px-3 py-1.5">
        <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search country..."
          className="bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none w-full"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }} className="text-slate-600 hover:text-slate-400 text-lg leading-none">×</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0E1525] border border-[#1E2D4A] rounded-lg overflow-hidden shadow-2xl z-50">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => select(c)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#151F35] transition-colors text-left"
            >
              <span className="text-base">{flag(c.iso2)}</span>
              <div>
                <p className="text-sm text-slate-200">{c.name}</p>
                <p className="text-xs text-slate-600">{c.region}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
