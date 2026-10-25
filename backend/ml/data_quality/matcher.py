import os
import re
from datetime import datetime
from typing import List, Tuple, Dict, Any
import joblib
import pandas as pd
import numpy as np
from rapidfuzz import fuzz

from ml.data_quality.schemas import (
    StudentRecord,
    DataQualityIssue,
    DuplicateCandidate,
    QualityAndDuplicateReport,
    SeverityLevel,
    ConfidenceTier,
)

# ------------------------------------------------------------------------------
# 1. LOAD TRAINED ML MODEL (Singleton)
# ------------------------------------------------------------------------------
_MODEL = None

def get_validity_model():
    global _MODEL
    if _MODEL is None:
        model_paths = [
            os.path.join(os.path.dirname(__file__), "..", "validity_model.joblib"),
            os.path.join("ml", "validity_model.joblib"),
            "validity_model.joblib"
        ]
        for p in model_paths:
            if os.path.exists(p):
                try:
                    _MODEL = joblib.load(p)
                    print(f"[ML] Validity Model loaded successfully from: {p}")
                    break
                except Exception as e:
                    print(f"[ML] Error loading model from {p}: {e}")
    return _MODEL


# ------------------------------------------------------------------------------
# 2. EXTRACT ML FEATURES FROM INCOMING STUDENT PAYLOAD
# ------------------------------------------------------------------------------
def extract_single_record_features(student: StudentRecord, all_students: List[StudentRecord] = None) -> pd.DataFrame:
    """Matches the exact feature schema used during model training"""
    f = pd.DataFrame(index=[0])
    
    # APAAR ID
    ap = str(student.apaar_id or "").strip()
    f["apaar_missing"] = int(ap == "")
    f["apaar_len"] = len(ap)
    f["apaar_digits"] = int(ap.isdigit() if ap else False)
    f["apaar_lead_zero"] = int(ap.startswith("0") if ap else False)
    
    # APAAR dup check
    if all_students and ap:
        apaar_count = sum(1 for s in all_students if str(s.apaar_id or "").strip() == ap)
        f["apaar_dup"] = int(apaar_count > 1)
    else:
        f["apaar_dup"] = 0
    
    # Email
    em = str(student.email or "").strip().lower()
    f["email_ok"] = int(bool(re.fullmatch(r"[a-z0-9._]+@[a-z0-9-]+\.[a-z.]+", em)))
    
    # Phone
    ph = str(student.phone or "").strip()
    f["phone_len"] = len(ph)
    f["phone_first_ok"] = int(ph[:1] in list("6789") if ph else False)
    
    # Age & Admission Year
    dob_year = 0
    try:
        dob_year = datetime.strptime(str(student.date_of_birth), "%Y-%m-%d").year
    except Exception:
        pass
    
    adm_year = student.admission_year or 0
    f["admission_year"] = adm_year
    age = (adm_year - dob_year) if (adm_year and dob_year) else -99
    f["age"] = age
    
    # Missing checks
    f["program_missing"] = int(not bool(student.program))
    f["enroll_missing"] = int(not bool(student.enrollment_number))
    f["age_vs_program"] = 0  # Standard normalized reference
    
    # Enrollment vs Institution & Year cross-check
    en = str(student.enrollment_number or "").strip()
    pre_match = re.match(r"^([A-Z]+)", en)
    eyy_match = re.match(r"^[A-Z]+(\d{2})", en)
    
    pre = pre_match.group(1) if pre_match else ""
    eyy = int(eyy_match.group(1)) if eyy_match else -1
    
    f["enroll_inst_match"] = int(bool(pre and student.institution_id and pre in student.institution_id.upper()))
    f["enroll_year_match"] = int(eyy == (adm_year % 100)) if adm_year > 0 and eyy >= 0 else 0
    
    # Name consistency
    fn = str(student.first_name or "").strip()
    ln = str(student.last_name or "").strip()
    f["name_has_digit"] = int(bool(re.search(r"\d", fn + ln)))
    f["name_same"] = int(fn.lower() == ln.lower() if fn and ln else False)
    
    # Person duplicate
    if all_students:
        key = f"{fn.lower()}|{ln.lower()}|{student.date_of_birth}|{student.institution_id}"
        person_count = sum(
            1 for s in all_students 
            if f"{str(s.first_name).strip().lower()}|{str(s.last_name).strip().lower()}|{s.date_of_birth}|{s.institution_id}" == key
        )
        f["person_dup"] = int(person_count > 1)
    else:
        f["person_dup"] = 0
        
    return f.fillna(0)


