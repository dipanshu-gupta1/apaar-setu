import sys
from pathlib import Path

# Add project root to sys.path automatically
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.data_quality.schemas import StudentRecord, ConfidenceTier
from ml.data_quality.matcher import calculate_duplicate_score

BENCHMARK_DATASET = [
    {
        "target": {"student_id": "1", "first_name": "Aarav", "last_name": "Sharma", "date_of_birth": "2004-03-15", "institution_id": "inst-1", "phone": "9876543210"},
        "candidate": {"student_id": "2", "first_name": "Aarav", "last_name": "Sharma", "date_of_birth": "2004-03-15", "institution_id": "inst-1", "phone": "9876543210"},
        "is_duplicate": True,
        "category": "Exact Identity"
    },
    {
        "target": {"student_id": "3", "first_name": "Rohan", "last_name": "Verma", "date_of_birth": "2003-07-20", "institution_id": "inst-1", "apaar_id": "APAAR-1234"},
        "candidate": {"student_id": "4", "first_name": "Rohan", "last_name": "Verma", "date_of_birth": "2003-07-20", "institution_id": "inst-1", "apaar_id": "APAAR-1234"},
        "is_duplicate": True,
        "category": "Exact APAAR ID"
    },
    {
        "target": {"student_id": "5", "first_name": "Pooja", "last_name": "Singh", "date_of_birth": "2002-11-05", "institution_id": "inst-1", "phone": "9811223344"},
        "candidate": {"student_id": "6", "first_name": "Singh", "last_name": "Pooja", "date_of_birth": "2002-11-05", "institution_id": "inst-1", "phone": "9811223344"},
        "is_duplicate": True,
        "category": "Inverted Name Order"
    },
    {
        "target": {"student_id": "7", "first_name": "Vikram", "last_name": "Aditya", "date_of_birth": "2004-01-12", "institution_id": "inst-1", "email": "vikram@demo.com"},
        "candidate": {"student_id": "8", "first_name": "Vikram", "last_name": "Adithya", "date_of_birth": "2004-01-12", "institution_id": "inst-1", "email": "vikram@demo.com"},
        "is_duplicate": True,
        "category": "Spelling Typo with same contact"
    },
    {
        "target": {"student_id": "9", "first_name": "Amit", "last_name": "Sharma", "date_of_birth": "2003-05-10", "institution_id": "inst-1"},
        "candidate": {"student_id": "10", "first_name": "Rohit", "last_name": "Sharma", "date_of_birth": "2005-09-18", "institution_id": "inst-1"},
        "is_duplicate": False,
        "category": "Siblings / Same Surname"
    },
    {
        "target": {"student_id": "11", "first_name": "Priya", "last_name": "Patel", "date_of_birth": "2004-08-25", "institution_id": "inst-1"},
        "candidate": {"student_id": "12", "first_name": "Sneha", "last_name": "Patel", "date_of_birth": "2004-08-25", "institution_id": "inst-1"},
        "is_duplicate": False,
        "category": "Same DOB & Surname, Different First Name"
    },
    {
        "target": {"student_id": "13", "first_name": "Kabir", "last_name": "Khan", "date_of_birth": "2002-04-14", "institution_id": "inst-1"},
        "candidate": {"student_id": "14", "first_name": "Ananya", "last_name": "Deshmukh", "date_of_birth": "2004-12-01", "institution_id": "inst-1"},
        "is_duplicate": False,
        "category": "Unrelated Students"
    },
    {
        "target": {"student_id": "15", "first_name": "Manish", "last_name": "Tiwari", "date_of_birth": "2003-10-30", "institution_id": "inst-1"},
        "candidate": {"student_id": "16", "first_name": "Deepak", "last_name": "Joshi", "date_of_birth": "2001-02-19", "institution_id": "inst-1"},
        "is_duplicate": False,
        "category": "Unrelated Students"
    }
]

def evaluate_model(threshold: float = 0.65):
    tp = fp = tn = fn = 0

    print("=" * 65)
    print("      SIH26263 DUPLICATE DETECTION MODEL BENCHMARK")
    print(f"      Threshold: {threshold} (Scores >= {threshold} flagged)")
    print("=" * 65)

    for item in BENCHMARK_DATASET:
        target = StudentRecord(**item["target"])
        candidate = StudentRecord(**item["candidate"])
        ground_truth = item["is_duplicate"]

        score, signals = calculate_duplicate_score(target, candidate)
        predicted = score >= threshold

        if predicted and ground_truth:
            tp += 1
            result = "[TP] Correctly Flagged Duplicate"
        elif predicted and not ground_truth:
            fp += 1
            result = "[FP] False Alarm"
        elif not predicted and not ground_truth:
            tn += 1
            result = "[TN] Correctly Ignored"
        else:
            fn += 1
            result = "[FN] Missed Duplicate"

        print(f"[{item['category']:<26}] Score: {score:<6} -> {result}")

    total = len(BENCHMARK_DATASET)
    accuracy = (tp + tn) / total
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    print("\n" + "=" * 65)
    print("                 CONFUSION MATRIX")
    print("=" * 65)
    print(f"  True Positives (TP) : {tp}  |  False Positives (FP) : {fp}")
    print(f"  False Negatives (FN): {fn}  |  True Negatives (TN)  : {tn}")
    print("-" * 65)
    print("                 FINAL EVALUATION METRICS")
    print("-" * 65)
    print(f"  Accuracy  : {accuracy * 100:.2f}%")
    print(f"  Precision : {precision * 100:.2f}%")
    print(f"  Recall    : {recall * 100:.2f}%")
    print(f"  F1-Score  : {f1 * 100:.2f}%")
    print("=" * 65)

if __name__ == "__main__":
    evaluate_model()
