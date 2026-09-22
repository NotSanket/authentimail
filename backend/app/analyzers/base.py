from dataclasses import dataclass

from app.schemas.analysis import IndicatorSource, Severity


@dataclass(frozen=True)
class AnalysisSignal:
    type: str
    severity: Severity
    message: str
    source: IndicatorSource
    weight: int


@dataclass(frozen=True)
class AnalyzerResult:
    score: int
    signals: tuple[AnalysisSignal, ...]
