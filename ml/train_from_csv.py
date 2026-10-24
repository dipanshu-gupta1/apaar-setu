import sys
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
import joblib

DATA_DIR = Path(__file__).resolve().parent / "data"
CSV_PATH = DATA_DIR / "training_pairs_labeled.csv"
MODEL_PATH = Path(__file__).resolve().parent / "duplicate_model.joblib"

FEATURE_COLS = [
    "name_sort_sim",
    "name_partial_sim",
    "dob_exact",
    "dob_year_diff",
    "phone_match",
    "enrollment_exact",
    "same_institution"
]
TARGET_COL = "is_duplicate"

def train():
    print("=" * 70)
    print("   SIH26263: TRAINING SUPERVISED ML MODEL FROM REAL CSV DATASET")
    print("=" * 70)

    print(f"\n[1/4] Loading CSV: {CSV_PATH.name} using pandas...")
    df = pd.read_csv(CSV_PATH)
    print(f"      -> Total pairs loaded: {len(df):,}")
    print(f"      -> Feature columns   : {len(FEATURE_COLS)}")

    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    print("\n[2/4] Splitting 80% Train (8,000 pairs) / 20% Test (2,000 pairs)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print("\n[3/4] Training Logistic Regression Classifier (L2 Regularization)...")
    clf = LogisticRegression(class_weight="balanced", random_state=42, max_iter=1000)
    clf.fit(X_train, y_train)

    joblib.dump(clf, MODEL_PATH)
    print(f"      -> Serialized trained model saved to: {MODEL_PATH.name}")

    print("\n[4/4] Evaluating on 2,000 UNSEEN HELD-OUT TEST PAIRS...")
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    roc = roc_auc_score(y_test, y_prob)

    print("\n" + "=" * 70)
    print("              LEARNED FEATURE WEIGHTS (COEFFICIENTS)")
    print("=" * 70)
    for name, weight in zip(FEATURE_COLS, clf.coef_[0]):
        print(f"  {name:<22} : {weight:+.4f}")
    print(f"  Intercept Bias         : {clf.intercept_[0]:+.4f}")

    print("\n" + "=" * 70)
    print("         2,000 HELD-OUT TEST SAMPLES: ACTUAL TEST METRICS")
    print("=" * 70)
    print(f"  Out-of-Sample Accuracy : {acc * 100:.2f}%")
    print(f"  ROC-AUC Discriminator  : {roc:.4f}")
    print("\nDetailed Classification Report:\n")
    print(classification_report(y_test, y_pred, target_names=["Unique (0)", "Duplicate (1)"], digits=4))

    cm = confusion_matrix(y_test, y_pred)
    print("Confusion Matrix on 2,000 Unseen Pairs:")
    print(f"  TN (Correctly Unique)  : {cm[0][0]:<5} | FP (False Alarms)   : {cm[0][1]:<5}")
    print(f"  FN (Missed Duplicates) : {cm[1][0]:<5} | TP (Caught Dups)    : {cm[1][1]:<5}")
    print("=" * 70)

if __name__ == "__main__":
    train()
