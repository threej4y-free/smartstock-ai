import { useState } from 'react'
import { AlertTriangle, BarChart3, Boxes, ChevronLeft, ClipboardList, LayoutGrid, PackageOpen, Settings, ShoppingCart, X } from 'lucide-react'

type Page = 'dashboard' | 'products' | 'alerts' | 'purchases' | 'forecasts' | 'movements' | 'lots' | 'settings'

interface SidebarProps {
  page: Page
  onNavigate: (page: Page) => void
  open: boolean
  onClose: () => void
}

const primaryItems = [
  { id: 'dashboard' as const, label: 'Visão geral', icon: LayoutGrid },
  { id: 'products' as const, label: 'Produtos', icon: Boxes },
  { id: 'alerts' as const, label: 'Alertas', icon: AlertTriangle, count: 7 },
  { id: 'purchases' as const, label: 'Compras', icon: ShoppingCart },
]

export function Sidebar({ page, onNavigate, open, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={onClose} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'mobile-open' : ''}`}>
        <div className="brand-row">
          <button className="brand" onClick={() => onNavigate('dashboard')} aria-label="SmartStock">
            <span className="brand-name">SmartStock</span>
          </button>
          <button className="mobile-close" onClick={onClose} aria-label="Fechar menu"><X size={19} /></button>
        </div>

        <nav className="side-nav" aria-label="Navegação principal">
          <span className="nav-caption">Operação</span>
          {primaryItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { onNavigate(item.id); onClose() }} title={collapsed ? item.label : undefined}>
                <Icon size={18} strokeWidth={1.7} />
                <span>{item.label}</span>
                {item.count && <em>{item.count}</em>}
              </button>
            )
          })}

          <span className="nav-caption second">Análise</span>
          <button className={`nav-item ${page === 'forecasts' ? 'active' : ''}`} onClick={() => { onNavigate('forecasts'); onClose() }} title={collapsed ? 'Previsões' : undefined}><BarChart3 size={18} strokeWidth={1.7} /><span>Previsões</span></button>
          <button className={`nav-item ${page === 'movements' ? 'active' : ''}`} onClick={() => { onNavigate('movements'); onClose() }} title={collapsed ? 'Movimentações' : undefined}><ClipboardList size={18} strokeWidth={1.7} /><span>Movimentações</span></button>
          <button className={`nav-item ${page === 'lots' ? 'active' : ''}`} onClick={() => { onNavigate('lots'); onClose() }} title={collapsed ? 'Lotes' : undefined}><PackageOpen size={18} strokeWidth={1.7} /><span>Lotes</span></button>
        </nav>

        <div className="sidebar-footer">
          <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => { onNavigate('settings'); onClose() }}><Settings size={18} strokeWidth={1.7} /><span>Configurações</span></button>
          <div className="profile">
            <span className="avatar">SD</span>
            <span className="profile-copy"><strong>SmartStock Demo</strong><small>Ambiente local</small></span>
          </div>
          <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>
            <ChevronLeft size={16} />
          </button>
        </div>
      </aside>
    </>
  )
}

export type { Page }
