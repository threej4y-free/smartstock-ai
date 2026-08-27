import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, PackageCheck, Search, ShieldAlert } from 'lucide-react'
import type { Product } from '../types'

type LotStatus = 'Vence em 7 dias' | 'Vence em 15 dias' | 'Saudável' | 'Vencido'
const lots = [
  { id: 'LT-2607-088', productId: 'prod-004', received: 40, available: 26, reserved: 4, expires: '31 ago 2026', days: 4, status: 'Vence em 7 dias' as LotStatus, location: 'A-02-03', risk: 12 },
  { id: 'LT-2608-014', productId: 'prod-001', received: 48, available: 18, reserved: 8, expires: '18 set 2026', days: 22, status: 'Saudável' as LotStatus, location: 'B-01-02', risk: 0 },
  { id: 'LT-2608-022', productId: 'prod-002', received: 96, available: 42, reserved: 8, expires: '02 set 2026', days: 6, status: 'Vence em 7 dias' as LotStatus, location: 'R-01-04', risk: 6 },
  { id: 'LT-2608-016', productId: 'prod-006', received: 60, available: 35, reserved: 0, expires: '05 set 2026', days: 9, status: 'Vence em 15 dias' as LotStatus, location: 'A-01-08', risk: 3 },
  { id: 'LT-2607-071', productId: 'prod-003', received: 120, available: 54, reserved: 0, expires: '12 nov 2026', days: 77, status: 'Saudável' as LotStatus, location: 'C-03-01', risk: 0 },
  { id: 'LT-2608-029', productId: 'prod-003', received: 48, available: 42, reserved: 0, expires: '18 dez 2026', days: 113, status: 'Saudável' as LotStatus, location: 'C-03-02', risk: 0 },
  { id: 'LT-2606-042', productId: 'prod-008', received: 36, available: 0, reserved: 0, expires: '25 ago 2026', days: -2, status: 'Vencido' as LotStatus, location: 'BL-01', risk: 0 },
]

const statusIcon = { 'Vence em 7 dias': AlertTriangle, 'Vence em 15 dias': CalendarClock, Saudável: CheckCircle2, Vencido: ShieldAlert }

export function LotsPage({ products, onProduct }: { products: Product[]; onProduct: (product: Product) => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LotStatus | 'Todos'>('Todos')
  const filtered = useMemo(() => lots.filter(lot => { const product = products.find(item => item.id === lot.productId); return `${product?.name} ${product?.sku} ${lot.id}`.toLowerCase().includes(query.toLowerCase()) && (status === 'Todos' || lot.status === status) }), [products, query, status])
  return <div className="page-content lots-page">
    <div className="intro-row"><div><p>Controle validade por lote e siga a ordem FEFO: vence primeiro, sai primeiro.</p></div><div className="fefo-label"><PackageCheck size={15} /><span>Ordenação FEFO ativa</span></div></div>
    <section className="lot-summary"><div><span>Lotes ativos</span><strong>24</strong><small>197 unidades rastreadas</small></div><div><span>Vencem em 7 dias</span><strong>2</strong><small>68 unidades</small></div><div><span>Risco de perda</span><strong>21 un.</strong><small>R$ 184 estimados</small></div><div><span>Lotes bloqueados</span><strong>1</strong><small>estoque não vendável</small></div></section>
    <section className="panel lots-panel">
      <div className="table-toolbar"><label className="table-search movement-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produto, SKU ou lote" /></label><div className="filter-group lot-filters">{(['Todos', 'Vence em 7 dias', 'Vence em 15 dias', 'Saudável', 'Vencido'] as const).map(option => <button key={option} className={status === option ? 'selected' : ''} onClick={() => setStatus(option)}>{option}</button>)}</div></div>
      <div className="lot-table-head"><span>Prioridade</span><span>Lote e produto</span><span>Recebido</span><span>Disponível</span><span>Reservado</span><span>Validade</span><span>Local</span><span>Risco ao vencer</span><span>Status</span></div>
      {filtered.map((lot, index) => { const product = products.find(item => item.id === lot.productId); const Icon = statusIcon[lot.status]; return <button className={`lot-row-table ${lot.status === 'Vencido' ? 'expired' : ''}`} key={lot.id} onClick={() => product && onProduct(product)}><span className="fefo-priority">{lot.status !== 'Vencido' ? String(index + 1).padStart(2, '0') : '—'}</span><span className="lot-product"><strong>{lot.id}</strong><small>{product?.name}<br />{product?.sku}</small></span><span>{lot.received} un.</span><strong>{lot.available} un.</strong><span>{lot.reserved} un.</span><span><strong>{lot.expires}</strong><small>{lot.days < 0 ? `Vencido há ${Math.abs(lot.days)} dias` : `Faltam ${lot.days} dias`}</small></span><span>{lot.location}</span><span className={lot.risk ? 'risk-quantity' : ''}>{lot.risk ? `${lot.risk} un.` : '—'}</span><span className={`lot-status ${lot.status.toLowerCase().replaceAll(' ', '-').replace('á', 'a')}`}><Icon size={13} />{lot.status}</span></button> })}
      {!filtered.length && <div className="empty-state">Nenhum lote encontrado.</div>}
      <footer className="table-footer"><span>Os lotes vencidos permanecem bloqueados e não entram no estoque vendável.</span></footer>
    </section>
  </div>
}
