import re
from datetime import datetime
from typing import List, Tuple
from rapidfuzz import fuzz
from ml.data_quality.schemas import (
    StudentRecord,
    DataQualityIssue,
    DuplicateCandidate,
    QualityAndDuplicateReport,
    SeverityLevel,
    ConfidenceTier,
)
def validate_student_quality(student: StudentRecord) -> List[DataQualityIssue]:
    """Validate data quality, check formats and domain anomalies"""
    issues: List[DataQualityIssue] = []
    # 1. Date of Birth Validation & Anomaly Check
    dob_date = None
    try:
        dob_date = datetime.strptime(student.date_of_birth, "%Y-%m-%d").date()
        today = datetime.now().date()
        age = (today - dob_date).days // 365
        if age < 14:
            issues.append(DataQualityIssue(
                field="date_of_birth",
                severity=SeverityLevel.CRITICAL,
                issue_code="AGE_TOO_LOW",
                message=f"Calculated age is {age} years. Minimum allowed age is 14."
            ))
        elif age > 65:
            issues.append(DataQualityIssue(
                field="date_of_birth",
                severity=SeverityLevel.WARNING,
                issue_code="AGE_UNUSUALLY_HIGH",
                message=f"Calculated age is {age} years. Please verify records."
            ))
    except ValueError:
        issues.append(DataQualityIssue(
            field="date_of_birth",
            severity=SeverityLevel.CRITICAL,
            issue_code="INVALID_DATE_FORMAT",
            message="Date of birth must strictly follow YYYY-MM-DD format."
        ))
    # 2. Admission Year vs Age Anomaly
    if student.admission_year and dob_date:
        age_at_admission = student.admission_year - dob_date.year
        if age_at_admission < 14:
            issues.append(DataQualityIssue(
                field="admission_year",
                severity=SeverityLevel.CRITICAL,
                issue_code="ANOMALY_ADMISSION_BEFORE_ELIGIBILITY",
                message=f"Admission year {student.admission_year} implies student was age {age_at_admission} at enrollment."
            ))
    # 3. Phone Format Validation
    if student.phone:
        clean_phone = re.sub(r"[^\d]", "", student.phone)
        if len(clean_phone) != 10:
            issues.append(DataQualityIssue(
                field="phone",
                severity=SeverityLevel.WARNING,
                issue_code="INVALID_PHONE_LENGTH",
                message=f"Phone number '{student.phone}' does not conform to a 10-digit format."
            ))
    # 4. Email Format Validation
    if student.email:
        email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        if not re.match(email_pattern, student.email):
            issues.append(DataQualityIssue(
                field="email",
                severity=SeverityLevel.WARNING,
                issue_code="INVALID_EMAIL_FORMAT",
                message=f"Email '{student.email}' has an invalid structure."
            ))
    return issues
def calculate_duplicate_score(target: StudentRecord, candidate: StudentRecord) -> Tuple[float, List[str]]:
    """Compute weighted similarity score between two student records"""
    signals: List[str] = []
    # Strong signal 1: APAAR ID match (if present and unmasked)
    if target.apaar_id and candidate.apaar_id and target.apaar_id == candidate.apaar_id:
        signals.append("Exact APAAR-ID match")
        return 0.99, signals
    # Strong signal 2: Enrollment number exact match
    if (target.enrollment_number and candidate.enrollment_number and
            target.enrollment_number.strip().upper() == candidate.enrollment_number.strip().upper()):
        signals.append("Exact Enrollment Number match")
        return 0.95, signals
    # Multi-signal weighted calculation:
    # 1. Full name fuzzy similarity (Weight: 45%)
    name_target = f"{target.first_name} {target.last_name}".strip().lower()
    name_candidate = f"{candidate.first_name} {candidate.last_name}".strip().lower()
    name_sim = fuzz.token_sort_ratio(name_target, name_candidate) / 100.0
    signals.append(f"Name similarity: {int(name_sim * 100)}%")
    # 2. Date of birth exact match (Weight: 35%)
    dob_sim = 1.0 if target.date_of_birth == candidate.date_of_birth else 0.0
    if dob_sim == 1.0:
        signals.append("Exact Date-of-Birth match")
    else:
        signals.append("Date-of-Birth mismatch")
    # 3. Phone or Email match (Weight: 20%)
    contact_sim = 0.0
    if target.phone and candidate.phone and target.phone == candidate.phone:
        contact_sim = 1.0
        signals.append("Exact Phone match")
    elif target.email and candidate.email and target.email.lower() == candidate.email.lower():
        contact_sim = 1.0
        signals.append("Exact Email match")
    overall_score = (name_sim * 0.45) + (dob_sim * 0.35) + (contact_sim * 0.20)
    return round(overall_score, 4), signals
def analyze_student_record(
    target_student: StudentRecord,
    existing_students: List[StudentRecord],
    threshold: float = 0.65
) -> QualityAndDuplicateReport:
    """Main entrypoint: validates data quality and searches for duplicate candidates"""
    quality_issues = validate_student_quality(target_student)
    has_critical = any(issue.severity == SeverityLevel.CRITICAL for issue in quality_issues)
    duplicate_candidates: List[DuplicateCandidate] = []
    for existing in existing_students:
        # Do not compare a student with themselves
        if existing.student_id == target_student.student_id:
            continue
        score, signals = calculate_duplicate_score(target_student, existing)
        if score >= threshold:
            tier = ConfidenceTier.HIGH if score >= 0.85 else ConfidenceTier.MEDIUM
            explanation = " | ".join(signals)
            duplicate_candidates.append(DuplicateCandidate(
                target_student_id=target_student.student_id,
                matched_student_id=existing.student_id,
                overall_score=score,
                confidence_tier=tier,
                matched_signals={"score": score, "signals": signals},
                explanation=explanation,
                recommended_action="HUMAN_REVIEW_REQUIRED"  # Locked rule: Never auto-merge!
            ))
    # Sort candidates by highest score first
    duplicate_candidates.sort(key=lambda c: c.overall_score, reverse=True)
    summary = (
        f"Analyzed student {target_student.student_id}: {len(quality_issues)} quality issue(s), "
        f"{len(duplicate_candidates)} duplicate candidate(s) flagged."
    )
    return QualityAndDuplicateReport(
        student_id=target_student.student_id,
        institution_id=target_student.institution_id,
        quality_issues=quality_issues,
        duplicate_candidates=duplicate_candidates,
        has_critical_issues=has_critical,
        summary=summary,
    )