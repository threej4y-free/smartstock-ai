import { ArrowDownRight, ArrowUpRight, CalendarClock, ChevronRight, PackageCheck, ShoppingCart, X } from 'lucide-react'
import type { InventoryLot, Product } from '../types'
import { RiskBadge } from './RiskBadge'

interface ProductDrawerProps { product: Product | null; lots: InventoryLot[]; onClose: () => void }

function formatDate(value: string | null) {
  if (!value) return 'Sem validade'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)).replace('.', '')
}

export function ProductDrawer({ product, lots, onClose }: ProductDrawerProps) {
  if (!product) return null
  const productLots = lots.filter(lot => lot.productId === product.id && lot.quantityAvailable + lot.quantityReserved > 0).slice(0, 3)
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" onClick={onClose} aria-label="Fechar detalhe" />
      <aside className="product-drawer" aria-label={`Detalhes de ${product.name}`}>
        <div className="drawer-head">
          <div><span className="eyebrow">{product.category} · {product.sku}</span><h2>{product.name}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
        </div>
        <div className="drawer-status"><RiskBadge risk={product.risk} /><span>Sincronizado com a fonte ativa</span></div>

        <section className="drawer-section">
          <div className="section-title"><div><span>Posição atual</span><h3>Estoque e cobertura</h3></div></div>
          <div className="mini-metrics">
            <div><span>Disponível</span><strong>{product.stock} un.</strong><small><ArrowDownRight size={13} /> {product.reservedStock} reservadas</small></div>
            <div><span>Cobertura</span><strong>{product.cover} dias</strong><small className={product.cover < 7 ? 'negative' : ''}>{product.cover < 7 ? 'Abaixo do ideal' : 'Faixa planejada'}</small></div>
            <div><span>Físico</span><strong>{product.physicalStock} un.</strong><small><ArrowUpRight size={13} /> inclui reservas</small></div>
          </div>
        </section>

        <section className="drawer-section forecast-box">
          <div className="section-title"><div><span>Próximos 7 dias</span><h3>Previsão de demanda</h3></div><strong>{product.forecast7} un.</strong></div>
          {product.forecast7 ? <><div className="forecast-range"><i style={{ left: '17%', right: '21%' }} /><b style={{ left: '54%' }} /><span>P10 · {Math.round(product.forecast7 * .83)}</span><span>P50 · {product.forecast7}</span><span>P90 · {Math.round(product.forecast7 * 1.21)}</span></div><p>Faixa demonstrativa; será substituída pelos quantis reais do pipeline de ML.</p></> : <p>Sem previsão persistida. O pipeline P10/P50/P90 ainda não está conectado.</p>}
        </section>

        <section className="drawer-section recommendation">
          <div className="recommendation-icon"><ShoppingCart size={19} /></div>
          <div><span>Recomendação de compra</span><h3>{product.recommendation || 'Nenhuma compra'} {product.recommendation ? 'unidades' : 'necessária'}</h3><p>{product.recommendation ? 'Comprar até 02 set. Quantidade ajustada ao múltiplo de caixa e ao estoque em trânsito.' : 'A posição atual cobre a demanda durante o prazo de entrega.'}</p></div>
        </section>

        <section className="drawer-section">
          <div className="section-title"><div><span>Lotes ativos</span><h3>Validade e prioridade FEFO</h3></div><button className="text-button">Ver todos <ChevronRight size={15} /></button></div>
          {productLots.map((lot, index) => <div className="lot-row" key={lot.id}>{index ? <CalendarClock size={17} /> : <PackageCheck size={17} />}<div><strong>{lot.batchNumber}</strong><span>{lot.sellableQuantity} unidades vendáveis</span></div><div><small>Vence em</small><b>{formatDate(lot.expiresAt)}</b></div></div>)}
          {!productLots.length && <div className="empty-state">Nenhum lote ativo para este produto.</div>}
        </section>
      </aside>
    </div>
  )
}
