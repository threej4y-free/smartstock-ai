import { type FormEvent, useMemo, useState } from 'react'
import { ArrowDownUp, Check, Download, Filter, PackagePlus, Plus, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import type { Product, ProductCreateInput, Risk, SaleCreateInput, StockReceiptInput } from '../types'

interface ProductsPageProps {
  products: Product[]
  onProduct: (product: Product) => void
  onAddProduct: (input: ProductCreateInput) => Promise<void>
  onAddStock: (input: StockReceiptInput) => Promise<void>
  onSale: (input: SaleCreateInput) => Promise<void>
}

const emptyForm = {
  name: '', sku: '', category: '', cost: '', price: '', packSize: '1', minimumOrder: '0',
}

const emptyStockForm = {
  productId: '', quantity: '', batch: '', expiry: '', receivedAt: new Date().toISOString().slice(0, 10), supplier: '', invoice: '', unitCost: '',
}

const createEmptySaleForm = () => ({
  productId: '', quantity: '', reference: `VEN-${Date.now()}`, unitPrice: '', actor: 'Operação web',
})

export function ProductsPage({ products, onProduct, onAddProduct, onAddStock, onSale }: ProductsPageProps) {
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState<Risk | 'Todos'>('Todos')
  const [activeModal, setActiveModal] = useState<'product' | 'stock' | 'sale' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [stockForm, setStockForm] = useState(emptyStockForm)
  const [saleForm, setSaleForm] = useState(createEmptySaleForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const filtered = useMemo(() => products.filter(product => {
    const matchQuery = `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())
    return matchQuery && (risk === 'Todos' || product.risk === risk)
  }), [products, query, risk])
  const stockProductOptions = useMemo(() => products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 20), [products, productSearch])

  const updateField = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true); setFormError('')
    try {
      await onAddProduct({
        name: form.name,
        sku: form.sku.toUpperCase(),
        category: form.category,
        unitCost: Number(form.cost),
        listPrice: Number(form.price),
        packSize: Number(form.packSize || 1),
        minimumOrder: Number(form.minimumOrder || 0),
      })
      setForm(emptyForm)
      setActiveModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível cadastrar o produto.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStockField = (field: keyof typeof stockForm, value: string) => setStockForm(current => ({ ...current, [field]: value }))

  const handleStockSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stockForm.productId) return
    setSubmitting(true); setFormError('')
    try {
      await onAddStock({
        productId: stockForm.productId,
        batchNumber: stockForm.batch,
        quantity: Number(stockForm.quantity),
        receivedAt: stockForm.receivedAt,
        expiresAt: stockForm.expiry || null,
        supplierName: stockForm.supplier,
        invoiceNumber: stockForm.invoice || null,
        unitCost: Number(stockForm.unitCost),
        location: null,
        actor: 'Operação web',
      })
      setStockForm(emptyStockForm)
      setProductSearch('')
      setActiveModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível registrar o lote.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true); setFormError('')
    try {
      await onSale({
        productId: saleForm.productId,
        quantity: Number(saleForm.quantity),
        reference: saleForm.reference,
        unitPrice: saleForm.unitPrice === '' ? null : Number(saleForm.unitPrice),
        actor: saleForm.actor,
      })
      setSaleForm(createEmptySaleForm())
      setActiveModal(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível registrar a venda.')
    } finally {
      setSubmitting(false)
    }
  }

  const openModal = (modal: 'product' | 'stock' | 'sale') => {
    setFormError('')
    if (modal === 'sale') setSaleForm(createEmptySaleForm())
    setActiveModal(modal)
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
        <div className="page-actions"><button className="quiet-button"><Download size={16} /> Exportar</button><button className="secondary-button" onClick={() => openModal('sale')}><ShoppingCart size={16} /> Registrar venda</button><button className="secondary-button" onClick={() => openModal('product')}><Plus size={16} /> Cadastrar produto</button><button className="primary-button" onClick={() => openModal('stock')}><PackagePlus size={16} /> Adicionar estoque</button></div>
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
            <div className="stock-explanation"><PackagePlus size={20} /><div><strong>Catálogo e estoque são operações separadas</strong><p>Depois do cadastro, use “Adicionar estoque” para criar o primeiro lote rastreável.</p></div></div>
            <fieldset><legend>Identificação</legend><div className="form-grid">
              <label className="span-2"><span>Nome do produto</span><input required value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Ex.: Café Especial 500g" /></label>
              <label><span>SKU</span><input required value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="CAF-500-01" /></label>
              <label><span>Categoria</span><input required value={form.category} onChange={e => updateField('category', e.target.value)} placeholder="Mercearia" /></label>
            </div></fieldset>
            <fieldset><legend>Dados comerciais</legend><div className="form-grid four-columns">
              <label><span>Custo unitário</span><div className="money-input"><b>R$</b><input required min="0" step="0.01" type="number" value={form.cost} onChange={e => updateField('cost', e.target.value)} placeholder="0,00" /></div></label>
              <label><span>Preço de venda</span><div className="money-input"><b>R$</b><input required min="0" step="0.01" type="number" value={form.price} onChange={e => updateField('price', e.target.value)} placeholder="0,00" /></div></label>
              <label><span>Unidades por caixa</span><input min="1" type="number" value={form.packSize} onChange={e => updateField('packSize', e.target.value)} placeholder="12" /></label>
              <label><span>Pedido mínimo</span><input min="0" type="number" value={form.minimumOrder} onChange={e => updateField('minimumOrder', e.target.value)} placeholder="24" /></label>
            </div></fieldset>
            {formError && <p className="form-error">{formError}</p>}
            <footer className="modal-footer"><button type="button" className="secondary-button" onClick={() => setActiveModal(null)}>Cancelar</button><button disabled={submitting} type="submit" className="primary-button">{submitting ? 'Cadastrando…' : 'Cadastrar novo produto'}</button></footer>
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
              <label><span>Fornecedor</span><input required value={stockForm.supplier} onChange={e => updateStockField('supplier', e.target.value)} placeholder="Nome do fornecedor" /></label>
              <label><span>Nota fiscal</span><input value={stockForm.invoice} onChange={e => updateStockField('invoice', e.target.value)} placeholder="Ex.: NF-18452" /></label>
              <label><span>Custo unitário deste lote</span><div className="money-input"><b>R$</b><input required min="0" step="0.01" type="number" value={stockForm.unitCost} onChange={e => updateStockField('unitCost', e.target.value)} placeholder="0,00" /></div></label>
            </div></fieldset>
            {formError && <p className="form-error">{formError}</p>}
            <footer className="modal-footer"><button type="button" className="secondary-button" onClick={() => setActiveModal(null)}>Cancelar</button><button disabled={submitting} type="submit" className="primary-button"><PackagePlus size={16} /> {submitting ? 'Registrando…' : 'Confirmar entrada de estoque'}</button></footer>
          </form>
        </section>
      </div>}
      {activeModal === 'sale' && <div className="modal-layer">
        <button className="modal-backdrop" aria-label="Fechar formulário" onClick={() => setActiveModal(null)} />
        <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="sale-title">
          <header className="modal-header"><div><span>Saída de estoque por FEFO</span><h2 id="sale-title">Registrar venda</h2><p>O backend consumirá primeiro os lotes vendáveis com validade mais próxima.</p></div><button type="button" className="icon-button" onClick={() => setActiveModal(null)} aria-label="Fechar"><X size={19} /></button></header>
          <form onSubmit={handleSaleSubmit}>
            <div className="stock-explanation"><ShoppingCart size={20} /><div><strong>Alocação automática de lotes</strong><p>Lotes vencidos, bloqueados ou dentro da margem de segurança não serão utilizados.</p></div></div>
            <fieldset><legend>Venda</legend><div className="form-grid">
              <label className="span-2"><span>Produto</span><select required value={saleForm.productId} onChange={e => setSaleForm(current => ({ ...current, productId: e.target.value }))}><option value="">Selecione um produto</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {product.sku} · {product.stock} un.</option>)}</select></label>
              <label><span>Quantidade</span><input required min="1" type="number" value={saleForm.quantity} onChange={e => setSaleForm(current => ({ ...current, quantity: e.target.value }))} /></label>
              <label><span>Referência</span><input required value={saleForm.reference} onChange={e => setSaleForm(current => ({ ...current, reference: e.target.value }))} /></label>
              <label><span>Preço unitário opcional</span><div className="money-input"><b>R$</b><input min="0" step="0.01" type="number" value={saleForm.unitPrice} onChange={e => setSaleForm(current => ({ ...current, unitPrice: e.target.value }))} placeholder="Preço de tabela" /></div></label>
              <label><span>Responsável</span><input required value={saleForm.actor} onChange={e => setSaleForm(current => ({ ...current, actor: e.target.value }))} /></label>
            </div></fieldset>
            {formError && <p className="form-error">{formError}</p>}
            <footer className="modal-footer"><button type="button" className="secondary-button" onClick={() => setActiveModal(null)}>Cancelar</button><button disabled={submitting} type="submit" className="primary-button"><ShoppingCart size={16} /> {submitting ? 'Registrando…' : 'Confirmar venda'}</button></footer>
          </form>
        </section>
      </div>}
    </div>
  )
}
