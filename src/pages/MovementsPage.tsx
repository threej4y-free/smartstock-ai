import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Download, Filter, RotateCcw, Search, ShieldMinus } from 'lucide-react'
import type { Product } from '../types'

type MovementType = 'Entrada' | 'Venda' | 'Ajuste' | 'Reserva' | 'Perda'
const movements = [
  { id: 'MOV-8421', date: '27 ago 2026 · 14:32', productId: 'prod-001', type: 'Venda' as MovementType, quantity: -3, lot: 'LT-2608-014', reason: 'Venda PDV', reference: 'VEN-98421', user: 'Sistema' },
  { id: 'MOV-8420', date: '27 ago 2026 · 13:18', productId: 'prod-007', type: 'Entrada' as MovementType, quantity: 96, lot: 'LT-2608-031', reason: 'Recebimento de compra', reference: 'PC-2026-0182', user: 'Marina Costa' },
  { id: 'MOV-8419', date: '27 ago 2026 · 11:47', productId: 'prod-004', type: 'Perda' as MovementType, quantity: -4, lot: 'LT-2607-088', reason: 'Avaria na embalagem', reference: 'AJ-1840', user: 'Rafael Lima' },
  { id: 'MOV-8418', date: '27 ago 2026 · 10:22', productId: 'prod-002', type: 'Reserva' as MovementType, quantity: -8, lot: 'LT-2608-022', reason: 'Separação de pedido', reference: 'PED-3018', user: 'Sistema' },
  { id: 'MOV-8417', date: '27 ago 2026 · 09:06', productId: 'prod-006', type: 'Venda' as MovementType, quantity: -5, lot: 'LT-2608-016', reason: 'Venda e-commerce', reference: 'VEN-98413', user: 'Sistema' },
  { id: 'MOV-8416', date: '26 ago 2026 · 17:54', productId: 'prod-003', type: 'Ajuste' as MovementType, quantity: 2, lot: 'LT-2607-071', reason: 'Correção de inventário', reference: 'INV-0826', user: 'Marina Costa' },
  { id: 'MOV-8415', date: '26 ago 2026 · 16:40', productId: 'prod-005', type: 'Entrada' as MovementType, quantity: 24, lot: 'LT-2608-028', reason: 'Recebimento de compra', reference: 'PC-2026-0181', user: 'Rafael Lima' },
  { id: 'MOV-8414', date: '26 ago 2026 · 15:12', productId: 'prod-008', type: 'Venda' as MovementType, quantity: -2, lot: 'LT-2607-095', reason: 'Venda PDV', reference: 'VEN-98396', user: 'Sistema' },
]

const movementIcon = { Entrada: ArrowDownLeft, Venda: ArrowUpRight, Ajuste: RotateCcw, Reserva: ShieldMinus, Perda: ShieldMinus }

export function MovementsPage({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<MovementType | 'Todos'>('Todos')
  const filtered = useMemo(() => movements.filter(movement => { const product = products.find(item => item.id === movement.productId); return `${product?.name} ${product?.sku} ${movement.reference} ${movement.lot}`.toLowerCase().includes(query.toLowerCase()) && (type === 'Todos' || movement.type === type) }), [products, query, type])
  return <div className="page-content movements-page">
    <div className="intro-row"><div><p>Rastreie toda alteração de quantidade com lote, origem e responsável.</p></div><button className="secondary-button"><Download size={15} /> Exportar histórico</button></div>
    <section className="movement-summary"><div><span>Entradas hoje</span><strong>120 un.</strong><small>2 recebimentos</small></div><div><span>Saídas hoje</span><strong>22 un.</strong><small>vendas, reservas e perdas</small></div><div><span>Saldo do dia</span><strong>+98 un.</strong><small>posição líquida</small></div><div><span>Ajustes no mês</span><strong>7</strong><small>0,16% do estoque</small></div></section>
    <section className="panel movements-panel">
      <div className="table-toolbar"><label className="table-search movement-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Produto, SKU, lote ou referência" /></label><div className="filter-group"><Filter size={15} /><span>Tipo</span>{(['Todos', 'Entrada', 'Venda', 'Ajuste', 'Reserva', 'Perda'] as const).map(option => <button key={option} className={type === option ? 'selected' : ''} onClick={() => setType(option)}>{option}</button>)}</div></div>
      <div className="movement-table-head"><span>Movimentação</span><span>Produto</span><span>Tipo</span><span>Quantidade</span><span>Lote</span><span>Motivo</span><span>Referência</span><span>Responsável</span></div>
      {filtered.map(movement => { const product = products.find(item => item.id === movement.productId); const Icon = movementIcon[movement.type]; return <div className="movement-row" key={movement.id}><span><strong>{movement.id}</strong><small>{movement.date}</small></span><span className="product-cell"><i>{product?.name.slice(0, 1) || '?'}</i><span><strong>{product?.name || 'Produto removido'}</strong><small>{product?.sku}</small></span></span><span className={`movement-type ${movement.type.toLowerCase()}`}><Icon size={13} />{movement.type}</span><strong className={movement.quantity > 0 ? 'quantity-positive' : 'quantity-negative'}>{movement.quantity > 0 ? '+' : ''}{movement.quantity} un.</strong><span>{movement.lot}</span><span>{movement.reason}</span><span>{movement.reference}</span><span>{movement.user}</span></div> })}
      {!filtered.length && <div className="empty-state">Nenhuma movimentação encontrada.</div>}
      <footer className="table-footer"><span>Exibindo {filtered.length} movimentações recentes</span></footer>
    </section>
  </div>
}
