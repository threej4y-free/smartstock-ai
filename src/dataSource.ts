import { demoCatalog, demoLots, demoMovements } from './data'
import type {
  DataMode,
  InventoryLot,
  InventoryPolicy,
  LotStatus,
  Product,
  ProductCreateInput,
  Risk,
  SaleCreateInput,
  StockMovement,
  StockReceiptInput,
} from './types'

export interface InventorySnapshot {
  products: Product[]
  lots: InventoryLot[]
  movements: StockMovement[]
  policy: InventoryPolicy
}

export interface InventoryDataSource {
  mode: DataMode
  load: () => Promise<InventorySnapshot>
  createProduct: (input: ProductCreateInput) => Promise<void>
  receiveStock: (input: StockReceiptInput) => Promise<void>
  createSale: (input: SaleCreateInput) => Promise<void>
  updatePolicy: (expirationSafetyDays: number) => Promise<void>
}

interface ApiProduct {
  id: string
  sku: string
  name: string
  category: string
  unit_cost: string
  list_price: string
  pack_size: number
  minimum_order: number
  active: boolean
  available_stock: number
  reserved_stock: number
  physical_stock: number
  next_expiration: string | null
}

interface ApiLot {
  id: string
  product_id: string
  supplier_id: string
  batch_number: string
  invoice_number: string | null
  received_at: string
  expires_at: string | null
  unit_cost: string
  quantity_received: number
  quantity_available: number
  quantity_reserved: number
  sellable_quantity: number
  location: string | null
  blocked_at: string | null
  block_reason: string | null
  status: LotStatus
  days_to_expiry: number | null
}

interface ApiMovement {
  id: string
  product_id: string
  lot_id: string
  movement_type: StockMovement['movementType']
  quantity: number
  reason: string
  reference: string | null
  occurred_at: string
  actor: string
}

interface ApiPolicy {
  expiration_safety_days: number
  updated_at: string | null
}

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

function formatDate(value: string | null): string {
  if (!value) return 'Sem controle'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)).replace('.', '')
}

function productRisk(stock: number, lots: InventoryLot[]): Risk {
  if (stock <= 0) return 'Crítico'
  if (lots.some(lot => ['expires_in_7_days', 'expiration_safety_window'].includes(lot.status))) return 'Atenção'
  return 'Saudável'
}

function mapApiLot(lot: ApiLot): InventoryLot {
  return {
    id: lot.id,
    productId: lot.product_id,
    supplierId: lot.supplier_id,
    batchNumber: lot.batch_number,
    invoiceNumber: lot.invoice_number,
    receivedAt: lot.received_at,
    expiresAt: lot.expires_at,
    unitCost: Number(lot.unit_cost),
    quantityReceived: lot.quantity_received,
    quantityAvailable: lot.quantity_available,
    quantityReserved: lot.quantity_reserved,
    sellableQuantity: lot.sellable_quantity,
    location: lot.location,
    blockedAt: lot.blocked_at,
    blockReason: lot.block_reason,
    status: lot.status,
    daysToExpiry: lot.days_to_expiry,
  }
}

function mapApiProduct(product: ApiProduct, lots: InventoryLot[]): Product {
  const productLots = lots.filter(lot => lot.productId === product.id)
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    stock: product.available_stock,
    reservedStock: product.reserved_stock,
    physicalStock: product.physical_stock,
    sold7: 0,
    forecast7: 0,
    forecast28: 0,
    range: '—',
    cover: 0,
    recommendation: 0,
    expiry: formatDate(product.next_expiration),
    risk: productRisk(product.available_stock, productLots),
    cost: Number(product.unit_cost),
    price: Number(product.list_price),
    packSize: product.pack_size,
    minimumOrder: product.minimum_order,
    active: product.active,
  }
}

