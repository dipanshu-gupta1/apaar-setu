import re
from datetime import datetime, timezone
from typing import Dict, Any, List
from ml.nl_analytics.schemas import (
    AnalyticsIntent,
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
)
# Blocklist for Prompt Injection & Authority Override attempts
INJECTION_PATTERNS = [
    r"ignore\s+(previous|all)\s+instructions",
    r"bypass\s+(security|authorization|rls|scope)",
    r"drop\s+table",
    r"delete\s+from",
    r"grant\s+admin",
    r"show\s+all\s+institutions",
    r"select\s+\*\s+from",
    r"reveal\s+passwords",
]
def detect_security_threat(query: str) -> bool:
    """Scan query for prompt injection or unauthorized access attempts"""
    lower_query = query.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lower_query):
            return True
    return False
def classify_query_intent(query: str) -> AnalyticsIntent:
    """Deterministic NLP classifier mapping user prompts to safe allowlisted analytical intents"""
    q = query.lower()
    if detect_security_threat(q):
        return AnalyticsIntent.SECURITY_VIOLATION
    if any(k in q for k in ["pending", "backlog", "in progress", "waiting", "queue"]):
        return AnalyticsIntent.PENDING_VERIFICATIONS
    if any(k in q for k in ["duplicate", "similarity", "match", "suspect", "overlap"]):
        return AnalyticsIntent.DUPLICATE_SUMMARY
    if any(k in q for k in ["rate", "percentage", "accuracy", "approved", "rejected", "outcome"]):
        return AnalyticsIntent.VERIFICATION_RATES
    if any(k in q for k in ["summary", "overview", "total", "count", "stats", "statistics"]):
        return AnalyticsIntent.INSTITUTION_OVERVIEW
    return AnalyticsIntent.UNKNOWN
def process_analytics_query(
    request: AnalyticsQueryRequest,
    mock_db_data: Dict[str, Any]
) -> AnalyticsQueryResponse:
    """
    Executes permission-scoped analytics safely without raw SQL.
    Includes deterministic fallback if external AI is offline.
    """
    now_str = datetime.now(timezone.utc).isoformat()
    intent = classify_query_intent(request.query)
    # 1. Security Violation Intercept
    if intent == AnalyticsIntent.SECURITY_VIOLATION:
        return AnalyticsQueryResponse(
            summary="Access Denied: The query triggered an automated AI Safety policy violation.",
            intent=intent,
            scope=request.institution_id,
            as_of=now_str,
            metrics={},
            limitations="Query flagged for suspicious security/injection patterns.",
            is_fallback=True,
            security_flag="PROMPT_INJECTION_DETECTED"
        )
    # 2. Intent-based Safe Aggregation (Scoped strictly to request.institution_id)
    if intent == AnalyticsIntent.PENDING_VERIFICATIONS:
        pending_count = mock_db_data.get("pending_verifications", 0)
        return AnalyticsQueryResponse(
            summary=f"Institution has {pending_count} student verification cases currently pending review.",
            intent=intent,
            scope=request.institution_id,
            as_of=now_str,
            metrics={"pending_cases": pending_count, "sla_breached": mock_db_data.get("sla_breached", 0)},
            limitations="Metrics bounded strictly to institution-scoped synthetic data.",
            is_fallback=True
        )
    elif intent == AnalyticsIntent.DUPLICATE_SUMMARY:
        dup_count = mock_db_data.get("flagged_duplicates", 0)
        return AnalyticsQueryResponse(
            summary=f"Found {dup_count} duplicate candidate pairs flagged for mandatory human review.",
            intent=intent,
            scope=request.institution_id,
            as_of=now_str,
            metrics={"flagged_duplicates": dup_count, "high_confidence": mock_db_data.get("high_confidence_dups", 0)},
            limitations="All duplicates remain advisory and require human officer confirmation.",
            is_fallback=True
        )
    elif intent == AnalyticsIntent.VERIFICATION_RATES:
        total = mock_db_data.get("total_cases", 1)
        verified = mock_db_data.get("verified_cases", 0)
        rate = round((verified / total) * 100, 1) if total > 0 else 0.0
        return AnalyticsQueryResponse(
            summary=f"Verification completion rate is currently {rate}% ({verified} out of {total} verified).",
            intent=intent,
            scope=request.institution_id,
            as_of=now_str,
            metrics={"completion_rate_pct": rate, "verified": verified, "total": total},
            limitations="Calculated from scoped verification events.",
            is_fallback=True
        )
    elif intent == AnalyticsIntent.INSTITUTION_OVERVIEW:
        return AnalyticsQueryResponse(
            summary=f"Overview: {mock_db_data.get('total_students', 0)} total enrolled students with active records.",
            intent=intent,
            scope=request.institution_id,
            as_of=now_str,
            metrics=mock_db_data,
            limitations="Aggregated strictly for authorized roles.",
            is_fallback=True
        )
    # Fallback for unrecognized questions
    return AnalyticsQueryResponse(
        summary="Could not identify a supported analytics query. Try asking about pending cases, duplicates, or completion rates.",
        intent=AnalyticsIntent.UNKNOWN,
        scope=request.institution_id,
        as_of=now_str,
        metrics={},
        limitations="Natural language classifier only accepts allowlisted institutional analytics queries.",
        is_fallback=True
    )