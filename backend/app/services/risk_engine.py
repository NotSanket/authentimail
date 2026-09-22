from app.analyzers.base import AnalysisSignal, AnalyzerResult
from app.schemas.analysis import RiskStatus, ThreatIndicator


SEVERITY_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
    "safe": 4,
}


def status_for_score(score: int) -> RiskStatus:
    if score >= 70:
        return "high_risk"
    if score >= 40:
        return "suspicious"
    if score >= 15:
        return "low_risk"
    return "safe"


def calculate_risk(
    email_result: AnalyzerResult | None,
    url_result: AnalyzerResult | None,
) -> tuple[int, list[ThreatIndicator]]:
    available_results = [result for result in (email_result, url_result) if result is not None]
    if not available_results:
        return 0, []

    if len(available_results) == 1:
        overall_score = available_results[0].score
    else:
        strongest, secondary = sorted((result.score for result in available_results), reverse=True)
        # Additional evidence must never make an existing detector result look safer.
        overall_score = strongest + round(secondary * 0.15)
        if strongest >= 35 and secondary >= 35:
            overall_score = min(100, overall_score + 8)

    signals: list[AnalysisSignal] = [
        signal
        for result in available_results
        for signal in result.signals
    ]
    if email_result and url_result and email_result.score >= 35 and url_result.score >= 35:
        signals.append(AnalysisSignal(
            "cross_channel_correlation",
            "high",
            "Message and URL threat signals reinforce one another",
            "system",
            0,
        ))

    deduplicated: dict[tuple[str, str], AnalysisSignal] = {}
    for signal in signals:
        key = (signal.source, signal.type)
        existing = deduplicated.get(key)
        if existing is None or signal.weight > existing.weight:
            deduplicated[key] = signal

    ordered = sorted(
        deduplicated.values(),
        key=lambda signal: (SEVERITY_ORDER[signal.severity], signal.source, signal.type),
    )
    indicators = [
        ThreatIndicator(
            type=signal.type,
            severity=signal.severity,
            message=signal.message,
            source=signal.source,
        )
        for signal in ordered
    ]
    return min(100, overall_score), indicators
