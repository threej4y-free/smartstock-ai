import { AlertTriangle, CalendarClock, Check, Clock3, Info, PackageX } from 'lucide-react'
import { alerts, products } from '../data'
import type { Product } from '../types'

const extraAlerts = [
  { id: 5, level: 'warning' as const, title: 'Excesso de estoque', detail: 'Azeite Extra Virgem 500ml · cobertura estimada em 61 dias', time: 'Ontem', productId: 'prod-005' },
  { id: 6, level: 'warning' as const, title: 'Vencimento em 15 dias', detail: 'Lote LT-2608-008 · 18 unidades ainda não comprometidas', time: 'Ontem', productId: 'prod-004' },
]

const levelMeta = {
  critical: { label: 'Crítico', icon: PackageX },
  warning: { label: 'Atenção', icon: AlertTriangle },
  info: { label: 'Informativo', icon: Info },
}

export function AlertsPage({ onProduct }: { onProduct: (product: Product) => void }) {
  const allAlerts = [...alerts, ...extraAlerts]
  return (
    <div className="page-content alerts-page">
      <div className="intro-row"><div><p>Prioridades ordenadas por impacto financeiro e urgência operacional.</p></div><button className="secondary-button"><Check size={16} /> Marcar todos como lidos</button></div>
      <section className="alert-overview">
        <div><AlertTriangle size={19} /><span><strong>3</strong> ações imediatas</span></div><div><CalendarClock size={19} /><span><strong>12</strong> lotes monitorados</span></div><div><Clock3 size={19} /><span><strong>4h</strong> tempo médio de resolução</span></div>
      </section>
      <section className="panel alert-feed">
        <div className="alert-feed-head"><span>Alerta</span><span>Produto e contexto</span><span>Registrado</span><span>Status</span></div>
        {allAlerts.map(alert => {
          const meta = levelMeta[alert.level]
          const Icon = meta.icon
          const product = products.find(item => item.id === alert.productId)
          return <button className="alert-feed-row" key={alert.id} onClick={() => product && onProduct(product)}>
            <span className={`feed-icon ${alert.level}`}><Icon size={18} /></span>
            <span className="feed-copy"><strong>{alert.title}</strong><small>{alert.detail}</small></span>
            <time>{alert.time}</time><span className={`severity ${alert.level}`}>{meta.label}</span>
          </button>
        })}
      </section>
    </div>
  )
}