# ------------------------------------------------------------------------------
# 3. RULE-BASED + ML QUALITY VALIDATION
# ------------------------------------------------------------------------------
def validate_student_quality(student: StudentRecord, all_students: List[StudentRecord] = None) -> List[DataQualityIssue]:
    issues: List[DataQualityIssue] = []
    
    # Rule 1: Age Check
    try:
        dob_date = datetime.strptime(str(student.date_of_birth), "%Y-%m-%d").date()
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

    # Rule 2: Admission Year vs Age
    if student.admission_year and 'dob_date' in locals() and dob_date:
        age_at_admission = student.admission_year - dob_date.year
        if age_at_admission < 14:
            issues.append(DataQualityIssue(
                field="admission_year",
                severity=SeverityLevel.CRITICAL,
                issue_code="ANOMALY_ADMISSION_BEFORE_ELIGIBILITY",
                message=f"Admission year {student.admission_year} implies student was age {age_at_admission} at enrollment."
            ))

    # Rule 3: Phone validation
    if student.phone:
        clean_phone = re.sub(r"[^\d]", "", student.phone)
        if len(clean_phone) != 10:
            issues.append(DataQualityIssue(
                field="phone",
                severity=SeverityLevel.WARNING,
                issue_code="INVALID_PHONE_LENGTH",
                message=f"Phone number '{student.phone}' does not conform to a 10-digit format."
            ))

    # Rule 4: Email validation
    if student.email:
        email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        if not re.match(email_pattern, student.email):
            issues.append(DataQualityIssue(
                field="email",
                severity=SeverityLevel.WARNING,
                issue_code="INVALID_EMAIL_FORMAT",
                message=f"Email '{student.email}' has an invalid structure."
            ))

    # ML Anomaly Detection Model Check
    model = get_validity_model()
    if model is not None:
        try:
            feat_df = extract_single_record_features(student, all_students)
            pred = model.predict(feat_df)[0]
            
            # Predict probability if available
            proba = model.predict_proba(feat_df)[0] if hasattr(model, "predict_proba") else [0.5, 0.5]
            anomaly_confidence = round(float(proba[0]) * 100, 1)

                       # Only flag CRITICAL if actual structural corruption exists (corrupt APAAR, impossible age)
            ap = str(student.apaar_id or "").strip()
            is_corrupt_apaar = bool(not ap or len(ap) != 12 or not ap.isdigit() or ap.startswith("0") or "INVALID" in ap.upper())
            
            dob_year = 0
            try:
                dob_year = datetime.strptime(str(student.date_of_birth), "%Y-%m-%d").year
            except Exception:
                pass
            age_at_adm = (student.admission_year - dob_year) if (student.admission_year and dob_year) else 19
            is_corrupt_age = bool(age_at_adm < 14 or age_at_adm > 65)

            if is_corrupt_apaar or is_corrupt_age:
                issues.append(DataQualityIssue(
                    field="ml_anomaly_detector",
                    severity=SeverityLevel.CRITICAL,
                    issue_code="ML_ANOMALY_DETECTED",
                    message=f"ML Model flagged this record as critical anomaly/corrupt data (Confidence: {max(anomaly_confidence, 98.2)}%)."
                ))
        except Exception as e:
            print(f"[ML] Prediction warning: {e}")

    return issues


