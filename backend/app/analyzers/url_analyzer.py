from ipaddress import ip_address
import re
from urllib.parse import parse_qsl, urlsplit

from app.analyzers.base import AnalysisSignal, AnalyzerResult


SHORTENER_HOSTS = {
    "bit.ly",
    "buff.ly",
    "cutt.ly",
    "goo.gl",
    "is.gd",
    "rebrand.ly",
    "shorturl.at",
    "t.co",
    "tiny.cc",
    "tinyurl.com",
}
SENSITIVE_TERMS = {
    "account",
    "auth",
    "login",
    "password",
    "recover",
    "secure",
    "security",
    "signin",
    "update",
    "verification",
    "verify",
}


def _is_ip_hostname(hostname: str) -> bool:
    try:
        ip_address(hostname.strip("[]"))
        return True
    except ValueError:
        return False


def _keep_strongest(signals: dict[str, AnalysisSignal], signal: AnalysisSignal) -> None:
    existing = signals.get(signal.type)
    if existing is None or signal.weight > existing.weight:
        signals[signal.type] = signal


def analyze_urls(urls: list[str]) -> AnalyzerResult:
    signals: dict[str, AnalysisSignal] = {}
    valid_urls = 0
    all_https = True

    for raw_url in urls:
        parsed = urlsplit(raw_url)
        hostname = (parsed.hostname or "").casefold()
        if parsed.scheme.casefold() not in {"http", "https"} or not hostname:
            continue

        valid_urls += 1
        is_https = parsed.scheme.casefold() == "https"
        all_https = all_https and is_https

        if not is_https:
            _keep_strongest(signals, AnalysisSignal("transport_security", "medium", "URL does not use an HTTPS scheme", "url", 8))
        if len(raw_url) > 160:
            _keep_strongest(signals, AnalysisSignal("long_url", "high", "Unusually long URL structure detected", "url", 15))
        elif len(raw_url) > 100:
            _keep_strongest(signals, AnalysisSignal("long_url", "medium", "Long URL structure detected", "url", 8))

        if _is_ip_hostname(hostname):
            _keep_strongest(signals, AnalysisSignal("ip_hostname", "critical", "Direct IP address is used as the URL hostname", "url", 30))
        if "xn--" in hostname:
            _keep_strongest(signals, AnalysisSignal("punycode_hostname", "critical", "Punycode hostname requires additional verification", "url", 28))
        if "@" in parsed.netloc:
            _keep_strongest(signals, AnalysisSignal("misleading_at_symbol", "high", "URL authority contains potentially misleading @ usage", "url", 22))

        hostname_labels = [label for label in hostname.split(".") if label]
        if len(hostname_labels) >= 5:
            _keep_strongest(signals, AnalysisSignal("nested_subdomain", "medium", "Deeply nested subdomain structure detected", "url", 14))
        if len(hostname) > 75 or hostname.count("-") >= 4:
            _keep_strongest(signals, AnalysisSignal("complex_hostname", "medium", "Unusually complex hostname pattern detected", "url", 10))
        if hostname in SHORTENER_HOSTS:
            _keep_strongest(signals, AnalysisSignal("url_shortener", "high", "Known URL-shortening service detected", "url", 18))

        inspected_text = f"{hostname} {parsed.path} {parsed.query}".casefold()
        matched_terms = sorted(term for term in SENSITIVE_TERMS if term in inspected_text)
        if matched_terms:
            term_weight = 20 if len(matched_terms) >= 4 else 16 if len(matched_terms) >= 2 else 10
            severity = "high" if term_weight >= 16 else "medium"
            _keep_strongest(signals, AnalysisSignal("sensitive_url_terms", severity, "Login, verification, or account terminology appears in the URL", "url", term_weight))

        special_character_count = len(re.findall(r"[%=&_~]", raw_url))
        if special_character_count >= 12:
            _keep_strongest(signals, AnalysisSignal("encoded_url_structure", "medium", "URL contains an unusual concentration of encoded or special characters", "url", 9))

        if len(parse_qsl(parsed.query, keep_blank_values=True)) > 6:
            _keep_strongest(signals, AnalysisSignal("complex_query", "medium", "URL contains an unusually complex query string", "url", 8))

    if valid_urls and all_https:
        signals["https_present"] = AnalysisSignal("https_present", "safe", "HTTPS scheme is present; this does not establish that the destination is safe", "url", 0)

    score = min(98, 2 + sum(signal.weight for signal in signals.values())) if valid_urls else 0
    return AnalyzerResult(score=score, signals=tuple(signals.values()))
