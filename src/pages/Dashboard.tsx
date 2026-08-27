import { ArrowRight, CircleDollarSign, Clock3, Package, ShoppingBag, TriangleAlert } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import { SalesChart } from '../components/SalesChart'
import type { Page } from '../components/Sidebar'
import type { Alert, DataMode, InventoryLot, Product, StockMovement } from '../types'

interface DashboardProps {
  products: Product[]
  lots: InventoryLot[]
  movements: StockMovement[]
  alerts: Alert[]
  dataMode: DataMode
  onNavigate: (page: Page) => void
  onProduct: (product: Product) => void
}

const colors = ['#263c36', '#65746f', '#9a744b', '#c8c6bd', '#8f9b96', '#b4a58f']
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function Dashboard({ products, lots, movements, alerts, dataMode, onNavigate, onProduct }: DashboardProps) {
  const criticalProducts = products.filter(product => product.risk === 'Crítico')
  const inventoryUnits = products.reduce((sum, product) => sum + product.stock, 0)
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.cost, 0)
  const today = new Date().toISOString().slice(0, 10)
  const salesToday = Math.abs(movements.filter(item => item.movementType === 'sale' && item.occurredAt.slice(0, 10) === today).reduce((sum, item) => sum + item.quantity, 0))
  const riskLots = lots.filter(lot => lot.quantityAvailable > 0 && ['expires_in_7_days', 'expiration_safety_window', 'expired', 'blocked'].includes(lot.status))
  const riskValue = riskLots.reduce((sum, lot) => sum + lot.quantityAvailable * lot.unitCost, 0)
  const categoryTotals = products.reduce<Record<string, number>>((totals, product) => {
    totals[product.category] = (totals[product.category] || 0) + product.stock * product.cost
    return totals
  }, {})
  const categoryData = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([name, value], index) => ({ name, value: inventoryValue ? value / inventoryValue * 100 : 0, color: colors[index % colors.length] }))
  const donut = categoryData.length ? `conic-gradient(${categoryData.map((item, index) => `${item.color} ${categoryData.slice(0, index).reduce((sum, current) => sum + current.value, 0)}% ${categoryData.slice(0, index + 1).reduce((sum, current) => sum + current.value, 0)}%`).join(', ')})` : '#e4e5df'
  return (
    <div className="page-content dashboard-page">
      <div className="intro-row">
        <div><p>Acompanhe estoque, lotes e movimentações vindos da fonte operacional ativa.</p></div>
        <button className="primary-button" onClick={() => onNavigate('products')}>Operar estoque <ArrowRight size={16} /></button>
      </div>

      <section className="kpi-grid" aria-label="Indicadores principais">
        <article className="kpi-card"><div className="kpi-label"><ShoppingBag size={17} /><span>Unidades vendidas hoje</span></div><strong>{salesToday}</strong><p>movimentos de venda registrados</p></article>
        <article className="kpi-card"><div className="kpi-label"><Package size={17} /><span>Valor em estoque</span></div><strong>{currency.format(inventoryValue)}</strong><p>{inventoryUnits} unidades vendáveis</p></article>
        <article className="kpi-card critical-accent"><div className="kpi-label"><TriangleAlert size={17} /><span>Produtos sem estoque</span></div><strong>{criticalProducts.length} <small>produtos</small></strong><p>{alerts.filter(alert => alert.level === 'critical').length} alertas críticos</p></article>
        <article className="kpi-card"><div className="kpi-label"><CircleDollarSign size={17} /><span>Valor sob risco</span></div><strong>{currency.format(riskValue)}</strong><p>{riskLots.length} lotes críticos</p></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-header"><div><span>Série demonstrativa</span><h2>Vendas e previsão ainda não conectadas ao ML</h2></div><div className="legend"><span><i className="legend-actual" /> Realizado</span><span><i className="legend-forecast" /> Previsão P50</span><span><i className="legend-range" /> P10–P90</span></div></div>
          <SalesChart />
          <div className="chart-note"><span>Visual de demonstração</span><i /><span>Modo de dados: {dataMode === 'api' ? 'API' : 'demo'}</span></div>
        </article>

        <article className="panel alerts-panel">
          <div className="panel-header"><div><span>Prioridades calculadas</span><h2>Alertas operacionais</h2></div><button className="text-button" onClick={() => onNavigate('alerts')}>Ver todos <ArrowRight size={15} /></button></div>
          <div className="alert-list">
            {alerts.slice(0, 3).map(alert => { const product = products.find(item => item.id === alert.productId); return <button className="alert-row" key={alert.id} onClick={() => product && onProduct(product)}><span className={`alert-indicator ${alert.level}`} /><span className="alert-copy"><strong>{alert.title}</strong><small>{alert.detail}</small></span><time><Clock3 size={12} />{alert.time}</time></button> })}
            {!alerts.length && <div className="empty-state">Nenhum alerta ativo.</div>}
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel attention-panel">
          <div className="panel-header"><div><span>Ação recomendada</span><h2>Produtos que exigem atenção</h2></div><button className="text-button" onClick={() => onNavigate('products')}>Lista completa <ArrowRight size={15} /></button></div>
          <div className="attention-table">
            <div className="attention-head"><span>Produto</span><span>Estoque</span><span>Reservado</span><span>Próx. validade</span><span>Risco</span></div>
            {products.filter(product => product.risk !== 'Saudável').slice(0, 4).map(product => <button className="attention-row" key={product.id} onClick={() => onProduct(product)}><span className="product-cell"><i>{product.name.slice(0, 1)}</i><span><strong>{product.name}</strong><small>{product.sku}</small></span></span><span>{product.stock} un.</span><span>{product.reservedStock} un.</span><span>{product.expiry}</span><RiskBadge risk={product.risk} /></button>)}
            {!products.some(product => product.risk !== 'Saudável') && <div className="empty-state">Nenhum produto exige atenção.</div>}
          </div>
        </article>

        <article className="panel category-panel">
          <div className="panel-header"><div><span>Distribuição calculada</span><h2>Estoque por categoria</h2></div></div>
          <div className="category-visual"><div className="donut" style={{ background: donut }}><span><b>{currency.format(inventoryValue)}</b><small>total</small></span></div><div className="category-legend">{categoryData.map(item => <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><b>{Math.round(item.value)}%</b></div>)}</div></div>
        </article>
      </section>
      <p className="confidence-note">Indicadores de estoque são derivados de lotes. A série de previsão permanece demonstrativa até a conexão do pipeline de Machine Learning.</p>
    </div>
  )
}
