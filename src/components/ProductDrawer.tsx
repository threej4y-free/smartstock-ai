import { ArrowDownRight, ArrowUpRight, CalendarClock, ChevronRight, PackageCheck, ShoppingCart, X } from 'lucide-react'
import type { Product } from '../types'
import { RiskBadge } from './RiskBadge'

interface ProductDrawerProps { product: Product | null; onClose: () => void }

export function ProductDrawer({ product, onClose }: ProductDrawerProps) {
  if (!product) return null
  return (
    <div className="drawer-layer">
      <button className="drawer-backdrop" onClick={onClose} aria-label="Fechar detalhe" />
      <aside className="product-drawer" aria-label={`Detalhes de ${product.name}`}>
        <div className="drawer-head">
          <div><span className="eyebrow">{product.category} · {product.sku}</span><h2>{product.name}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
        </div>
        <div className="drawer-status"><RiskBadge risk={product.risk} /><span>Atualizado há 8 minutos</span></div>

        <section className="drawer-section">
          <div className="section-title"><div><span>Posição atual</span><h3>Estoque e cobertura</h3></div></div>
          <div className="mini-metrics">
            <div><span>Disponível</span><strong>{product.stock} un.</strong><small><ArrowDownRight size={13} /> 8 reservadas</small></div>
            <div><span>Cobertura</span><strong>{product.cover} dias</strong><small className={product.cover < 7 ? 'negative' : ''}>{product.cover < 7 ? 'Abaixo do ideal' : 'Faixa planejada'}</small></div>
            <div><span>Em trânsito</span><strong>20 un.</strong><small><ArrowUpRight size={13} /> chega em 5 dias</small></div>
          </div>
        </section>

        <section className="drawer-section forecast-box">
          <div className="section-title"><div><span>Próximos 7 dias</span><h3>Previsão de demanda</h3></div><strong>{product.forecast7} un.</strong></div>
          <div className="forecast-range"><i style={{ left: '17%', right: '21%' }} /><b style={{ left: '54%' }} /><span>P10 · {Math.round(product.forecast7 * .83)}</span><span>P50 · {product.forecast7}</span><span>P90 · {Math.round(product.forecast7 * 1.21)}</span></div>
          <p>Intervalo de confiança baseado no histórico recente, sazonalidade e variação de preço. A incerteza aumenta para horizontes maiores.</p>
        </section>

        <section className="drawer-section recommendation">
          <div className="recommendation-icon"><ShoppingCart size={19} /></div>
          <div><span>Recomendação de compra</span><h3>{product.recommendation || 'Nenhuma compra'} {product.recommendation ? 'unidades' : 'necessária'}</h3><p>{product.recommendation ? 'Comprar até 02 set. Quantidade ajustada ao múltiplo de caixa e ao estoque em trânsito.' : 'A posição atual cobre a demanda durante o prazo de entrega.'}</p></div>
        </section>

        <section className="drawer-section">
          <div className="section-title"><div><span>Lotes ativos</span><h3>Validade e prioridade FEFO</h3></div><button className="text-button">Ver todos <ChevronRight size={15} /></button></div>
          <div className="lot-row"><PackageCheck size={17} /><div><strong>LT-2608-014</strong><span>26 unidades disponíveis</span></div><div><small>Vence em</small><b>{product.expiry}</b></div></div>
          <div className="lot-row"><CalendarClock size={17} /><div><strong>LT-2608-029</strong><span>38 unidades disponíveis</span></div><div><small>Vence em</small><b>14 out 2026</b></div></div>
        </section>
      </aside>
    </div>
  )
}
