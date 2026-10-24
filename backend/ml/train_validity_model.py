import re
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report
import joblib

DATA_PATH = Path(__file__).resolve().parent / "data" / "students_validity_dataset.csv"
MODEL_PATH = Path(__file__).resolve().parent / "validity_model.joblib"


def extract_validity_features(d: pd.DataFrame) -> pd.DataFrame:
    """Mukul's exact feature extraction logic"""
    f = pd.DataFrame(index=d.index)
    
    # 1. APAAR Features
    ap = d.apaar_id.fillna('')
    f['apaar_missing'] = (ap == '').astype(int)
    f['apaar_len'] = ap.str.len()
    f['apaar_digits'] = ap.str.fullmatch(r'\d+').fillna(False).astype(int)
    f['apaar_lead_zero'] = ap.str.startswith('0').astype(int)
    f['apaar_dup'] = (ap.map(ap.value_counts()).where(ap != '', 0) > 1).astype(int)

    # 2. Email Features
    em = d.email.fillna('')
    f['email_ok'] = em.str.contains(r'@', regex=True).fillna(False).astype(int)
    f['email_at_count'] = em.str.count('@')

    # 3. Phone Features
    ph = d.phone.fillna('')
    f['phone_len'] = ph.str.len()
    f['phone_first_ok'] = ph.str[:1].isin(list('6789')).astype(int)

    # 4. Age & Admission Year Anomaly Features
    dob = pd.to_datetime(d.date_of_birth, errors='coerce')
    yr = pd.to_numeric(d.admission_year, errors='coerce')
    f['admission_year'] = yr.fillna(0)
    f['age_at_admission'] = (yr - dob.dt.year).fillna(-99)

    # 5. Completeness Features
    f['enroll_missing'] = d.enrollment_number.isna().astype(int)
    f['program_missing'] = d.program.isna().astype(int)
    f['gender_missing'] = d.gender.isna().astype(int)

    return f


def run_pipeline():
    print("=" * 72)
    print("   SIH26263: MUKUL'S STUDENT DATA VALIDITY & ANOMALY DETECTION ML")
    print("=" * 72)

    print(f"\n[1/4] Loading {DATA_PATH.name}...")
    df = pd.read_csv(DATA_PATH, dtype=str)
    y = df.is_valid.astype(int)
    print(f"      -> Total Student Records: {len(df):,}")
    print(f"      -> Valid Records (1)   : {(y == 1).sum():,}")
    print(f"      -> Invalid/Anomalies (0): {(y == 0).sum():,}")

    print("\n[2/4] Extracting Domain Validation Features...")
    X = extract_validity_features(df)

    print("\n[3/4] Stratified 80/20 Train-Test Split...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    baseline_acc = max(y_test.mean(), 1 - y_test.mean()) * 100
    print(f"      -> Majority-Class Baseline Accuracy: {baseline_acc:.2f}%")

    models = {
        "LogisticRegression": LogisticRegression(max_iter=2000, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(random_state=42),
    }

    print("\n[4/4] Training & Evaluating All 3 Algorithms...")
    print("-" * 72)
    best_model = None
    best_f1 = 0

    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        pr, rc, f1, _ = precision_recall_fscore_support(y_test, preds, labels=[0], zero_division=0)
        
        print(f"Model: {name:<22} | Acc: {acc * 100:.2f}% | Anomaly-F1: {f1[0]:.3f} | Recall: {rc[0]:.3f}")
        cm = confusion_matrix(y_test, preds)
        print(f"   Confusion Matrix: TN(Caught Anomaly)={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

        if f1[0] > best_f1:
            best_f1 = f1[0]
            best_model = model

    # Save the Best Model
    joblib.dump(best_model, MODEL_PATH)
    print("-" * 72)
    print(f"Successfully saved Best Model to: {MODEL_PATH.name} (Anomaly F1: {best_f1:.3f})")
    print("=" * 72)


if __name__ == "__main__":
    run_pipeline()
