from datetime import datetime
from typing import Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


RiskStatus = Literal["safe", "low_risk", "suspicious", "high_risk"]
Severity = Literal["critical", "high", "medium", "low", "safe"]
IndicatorSource = Literal["email", "url", "authentication", "system"]

MAX_EMAIL_CHARACTERS = 100_000
MAX_URL_CHARACTERS = 4_096


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    email: str | None = Field(default=None, max_length=MAX_EMAIL_CHARACTERS)
    url: str | None = Field(default=None, max_length=MAX_URL_CHARACTERS)

    @field_validator("email", "url", mode="before")
    @classmethod
    def require_string_values(cls, value: object) -> object:
        if value is not None and not isinstance(value, str):
            raise ValueError("Value must be a string")
        return value

    @field_validator("email", "url")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("url")
    @classmethod
    def validate_optional_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if any(character.isspace() for character in value):
            raise ValueError("URL must not contain whitespace")

        try:
            parsed = urlsplit(value)
            hostname = parsed.hostname
        except ValueError as exc:
            raise ValueError("URL must be an absolute HTTP or HTTPS URL") from exc
        if parsed.scheme.lower() not in {"http", "https"} or not hostname:
            raise ValueError("URL must be an absolute HTTP or HTTPS URL")
        return value

    @model_validator(mode="after")
    def require_analyzable_content(self) -> "AnalysisRequest":
        if self.email is None and self.url is None:
            raise ValueError("Provide an email message, a URL, or both")
        return self


class DetectorResult(BaseModel):
    score: int = Field(ge=0, le=100)
    status: RiskStatus


class DetectorCollection(BaseModel):
    url: DetectorResult
    email: DetectorResult


class ThreatIndicator(BaseModel):
    type: str
    severity: Severity
    message: str
    source: IndicatorSource


class AnalysisMetadata(BaseModel):
    domain: str | None = None
    message_characters: int = Field(ge=0)
    links_observed: int = Field(ge=0)
    analysis_version: str


class AnalysisResponse(BaseModel):
    scan_id: str
    created_at: datetime
    verdict: RiskStatus
    risk_score: int = Field(ge=0, le=100)
    detectors: DetectorCollection
    indicators: list[ThreatIndicator]
    metadata: AnalysisMetadata


class HealthResponse(BaseModel):
    status: Literal["operational"]
    service: str
