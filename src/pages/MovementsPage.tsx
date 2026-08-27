import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Download, Filter, RotateCcw, Search, ShieldMinus } from 'lucide-react'
import type { InventoryLot, Product, StockMovement, StockMovementType } from '../types'

const movementMeta: Record<StockMovementType, { label: string; icon: typeof ArrowDownLeft }> = {
  receipt: { label: 'Entrada', icon: ArrowDownLeft },
  sale: { label: 'Venda', icon: ArrowUpRight },
  adjustment: { label: 'Ajuste', icon: RotateCcw },
  reservation: { label: 'Reserva', icon: ShieldMinus },
  release: { label: 'Liberação', icon: RotateCcw },
  loss: { label: 'Perda', icon: ShieldMinus },
}

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'receipt', label: 'Entrada' },
  { value: 'sale', label: 'Venda' },
  { value: 'adjustment', label: 'Ajuste' },
  { value: 'reservation', label: 'Reserva' },
  { value: 'loss', label: 'Perda' },
] as const

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function MovementsPage({ products, lots, movements }: { products: Product[]; lots: InventoryLot[]; movements: StockMovement[] }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<(typeof filters)[number]['value']>('all')
  const filtered = useMemo(() => movements.filter(movement => {
    const product = products.find(item => item.id === movement.productId)
    const lot = lots.find(item => item.id === movement.lotId)
    return `${product?.name} ${product?.sku} ${movement.reference} ${lot?.batchNumber}`.toLowerCase().includes(query.toLowerCase()) && (type === 'all' || movement.movementType === type)
  }), [lots, movements, products, query, type])
  const today = new Date().toISOString().slice(0, 10)
  const todayMovements = movements.filter(movement => movement.occurredAt.slice(0, 10) === today)
  const entries = todayMovements.filter(item => item.movementType === 'receipt').reduce((sum, item) => sum + item.quantity, 0)
  const outputs = Math.abs(todayMovements.filter(item => item.quantity < 0).reduce((sum, item) => sum + item.quantity, 0))
  const adjustments = movements.filter(item => item.movementType === 'adjustment').length
  return <div className="page-content movements-page">
    <div className="intro-row"><div><p>Rastreie toda alteração de quantidade com lote, origem e responsável.</p></div><button className="secondary-button"><Download size={15} /> Exportar histórico</button></div>
    <section className="movement-summary"><div><span>Entradas hoje</span><strong>{entries} un.</strong><small>{todayMovements.filter(item => item.movementType === 'receipt').length} recebimentos</small></div><div><span>Saídas hoje</span><strong>{outputs} un.</strong><small>vendas, reservas e perdas</small></div><div><span>Saldo do dia</span><strong>{entries - outputs >= 0 ? '+' : ''}{entries - outputs} un.</strong><small>posição líquida</small></div><div><span>Ajustes registrados</span><strong>{adjustments}</strong><small>no histórico carregado</small></div></section>
    <section className="panel movements-panel">
      <div className="table-toolbar"><label className="table-search movement-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Produto, SKU, lote ou referência" /></label><div className="filter-group"><Filter size={15} /><span>Tipo</span>{filters.map(option => <button key={option.value} className={type === option.value ? 'selected' : ''} onClick={() => setType(option.value)}>{option.label}</button>)}</div></div>
      <div className="movement-table-head"><span>Movimentação</span><span>Produto</span><span>Tipo</span><span>Quantidade</span><span>Lote</span><span>Motivo</span><span>Referência</span><span>Responsável</span></div>
      {filtered.map(movement => { const product = products.find(item => item.id === movement.productId); const lot = lots.find(item => item.id === movement.lotId); const meta = movementMeta[movement.movementType]; const Icon = meta.icon; return <div className="movement-row" key={movement.id}><span><strong>{movement.id.slice(0, 12)}</strong><small>{formatDate(movement.occurredAt)}</small></span><span className="product-cell"><i>{product?.name.slice(0, 1) || '?'}</i><span><strong>{product?.name || 'Produto removido'}</strong><small>{product?.sku}</small></span></span><span className={`movement-type ${meta.label.toLowerCase()}`}><Icon size={13} />{meta.label}</span><strong className={movement.quantity > 0 ? 'quantity-positive' : 'quantity-negative'}>{movement.quantity > 0 ? '+' : ''}{movement.quantity} un.</strong><span>{lot?.batchNumber || movement.lotId.slice(0, 8)}</span><span>{movement.reason}</span><span>{movement.reference || '—'}</span><span>{movement.actor}</span></div> })}
      {!filtered.length && <div className="empty-state">Nenhuma movimentação encontrada.</div>}
      <footer className="table-footer"><span>Exibindo {filtered.length} movimentações</span></footer>
    </section>
  </div>
}
