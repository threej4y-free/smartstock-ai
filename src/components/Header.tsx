import { Bell, CalendarDays, Menu, Search } from 'lucide-react'
import type { DataMode } from '../types'

interface HeaderProps {
  title: string
  eyebrow: string
  onMenu: () => void
  dataMode: DataMode
}

export function Header({ title, eyebrow, onMenu, dataMode }: HeaderProps) {
  const currentDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).replace('.', '')
  return (
    <header className="topbar">
      <div className="page-heading">
        <button className="menu-button" onClick={onMenu} aria-label="Abrir menu"><Menu size={21} /></button>
        <div><span>{eyebrow}</span><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <span className={`data-mode-badge ${dataMode}`}>{dataMode === 'api' ? 'PostgreSQL · API' : 'Modo demo'}</span>
        <label className="global-search">
          <Search size={17} />
          <input aria-label="Busca global" placeholder="Buscar produto ou SKU" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="date-button"><CalendarDays size={17} /><span>{currentDate}</span></button>
        <button className="icon-button has-notification" aria-label="Notificações"><Bell size={18} /></button>
      </div>
    </header>
  )
}
