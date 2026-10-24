import sys
import csv
import random
from pathlib import Path
from typing import List, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rapidfuzz import fuzz
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
import joblib

from ml.data_quality.schemas import StudentRecord

MODEL_PATH = Path(__file__).resolve().parent / "duplicate_model.joblib"
DATA_DIR = Path(__file__).resolve().parent / "data"
CSV_PATH = DATA_DIR / "student_pairs_20k.csv"


def extract_pairwise_features(target: StudentRecord, candidate: StudentRecord) -> List[float]:
    name_t = f"{target.first_name} {target.last_name}".strip().lower()
    name_c = f"{candidate.first_name} {candidate.last_name}".strip().lower()

    f_name_sort = fuzz.token_sort_ratio(name_t, name_c) / 100.0
    f_name_partial = fuzz.partial_ratio(name_t, name_c) / 100.0
    f_dob_exact = 1.0 if target.date_of_birth == candidate.date_of_birth else 0.0

    try:
        y_t = int(target.date_of_birth.split("-")[0])
        y_c = int(candidate.date_of_birth.split("-")[0])
        f_year_diff = min(abs(y_t - y_c), 10) / 10.0
    except Exception:
        f_year_diff = 1.0

    f_phone = 1.0 if (target.phone and candidate.phone and target.phone == candidate.phone) else (-0.5 if (target.phone and candidate.phone) else 0.0)
    f_email = 1.0 if (target.email and candidate.email and target.email.lower() == candidate.email.lower()) else (-0.5 if (target.email and candidate.email) else 0.0)
    
    if target.apaar_id and candidate.apaar_id:
        f_apaar = 1.0 if target.apaar_id == candidate.apaar_id else -1.0
    else:
        f_apaar = 0.0

    return [f_name_sort, f_name_partial, f_dob_exact, f_year_diff, f_phone, f_email, f_apaar]


