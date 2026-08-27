import type { Alert, InventoryLot, Product } from './types'

export function buildOperationalAlerts(products: Product[], lots: InventoryLot[]): Alert[] {
  const stockAlerts: Alert[] = products
    .filter(product => product.stock <= 0)
    .map(product => ({
      id: `stockout-${product.id}`,
      level: 'critical',
      title: 'Produto sem estoque vendável',
      detail: `${product.name} · nenhum lote disponível para venda`,
      time: 'Agora',
      productId: product.id,
    }))

  const expirationAlerts: Alert[] = lots
    .filter(lot => lot.quantityAvailable > 0 && ['expires_in_7_days', 'expiration_safety_window', 'expired', 'blocked'].includes(lot.status))
    .map(lot => {
      const product = products.find(item => item.id === lot.productId)
      const unavailable = ['expiration_safety_window', 'expired', 'blocked'].includes(lot.status)
      return {
        id: `lot-${lot.id}`,
        level: unavailable ? 'critical' : 'warning',
        title: unavailable ? 'Lote fora do estoque vendável' : 'Lote próximo do vencimento',
        detail: `${product?.name || 'Produto removido'} · ${lot.batchNumber} · ${lot.quantityAvailable} unidades`,
        time: lot.daysToExpiry === null ? 'Sem validade' : lot.daysToExpiry < 0 ? `Vencido há ${Math.abs(lot.daysToExpiry)} dias` : `Faltam ${lot.daysToExpiry} dias`,
        productId: lot.productId,
      } satisfies Alert
    })

  return [...stockAlerts, ...expirationAlerts]
}
