import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Risk } from '../types'

export function RiskBadge({ risk }: { risk: Risk }) {
  const Icon = risk === 'Saudável' ? CheckCircle2 : AlertCircle
  return <span className={`risk-badge risk-${risk.toLowerCase().replace('í', 'i').replace('ç', 'c')}`}><Icon size={13} />{risk}</span>
}
