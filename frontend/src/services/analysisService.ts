import type { AnalysisInput, AnalysisResponse, AnalysisService, RiskStatus, Severity, ThreatIndicator } from '../types/analysis'

export type AnalysisErrorCode = 'configuration' | 'validation' | 'timeout' | 'network' | 'invalid_response' | 'server'

export class AnalysisServiceError extends Error {
  readonly code: AnalysisErrorCode

  constructor(code: AnalysisErrorCode, message: string) {
    super(message)
    this.name = 'AnalysisServiceError'
    this.code = code
  }
}

const storageKey = 'authentimail:reports'
const minimumScanDurationMs = 3300
const requestTimeoutMs = 20000

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRiskStatus(value: unknown): value is RiskStatus {
  return value === 'safe' || value === 'low_risk' || value === 'suspicious' || value === 'high_risk'
}

function isSeverity(value: unknown): value is Severity {
  return value === 'critical' || value === 'high' || value === 'medium' || value === 'low' || value === 'safe'
}

function isIndicator(value: unknown): value is ThreatIndicator {
  if (!isRecord(value)) return false
  return typeof value.type === 'string'
    && isSeverity(value.severity)
    && typeof value.message === 'string'
    && ['email', 'url', 'authentication', 'system'].includes(String(value.source))
}

function isDetector(value: unknown) {
  return isRecord(value)
    && typeof value.score === 'number'
    && value.score >= 0
    && value.score <= 100
    && isRiskStatus(value.status)
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (!isRecord(value) || !isRecord(value.detectors) || !isRecord(value.metadata)) return false
  return typeof value.scan_id === 'string'
    && typeof value.created_at === 'string'
    && isRiskStatus(value.verdict)
    && typeof value.risk_score === 'number'
    && value.risk_score >= 0
    && value.risk_score <= 100
    && isDetector(value.detectors.email)
    && isDetector(value.detectors.url)
    && Array.isArray(value.indicators)
    && value.indicators.every(isIndicator)
    && (typeof value.metadata.domain === 'string' || value.metadata.domain === undefined || value.metadata.domain === null)
    && typeof value.metadata.message_characters === 'number'
    && typeof value.metadata.links_observed === 'number'
    && typeof value.metadata.analysis_version === 'string'
}

function saveReport(result: AnalysisResponse) {
  try {
    const reports = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}') as Record<string, AnalysisResponse>
    reports[result.scan_id] = result
    sessionStorage.setItem(storageKey, JSON.stringify(reports))
  } catch {
    // Report persistence is optional and never includes the submitted message body.
  }
}

export function getStoredReport(scanId: string): AnalysisResponse | undefined {
  try {
    const reports = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}') as Record<string, AnalysisResponse>
    return reports[scanId]
  } catch {
    return undefined
  }
}

async function getValidationMessage(response: Response) {
  try {
    const payload: unknown = await response.json()
    if (!isRecord(payload) || !Array.isArray(payload.detail)) return undefined
    const firstDetail = payload.detail[0]
    if (isRecord(firstDetail) && typeof firstDetail.message === 'string') return firstDetail.message
    return undefined
  } catch {
    return undefined
  }
}

async function requestAnalysis(input: AnalysisInput): Promise<AnalysisResponse> {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    throw new AnalysisServiceError('configuration', 'The analysis service is not configured for this environment.')
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)

  try {
    const response = await fetch(`${apiBaseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: input.message.trim() || undefined,
        url: input.url?.trim() || undefined,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 422) {
        const detail = await getValidationMessage(response)
        throw new AnalysisServiceError('validation', detail ?? 'The submitted message or URL could not be validated.')
      }
      throw new AnalysisServiceError('server', 'The analysis service could not complete this request. Please try again.')
    }

    const payload: unknown = await response.json()
    if (!isAnalysisResponse(payload)) {
      throw new AnalysisServiceError('invalid_response', 'The analysis service returned an invalid report. Please try again.')
    }
    return payload
  } catch (error) {
    if (error instanceof AnalysisServiceError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AnalysisServiceError('timeout', 'The analysis service took too long to respond. Your input was not saved.')
    }
    throw new AnalysisServiceError('network', 'AUTHENTIMAIL could not reach the analysis service. Check the connection and try again.')
  } finally {
    window.clearTimeout(timeout)
  }
}

export const analysisService: AnalysisService = {
  async analyze(input) {
    const requestOutcome = requestAnalysis(input).then(
      (result) => ({ ok: true as const, result }),
      (error: unknown) => ({ ok: false as const, error }),
    )
    await new Promise((resolve) => window.setTimeout(resolve, minimumScanDurationMs))
    const outcome = await requestOutcome
    if (!outcome.ok) throw outcome.error
    saveReport(outcome.result)
    return outcome.result
  },
}
