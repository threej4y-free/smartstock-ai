import type { InventoryLot, Product, StockMovement } from './types'

type DemoCatalogProduct = Omit<Product, 'stock' | 'reservedStock' | 'physicalStock' | 'expiry'>

export const demoCatalog: DemoCatalogProduct[] = [
  { id: 'prod-001', name: 'Café Especial 500g', sku: 'CAF-500-01', category: 'Mercearia', sold7: 31, forecast7: 42, forecast28: 168, range: '35–51', cover: 3, recommendation: 72, risk: 'Crítico', cost: 24.9, price: 39.9, packSize: 12, minimumOrder: 24, active: true },
  { id: 'prod-002', name: 'Leite Integral 1L', sku: 'LEI-INT-01', category: 'Laticínios', sold7: 84, forecast7: 91, forecast28: 348, range: '76–108', cover: 4, recommendation: 120, risk: 'Crítico', cost: 4.39, price: 6.9, packSize: 12, minimumOrder: 24, active: true },
  { id: 'prod-003', name: 'Granola Tradicional 300g', sku: 'GRA-300-02', category: 'Matinais', sold7: 22, forecast7: 25, forecast28: 102, range: '19–32', cover: 27, recommendation: 0, risk: 'Saudável', cost: 11.8, price: 18.9, packSize: 6, minimumOrder: 12, active: true },
  { id: 'prod-004', name: 'Iogurte Natural 170g', sku: 'IOG-NAT-03', category: 'Laticínios', sold7: 47, forecast7: 53, forecast28: 205, range: '43–64', cover: 8, recommendation: 48, risk: 'Atenção', cost: 3.2, price: 5.5, packSize: 12, minimumOrder: 24, active: true },
  { id: 'prod-005', name: 'Azeite Extra Virgem 500ml', sku: 'AZE-EV-04', category: 'Mercearia', sold7: 12, forecast7: 14, forecast28: 58, range: '9–19', cover: 61, recommendation: 0, risk: 'Atenção', cost: 32.5, price: 49.9, packSize: 6, minimumOrder: 12, active: true },
  { id: 'prod-006', name: 'Pão de Forma Integral', sku: 'PAO-INT-06', category: 'Padaria', sold7: 51, forecast7: 48, forecast28: 194, range: '40–57', cover: 5, recommendation: 60, risk: 'Atenção', cost: 7.15, price: 11.9, packSize: 12, minimumOrder: 24, active: true },
  { id: 'prod-007', name: 'Água Mineral 500ml', sku: 'AGU-500-08', category: 'Bebidas', sold7: 103, forecast7: 110, forecast28: 443, range: '94–128', cover: 18, recommendation: 96, risk: 'Saudável', cost: 1.4, price: 2.9, packSize: 24, minimumOrder: 48, active: true },
  { id: 'prod-008', name: 'Chocolate 70% Cacau 80g', sku: 'CHO-70-12', category: 'Confeitaria', sold7: 19, forecast7: 24, forecast28: 89, range: '17–31', cover: 21, recommendation: 24, risk: 'Saudável', cost: 8.9, price: 14.9, packSize: 12, minimumOrder: 12, active: true },
]

