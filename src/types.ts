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
  imageUrl?: string
}

export interface Alert {
  id: number
  level: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  time: string
  productId: string
}
