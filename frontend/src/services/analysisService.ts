import type { AnalysisInput, AnalysisResponse, AnalysisService, RiskStatus, Severity, ThreatIndicator } from '../types/analysis'

const suspiciousTerms = ['verify', 'urgent', 'password', 'suspended', 'immediately', 'login', 'credential', 'confirm', 'account', 'expire']
const credentialTerms = ['password', 'credential', 'sign in', 'login', 'verify your account']
const urgencyTerms = ['urgent', 'immediately', 'within 24 hours', 'suspended', 'expire', 'final notice']
const brandTerms = ['microsoft', 'paypal', 'apple', 'amazon', 'bank', 'netflix', 'google']
const riskyTlds = ['.zip', '.click', '.top', '.xyz', '.work', '.live']

function hash(value: string) {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(16).padStart(8, '0')
}

function statusFor(score: number): RiskStatus {
  if (score >= 75) return 'high_risk'
  if (score >= 45) return 'suspicious'
  if (score >= 20) return 'low_risk'
  return 'safe'
}

function severityFor(weight: number): Severity {
  if (weight >= 28) return 'critical'
  if (weight >= 18) return 'high'
  if (weight >= 10) return 'medium'
  return 'low'
}

function getDomain(rawUrl?: string) {
  if (!rawUrl) return undefined
  try {
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    return new URL(normalized).hostname.toLowerCase()
  } catch {
    return undefined
  }
}

function addIndicator(indicators: ThreatIndicator[], indicator: ThreatIndicator) {
  if (!indicators.some((item) => item.type === indicator.type)) indicators.push(indicator)
}

async function mockAnalyze(input: AnalysisInput): Promise<AnalysisResponse> {
  const message = input.message.trim()
  const lower = message.toLowerCase()
  const domain = getDomain(input.url)
  const indicators: ThreatIndicator[] = []
  let emailScore = 4
  let urlScore = input.url ? 8 : 0

  const matchedTerms = suspiciousTerms.filter((term) => lower.includes(term))
  emailScore += Math.min(32, matchedTerms.length * 5)

  if (credentialTerms.some((term) => lower.includes(term))) {
    emailScore += 28
    addIndicator(indicators, { type: 'credential_request', severity: 'critical', message: 'Credential verification request detected', source: 'email' })
  }
  if (urgencyTerms.some((term) => lower.includes(term))) {
    emailScore += 16
    addIndicator(indicators, { type: 'urgency', severity: 'medium', message: 'Urgent account-related language detected', source: 'email' })
  }
  if (brandTerms.some((term) => lower.includes(term)) && credentialTerms.some((term) => lower.includes(term))) {
    emailScore += 12
    addIndicator(indicators, { type: 'impersonation', severity: 'high', message: 'Brand language appears alongside an account request', source: 'email' })
  }
  if (/dear (customer|user|member)/i.test(message)) {
    emailScore += 8
    addIndicator(indicators, { type: 'generic_salutation', severity: 'low', message: 'Non-personalized recipient greeting observed', source: 'email' })
  }

  if (input.url) {
    if (!/^https:\/\//i.test(input.url)) {
      urlScore += 18
      addIndicator(indicators, { type: 'transport_security', severity: 'high', message: 'Link does not declare an HTTPS scheme', source: 'url' })
    } else {
      addIndicator(indicators, { type: 'https_present', severity: 'safe', message: 'HTTPS scheme is present', source: 'url' })
    }
    if (domain) {
      const parts = domain.split('.')
      if (parts.length > 3) {
        urlScore += 16
        addIndicator(indicators, { type: 'nested_subdomain', severity: 'medium', message: 'Deeply nested subdomain structure detected', source: 'url' })
      }
      if (riskyTlds.some((tld) => domain.endsWith(tld))) {
        urlScore += 30
        addIndicator(indicators, { type: 'risky_tld', severity: 'high', message: 'Domain uses a frequently abused top-level domain', source: 'url' })
      }
      if (domain.includes('xn--') || /\d{1,3}(?:\.\d{1,3}){3}/.test(domain)) {
        urlScore += 35
        addIndicator(indicators, { type: 'obfuscated_host', severity: 'critical', message: 'Obfuscated or direct IP host detected', source: 'url' })
      }
      if (/[0-9-].*[0-9-].*[0-9-]/.test(domain)) {
        urlScore += 12
        addIndicator(indicators, { type: 'domain_pattern', severity: 'medium', message: 'Unusual domain naming pattern observed', source: 'url' })
      }
    } else {
      urlScore += 24
      addIndicator(indicators, { type: 'invalid_url', severity: 'high', message: 'URL structure could not be validated', source: 'url' })
    }
  }

  const embeddedLinks = message.match(/https?:\/\/[^\s)]+/gi) ?? []
  if (embeddedLinks.length > 0) {
    emailScore += Math.min(14, embeddedLinks.length * 7)
    addIndicator(indicators, { type: 'embedded_link', severity: severityFor(embeddedLinks.length * 7), message: `${embeddedLinks.length} external link${embeddedLinks.length === 1 ? '' : 's'} found in message content`, source: 'email' })
  }

  emailScore = Math.min(98, emailScore)
  urlScore = Math.min(98, urlScore)
  const activeScores = input.url ? [emailScore, urlScore] : [emailScore]
  const strongest = Math.max(...activeScores)
  const average = activeScores.reduce((sum, score) => sum + score, 0) / activeScores.length
  const riskScore = Math.round(strongest * 0.64 + average * 0.36)

  if (indicators.length === 0) {
    indicators.push({ type: 'no_elevated_signal', severity: 'safe', message: 'No elevated phishing patterns were identified', source: 'system' })
  }

  const fingerprint = hash(`${lower}|${input.url?.toLowerCase() ?? ''}`)
  return {
    scan_id: `scan_${fingerprint}`,
    created_at: new Date(1704067200000 + (Number.parseInt(fingerprint.slice(0, 6), 16) % 31536000) * 1000).toISOString(),
    verdict: statusFor(riskScore),
    risk_score: riskScore,
    detectors: {
      email: { score: emailScore, status: statusFor(emailScore) },
      url: { score: urlScore, status: input.url ? statusFor(urlScore) : 'safe' },
    },
    indicators,
    metadata: {
      domain,
      message_characters: message.length,
      links_observed: embeddedLinks.length + (input.url ? 1 : 0),
      analysis_version: 'DEV-RULESET-0.4',
    },
  }
}

const storageKey = 'authentimail:reports'

function saveReport(result: AnalysisResponse) {
  try {
    const reports = JSON.parse(sessionStorage.getItem(storageKey) ?? '{}') as Record<string, AnalysisResponse>
    reports[result.scan_id] = result
    sessionStorage.setItem(storageKey, JSON.stringify(reports))
  } catch {
    // Browsers with disabled storage can still complete and view the active scan.
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

export const analysisService: AnalysisService = {
  async analyze(input) {
    await new Promise((resolve) => window.setTimeout(resolve, 3600))
    const result = await mockAnalyze(input)
    saveReport(result)
    return result
  },
}
