from datetime import datetime, timezone
from hashlib import sha256
from urllib.parse import urlsplit

from app.analyzers.email_analyzer import analyze_email, extract_urls
from app.analyzers.url_analyzer import analyze_urls
from app.schemas.analysis import (
    AnalysisMetadata,
    AnalysisRequest,
    AnalysisResponse,
    DetectorCollection,
    DetectorResult,
)
from app.services.risk_engine import calculate_risk, status_for_score


ANALYSIS_VERSION = "BASELINE-RULESET-1.0"


def _deduplicate_urls(urls: list[str]) -> list[str]:
    deduplicated: list[str] = []
    seen: set[str] = set()
    for url in urls:
        key = url.casefold()
        if key not in seen:
            deduplicated.append(url)
            seen.add(key)
    return deduplicated


def analyze_submission(request: AnalysisRequest) -> AnalysisResponse:
    message = request.email or ""
    embedded_urls = extract_urls(message)
    observed_urls = _deduplicate_urls([
        *embedded_urls,
        *([request.url] if request.url else []),
    ])

    email_result = analyze_email(message, embedded_urls) if request.email else None
    url_result = analyze_urls(observed_urls) if observed_urls else None
    risk_score, indicators = calculate_risk(email_result, url_result)

    email_score = email_result.score if email_result else 0
    url_score = url_result.score if url_result else 0
    fingerprint_input = f"{message.casefold()}\0{(request.url or '').casefold()}"
    scan_id = f"scan_{sha256(fingerprint_input.encode('utf-8')).hexdigest()[:12]}"

    domain = None
    if observed_urls:
        domain = urlsplit(observed_urls[0]).hostname

    return AnalysisResponse(
        scan_id=scan_id,
        created_at=datetime.now(timezone.utc),
        verdict=status_for_score(risk_score),
        risk_score=risk_score,
        detectors=DetectorCollection(
            email=DetectorResult(score=email_score, status=status_for_score(email_score)),
            url=DetectorResult(score=url_score, status=status_for_score(url_score)),
        ),
        indicators=indicators,
        metadata=AnalysisMetadata(
            domain=domain,
            message_characters=len(message),
            links_observed=len(observed_urls),
            analysis_version=ANALYSIS_VERSION,
        ),
    )
