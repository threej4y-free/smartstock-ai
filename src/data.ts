import type { Alert, Product } from './types'

export const products: Product[] = [
  { id: 'prod-001', name: 'Café Especial 500g', sku: 'CAF-500-01', category: 'Mercearia', stock: 18, sold7: 31, forecast7: 42, forecast28: 168, range: '35–51', cover: 3, recommendation: 72, expiry: '18 set 2026', risk: 'Crítico', cost: 24.9 },
  { id: 'prod-002', name: 'Leite Integral 1L', sku: 'LEI-INT-01', category: 'Laticínios', stock: 42, sold7: 84, forecast7: 91, forecast28: 348, range: '76–108', cover: 4, recommendation: 120, expiry: '02 set 2026', risk: 'Crítico', cost: 4.39 },
  { id: 'prod-003', name: 'Granola Tradicional 300g', sku: 'GRA-300-02', category: 'Matinais', stock: 96, sold7: 22, forecast7: 25, forecast28: 102, range: '19–32', cover: 27, recommendation: 0, expiry: '12 nov 2026', risk: 'Saudável', cost: 11.8 },
  { id: 'prod-004', name: 'Iogurte Natural 170g', sku: 'IOG-NAT-03', category: 'Laticínios', stock: 64, sold7: 47, forecast7: 53, forecast28: 205, range: '43–64', cover: 8, recommendation: 48, expiry: '31 ago 2026', risk: 'Atenção', cost: 3.2 },
  { id: 'prod-005', name: 'Azeite Extra Virgem 500ml', sku: 'AZE-EV-04', category: 'Mercearia', stock: 121, sold7: 12, forecast7: 14, forecast28: 58, range: '9–19', cover: 61, recommendation: 0, expiry: '22 mar 2027', risk: 'Atenção', cost: 32.5 },
  { id: 'prod-006', name: 'Pão de Forma Integral', sku: 'PAO-INT-06', category: 'Padaria', stock: 35, sold7: 51, forecast7: 48, forecast28: 194, range: '40–57', cover: 5, recommendation: 60, expiry: '05 set 2026', risk: 'Atenção', cost: 7.15 },
  { id: 'prod-007', name: 'Água Mineral 500ml', sku: 'AGU-500-08', category: 'Bebidas', stock: 284, sold7: 103, forecast7: 110, forecast28: 443, range: '94–128', cover: 18, recommendation: 96, expiry: '18 jun 2027', risk: 'Saudável', cost: 1.4 },
  { id: 'prod-008', name: 'Chocolate 70% Cacau 80g', sku: 'CHO-70-12', category: 'Confeitaria', stock: 73, sold7: 19, forecast7: 24, forecast28: 89, range: '17–31', cover: 21, recommendation: 24, expiry: '16 jan 2027', risk: 'Saudável', cost: 8.9 },
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

export const alerts: Alert[] = [
  { id: 1, level: 'critical', title: 'Ruptura provável em 3 dias', detail: 'Café Especial 500g · estoque abaixo do ponto de reposição', time: 'Há 12 min', productId: 'prod-001' },
  { id: 2, level: 'warning', title: 'Lote próximo do vencimento', detail: 'Iogurte Natural 170g · 26 unidades vencem em 4 dias', time: 'Há 28 min', productId: 'prod-004' },
  { id: 3, level: 'critical', title: 'Demanda acima do previsto', detail: 'Leite Integral 1L · desvio de +18% nos últimos 3 dias', time: 'Há 1 h', productId: 'prod-002' },
  { id: 4, level: 'info', title: 'Compra recomendada revisada', detail: 'Pão de Forma Integral · sugestão ajustada para 60 unidades', time: 'Há 2 h', productId: 'prod-006' },
]

export const categoryData = [
  { name: 'Mercearia', value: 38, color: '#263c36' },
  { name: 'Laticínios', value: 27, color: '#65746f' },
  { name: 'Bebidas', value: 18, color: '#9a744b' },
  { name: 'Outros', value: 17, color: '#c8c6bd' },
]
