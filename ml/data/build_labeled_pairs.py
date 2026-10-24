import random
from pathlib import Path
import pandas as pd
from rapidfuzz import fuzz
DATA_DIR = Path(__file__).resolve().parent
STUDENTS_CSV = DATA_DIR / "aicte_students_10k.csv"
PAIRS_CSV = DATA_DIR / "training_pairs_labeled.csv"
def extract_features(s1: dict, s2: dict) -> dict:
    """Extracts ML features without cheating on APAAR ID"""
    name1 = f"{s1['first_name']} {s1['last_name']}".strip().lower()
    name2 = f"{s2['first_name']} {s2['last_name']}".strip().lower()
    f_name_sort = round(fuzz.token_sort_ratio(name1, name2) / 100.0, 4)
    f_name_partial = round(fuzz.partial_ratio(name1, name2) / 100.0, 4)
    
    dob1 = str(s1['date_of_birth'])
    dob2 = str(s2['date_of_birth'])
    f_dob_exact = 1 if dob1 == dob2 else 0
    try:
        y1 = int(dob1.split("-")[0])
        y2 = int(dob2.split("-")[0])
        f_year_diff = round(min(abs(y1 - y2), 10) / 10.0, 2)
    except Exception:
        f_year_diff = 1.0
    # Phone match
    p1 = str(s1.get('phone', ''))
    p2 = str(s2.get('phone', ''))
    if p1 and p2 and p1 != 'nan' and p2 != 'nan':
        f_phone = 1 if p1 == p2 else -1
    else:
        f_phone = 0
    # Enrollment match
    e1 = str(s1.get('enrollment_number', ''))
    e2 = str(s2.get('enrollment_number', ''))
    f_enrollment_exact = 1 if (e1 and e2 and e1 == e2 and e1 != 'nan') else 0
    # Institution match
    f_same_inst = 1 if s1['institution_id'] == s2['institution_id'] else 0
    return {
        "student1_name": f"{s1['first_name']} {s1['last_name']}",
        "student2_name": f"{s2['first_name']} {s2['last_name']}",
        "name_sort_sim": f_name_sort,
        "name_partial_sim": f_name_partial,
        "dob_exact": f_dob_exact,
        "dob_year_diff": f_year_diff,
        "phone_match": f_phone,
        "enrollment_exact": f_enrollment_exact,
        "same_institution": f_same_inst,
    }
def build_pairs_dataset(num_pairs: int = 10000):
    print(f"Reading students from {STUDENTS_CSV.name}...")
    df = pd.read_csv(STUDENTS_CSV)
    records = df.to_dict('records')
    total = len(records)
    pairs = []
    random.seed(42)
    print(f"Generating {num_pairs:,} labeled feature pairs (50% Duplicates / 50% Unique)...")
    # 1. POSITIVE PAIRS: DUPLICATE (5,000 pairs)
    for _ in range(num_pairs // 2):
        orig = random.choice(records)
        dup = orig.copy()
        noise = random.random()
        if noise < 0.25:  # Inverted name
            dup['first_name'], dup['last_name'] = dup['last_name'], dup['first_name']
        elif noise < 0.50:  # Typo in name
            fn = str(dup['first_name'])
            dup['first_name'] = fn[:-1] + ("a" if fn[-1] != "a" else "i")
        elif noise < 0.70:  # Phone changed / updated
            dup['phone'] = f"97{random.randint(10000000, 99999999)}"
        elif noise < 0.85:  # Typo in DOB (off by 1 day)
            dob = str(dup['date_of_birth'])
            dup['date_of_birth'] = dob[:-2] + ("10" if dob[-2:] != "10" else "11")
        feat = extract_features(orig, dup)
        feat["is_duplicate"] = 1  # TARGET LABEL
        pairs.append(feat)
    # 2. NEGATIVE PAIRS: UNIQUE / NON-DUPLICATE (5,000 pairs)
    for _ in range(num_pairs // 2):
        s1 = random.choice(records)
        s2 = random.choice(records)
        while s1['student_id'] == s2['student_id']:
            s2 = random.choice(records)
        feat = extract_features(s1, s2)
        feat["is_duplicate"] = 0  # TARGET LABEL
        pairs.append(feat)
    # Save to CSV
    df_pairs = pd.DataFrame(pairs)
    df_pairs.to_csv(PAIRS_CSV, index=False)
    file_size_mb = PAIRS_CSV.stat().st_size / (1024 * 1024)
    print(f"Successfully generated: {PAIRS_CSV.name} ({len(df_pairs):,} labeled pairs, {file_size_mb:.2f} MB)")
if __name__ == "__main__":
    build_pairs_dataset(10000)