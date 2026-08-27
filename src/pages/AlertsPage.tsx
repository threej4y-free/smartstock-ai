import { AlertTriangle, CalendarClock, Check, Clock3, Info, PackageX } from 'lucide-react'
import type { Alert, Product } from '../types'

const levelMeta = {
  critical: { label: 'Crítico', icon: PackageX },
  warning: { label: 'Atenção', icon: AlertTriangle },
  info: { label: 'Informativo', icon: Info },
}

export function AlertsPage({ alerts, products, onProduct }: { alerts: Alert[]; products: Product[]; onProduct: (product: Product) => void }) {
  const immediate = alerts.filter(alert => alert.level === 'critical').length
  const monitoredLots = alerts.filter(alert => alert.id.startsWith('lot-')).length
  return (
    <div className="page-content alerts-page">
      <div className="intro-row"><div><p>Prioridades calculadas a partir do estoque vendável e da validade dos lotes.</p></div><button className="secondary-button"><Check size={16} /> Marcar todos como lidos</button></div>
      <section className="alert-overview">
        <div><AlertTriangle size={19} /><span><strong>{immediate}</strong> ações imediatas</span></div><div><CalendarClock size={19} /><span><strong>{monitoredLots}</strong> lotes monitorados</span></div><div><Clock3 size={19} /><span><strong>{alerts.length}</strong> alertas ativos</span></div>
      </section>
      <section className="panel alert-feed">
        <div className="alert-feed-head"><span>Alerta</span><span>Produto e contexto</span><span>Registrado</span><span>Status</span></div>
        {alerts.map(alert => {
          const meta = levelMeta[alert.level]
          const Icon = meta.icon
          const product = products.find(item => item.id === alert.productId)
          return <button className="alert-feed-row" key={alert.id} onClick={() => product && onProduct(product)}>
            <span className={`feed-icon ${alert.level}`}><Icon size={18} /></span>
            <span className="feed-copy"><strong>{alert.title}</strong><small>{alert.detail}</small></span>
            <time>{alert.time}</time><span className={`severity ${alert.level}`}>{meta.label}</span>
          </button>
        })}
        {!alerts.length && <div className="empty-state">Nenhum risco operacional identificado nos dados atuais.</div>}
      </section>
    </div>
  )
}
