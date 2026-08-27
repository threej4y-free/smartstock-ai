import { CheckCircle2, Clock3, PackageCheck, Plus, Truck } from 'lucide-react'

const orders = [
  { id: 'PC-2026-0184', supplier: 'Distribuidora Aurora', status: 'Em trânsito', expected: '02 set 2026', value: 'R$ 8.420,00', items: 8 },
  { id: 'PC-2026-0183', supplier: 'Alimentos Serra Sul', status: 'Aguardando', expected: '04 set 2026', value: 'R$ 5.186,40', items: 5 },
  { id: 'PC-2026-0182', supplier: 'Casa do Grão', status: 'Recebido', expected: '26 ago 2026', value: 'R$ 3.912,00', items: 4 },
]

export function PurchasesPage() {
  return <div className="page-content purchases-page">
    <div className="intro-row"><div><p>Planeje reposições e acompanhe pedidos já enviados aos fornecedores.</p></div><button className="primary-button"><Plus size={16} /> Novo pedido</button></div>
    <section className="purchase-stats"><div><Truck /><span>Em trânsito<strong>3 pedidos</strong></span><b>R$ 18.240</b></div><div><Clock3 /><span>Aguardando envio<strong>2 pedidos</strong></span><b>R$ 7.890</b></div><div><CheckCircle2 /><span>Recebido no mês<strong>14 pedidos</strong></span><b>R$ 64.310</b></div></section>
    <section className="panel orders-panel"><div className="panel-header"><div><span>Agosto de 2026</span><h2>Pedidos de compra</h2></div></div>
      <div className="order-head"><span>Pedido</span><span>Fornecedor</span><span>Itens</span><span>Previsão</span><span>Valor</span><span>Status</span></div>
      {orders.map(order => <div className="order-row" key={order.id}><span><PackageCheck size={17} />{order.id}</span><strong>{order.supplier}</strong><span>{order.items} itens</span><span>{order.expected}</span><strong>{order.value}</strong><span className={`order-status ${order.status.toLowerCase().replace(' ', '-')}`}>{order.status}</span></div>)}
    </section>
  </div>
}