export const demoLots: InventoryLot[] = [
  { id: 'lot-001', productId: 'prod-004', supplierId: 'sup-001', batchNumber: 'LT-2607-088', invoiceNumber: 'NF-18001', receivedAt: '2026-07-15', expiresAt: '2026-08-31', unitCost: 3.2, quantityReceived: 40, quantityAvailable: 26, quantityReserved: 4, sellableQuantity: 26, location: 'A-02-03', blockedAt: null, blockReason: null, status: 'expires_in_7_days', daysToExpiry: 4 },
  { id: 'lot-002', productId: 'prod-001', supplierId: 'sup-002', batchNumber: 'LT-2608-014', invoiceNumber: 'NF-18014', receivedAt: '2026-08-08', expiresAt: '2026-09-18', unitCost: 24.9, quantityReceived: 48, quantityAvailable: 18, quantityReserved: 8, sellableQuantity: 18, location: 'B-01-02', blockedAt: null, blockReason: null, status: 'healthy', daysToExpiry: 22 },
  { id: 'lot-003', productId: 'prod-002', supplierId: 'sup-003', batchNumber: 'LT-2608-022', invoiceNumber: 'NF-18022', receivedAt: '2026-08-15', expiresAt: '2026-09-02', unitCost: 4.39, quantityReceived: 96, quantityAvailable: 42, quantityReserved: 8, sellableQuantity: 42, location: 'R-01-04', blockedAt: null, blockReason: null, status: 'expires_in_7_days', daysToExpiry: 6 },
  { id: 'lot-004', productId: 'prod-006', supplierId: 'sup-004', batchNumber: 'LT-2608-016', invoiceNumber: 'NF-18016', receivedAt: '2026-08-10', expiresAt: '2026-09-05', unitCost: 7.15, quantityReceived: 60, quantityAvailable: 35, quantityReserved: 0, sellableQuantity: 35, location: 'A-01-08', blockedAt: null, blockReason: null, status: 'expires_in_15_days', daysToExpiry: 9 },
  { id: 'lot-005', productId: 'prod-003', supplierId: 'sup-005', batchNumber: 'LT-2607-071', invoiceNumber: 'NF-17071', receivedAt: '2026-07-08', expiresAt: '2026-11-12', unitCost: 11.8, quantityReceived: 120, quantityAvailable: 54, quantityReserved: 0, sellableQuantity: 54, location: 'C-03-01', blockedAt: null, blockReason: null, status: 'healthy', daysToExpiry: 77 },
  { id: 'lot-006', productId: 'prod-003', supplierId: 'sup-005', batchNumber: 'LT-2608-029', invoiceNumber: 'NF-18029', receivedAt: '2026-08-20', expiresAt: '2026-12-18', unitCost: 11.8, quantityReceived: 48, quantityAvailable: 42, quantityReserved: 0, sellableQuantity: 42, location: 'C-03-02', blockedAt: null, blockReason: null, status: 'healthy', daysToExpiry: 113 },
  { id: 'lot-007', productId: 'prod-005', supplierId: 'sup-006', batchNumber: 'LT-2608-028', invoiceNumber: 'NF-18028', receivedAt: '2026-08-20', expiresAt: '2027-03-22', unitCost: 32.5, quantityReceived: 144, quantityAvailable: 121, quantityReserved: 0, sellableQuantity: 121, location: 'D-02-01', blockedAt: null, blockReason: null, status: 'healthy', daysToExpiry: 207 },
  { id: 'lot-008', productId: 'prod-007', supplierId: 'sup-007', batchNumber: 'LT-2608-031', invoiceNumber: 'NF-18031', receivedAt: '2026-08-25', expiresAt: '2027-06-18', unitCost: 1.4, quantityReceived: 300, quantityAvailable: 284, quantityReserved: 0, sellableQuantity: 284, location: 'E-01-01', blockedAt: null, blockReason: null, status: 'healthy', daysToExpiry: 295 },
  { id: 'lot-009', productId: 'prod-008', supplierId: 'sup-008', batchNumber: 'LT-2607-095', invoiceNumber: 'NF-17095', receivedAt: '2026-07-20', expiresAt: '2027-01-16', unitCost: 8.9, quantityReceived: 84, quantityAvailable: 73, quantityReserved: 0, sellableQuantity: 73, location: 'F-01-02', blockedAt: null, blockReason: null, status: 'healthy', daysToExpiry: 142 },
  { id: 'lot-010', productId: 'prod-008', supplierId: 'sup-008', batchNumber: 'LT-2606-042', invoiceNumber: 'NF-16042', receivedAt: '2026-06-10', expiresAt: '2026-08-25', unitCost: 8.7, quantityReceived: 36, quantityAvailable: 0, quantityReserved: 0, sellableQuantity: 0, location: 'BL-01', blockedAt: '2026-08-26T00:00:00Z', blockReason: 'expired', status: 'blocked', daysToExpiry: -2 },
]

export const demoMovements: StockMovement[] = [
  { id: 'MOV-8421', occurredAt: '2026-08-27T14:32:00Z', productId: 'prod-001', movementType: 'sale', quantity: -3, lotId: 'lot-002', reason: 'Venda PDV', reference: 'VEN-98421', actor: 'Sistema' },
  { id: 'MOV-8420', occurredAt: '2026-08-27T13:18:00Z', productId: 'prod-007', movementType: 'receipt', quantity: 96, lotId: 'lot-008', reason: 'Recebimento de compra', reference: 'PC-2026-0182', actor: 'Marina Costa' },
  { id: 'MOV-8419', occurredAt: '2026-08-27T11:47:00Z', productId: 'prod-004', movementType: 'loss', quantity: -4, lotId: 'lot-001', reason: 'Avaria na embalagem', reference: 'AJ-1840', actor: 'Rafael Lima' },
  { id: 'MOV-8418', occurredAt: '2026-08-27T10:22:00Z', productId: 'prod-002', movementType: 'reservation', quantity: -8, lotId: 'lot-003', reason: 'Separação de pedido', reference: 'PED-3018', actor: 'Sistema' },
  { id: 'MOV-8417', occurredAt: '2026-08-27T09:06:00Z', productId: 'prod-006', movementType: 'sale', quantity: -5, lotId: 'lot-004', reason: 'Venda e-commerce', reference: 'VEN-98413', actor: 'Sistema' },
  { id: 'MOV-8416', occurredAt: '2026-08-26T17:54:00Z', productId: 'prod-003', movementType: 'adjustment', quantity: 2, lotId: 'lot-005', reason: 'Correção de inventário', reference: 'INV-0826', actor: 'Marina Costa' },
]

export const salesData = [
  { day: '01 ago', actual: 116, forecast: 110, low: 94, high: 128 },
  { day: '05 ago', actual: 122, forecast: 119, low: 100, high: 138 },
  { day: '09 ago', actual: 108, forecast: 121, low: 102, high: 141 },
  { day: '13 ago', actual: 134, forecast: 126, low: 108, high: 145 },
  { day: '17 ago', actual: 128, forecast: 132, low: 112, high: 153 },
  { day: '21 ago', actual: 149, forecast: 139, low: 119, high: 161 },
  { day: '25 ago', actual: 143, forecast: 146, low: 124, high: 169 },
  { day: '29 ago', actual: null, forecast: 152, low: 128, high: 178 },
  { day: '02 set', actual: null, forecast: 148, low: 123, high: 175 },
  { day: '06 set', actual: null, forecast: 157, low: 130, high: 187 },
]