function mapApiMovement(movement: ApiMovement): StockMovement {
  return {
    id: movement.id,
    productId: movement.product_id,
    lotId: movement.lot_id,
    movementType: movement.movement_type,
    quantity: movement.quantity,
    reason: movement.reason,
    reference: movement.reference,
    occurredAt: movement.occurred_at,
    actor: movement.actor,
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string }; detail?: string | Array<{ msg?: string }> } | null
    const validationMessage = Array.isArray(payload?.detail) ? payload.detail[0]?.msg : payload?.detail
    throw new Error(payload?.error?.message || validationMessage || `API request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function createApiDataSource(): InventoryDataSource {
  return {
    mode: 'api',
    async load() {
      const [rawProducts, rawLots, rawMovements, rawPolicy] = await Promise.all([
        request<ApiProduct[]>('/products?limit=500'),
        request<ApiLot[]>('/inventory/lots?limit=500&include_empty=true'),
        request<ApiMovement[]>('/inventory/movements?limit=500'),
        request<ApiPolicy>('/inventory/policy'),
      ])
      const lots = rawLots.map(mapApiLot)
      return {
        products: rawProducts.map(product => mapApiProduct(product, lots)),
        lots,
        movements: rawMovements.map(mapApiMovement),
        policy: {
          expirationSafetyDays: rawPolicy.expiration_safety_days,
          updatedAt: rawPolicy.updated_at,
        },
      }
    },
    async createProduct(input) {
      await request('/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: input.sku,
          name: input.name,
          category: input.category,
          unit_cost: input.unitCost,
          list_price: input.listPrice,
          pack_size: input.packSize,
          minimum_order: input.minimumOrder,
          active: true,
        }),
      })
    },
    async receiveStock(input) {
      await request('/inventory/receipts', {
        method: 'POST',
        body: JSON.stringify({
          product_id: input.productId,
          batch_number: input.batchNumber,
          quantity: input.quantity,
          received_at: input.receivedAt,
          expires_at: input.expiresAt,
          supplier_name: input.supplierName,
          invoice_number: input.invoiceNumber,
          unit_cost: input.unitCost,
          location: input.location,
          actor: input.actor,
        }),
      })
    },
    async createSale(input) {
      await request('/sales', {
        method: 'POST',
        body: JSON.stringify({
          reference: input.reference,
          items: [{
            product_id: input.productId,
            quantity: input.quantity,
            unit_price: input.unitPrice,
          }],
          actor: input.actor,
        }),
      })
    },
    async updatePolicy(expirationSafetyDays) {
      await request('/inventory/policy', {
        method: 'PUT',
        body: JSON.stringify({ expiration_safety_days: expirationSafetyDays }),
      })
    },
  }
}

function daysBetween(dateValue: string): number {
  const today = new Date()
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const target = new Date(`${dateValue}T00:00:00Z`).getTime()
  return Math.floor((target - utcToday) / 86_400_000)
}

function normalizeDemoLot(lot: InventoryLot, safetyDays: number): InventoryLot {
  const daysToExpiry = lot.expiresAt ? daysBetween(lot.expiresAt) : null
  let status: LotStatus = 'healthy'
  if (lot.blockedAt) status = 'blocked'
  else if (daysToExpiry !== null && daysToExpiry < 0) status = 'expired'
  else if (daysToExpiry !== null && daysToExpiry < safetyDays) status = 'expiration_safety_window'
  else if (daysToExpiry !== null && daysToExpiry <= 7) status = 'expires_in_7_days'
  else if (daysToExpiry !== null && daysToExpiry <= 15) status = 'expires_in_15_days'
  const sellable = !['blocked', 'expired', 'expiration_safety_window'].includes(status)
  return { ...lot, status, daysToExpiry, sellableQuantity: sellable ? lot.quantityAvailable : 0 }
}

export function createDemoDataSource(): InventoryDataSource {
  let catalog = demoCatalog.map(item => ({ ...item }))
  let lots = demoLots.map(item => ({ ...item }))
  let movements = demoMovements.map(item => ({ ...item }))
  let policy: InventoryPolicy = { expirationSafetyDays: 2, updatedAt: null }

  const snapshot = (): InventorySnapshot => {
    const normalizedLots = lots.map(lot => normalizeDemoLot(lot, policy.expirationSafetyDays))
    const products = catalog.map(item => {
      const productLots = normalizedLots.filter(lot => lot.productId === item.id)
      const stock = productLots.reduce((sum, lot) => sum + lot.sellableQuantity, 0)
      const reservedStock = productLots.reduce((sum, lot) => sum + lot.quantityReserved, 0)
      const physicalStock = productLots.reduce((sum, lot) => sum + lot.quantityAvailable + lot.quantityReserved, 0)
      const expirations = productLots.filter(lot => lot.sellableQuantity > 0 && lot.expiresAt).map(lot => lot.expiresAt as string).sort()
      return {
        ...item,
        stock,
        reservedStock,
        physicalStock,
        expiry: formatDate(expirations[0] || null),
        risk: productRisk(stock, productLots),
      }
    })
    return {
      products,
      lots: normalizedLots,
      movements: [...movements].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      policy: { ...policy },
    }
  }

  return {
    mode: 'demo',
    async load() { return snapshot() },
    async createProduct(input) {
      catalog = [{
        id: `demo-${crypto.randomUUID()}`,
        name: input.name,
        sku: input.sku.toUpperCase(),
        category: input.category,
        sold7: 0,
        forecast7: 0,
        forecast28: 0,
        range: '—',
        cover: 0,
        recommendation: 0,
        risk: 'Crítico',
        cost: input.unitCost,
        price: input.listPrice,
        packSize: input.packSize,
        minimumOrder: input.minimumOrder,
        active: true,
      }, ...catalog]
    },
    async receiveStock(input) {
      const lotId = `demo-lot-${crypto.randomUUID()}`
      lots = [{
        id: lotId,
        productId: input.productId,
        supplierId: `demo-supplier-${input.supplierName.toLowerCase().replaceAll(' ', '-')}`,
        batchNumber: input.batchNumber,
        invoiceNumber: input.invoiceNumber,
        receivedAt: input.receivedAt,
        expiresAt: input.expiresAt,
        unitCost: input.unitCost,
        quantityReceived: input.quantity,
        quantityAvailable: input.quantity,
        quantityReserved: 0,
        sellableQuantity: input.quantity,
        location: input.location,
        blockedAt: null,
        blockReason: null,
        status: 'healthy',
        daysToExpiry: null,
      }, ...lots]
      movements = [{
        id: `demo-movement-${crypto.randomUUID()}`,
        productId: input.productId,
        lotId,
        movementType: 'receipt',
        quantity: input.quantity,
        reason: 'Stock receipt',
        reference: input.invoiceNumber,
        occurredAt: new Date().toISOString(),
        actor: input.actor,
      }, ...movements]
    },
    async createSale(input) {
      const eligible = lots
        .map((lot, index) => ({ lot: normalizeDemoLot(lot, policy.expirationSafetyDays), index }))
        .filter(item => item.lot.productId === input.productId && item.lot.sellableQuantity > 0)
        .sort((a, b) => (a.lot.expiresAt || '9999').localeCompare(b.lot.expiresAt || '9999'))
      const available = eligible.reduce((sum, item) => sum + item.lot.quantityAvailable, 0)
      if (available < input.quantity) throw new Error(`Estoque vendável insuficiente: solicitado ${input.quantity}, disponível ${available}`)
      let remaining = input.quantity
      for (const { lot, index } of eligible) {
        const quantity = Math.min(lot.quantityAvailable, remaining)
        if (!quantity) continue
        lots[index] = { ...lots[index], quantityAvailable: lots[index].quantityAvailable - quantity }
        movements = [{
          id: `demo-movement-${crypto.randomUUID()}`,
          productId: input.productId,
          lotId: lot.id,
          movementType: 'sale',
          quantity: -quantity,
          reason: 'FEFO sale',
          reference: input.reference,
          occurredAt: new Date().toISOString(),
          actor: input.actor,
        }, ...movements]
        remaining -= quantity
        if (!remaining) break
      }
    },
    async updatePolicy(expirationSafetyDays) {
      policy = { expirationSafetyDays, updatedAt: new Date().toISOString() }
    },
  }
}

export async function connectDataSource(): Promise<{
  source: InventoryDataSource
  snapshot: InventorySnapshot
  fallbackMessage: string | null
}> {
  const configured = (import.meta.env.VITE_DATA_MODE || 'auto').toLowerCase()
  if (configured === 'demo') {
    const source = createDemoDataSource()
    return { source, snapshot: await source.load(), fallbackMessage: null }
  }
  const apiSource = createApiDataSource()
  try {
    return { source: apiSource, snapshot: await apiSource.load(), fallbackMessage: null }
  } catch (error) {
    if (configured === 'api') throw error
    const source = createDemoDataSource()
    return {
      source,
      snapshot: await source.load(),
      fallbackMessage: 'API indisponível; o modo demonstrativo foi ativado automaticamente.',
    }
  }
}
