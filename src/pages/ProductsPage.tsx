import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import { ArrowDownUp, Check, Download, Filter, ImagePlus, PackagePlus, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import type { Product, Risk } from '../types'

interface ProductsPageProps {
  products: Product[]
  onProduct: (product: Product) => void
  onAddProduct: (product: Product) => void
  onAddStock: (productId: string, quantity: number, expiry: string) => void
}

const emptyForm = {
  name: '', sku: '', category: '', cost: '', price: '', stock: '', expiry: '', packSize: '', minimumOrder: '', imageUrl: '',
}

const emptyStockForm = {
  productId: '', quantity: '', batch: '', expiry: '', receivedAt: new Date().toISOString().slice(0, 10), supplier: '', invoice: '', unitCost: '',
}

export function ProductsPage({ products, onProduct, onAddProduct, onAddStock }: ProductsPageProps) {
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState<Risk | 'Todos'>('Todos')
  const [activeModal, setActiveModal] = useState<'product' | 'stock' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [stockForm, setStockForm] = useState(emptyStockForm)
  const [productSearch, setProductSearch] = useState('')
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const filtered = useMemo(() => products.filter(product => {
    const matchQuery = `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())
    return matchQuery && (risk === 'Todos' || product.risk === risk)
  }), [products, query, risk])
  const stockProductOptions = useMemo(() => products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 20), [products, productSearch])

  const updateField = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }))

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateField('imageUrl', String(reader.result))
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const stock = Number(form.stock)
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: form.name,
      sku: form.sku.toUpperCase(),
      category: form.category,
      stock,
      sold7: 0,
      forecast7: 0,
      forecast28: 0,
      range: '—',
      cover: stock > 0 ? 30 : 0,
      recommendation: 0,
      expiry: form.expiry ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${form.expiry}T00:00:00Z`)).replace('.', '') : 'Sem controle',
      risk: stock > 0 ? 'Saudável' : 'Atenção',
      cost: Number(form.cost),
      imageUrl: form.imageUrl || undefined,
    }
    onAddProduct(newProduct)
    setForm(emptyForm)
    setActiveModal(null)
  }

  const updateStockField = (field: keyof typeof stockForm, value: string) => setStockForm(current => ({ ...current, [field]: value }))

  const handleStockSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stockForm.productId) return
    const formattedExpiry = stockForm.expiry
      ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${stockForm.expiry}T00:00:00Z`)).replace('.', '')
      : ''
    onAddStock(stockForm.productId, Number(stockForm.quantity), formattedExpiry)
    setStockForm(emptyStockForm)
    setProductSearch('')
    setActiveModal(null)
  }

  const selectStockProduct = (product: Product) => {
    updateStockField('productId', product.id)
    setProductSearch(`${product.name} — ${product.sku}`)
    setProductPickerOpen(false)
  }

  return (
    <div className="page-content products-page">
      <div className="intro-row">
        <div><p>Cadastre produtos novos ou registre a entrada de mais unidades no estoque.</p></div>
        <div className="page-actions"><button className="quiet-button"><Download size={16} /> Exportar</button><button className="secondary-button" onClick={() => setActiveModal('product')}><Plus size={16} /> Cadastrar novo produto</button><button className="primary-button" onClick={() => setActiveModal('stock')}><PackagePlus size={16} /> Adicionar estoque</button></div>
      </div>
      <section className="product-summary">
        <div><span>Produtos ativos</span><strong>{products.length}</strong></div><div><span>Estoque saudável</span><strong>{products.filter(item => item.risk === 'Saudável').length}</strong></div><div><span>Requer atenção</span><strong>{products.filter(item => item.risk === 'Atenção').length}</strong></div><div><span>Risco crítico</span><strong>{products.filter(item => item.risk === 'Crítico').length}</strong></div>
      </section>
      <section className="panel product-table-panel">
        <div className="table-toolbar">
          <label className="table-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por produto ou SKU" /></label>
          <div className="filter-group"><Filter size={15} /><span>Risco</span>{(['Todos', 'Crítico', 'Atenção', 'Saudável'] as const).map(option => <button key={option} className={risk === option ? 'selected' : ''} onClick={() => setRisk(option)}>{option}</button>)}</div>
          <button className="filter-button"><SlidersHorizontal size={16} /> Mais filtros</button>
        </div>
        <div className="products-table-scroll">
          <table className="products-table">
            <thead><tr><th>Produto</th><th>Estoque</th><th>Vendas 7d</th><th>Previsão 7d</th><th>Previsão 28d</th><th><span>Intervalo <small>P10–P90</small></span></th><th>Cobertura</th><th>Comprar</th><th>Próx. validade</th><th><span>Risco <ArrowDownUp size={12} /></span></th></tr></thead>
            <tbody>{filtered.map(product => <tr key={product.id} onClick={() => onProduct(product)}>
              <td><span className="product-cell">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <i>{product.name.slice(0, 1)}</i>}<span><strong>{product.name}</strong><small>{product.sku} · {product.category}</small></span></span></td>
              <td><b>{product.stock}</b> un.</td><td>{product.sold7} un.</td><td><b>{product.forecast7}</b> un.</td><td>{product.forecast28} un.</td><td>{product.range}</td><td><span className={`cover-value ${product.cover < 7 ? 'low' : product.cover > 45 ? 'high' : ''}`}>{product.cover} dias</span></td><td><b>{product.recommendation || '—'}</b>{product.recommendation ? ' un.' : ''}</td><td>{product.expiry}</td><td><RiskBadge risk={product.risk} /></td>
            </tr>)}</tbody>
          </table>
          {!filtered.length && <div className="empty-state">Nenhum produto encontrado com estes filtros.</div>}
        </div>
        <footer className="table-footer"><span>Exibindo {filtered.length} de {products.length} produtos</span><div><button disabled>Anterior</button><button className="current">1</button><button>2</button><button>3</button><button>Próxima</button></div></footer>
      </section>
      {activeModal === 'product' && <div className="modal-layer">
        <button className="modal-backdrop" aria-label="Fechar formulário" onClick={() => setActiveModal(null)} />
        <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="new-product-title">
          <header className="modal-header"><div><span>Produto que ainda não existe no sistema</span><h2 id="new-product-title">Cadastrar novo produto</h2><p>Crie um novo item no catálogo com seus dados comerciais.</p></div><button type="button" className="icon-button" onClick={() => setActiveModal(null)} aria-label="Fechar"><X size={19} /></button></header>
          <form onSubmit={handleSubmit}>
            <div className="image-field">
              <label className={form.imageUrl ? 'has-image' : ''}>
                {form.imageUrl ? <img src={form.imageUrl} alt="Prévia do produto" /> : <><ImagePlus size={21} /><strong>Foto do produto</strong><span>PNG ou JPG, até 5 MB</span></>}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} />
              </label>
              <div><strong>Imagem opcional</strong><p>Use uma foto quadrada e com fundo neutro para manter o catálogo organizado.</p></div>
            </div>
            <fieldset><legend>Identificação</legend><div className="form-grid">
              <label className="span-2"><span>Nome do produto</span><input required value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Ex.: Café Especial 500g" /></label>
              <label><span>SKU</span><input required value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="CAF-500-01" /></label>
              <label><span>Categoria</span><input required value={form.category} onChange={e => updateField('category', e.target.value)} placeholder="Mercearia" /></label>
            </div></fieldset>
            <fieldset><legend>Comercial e estoque</legend><div className="form-grid four-columns">
              <label><span>Custo unitário</span><div className="money-input"><b>R$</b><input required min="0" step="0.01" type="number" value={form.cost} onChange={e => updateField('cost', e.target.value)} placeholder="0,00" /></div></label>
              <label><span>Preço de venda</span><div className="money-input"><b>R$</b><input required min="0" step="0.01" type="number" value={form.price} onChange={e => updateField('price', e.target.value)} placeholder="0,00" /></div></label>
              <label><span>Estoque inicial</span><input required min="0" type="number" value={form.stock} onChange={e => updateField('stock', e.target.value)} placeholder="0" /></label>
              <label><span>Validade do lote</span><input type="date" value={form.expiry} onChange={e => updateField('expiry', e.target.value)} /></label>
              <label><span>Unidades por caixa</span><input min="1" type="number" value={form.packSize} onChange={e => updateField('packSize', e.target.value)} placeholder="12" /></label>
              <label><span>Pedido mínimo</span><input min="0" type="number" value={form.minimumOrder} onChange={e => updateField('minimumOrder', e.target.value)} placeholder="24" /></label>
            </div></fieldset>
            <footer className="modal-footer"><button type="button" className="secondary-button" onClick={() => setActiveModal(null)}>Cancelar</button><button type="submit" className="primary-button">Cadastrar novo produto</button></footer>
          </form>
        </section>
      </div>}
      {activeModal === 'stock' && <div className="modal-layer">
        <button className="modal-backdrop" aria-label="Fechar formulário" onClick={() => setActiveModal(null)} />
        <section className="product-modal stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-entry-title">
          <header className="modal-header"><div><span>Produto já cadastrado</span><h2 id="stock-entry-title">Adicionar unidades ao estoque</h2><p>Registre o recebimento de um novo lote de um produto existente.</p></div><button type="button" className="icon-button" onClick={() => setActiveModal(null)} aria-label="Fechar"><X size={19} /></button></header>
          <form onSubmit={handleStockSubmit}>
            <div className="stock-explanation"><PackagePlus size={20} /><div><strong>Esta operação aumenta o estoque</strong><p>Para criar um item diferente, feche esta janela e use “Cadastrar novo produto”.</p></div></div>
            <fieldset><legend>Produto e quantidade recebida</legend><div className="form-grid">
              <label className="span-2 searchable-product-field"><span>Produto existente</span><div className={`product-combobox ${productPickerOpen ? 'open' : ''}`}>
                <Search size={15} />
                <input required autoComplete="off" value={productSearch} onFocus={() => setProductPickerOpen(true)} onChange={e => { setProductSearch(e.target.value); updateStockField('productId', ''); setProductPickerOpen(true) }} placeholder="Digite o nome ou SKU do produto" />
                {productSearch && <button type="button" className="clear-product-search" aria-label="Limpar busca" onClick={() => { setProductSearch(''); updateStockField('productId', ''); setProductPickerOpen(true) }}><X size={14} /></button>}
                {productPickerOpen && <div className="product-options">
                  <div className="product-options-caption">{stockProductOptions.length} {stockProductOptions.length === 1 ? 'produto encontrado' : 'produtos encontrados'}{products.length > 20 && !productSearch ? ' · digite para refinar' : ''}</div>
                  {stockProductOptions.map(product => <button type="button" key={product.id} onClick={() => selectStockProduct(product)}>
                    {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <i>{product.name.slice(0, 1)}</i>}
                    <span><strong>{product.name}</strong><small>{product.sku} · {product.category}</small></span>
                    <em>{product.stock} un.</em>
                    {stockForm.productId === product.id && <Check size={14} />}
                  </button>)}
                  {!stockProductOptions.length && <div className="no-product-options"><strong>Nenhum produto encontrado</strong><span>Confira o nome ou o SKU pesquisado.</span></div>}
                </div>}
              </div>{productSearch && !stockForm.productId && <small className="field-hint error">Selecione um produto nos resultados da busca.</small>}</label>
              <label><span>Quantidade recebida</span><input required min="1" type="number" value={stockForm.quantity} onChange={e => updateStockField('quantity', e.target.value)} placeholder="Ex.: 48" /></label>
              <label><span>Data de recebimento</span><input required type="date" value={stockForm.receivedAt} onChange={e => updateStockField('receivedAt', e.target.value)} /></label>
            </div></fieldset>
            <fieldset><legend>Identificação do lote</legend><div className="form-grid">
              <label><span>Número do lote</span><input required value={stockForm.batch} onChange={e => updateStockField('batch', e.target.value)} placeholder="Ex.: LT-2608-030" /></label>
              <label><span>Validade do lote</span><input type="date" value={stockForm.expiry} onChange={e => updateStockField('expiry', e.target.value)} /></label>
              <label><span>Fornecedor</span><input value={stockForm.supplier} onChange={e => updateStockField('supplier', e.target.value)} placeholder="Nome do fornecedor" /></label>
              <label><span>Nota fiscal</span><input value={stockForm.invoice} onChange={e => updateStockField('invoice', e.target.value)} placeholder="Ex.: NF-18452" /></label>
              <label><span>Custo unitário deste lote</span><div className="money-input"><b>R$</b><input min="0" step="0.01" type="number" value={stockForm.unitCost} onChange={e => updateStockField('unitCost', e.target.value)} placeholder="0,00" /></div></label>
            </div></fieldset>
            <footer className="modal-footer"><button type="button" className="secondary-button" onClick={() => setActiveModal(null)}>Cancelar</button><button type="submit" className="primary-button"><PackagePlus size={16} /> Confirmar entrada de estoque</button></footer>
          </form>
        </section>
      </div>}
    </div>
  )
}
