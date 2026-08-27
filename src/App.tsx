import { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { ProductDrawer } from './components/ProductDrawer'
import { Sidebar, type Page } from './components/Sidebar'
import { connectDataSource, type InventoryDataSource, type InventorySnapshot } from './dataSource'
import { AlertsPage } from './pages/AlertsPage'
import { Dashboard } from './pages/Dashboard'
import { ForecastsPage } from './pages/ForecastsPage'
import { LotsPage } from './pages/LotsPage'
import { MovementsPage } from './pages/MovementsPage'
import { ProductsPage } from './pages/ProductsPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { SettingsPage } from './pages/SettingsPage'
import { buildOperationalAlerts } from './selectors'
import type { DataMode, Product, ProductCreateInput, SaleCreateInput, StockReceiptInput } from './types'

const titles: Record<Page, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Visão geral', eyebrow: 'Operação de estoque' },
  products: { title: 'Produtos', eyebrow: 'Catálogo e posição de estoque' },
  alerts: { title: 'Central de alertas', eyebrow: 'Riscos e oportunidades' },
  purchases: { title: 'Compras', eyebrow: 'Pedidos e recomendações' },
  forecasts: { title: 'Previsões', eyebrow: 'Demanda e nível de confiança' },
  movements: { title: 'Movimentações', eyebrow: 'Histórico operacional de estoque' },
  lots: { title: 'Lotes', eyebrow: 'Validade e prioridade FEFO' },
  settings: { title: 'Configurações', eyebrow: 'Preferências da operação' },
}

const emptySnapshot: InventorySnapshot = {
  products: [], lots: [], movements: [], policy: { expirationSafetyDays: 2, updatedAt: null },
}

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [snapshot, setSnapshot] = useState<InventorySnapshot>(emptySnapshot)
  const [dataMode, setDataMode] = useState<DataMode>(import.meta.env.VITE_DATA_MODE === 'demo' ? 'demo' : 'api')
  const [loading, setLoading] = useState(true)
  const [dataMessage, setDataMessage] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const sourceRef = useRef<InventoryDataSource | null>(null)
  const alerts = useMemo(() => buildOperationalAlerts(snapshot.products, snapshot.lots), [snapshot.lots, snapshot.products])

  const applySnapshot = (next: InventorySnapshot) => {
    setSnapshot(next)
    setSelectedProduct(current => current ? next.products.find(product => product.id === current.id) || null : null)
  }

  useEffect(() => {
    let active = true
    connectDataSource()
      .then(({ source, snapshot: initial, fallbackMessage }) => {
        if (!active) return
        sourceRef.current = source
        setDataMode(source.mode)
        applySnapshot(initial)
        setDataMessage(fallbackMessage || '')
      })
      .catch(error => active && setDataMessage(error instanceof Error ? error.message : 'Não foi possível carregar os dados.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const mutate = async (action: (source: InventoryDataSource) => Promise<void>) => {
    const source = sourceRef.current
    if (!source) throw new Error('A fonte de dados ainda não está pronta.')
    setDataMessage('')
    await action(source)
    applySnapshot(await source.load())
  }

  const navigate = (nextPage: Page) => { setPage(nextPage); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const addProduct = (input: ProductCreateInput) => mutate(source => source.createProduct(input))
  const addStock = (input: StockReceiptInput) => mutate(source => source.receiveStock(input))
  const createSale = (input: SaleCreateInput) => mutate(source => source.createSale(input))
  const updatePolicy = (days: number) => mutate(source => source.updatePolicy(days))

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} open={mobileMenu} onClose={() => setMobileMenu(false)} />
      <main className="main-area">
        <Header {...titles[page]} dataMode={dataMode} onMenu={() => setMobileMenu(true)} />
        {dataMessage && <div className={`data-banner ${dataMode}`}>{dataMessage}</div>}
        {loading ? <div className="page-loading">Carregando fonte de dados…</div> : <>
          {page === 'dashboard' && <Dashboard products={snapshot.products} lots={snapshot.lots} movements={snapshot.movements} alerts={alerts} dataMode={dataMode} onNavigate={navigate} onProduct={setSelectedProduct} />}
          {page === 'products' && <ProductsPage products={snapshot.products} onProduct={setSelectedProduct} onAddProduct={addProduct} onAddStock={addStock} onSale={createSale} />}
          {page === 'alerts' && <AlertsPage alerts={alerts} products={snapshot.products} onProduct={setSelectedProduct} />}
          {page === 'purchases' && <PurchasesPage />}
          {page === 'forecasts' && <ForecastsPage products={snapshot.products} onProduct={setSelectedProduct} />}
          {page === 'movements' && <MovementsPage products={snapshot.products} lots={snapshot.lots} movements={snapshot.movements} />}
          {page === 'lots' && <LotsPage products={snapshot.products} lots={snapshot.lots} onProduct={setSelectedProduct} />}
          {page === 'settings' && <SettingsPage expirationSafetyDays={snapshot.policy.expirationSafetyDays} dataMode={dataMode} onUpdateExpirationSafety={updatePolicy} />}
        </>}
      </main>
      <ProductDrawer product={selectedProduct} lots={snapshot.lots} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}

export default App