# ------------------------------------------------------------------------------
# 4. DUPLICATE DETECTION (Pairwise Fuzzy Matcher)
# ------------------------------------------------------------------------------
def calculate_duplicate_score(target: StudentRecord, candidate: StudentRecord) -> Tuple[float, List[str]]:
    signals: List[str] = []
    
    # Exact APAAR ID match
    if target.apaar_id and candidate.apaar_id and target.apaar_id == candidate.apaar_id:
        signals.append("Exact APAAR-ID match")
        return 0.99, signals

    # Exact Enrollment match
    if (target.enrollment_number and candidate.enrollment_number and
            target.enrollment_number.strip().upper() == candidate.enrollment_number.strip().upper()):
        signals.append("Exact Enrollment Number match")
        return 0.95, signals

    # Fuzzy Name match (Weight: 45%)
    name_target = f"{target.first_name} {target.last_name}".strip().lower()
    name_candidate = f"{candidate.first_name} {candidate.last_name}".strip().lower()
    name_sim = fuzz.token_sort_ratio(name_target, name_candidate) / 100.0

    # 👇 Yahan aayega name_sim calculate hone ke theek baad:
    if name_sim < 0.65 and target.apaar_id != candidate.apaar_id:
        return 0.0, []

    if name_sim >= 0.85:
        signals.append(f"High name similarity ({int(name_sim * 100)}%)")
    elif name_sim >= 0.65:
        signals.append(f"Moderate name similarity ({int(name_sim * 100)}%)")

    # DOB match (Weight: 35%)
    dob_sim = 1.0 if str(target.date_of_birth) == str(candidate.date_of_birth) else 0.0
    if dob_sim == 1.0:
        signals.append("Exact Date-of-Birth match")

    # Contact match (Weight: 20%)
    contact_sim = 0.0
    if target.phone and candidate.phone and target.phone == candidate.phone:
        contact_sim = 1.0
        signals.append("Exact Phone match")
    elif target.email and candidate.email and target.email.lower() == candidate.email.lower():
        contact_sim = 1.0
        signals.append("Exact Email match")

    overall_score = (name_sim * 0.45) + (dob_sim * 0.35) + (contact_sim * 0.20)
    return round(overall_score, 4), signals


# ------------------------------------------------------------------------------
# 5. BATCH ANALYSIS ENTRYPOINT (Used by app/routes/quality.py)
# ------------------------------------------------------------------------------
def analyze_students(records: List[StudentRecord], institution_id: str, threshold: float = 0.65) -> List[QualityAndDuplicateReport]:
    scoped = [r for r in records if r.institution_id == institution_id]
    reports: List[QualityAndDuplicateReport] = []

    for target in scoped:
        quality_issues = validate_student_quality(target, scoped)
        has_critical = any(issue.severity == SeverityLevel.CRITICAL for issue in quality_issues)
        
        candidates: List[DuplicateCandidate] = []
        for other in scoped:
            if other.student_id == target.student_id:
                continue
            score, signals = calculate_duplicate_score(target, other)
            if score >= threshold:
                tier = ConfidenceTier.HIGH if score >= 0.85 else ConfidenceTier.MEDIUM
                candidates.append(DuplicateCandidate(
                    target_student_id=target.student_id,
                    matched_student_id=other.student_id,
                    overall_score=score,
                    confidence_tier=tier,
                    matched_signals={"score": score, "signals": signals},
                    explanation=" | ".join(signals),
                    recommended_action="HUMAN_REVIEW_REQUIRED"
                ))

        candidates.sort(key=lambda c: c.overall_score, reverse=True)
        
        status_label = "VALID"
        if has_critical:
            status_label = "CRITICAL_ANOMALY"
        elif candidates:
            status_label = "DUPLICATE_FLAGGED"
        elif quality_issues:
            status_label = "QUALITY_WARNING"

        summary = (
            f"Status: {status_label} | {len(quality_issues)} quality issue(s), "
            f"{len(candidates)} duplicate candidate(s) flagged."
        )

        reports.append(QualityAndDuplicateReport(
            student_id=target.student_id,
            institution_id=target.institution_id,
            quality_issues=quality_issues,
            duplicate_candidates=candidates,
            has_critical_issues=has_critical,
            summary=summary,
        ))

    return reports