import { useState } from 'react'
import { Header } from './components/Header'
import { ProductDrawer } from './components/ProductDrawer'
import { Sidebar, type Page } from './components/Sidebar'
import { AlertsPage } from './pages/AlertsPage'
import { Dashboard } from './pages/Dashboard'
import { ProductsPage } from './pages/ProductsPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { ForecastsPage } from './pages/ForecastsPage'
import { MovementsPage } from './pages/MovementsPage'
import { LotsPage } from './pages/LotsPage'
import { SettingsPage } from './pages/SettingsPage'
import type { Product } from './types'
import { products as initialProducts } from './data'

const titles: Record<Page, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Visão geral', eyebrow: 'Quinta-feira, 27 de agosto' },
  products: { title: 'Produtos', eyebrow: 'Catálogo e posição de estoque' },
  alerts: { title: 'Central de alertas', eyebrow: 'Riscos e oportunidades' },
  purchases: { title: 'Compras', eyebrow: 'Pedidos e recomendações' },
  forecasts: { title: 'Previsões', eyebrow: 'Demanda e nível de confiança' },
  movements: { title: 'Movimentações', eyebrow: 'Histórico operacional de estoque' },
  lots: { title: 'Lotes', eyebrow: 'Validade e prioridade FEFO' },
  settings: { title: 'Configurações', eyebrow: 'Preferências da operação' },
}

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(initialProducts)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const navigate = (nextPage: Page) => { setPage(nextPage); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} open={mobileMenu} onClose={() => setMobileMenu(false)} />
      <main className="main-area">
        <Header {...titles[page]} onMenu={() => setMobileMenu(true)} />
        {page === 'dashboard' && <Dashboard onNavigate={navigate} onProduct={setSelectedProduct} />}
        {page === 'products' && <ProductsPage
          products={catalogProducts}
          onProduct={setSelectedProduct}
          onAddProduct={(product) => setCatalogProducts((current) => [product, ...current])}
          onAddStock={(productId, quantity, expiry) => setCatalogProducts((current) => current.map((product) => product.id === productId ? {
            ...product,
            stock: product.stock + quantity,
            expiry: expiry || product.expiry,
            risk: product.stock + quantity > 0 && product.risk === 'Crítico' ? 'Atenção' : product.risk,
          } : product))}
        />}
        {page === 'alerts' && <AlertsPage onProduct={setSelectedProduct} />}
        {page === 'purchases' && <PurchasesPage />}
        {page === 'forecasts' && <ForecastsPage products={catalogProducts} onProduct={setSelectedProduct} />}
        {page === 'movements' && <MovementsPage products={catalogProducts} />}
        {page === 'lots' && <LotsPage products={catalogProducts} onProduct={setSelectedProduct} />}
        {page === 'settings' && <SettingsPage />}
      </main>
      <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}

export default App
