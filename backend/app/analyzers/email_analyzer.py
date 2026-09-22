import re

from app.analyzers.base import AnalysisSignal, AnalyzerResult


URL_PATTERN = re.compile(r"https?://[^\s<>'\"\]\[{}]+", re.IGNORECASE)

URGENCY_PHRASES = (
    "urgent",
    "immediately",
    "within 24 hours",
    "act now",
    "final notice",
    "as soon as possible",
)
ACCOUNT_THREAT_PHRASES = (
    "account has been suspended",
    "account is suspended",
    "account will be suspended",
    "account will be closed",
    "permanently closed",
    "access will be suspended",
    "account locked",
)
CREDENTIAL_PHRASES = (
    "password",
    "credentials",
    "login details",
    "sign-in details",
    "passcode",
    "security code",
)
VERIFICATION_PHRASES = (
    "verify your account",
    "confirm your account",
    "verify your identity",
    "account verification",
)
PAYMENT_PHRASES = (
    "payment overdue",
    "unpaid invoice",
    "wire transfer",
    "gift card",
    "billing failure",
    "payment required",
)
ACTION_PHRASES = (
    "click the link",
    "click below",
    "login now",
    "sign in now",
    "use the link",
    "using the login link",
)
AUTHORITY_PHRASES = (
    "security team",
    "support team",
    "billing department",
    "account department",
    "administrator",
)


def extract_urls(message: str) -> list[str]:
    observed: list[str] = []
    seen: set[str] = set()
    for match in URL_PATTERN.findall(message):
        candidate = match.rstrip(".,;:!?)]")
        key = candidate.casefold()
        if candidate and key not in seen:
            observed.append(candidate)
            seen.add(key)
    return observed


def _contains_any(text: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in text for phrase in phrases)


def analyze_email(message: str, extracted_urls: list[str]) -> AnalyzerResult:
    normalized = " ".join(message.casefold().split())
    signals: list[AnalysisSignal] = []

    urgency = _contains_any(normalized, URGENCY_PHRASES)
    account_threat = _contains_any(normalized, ACCOUNT_THREAT_PHRASES)
    credentials = _contains_any(normalized, CREDENTIAL_PHRASES)
    verification = _contains_any(normalized, VERIFICATION_PHRASES)
    payment = _contains_any(normalized, PAYMENT_PHRASES)
    direct_action = _contains_any(normalized, ACTION_PHRASES)
    authority_style = _contains_any(normalized, AUTHORITY_PHRASES)

    if urgency:
        signals.append(AnalysisSignal("urgency", "medium", "Urgent action language detected", "email", 10))
    if account_threat:
        signals.append(AnalysisSignal("account_threat", "high", "Account suspension or closure threat detected", "email", 18))
    if credentials:
        signals.append(AnalysisSignal("credential_request", "critical", "Credential or password request detected", "email", 24))
    if verification:
        signals.append(AnalysisSignal("account_verification", "high", "Account or identity verification request detected", "email", 14))
    if payment:
        signals.append(AnalysisSignal("financial_pressure", "high", "Payment or financial pressure language detected", "email", 16))
    if direct_action and (urgency or verification or credentials):
        signals.append(AnalysisSignal("immediate_link_action", "high", "Immediate login or link action requested", "email", 12))
    if authority_style and (account_threat or verification or credentials or payment):
        signals.append(AnalysisSignal("authority_style_language", "medium", "Authority-style language reinforces a sensitive request", "email", 8))
    if account_threat and (credentials or verification):
        signals.append(AnalysisSignal("coercive_account_request", "critical", "Account threat is combined with a sensitive verification request", "email", 10))

    letters = [character for character in message if character.isalpha()]
    uppercase_ratio = (
        sum(1 for character in letters if character.isupper()) / len(letters)
        if len(letters) >= 20
        else 0
    )
    if uppercase_ratio >= 0.30:
        signals.append(AnalysisSignal("excessive_capitalization", "medium", "Unusually high capitalization detected", "email", 7))

    if re.search(r"\bdear\s+(customer|user|member|account holder)\b", normalized):
        signals.append(AnalysisSignal("generic_salutation", "low", "Non-personalized recipient greeting observed", "email", 4))

    if extracted_urls:
        url_weight = min(8, 4 + max(0, len(extracted_urls) - 1) * 2)
        label = "link" if len(extracted_urls) == 1 else "links"
        signals.append(AnalysisSignal("embedded_link", "low", f"{len(extracted_urls)} external {label} found in message content", "email", url_weight))

    score = min(98, 3 + sum(signal.weight for signal in signals))
    if not signals:
        signals.append(AnalysisSignal("no_elevated_email_signal", "safe", "No elevated message-language patterns were identified", "email", 0))

    return AnalyzerResult(score=score, signals=tuple(signals))