def generate_20k_dataset(num_pairs: int = 20000) -> Tuple[np.ndarray, np.ndarray]:
    """Generates 20,000 Pan-India student record pairs and writes to CSV"""
    random.seed(42)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    first_names = [
        "Aarav", "Rohan", "Pooja", "Vikram", "Sneha", "Amit", "Priya", "Deepak", "Ananya", "Rahul",
        "Karthik", "Suresh", "Meenakshi", "Venkatesh", "Anuradha", "Subhash", "Debashis", "Tanmoy",
        "Prathamesh", "Shruti", "Siddharth", "Fatima", "Mohammad", "Tariq", "Harpreet", "Manpreet",
        "Arjun", "Aditya", "Neha", "Divya", "Kavita", "Sanjay", "Manoj", "Rajesh", "Naveen", "Swati",
        "Geeta", "Sunita", "Ashwin", "Ganesh", "Lakshmi", "Bhavana", "Chirag", "Jatin", "Kunal",
        "Ramesh", "Mukesh", "Vijay", "Anita", "Sunil", "Manish", "Pankaj", "Alok", "Gaurav"
    ]
    last_names = [
        "Sharma", "Verma", "Singh", "Patel", "Gupta", "Joshi", "Kumar", "Nair", "Mehta", "Khan",
        "Iyer", "Rao", "Reddy", "Banerjee", "Mukherjee", "Kulkarni", "Deshmukh", "Kaur", "Gill",
        "Bose", "Dutta", "Bhat", "Hegde", "Pillai", "Menon", "Chauhan", "Yadav", "Pandey", "Mishra",
        "Tiwari", "Dubey", "Shukla", "Saxena", "Agrawal", "Chatterjee", "Sen", "Bhattacharya"
    ]

    X = []
    y = []
    csv_rows = []

    # 1. DUPLICATES (Label = 1) -> 10,000 pairs
    for i in range(num_pairs // 2):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        dob = f"200{random.randint(0, 5)}-0{random.randint(1, 9)}-{random.randint(10, 28)}"
        phone = f"98{random.randint(10000000, 99999999)}" if random.random() > 0.15 else None
        email = f"{fn.lower()}.{ln.lower()}{random.randint(1, 99)}@gmail.com" if random.random() > 0.20 else None
        apaar = f"APAAR-{random.randint(1000, 9999)}" if random.random() < 0.25 else None

        s1 = StudentRecord(student_id=f"orig-{i}", first_name=fn, last_name=ln, date_of_birth=dob, institution_id="inst-1", phone=phone, email=email, apaar_id=apaar)

        noise = random.random()
        if noise < 0.20:
            s2 = StudentRecord(student_id=f"dup-{i}", first_name=ln, last_name=fn, date_of_birth=dob, institution_id="inst-1", phone=phone, email=email, apaar_id=apaar)
        elif noise < 0.45:
            typo_fn = fn[:-1] + ("a" if fn[-1] != "a" else "i")
            s2 = StudentRecord(student_id=f"dup-{i}", first_name=typo_fn, last_name=ln, date_of_birth=dob, institution_id="inst-1", phone=phone, email=email, apaar_id=apaar)
        elif noise < 0.65:
            new_phone = f"97{random.randint(10000000, 99999999)}"
            s2 = StudentRecord(student_id=f"dup-{i}", first_name=fn, last_name=ln, date_of_birth=dob, institution_id="inst-1", phone=new_phone, email=email, apaar_id=apaar)
        elif noise < 0.75:
            fuzzy_dob = dob[:-2] + ("10" if dob[-2:] != "10" else "11")
            s2 = StudentRecord(student_id=f"dup-{i}", first_name=fn, last_name=ln, date_of_birth=fuzzy_dob, institution_id="inst-1", phone=phone, email=email, apaar_id=apaar)
        else:
            s2 = StudentRecord(student_id=f"dup-{i}", first_name=fn, last_name=ln, date_of_birth=dob, institution_id="inst-1", phone=phone, email=email, apaar_id=apaar)

        X.append(extract_pairwise_features(s1, s2))
        y.append(1)
        csv_rows.append([s1.student_id, f"{s1.first_name} {s1.last_name}", s1.date_of_birth, s1.phone, s2.student_id, f"{s2.first_name} {s2.last_name}", s2.date_of_birth, s2.phone, 1])

    # 2. UNIQUE / NON-DUPLICATES (Label = 0) -> 10,000 pairs
    for i in range(num_pairs // 2):
        challenge = random.random()

        if challenge < 0.15:
            common_fn = random.choice(["Rahul", "Amit", "Pooja", "Vikram", "Sneha", "Kunal"])
            common_ln = random.choice(["Sharma", "Kumar", "Singh", "Verma", "Gupta", "Joshi"])
            dob1 = f"200{random.randint(0, 2)}-04-10"
            dob2 = f"200{random.randint(3, 5)}-11-22"
            s1 = StudentRecord(student_id=f"n1-{i}", first_name=common_fn, last_name=common_ln, date_of_birth=dob1, institution_id="inst-1")
            s2 = StudentRecord(student_id=f"n2-{i}", first_name=common_fn, last_name=common_ln, date_of_birth=dob2, institution_id="inst-1")

        elif challenge < 0.30:
            fn1, fn2 = random.sample(first_names, 2)
            same_ln = random.choice(last_names)
            twin_dob = f"2004-06-15"
            family_phone = f"98{random.randint(10000000, 99999999)}"
            s1 = StudentRecord(student_id=f"n1-{i}", first_name=fn1, last_name=same_ln, date_of_birth=twin_dob, institution_id="inst-1", phone=family_phone)
            s2 = StudentRecord(student_id=f"n2-{i}", first_name=fn2, last_name=same_ln, date_of_birth=twin_dob, institution_id="inst-1", phone=family_phone)

        elif challenge < 0.50:
            fn1, fn2 = random.sample(first_names, 2)
            ln1, ln2 = random.sample(last_names, 2)
            same_dob = f"2003-08-20"
            s1 = StudentRecord(student_id=f"n1-{i}", first_name=fn1, last_name=ln1, date_of_birth=same_dob, institution_id="inst-1")
            s2 = StudentRecord(student_id=f"n2-{i}", first_name=fn2, last_name=ln2, date_of_birth=same_dob, institution_id="inst-1")

        else:
            fn1, fn2 = random.sample(first_names, 2)
            ln1, ln2 = random.sample(last_names, 2)
            s1 = StudentRecord(student_id=f"n1-{i}", first_name=fn1, last_name=ln1, date_of_birth="2002-01-05", institution_id="inst-1")
            s2 = StudentRecord(student_id=f"n2-{i}", first_name=fn2, last_name=ln2, date_of_birth="2005-12-19", institution_id="inst-1")

        X.append(extract_pairwise_features(s1, s2))
        y.append(0)
        csv_rows.append([s1.student_id, f"{s1.first_name} {s1.last_name}", s1.date_of_birth, s1.phone or "", s2.student_id, f"{s2.first_name} {s2.last_name}", s2.date_of_birth, s2.phone or "", 0])

    # Write out actual CSV dataset to disk
    with open(CSV_PATH, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["student1_id", "student1_name", "student1_dob", "student1_phone", "student2_id", "student2_name", "student2_dob", "student2_phone", "is_duplicate"])
        writer.writerows(csv_rows)

    return np.array(X), np.array(y)


def run_training_pipeline():
    print("=" * 72)
    print("   SIH26263: 20,000 RECORDS ENTERPRISE SUPERVISED ML TRAINING")
    print("=" * 72)

    print("\n[1/4] Generating & exporting 20,000 Pan-India student pairs to CSV...")
    X, y = generate_20k_dataset(num_pairs=20000)
    print(f"      -> Total samples generated : {X.shape[0]:,}")
    print(f"      -> Features per pair       : {X.shape[1]}")
    print(f"      -> CSV Dataset saved to    : {CSV_PATH.name} ({CSV_PATH.stat().st_size / (1024*1024):.2f} MB)")

    print("\n[2/4] Stratified 80/20 Train-Test Split (16,000 Train / 4,000 Test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print("\n[3/4] Fitting Logistic Regression with L2 Regularization & Balanced Classes...")
    clf = LogisticRegression(class_weight="balanced", random_state=42, max_iter=1000)
    clf.fit(X_train, y_train)

    joblib.dump(clf, MODEL_PATH)
    print(f"      -> Model weights serialized and saved to: {MODEL_PATH.name}")

    print("\n[4/4] Evaluating on 4,000 UNSEEN HELD-OUT TEST PAIRS...")
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    roc = roc_auc_score(y_test, y_prob)

    feature_names = [
        "Name Token Sort", "Name Partial Ratio", "DOB Exact Match",
        "DOB Year Diff", "Phone Match", "Email Match", "APAAR Match"
    ]
    weights = clf.coef_[0]

    print("\n" + "=" * 72)
    print("              OPTIMIZED FEATURE COEFFICIENTS (LEARNED WEIGHTS)")
    print("=" * 72)
    for name, w in zip(feature_names, weights):
        print(f"  {name:<22} : {w:+.4f}")
    print(f"  Intercept Bias         : {clf.intercept_[0]:+.4f}")

    print("\n" + "=" * 72)
    print("       4,000 HELD-OUT UNSEEN SAMPLES: ACTUAL TEST METRICS")
    print("=" * 72)
    print(f"  Out-of-Sample Accuracy : {acc * 100:.2f}%")
    print(f"  ROC-AUC Discriminator  : {roc:.4f}")
    print("\nDetailed Classification Report:\n")
    print(classification_report(y_test, y_pred, target_names=["Unique (0)", "Duplicate (1)"], digits=4))

    cm = confusion_matrix(y_test, y_pred)
    print("Confusion Matrix on 4,000 Unseen Pairs:")
    print(f"  TN (Correctly Unique)  : {cm[0][0]:<5} | FP (False Alarms)   : {cm[0][1]:<5}")
    print(f"  FN (Missed Duplicates) : {cm[1][0]:<5} | TP (Caught Dups)    : {cm[1][1]:<5}")
    print("=" * 72)


if __name__ == "__main__":
    run_training_pipeline()
