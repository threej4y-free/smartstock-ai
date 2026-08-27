import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, PackageCheck, Search, ShieldAlert } from 'lucide-react'
import type { InventoryLot, LotStatus, Product } from '../types'

const statusMeta: Record<LotStatus, { label: string; icon: typeof AlertTriangle; className: string }> = {
  healthy: { label: 'Saudável', icon: CheckCircle2, className: 'saudavel' },
  expires_in_15_days: { label: 'Vence em 15 dias', icon: CalendarClock, className: 'vence-em-15-dias' },
  expires_in_7_days: { label: 'Vence em 7 dias', icon: AlertTriangle, className: 'vence-em-7-dias' },
  expiration_safety_window: { label: 'Margem de validade', icon: ShieldAlert, className: 'vencido' },
  expired: { label: 'Vencido', icon: ShieldAlert, className: 'vencido' },
  blocked: { label: 'Bloqueado', icon: ShieldAlert, className: 'vencido' },
}

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'expires_in_7_days', label: 'Vence em 7 dias' },
  { value: 'expires_in_15_days', label: 'Vence em 15 dias' },
  { value: 'healthy', label: 'Saudável' },
  { value: 'unavailable', label: 'Bloqueado' },
] as const

function formatDate(value: string | null): string {
  if (!value) return 'Sem validade'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`)).replace('.', '')
}

export function LotsPage({ products, lots, onProduct }: { products: Product[]; lots: InventoryLot[]; onProduct: (product: Product) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<(typeof filters)[number]['value']>('all')
  const filtered = useMemo(() => lots.filter(lot => {
    const product = products.find(item => item.id === lot.productId)
    const matchesQuery = `${product?.name} ${product?.sku} ${lot.batchNumber}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'all' || lot.status === status || (status === 'unavailable' && ['blocked', 'expired', 'expiration_safety_window'].includes(lot.status))
    return matchesQuery && matchesStatus
  }), [lots, products, query, status])
  const activeLots = lots.filter(lot => lot.quantityAvailable + lot.quantityReserved > 0 && !['blocked', 'expired'].includes(lot.status))
  const expiring = lots.filter(lot => lot.daysToExpiry !== null && lot.daysToExpiry >= 0 && lot.daysToExpiry <= 7)
  const atRisk = lots.filter(lot => ['expires_in_7_days', 'expiration_safety_window'].includes(lot.status)).reduce((sum, lot) => sum + lot.quantityAvailable, 0)
  const blocked = lots.filter(lot => ['blocked', 'expired', 'expiration_safety_window'].includes(lot.status))
  return <div className="page-content lots-page">
    <div className="intro-row"><div><p>Controle validade por lote e siga a ordem FEFO: vence primeiro, sai primeiro.</p></div><div className="fefo-label"><PackageCheck size={15} /><span>Ordenação FEFO ativa</span></div></div>
    <section className="lot-summary"><div><span>Lotes ativos</span><strong>{activeLots.length}</strong><small>{activeLots.reduce((sum, lot) => sum + lot.quantityAvailable, 0)} unidades rastreadas</small></div><div><span>Vencem em 7 dias</span><strong>{expiring.length}</strong><small>{expiring.reduce((sum, lot) => sum + lot.quantityAvailable, 0)} unidades</small></div><div><span>Risco de perda</span><strong>{atRisk} un.</strong><small>dentro da janela crítica</small></div><div><span>Lotes bloqueados</span><strong>{blocked.length}</strong><small>estoque não vendável</small></div></section>
    <section className="panel lots-panel">
      <div className="table-toolbar"><label className="table-search movement-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produto, SKU ou lote" /></label><div className="filter-group lot-filters">{filters.map(option => <button key={option.value} className={status === option.value ? 'selected' : ''} onClick={() => setStatus(option.value)}>{option.label}</button>)}</div></div>
      <div className="lot-table-head"><span>Prioridade</span><span>Lote e produto</span><span>Recebido</span><span>Disponível</span><span>Reservado</span><span>Validade</span><span>Local</span><span>Vendável</span><span>Status</span></div>
      {filtered.map((lot, index) => { const product = products.find(item => item.id === lot.productId); const meta = statusMeta[lot.status]; const Icon = meta.icon; const unavailable = ['blocked', 'expired', 'expiration_safety_window'].includes(lot.status); return <button className={`lot-row-table ${unavailable ? 'expired' : ''}`} key={lot.id} onClick={() => product && onProduct(product)}><span className="fefo-priority">{!unavailable && lot.quantityAvailable ? String(index + 1).padStart(2, '0') : '—'}</span><span className="lot-product"><strong>{lot.batchNumber}</strong><small>{product?.name || 'Produto removido'}<br />{product?.sku}</small></span><span>{lot.quantityReceived} un.</span><strong>{lot.quantityAvailable} un.</strong><span>{lot.quantityReserved} un.</span><span><strong>{formatDate(lot.expiresAt)}</strong><small>{lot.daysToExpiry === null ? 'Sem controle' : lot.daysToExpiry < 0 ? `Vencido há ${Math.abs(lot.daysToExpiry)} dias` : `Faltam ${lot.daysToExpiry} dias`}</small></span><span>{lot.location || '—'}</span><span className={!lot.sellableQuantity && lot.quantityAvailable ? 'risk-quantity' : ''}>{lot.sellableQuantity} un.</span><span className={`lot-status ${meta.className}`}><Icon size={13} />{meta.label}</span></button> })}
      {!filtered.length && <div className="empty-state">Nenhum lote encontrado.</div>}
      <footer className="table-footer"><span>Lotes vencidos, bloqueados ou dentro da margem não entram no estoque vendável.</span></footer>
    </section>
  </div>
}
