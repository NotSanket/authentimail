import type { RiskStatus, Severity } from '../../types/analysis'
import { formatVerdict } from '../../utils/format'

export function StatusPill({ status }: { status: RiskStatus | Severity }) {
  const label = status.includes('_') ? formatVerdict(status as RiskStatus) : status.toUpperCase()
  return <span className={`status-pill status-${status}`}>{label}</span>
}
