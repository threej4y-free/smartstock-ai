import { useMemo, useState } from 'react'
import { Activity, AlertCircle, ArrowRight, BarChart3, CalendarRange, CheckCircle2, Database, GitCompareArrows, Layers3, RefreshCw, Search, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Product } from '../types'

const forecastSeries = [
  { day: '28 ago', p10: 102, p50: 126, p90: 151 }, { day: '29 ago', p10: 107, p50: 132, p90: 159 },
  { day: '30 ago', p10: 112, p50: 139, p90: 168 }, { day: '31 ago', p10: 105, p50: 131, p90: 158 },
  { day: '01 set', p10: 118, p50: 146, p90: 176 }, { day: '02 set', p10: 123, p50: 152, p90: 184 },
  { day: '03 set', p10: 116, p50: 143, p90: 173 }, { day: '04 set', p10: 128, p50: 157, p90: 189 },
  { day: '05 set', p10: 133, p50: 163, p90: 196 }, { day: '06 set', p10: 121, p50: 149, p90: 181 },
  { day: '07 set', p10: 126, p50: 155, p90: 188 }, { day: '08 set', p10: 135, p50: 166, p90: 201 },
  { day: '09 set', p10: 139, p50: 171, p90: 207 }, { day: '10 set', p10: 132, p50: 162, p90: 197 },
]

interface ForecastsPageProps { products: Product[]; onProduct: (product: Product) => void }

export function ForecastsPage({ products, onProduct }: ForecastsPageProps) {
  const [horizon, setHorizon] = useState<7 | 28>(28)
  const [query, setQuery] = useState('')
  const visibleProducts = useMemo(() => products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  return <div className="page-content forecasts-page">
    <div className="intro-row"><div><p>Compare cenários de demanda e entenda a incerteza antes de decidir uma compra.</p></div><button className="primary-button"><RefreshCw size={15} /> Gerar novas previsões</button></div>
    <section className="forecast-summary">
      <div><BarChart3 size={18} /><span>Demanda prevista · 7 dias<strong>397 un.</strong><small>cenário mais provável · P50</small></span></div>
      <div><TrendingUp size={18} /><span>Variação esperada<strong>+8,4%</strong><small>comparado aos últimos 7 dias</small></span></div>
      <div><CheckCircle2 size={18} /><span>Cobertura P10–P90<strong>82%</strong><small>meta de cobertura: 80%</small></span></div>
      <div><AlertCircle size={18} /><span>Baixa confiança<strong>4 produtos</strong><small>histórico curto ou instável</small></span></div>
    </section>
    <section className="panel forecast-main-panel">
      <div className="panel-header"><div><span>Demanda consolidada</span><h2>Previsão probabilística</h2></div><div className="period-switch"><button className={horizon === 7 ? 'active' : ''} onClick={() => setHorizon(7)}>7 dias</button><button className={horizon === 28 ? 'active' : ''} onClick={() => setHorizon(28)}>28 dias</button></div></div>
      <div className="forecast-chart-body">
        <div className="forecast-chart">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={horizon === 7 ? forecastSeries.slice(0, 7) : forecastSeries} margin={{ top: 14, right: 14, left: -20, bottom: 2 }}>
            <CartesianGrid stroke="#e7e6e0" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#858983', fontSize: 9 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#92958f', fontSize: 9 }} domain={[60, 220]} />
            <Tooltip contentStyle={{ border: '1px solid #d9dad4', borderRadius: 0, fontSize: 10 }} /><Area type="monotone" dataKey="p90" stroke="none" fill="#dce3df" /><Area type="monotone" dataKey="p10" stroke="none" fill="#fbfaf7" /><Line type="monotone" dataKey="p50" name="P50" stroke="#263c36" strokeWidth={2} dot={false} />
          </AreaChart></ResponsiveContainer>
        </div>
        <aside className="forecast-meaning"><span>Como interpretar</span><div><i className="p10-dot" /><p><strong>P10 · Demanda baixa</strong>Usado para avaliar excesso e validade.</p></div><div><i className="p50-dot" /><p><strong>P50 · Mais provável</strong>Referência central de planejamento.</p></div><div><i className="p90-dot" /><p><strong>P90 · Demanda alta</strong>Usado para avaliar risco de ruptura.</p></div><small>Previsões são estimativas, não garantias. A faixa aumenta conforme cresce a incerteza.</small></aside>
      </div>
    </section>
    <section className="panel forecast-product-panel">
      <div className="table-toolbar"><label className="table-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produto ou SKU" /></label><div className="model-stamp"><CalendarRange size={14} /><span>Modelo v1.4 · gerado hoje às 06:00</span></div></div>
      <div className="forecast-table-head"><span>Produto</span><span>Vendas 7d</span><span>P10</span><span>P50</span><span>P90</span><span>28 dias</span><span>Confiança</span><span /></div>
      {visibleProducts.map(product => {
        const p10 = Math.round(product.forecast7 * .83); const p90 = Math.round(product.forecast7 * 1.21); const confidence = product.forecast7 ? (product.risk === 'Saudável' ? 'Alta' : product.risk === 'Atenção' ? 'Média' : 'Baixa') : 'Sem dados'
        return <button className="forecast-table-row" key={product.id} onClick={() => onProduct(product)}><span className="product-cell">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <i>{product.name.slice(0, 1)}</i>}<span><strong>{product.name}</strong><small>{product.sku}</small></span></span><span>{product.sold7} un.</span><span>{p10 || '—'}</span><strong>{product.forecast7 || '—'} {product.forecast7 ? 'un.' : ''}</strong><span>{p90 || '—'}</span><span>{product.forecast28 || '—'} {product.forecast28 ? 'un.' : ''}</span><span className={`confidence-badge ${confidence.toLowerCase().replace('é', 'e')}`}>{confidence}</span><ArrowRight size={14} /></button>
      })}
    </section>
    <section className="panel model-explanation">
      <div className="model-explanation-head"><div><span>Metodologia</span><h2>Como funciona o modelo preditivo</h2><p>A previsão combina o histórico de vendas com sinais que ajudam a explicar as mudanças na demanda.</p></div><span className="demo-model-badge">Modelo demonstrativo</span></div>
      <div className="model-steps">
        <article><span className="model-step-number">01</span><Database size={18} /><h3>Dados históricos</h3><p>O modelo recebe vendas diárias, preços, eventos, feriados, categoria, loja e produto.</p></article>
        <article><span className="model-step-number">02</span><Activity size={18} /><h3>Padrões de demanda</h3><p>São calculados atrasos de 1, 7, 14 e 28 dias, médias móveis, tendência e sazonalidade.</p></article>
        <article><span className="model-step-number">03</span><GitCompareArrows size={18} /><h3>Validação temporal</h3><p>O treinamento usa somente informações disponíveis antes da previsão, evitando vazamento de dados futuros.</p></article>
        <article><span className="model-step-number">04</span><Layers3 size={18} /><h3>Cenários de previsão</h3><p>O resultado apresenta P10 para demanda baixa, P50 como cenário central e P90 para demanda alta.</p></article>
      </div>
      <div className="model-limitations"><AlertCircle size={16} /><p><strong>Importante:</strong> previsões não são garantias. Promoções inesperadas, falta de produto, mudanças de preço e eventos não cadastrados podem aumentar o erro. Os números exibidos nesta interface são demonstrativos; previsões reais exigem o pipeline de treinamento e a API conectados.</p></div>
    </section>
  </div>
}
