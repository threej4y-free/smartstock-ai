import { Bell, CalendarDays, Menu, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  eyebrow: string
  onMenu: () => void
}

export function Header({ title, eyebrow, onMenu }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="page-heading">
        <button className="menu-button" onClick={onMenu} aria-label="Abrir menu"><Menu size={21} /></button>
        <div><span>{eyebrow}</span><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <Search size={17} />
          <input aria-label="Busca global" placeholder="Buscar produto ou SKU" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="date-button"><CalendarDays size={17} /><span>27 ago 2026</span></button>
        <button className="icon-button has-notification" aria-label="Notificações"><Bell size={18} /></button>
      </div>
    </header>
  )
}
