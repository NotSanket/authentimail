import type { RiskStatus } from '../types/analysis'

export function formatVerdict(status: RiskStatus) {
  return status.replace('_', ' ').toUpperCase()
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}
