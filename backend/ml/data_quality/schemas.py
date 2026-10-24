"""
SIH26263 - APAAR Platform
Data Quality, Anomaly Detection & Duplicate Candidate Schemas
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class ConfidenceTier(str, Enum):
    HIGH = "HIGH"        # Likely duplicate (Score >= 0.85)
    MEDIUM = "MEDIUM"    # Possible duplicate (Score >= 0.65)
    LOW = "LOW"          # Weak signal (Score < 0.65)


class StudentRecord(BaseModel):
    """Canonical Student Record model for ML processing"""
    student_id: str = Field(..., description="Unique record UUID")
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    date_of_birth: str = Field(..., description="Format: YYYY-MM-DD")
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    apaar_id: Optional[str] = Field(None, description="Masked or raw APAAR ID reference")
    institution_id: str = Field(..., description="Institution scope UUID")
    enrollment_number: Optional[str] = None
    admission_year: Optional[int] = None
    program: Optional[str] = None


class DataQualityIssue(BaseModel):
    """Field-level quality flaw or anomaly detected"""
    field: str
    severity: SeverityLevel
    issue_code: str
    message: str


class DuplicateCandidate(BaseModel):
    """Duplicate match candidate flagged for human officer review"""
    target_student_id: str
    matched_student_id: str
    overall_score: float = Field(..., ge=0.0, le=1.0)
    confidence_tier: ConfidenceTier
    matched_signals: Dict[str, Any]
    explanation: str
    recommended_action: str = "HUMAN_REVIEW_REQUIRED"  # Never auto-merge!


class QualityAndDuplicateReport(BaseModel):
    """Consolidated advisory report returned by the ML module"""
    student_id: str
    institution_id: str
    quality_issues: List[DataQualityIssue] = []
    duplicate_candidates: List[DuplicateCandidate] = []
    has_critical_issues: bool = False
    summary: str