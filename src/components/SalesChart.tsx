import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { salesData } from '../data'

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  const visible = payload.filter((item) => ['actual', 'forecast'].includes(item.dataKey))
  return (
    <div className="chart-tooltip"><strong>{label}</strong>{visible.map((item) => <span key={item.dataKey}><i style={{ background: item.color }} />{item.dataKey === 'actual' ? 'Realizado' : 'Previsão'} <b>{item.value} un.</b></span>)}</div>
  )
}

export function SalesChart() {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={salesData} margin={{ top: 12, right: 8, bottom: 2, left: -22 }}>
          <defs><linearGradient id="rangeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c7d77" stopOpacity={0.18} /><stop offset="100%" stopColor="#6c7d77" stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid stroke="#e7e6e0" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7a7d77', fontSize: 11 }} dy={9} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#90928d', fontSize: 11 }} domain={[60, 200]} ticks={[80, 120, 160, 200]} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#b9bbb5', strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey="high" stroke="none" fill="url(#rangeFill)" animationDuration={600} />
          <Area type="monotone" dataKey="low" stroke="none" fill="#fbfaf7" animationDuration={600} />
          <Line type="monotone" dataKey="forecast" stroke="#9a744b" strokeWidth={1.8} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, fill: '#9a744b', strokeWidth: 0 }} animationDuration={700} />
          <Line type="monotone" dataKey="actual" stroke="#263c36" strokeWidth={2.2} dot={{ r: 2.5, fill: '#263c36', strokeWidth: 0 }} activeDot={{ r: 4, fill: '#263c36', strokeWidth: 0 }} connectNulls={false} animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
