from typing import List
from fastapi import APIRouter

# Yahan ml schema wala StudentRecord use karenge taaki dirty data model tak pahunch sake:
from ml.data_quality.schemas import StudentRecord, QualityAndDuplicateReport
from ml.data_quality.matcher import analyze_students

router = APIRouter(prefix="/ml", tags=["data-quality"])

@router.post("/quality-check", response_model=List[QualityAndDuplicateReport])
def quality_check(records: List[StudentRecord]):
    """
    Unified Data Quality & Duplicate Candidate Matching API.
    - Accepts raw & dirty records
    - Runs Trained ML Validity/Anomaly Detection Model
    - Runs Pairwise Fuzzy Duplicate Candidate Matcher
    - Flags anomalies as HUMAN_REVIEW_REQUIRED
    """
    by_institution = {}
    for record in records:
        by_institution.setdefault(record.institution_id, []).append(record)

    all_reports: List[QualityAndDuplicateReport] = []
    for institution_id, institution_records in by_institution.items():
        all_reports.extend(analyze_students(institution_records, institution_id))

    return all_reports