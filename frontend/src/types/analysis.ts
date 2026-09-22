export type RiskStatus = 'safe' | 'low_risk' | 'suspicious' | 'high_risk'
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'safe'

export interface AnalysisInput {
  message: string
  url?: string
}

export interface DetectorResult {
  score: number
  status: RiskStatus
}

export interface ThreatIndicator {
  type: string
  severity: Severity
  message: string
  source: 'email' | 'url' | 'authentication' | 'system'
}

export interface AnalysisResponse {
  scan_id: string
  created_at: string
  verdict: RiskStatus
  risk_score: number
  detectors: {
    url: DetectorResult
    email: DetectorResult
  }
  indicators: ThreatIndicator[]
  metadata: {
    domain?: string | null
    message_characters: number
    links_observed: number
    analysis_version: string
  }
}

export interface AnalysisService {
  analyze(input: AnalysisInput): Promise<AnalysisResponse>
}
