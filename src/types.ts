export type Risk = 'Crítico' | 'Atenção' | 'Saudável'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  sold7: number
  forecast7: number
  forecast28: number
  range: string
  cover: number
  recommendation: number
  expiry: string
  risk: Risk
  cost: number
  price: number
  packSize: number
  minimumOrder: number
  reservedStock: number
  physicalStock: number
  active: boolean
  imageUrl?: string
}

export type LotStatus = 'healthy' | 'expires_in_15_days' | 'expires_in_7_days' | 'expiration_safety_window' | 'expired' | 'blocked'

export interface InventoryLot {
  id: string
  productId: string
  supplierId: string
  batchNumber: string
  invoiceNumber: string | null
  receivedAt: string
  expiresAt: string | null
  unitCost: number
  quantityReceived: number
  quantityAvailable: number
  quantityReserved: number
  sellableQuantity: number
  location: string | null
  blockedAt: string | null
  blockReason: string | null
  status: LotStatus
  daysToExpiry: number | null
}

export type StockMovementType = 'receipt' | 'sale' | 'reservation' | 'release' | 'adjustment' | 'loss'

export interface StockMovement {
  id: string
  productId: string
  lotId: string
  movementType: StockMovementType
  quantity: number
  reason: string
  reference: string | null
  occurredAt: string
  actor: string
}

export interface InventoryPolicy {
  expirationSafetyDays: number
  updatedAt: string | null
}

export interface ProductCreateInput {
  sku: string
  name: string
  category: string
  unitCost: number
  listPrice: number
  packSize: number
  minimumOrder: number
}

export interface StockReceiptInput {
  productId: string
  batchNumber: string
  quantity: number
  receivedAt: string
  expiresAt: string | null
  supplierName: string
  invoiceNumber: string | null
  unitCost: number
  location: string | null
  actor: string
}

export interface SaleCreateInput {
  reference: string
  productId: string
  quantity: number
  unitPrice: number | null
  actor: string
}

export type DataMode = 'api' | 'demo'

export interface Alert {
  id: string
  level: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  time: string
  productId: string
}
