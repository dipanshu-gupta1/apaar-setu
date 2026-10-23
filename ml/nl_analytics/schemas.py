from enum import Enum
from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
class AnalyticsIntent(str, Enum):
    PENDING_VERIFICATIONS = "PENDING_VERIFICATIONS"
    DUPLICATE_SUMMARY = "DUPLICATE_SUMMARY"
    VERIFICATION_RATES = "VERIFICATION_RATES"
    INSTITUTION_OVERVIEW = "INSTITUTION_OVERVIEW"
    UNKNOWN = "UNKNOWN"
    SECURITY_VIOLATION = "SECURITY_VIOLATION"
class AnalyticsQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    institution_id: str
    user_role: str
class AnalyticsQueryResponse(BaseModel):
    """Complies with F4 AI Contract in Master Blueprint"""
    summary: str
    intent: AnalyticsIntent
    scope: str = Field(..., description="Institution scope enforced")
    as_of: str
    metrics: Dict[str, Any] = {}
    limitations: str
    is_fallback: bool = True
    security_flag: Optional[str] = None