import { ArrowRight, CircleDollarSign, Clock3, Package, ShoppingBag, TrendingUp, TriangleAlert } from 'lucide-react'
import { alerts, categoryData, products } from '../data'
import { SalesChart } from '../components/SalesChart'
import { RiskBadge } from '../components/RiskBadge'
import type { Product } from '../types'
import type { Page } from '../components/Sidebar'

interface DashboardProps {
  onNavigate: (page: Page) => void
  onProduct: (product: Product) => void
}

export function Dashboard({ onNavigate, onProduct }: DashboardProps) {
  const criticalProducts = products.filter((product) => product.risk === 'Crítico')
  return (
    <div className="page-content dashboard-page">
      <div className="intro-row">
        <div><p>Acompanhe estoque, demanda e decisões de compra em um só lugar.</p></div>
        <button className="primary-button" onClick={() => onNavigate('purchases')}>Revisar compras <ArrowRight size={16} /></button>
      </div>

      <section className="kpi-grid" aria-label="Indicadores principais">
        <article className="kpi-card">
          <div className="kpi-label"><ShoppingBag size={17} /><span>Vendas hoje</span></div>
          <strong>R$ 12.480</strong>
          <p><span className="trend-positive"><TrendingUp size={13} /> 8,2%</span> vs. quinta passada</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-label"><Package size={17} /><span>Valor em estoque</span></div>
          <strong>R$ 286.340</strong>
          <p>4.286 unidades disponíveis</p>
        </article>
        <article className="kpi-card critical-accent">
          <div className="kpi-label"><TriangleAlert size={17} /><span>Risco de ruptura</span></div>
          <strong>7 <small>produtos</small></strong>
          <p>3 exigem ação hoje</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-label"><CircleDollarSign size={17} /><span>Valor sob risco</span></div>
          <strong>R$ 3.840</strong>
          <p>12 lotes próximos do vencimento</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div><span>Demanda consolidada</span><h2>Vendas reais e previsão</h2></div>
            <div className="legend"><span><i className="legend-actual" /> Realizado</span><span><i className="legend-forecast" /> Previsão P50</span><span><i className="legend-range" /> P10–P90</span></div>
          </div>
          <SalesChart />
          <div className="chart-note"><span>28 dias observados</span><i /><span>Próximos 10 dias</span></div>
        </article>

        <article className="panel alerts-panel">
          <div className="panel-header"><div><span>Prioridades</span><h2>Alertas recentes</h2></div><button className="text-button" onClick={() => onNavigate('alerts')}>Ver todos <ArrowRight size={15} /></button></div>
          <div className="alert-list">
            {alerts.slice(0, 3).map((alert) => {
              const product = products.find((item) => item.id === alert.productId)
              return <button className="alert-row" key={alert.id} onClick={() => product && onProduct(product)}><span className={`alert-indicator ${alert.level}`} /><span className="alert-copy"><strong>{alert.title}</strong><small>{alert.detail}</small></span><time><Clock3 size={12} />{alert.time}</time></button>
            })}
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel attention-panel">
          <div className="panel-header"><div><span>Ação recomendada</span><h2>Produtos que exigem atenção</h2></div><button className="text-button" onClick={() => onNavigate('products')}>Lista completa <ArrowRight size={15} /></button></div>
          <div className="attention-table">
            <div className="attention-head"><span>Produto</span><span>Estoque</span><span>Cobertura</span><span>Recomendação</span><span>Risco</span></div>
            {criticalProducts.concat(products.filter(p => p.risk === 'Atenção')).slice(0, 4).map((product) => (
              <button className="attention-row" key={product.id} onClick={() => onProduct(product)}>
                <span className="product-cell"><i>{product.name.slice(0, 1)}</i><span><strong>{product.name}</strong><small>{product.sku}</small></span></span>
                <span>{product.stock} un.</span><span>{product.cover} dias</span><span>{product.recommendation ? `${product.recommendation} un.` : '—'}</span><RiskBadge risk={product.risk} />
              </button>
            ))}
          </div>
        </article>

        <article className="panel category-panel">
          <div className="panel-header"><div><span>Distribuição</span><h2>Estoque por categoria</h2></div></div>
          <div className="category-visual">
            <div className="donut" style={{ background: `conic-gradient(${categoryData.map((item, index) => `${item.color} ${categoryData.slice(0, index).reduce((sum, current) => sum + current.value, 0)}% ${categoryData.slice(0, index + 1).reduce((sum, current) => sum + current.value, 0)}%`).join(', ')})` }}><span><b>R$ 286k</b><small>total</small></span></div>
            <div className="category-legend">{categoryData.map(item => <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><b>{item.value}%</b></div>)}</div>
          </div>
        </article>
      </section>
      <p className="confidence-note">As previsões são estimativas estatísticas e incluem incerteza. Decisões de compra devem considerar condições operacionais e comerciais.</p>
    </div>
  )
}
