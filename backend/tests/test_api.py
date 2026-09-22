import asyncio

import httpx
import pytest
from pydantic import ValidationError

from app.main import app
from app.schemas.analysis import AnalysisRequest
from app.services.analysis_service import analyze_submission


BENIGN_MESSAGE = "Hi Sam, the project meeting has moved to tomorrow at 3 PM. The agenda is attached."
PHISHING_MESSAGE = "URGENT: Your account has been suspended. Verify your password immediately using the login link below or your account will be permanently closed."
SUSPICIOUS_URL = "http://192.168.10.5/security/login?verify=account&password=update"


def analyze(payload: dict[str, str | None]):
    return analyze_submission(AnalysisRequest.model_validate(payload))


def api_request(method: str, path: str, json: dict[str, object] | None = None) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json)

    return asyncio.run(send())


def test_health_endpoint() -> None:
    response = api_request("GET", "/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "operational",
        "service": "authentimail-analysis",
    }


def test_analyze_endpoint_returns_safe_validation_errors() -> None:
    response = api_request("POST", "/api/analyze", {"email": " ", "url": None})
    assert response.status_code == 422
    body = response.json()
    assert body["detail"]
    assert "input" not in body["detail"][0]


def test_benign_message_is_relatively_low_risk() -> None:
    result = analyze({"email": BENIGN_MESSAGE})
    assert result.risk_score < 20
    assert result.verdict in {"safe", "low_risk"}


def test_phishing_message_scores_meaningfully_higher() -> None:
    benign = analyze({"email": BENIGN_MESSAGE})
    phishing = analyze({"email": PHISHING_MESSAGE})
    assert phishing.risk_score >= 70
    assert phishing.risk_score >= benign.risk_score + 50
    assert phishing.verdict == "high_risk"
    assert any(item.type == "credential_request" for item in phishing.indicators)


def test_suspicious_url_input() -> None:
    result = analyze({"url": SUSPICIOUS_URL})
    assert result.detectors.url.score >= 40
    assert any(item.type == "ip_hostname" for item in result.indicators)


def test_empty_input_validation() -> None:
    with pytest.raises(ValidationError, match="Provide an email message"):
        AnalysisRequest.model_validate({"email": "  ", "url": None})


def test_url_only_input() -> None:
    result = analyze({"url": SUSPICIOUS_URL})
    assert result.metadata.message_characters == 0
    assert result.detectors.email.score == 0
    assert result.detectors.url.score > 0


def test_email_only_input() -> None:
    result = analyze({"email": PHISHING_MESSAGE})
    assert result.detectors.email.score > 0
    assert result.detectors.url.score == 0


def test_analysis_is_deterministic() -> None:
    payload = {"email": PHISHING_MESSAGE, "url": SUSPICIOUS_URL}
    first = analyze(payload)
    second = analyze(payload)
    assert first.scan_id == second.scan_id
    assert first.risk_score == second.risk_score
    assert first.detectors == second.detectors
    assert first.indicators == second.indicators


def test_secondary_input_never_reduces_the_strongest_detector_score() -> None:
    result = analyze({"email": PHISHING_MESSAGE, "url": "http://example.com/login"})
    assert result.risk_score >= result.detectors.email.score
    assert result.risk_score >= result.detectors.url.score


def test_rejects_malformed_url_and_unexpected_types() -> None:
    with pytest.raises(ValidationError, match="absolute HTTP or HTTPS URL"):
        AnalysisRequest.model_validate({"url": "not-a-url"})
    with pytest.raises(ValidationError, match="Value must be a string"):
        AnalysisRequest.model_validate({"email": 1234})

    response = api_request("POST", "/api/analyze", {"url": "http://[::1"})
    assert response.status_code == 422
    assert response.json()["detail"][0]["message"] == (
        "Value error, URL must be an absolute HTTP or HTTPS URL"
    )
