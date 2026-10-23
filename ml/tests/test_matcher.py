import pytest
from ml.data_quality.schemas import StudentRecord, SeverityLevel, ConfidenceTier
from ml.data_quality.matcher import (
    validate_student_quality,
    calculate_duplicate_score,
    analyze_student_record,
)
def test_quality_validation_catches_underage_anomaly():
    """Verify anomaly detection flags student enrolled before eligible age"""
    student = StudentRecord(
        student_id="test-1",
        first_name="Rohan",
        last_name="Verma",
        date_of_birth="2015-01-01",  # 9-10 years old
        institution_id="inst-001",
        admission_year=2024,         # Age at admission = 9!
    )
    issues = validate_student_quality(student)
    issue_codes = [i.issue_code for i in issues]
    assert "AGE_TOO_LOW" in issue_codes
    assert "ANOMALY_ADMISSION_BEFORE_ELIGIBILITY" in issue_codes
    assert any(i.severity == SeverityLevel.CRITICAL for i in issues)
def test_quality_validation_catches_invalid_formats():
    """Verify formatting errors in phone and email are flagged"""
    student = StudentRecord(
        student_id="test-2",
        first_name="Pooja",
        last_name="Singh",
        date_of_birth="2003-08-20",
        institution_id="inst-001",
        phone="12345",              # Invalid length
        email="not-an-email",       # Invalid structure
    )
    issues = validate_student_quality(student)
    issue_codes = [i.issue_code for i in issues]
    assert "INVALID_PHONE_LENGTH" in issue_codes
    assert "INVALID_EMAIL_FORMAT" in issue_codes
def test_fuzzy_duplicate_match_reversed_name_same_dob():
    """Verify reversed name + same DOB triggers High Confidence duplicate candidate"""
    existing_student = StudentRecord(
        student_id="existing-1",
        first_name="Aarav",
        last_name="Sharma",
        date_of_birth="2004-03-15",
        institution_id="inst-001",
        phone="9876543210",
    )
    incoming_student = StudentRecord(
        student_id="incoming-1",
        first_name="Sharma",
        last_name="Aarav",         # Inverted name order
        date_of_birth="2004-03-15", # Identical DOB
        institution_id="inst-001",
        phone="9876543210",
    )
    score, signals = calculate_duplicate_score(incoming_student, existing_student)
    assert score >= 0.85
    assert any("Name similarity" in s for s in signals)
    assert "Exact Date-of-Birth match" in signals
def test_no_false_positive_for_different_students():
    """Verify completely different students are not flagged above threshold"""
    student_a = StudentRecord(
        student_id="a-1",
        first_name="Rahul",
        last_name="Gupta",
        date_of_birth="2002-11-10",
        institution_id="inst-001",
    )
    student_b = StudentRecord(
        student_id="b-1",
        first_name="Priya",
        last_name="Nair",
        date_of_birth="2004-01-22",
        institution_id="inst-001",
    )
    report = analyze_student_record(student_a, [student_b])
    assert len(report.duplicate_candidates) == 0
def test_blueprint_rule_never_auto_merge():
    """Verify blueprint compliance: action must strictly be HUMAN_REVIEW_REQUIRED"""
    student_a = StudentRecord(
        student_id="dup-1",
        first_name="Vikas",
        last_name="Mehta",
        date_of_birth="2003-05-10",
        institution_id="inst-001",
        apaar_id="APAAR-9999-0001",
    )
    student_b = StudentRecord(
        student_id="dup-2",
        first_name="Vikas",
        last_name="Mehta",
        date_of_birth="2003-05-10",
        institution_id="inst-001",
        apaar_id="APAAR-9999-0001",  # Identical APAAR
    )
    report = analyze_student_record(student_a, [student_b])
    assert len(report.duplicate_candidates) == 1
    candidate = report.duplicate_candidates[0]
    assert candidate.overall_score >= 0.99
    assert candidate.confidence_tier == ConfidenceTier.HIGH
    assert candidate.recommended_action == "HUMAN_REVIEW_REQUIRED"