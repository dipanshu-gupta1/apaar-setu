import csv
import uuid
import random
from pathlib import Path
DATA_DIR = Path(__file__).resolve().parent
CSV_PATH = DATA_DIR / "aicte_students_10k.csv"
PROGRAMS = [
    ("B.Tech Computer Science and Engineering", "CSE"),
    ("B.Tech Electronics & Communication Engineering", "ECE"),
    ("B.Tech Mechanical Engineering", "MECH"),
    ("B.Tech Information Technology", "IT"),
    ("B.Tech Civil Engineering", "CIVIL"),
    ("Master of Computer Applications", "MCA")
]
FIRST_NAMES_MALE = [
    "Aarav", "Rohan", "Vikram", "Amit", "Deepak", "Rahul", "Karthik", "Suresh",
    "Venkatesh", "Subhash", "Debashis", "Tanmoy", "Prathamesh", "Siddharth",
    "Mohammad", "Tariq", "Harpreet", "Arjun", "Aditya", "Sanjay", "Manoj",
    "Rajesh", "Naveen", "Ashwin", "Ganesh", "Chirag", "Jatin", "Kunal"
]
FIRST_NAMES_FEMALE = [
    "Pooja", "Sneha", "Priya", "Ananya", "Meenakshi", "Anuradha", "Shruti",
    "Fatima", "Manpreet", "Neha", "Divya", "Kavita", "Swati", "Geeta",
    "Sunita", "Lakshmi", "Bhavana", "Anita", "Ritu", "Deepika", "Shalini"
]
LAST_NAMES = [
    "Sharma", "Verma", "Singh", "Patel", "Gupta", "Joshi", "Kumar", "Nair", "Mehta", "Khan",
    "Iyer", "Rao", "Reddy", "Banerjee", "Mukherjee", "Kulkarni", "Deshmukh", "Kaur", "Gill",
    "Bose", "Dutta", "Bhat", "Hegde", "Pillai", "Menon", "Chauhan", "Yadav", "Pandey", "Mishra"
]
def generate_csv(total_records: int = 10000):
    random.seed(42)
    rows = []
    print(f"Generating {total_records} authentic AICTE student records...")
    for i in range(total_records):
        student_id = str(uuid.uuid4())
        is_female = random.random() < 0.35
        gender = "female" if is_female else "male"
        fn = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
        ln = random.choice(LAST_NAMES)
        birth_year = random.randint(2001, 2006)
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        dob = f"{birth_year}-{birth_month:02d}-{birth_day:02d}"
        phone = f"98{random.randint(10000000, 99999999)}" if random.random() > 0.05 else ""
        email = f"{fn.lower()}.{ln.lower()}{random.randint(1, 999)}@gmail.com" if random.random() > 0.05 else ""
        has_apaar = random.random() < 0.30
        apaar_id = f"APAAR-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}" if has_apaar else ""
        inst_id = str(uuid.UUID(int=random.randint(1, 10)))
        prog_name, prog_code = random.choice(PROGRAMS)
        adm_year = random.randint(2021, 2024)
        enrollment_no = f"{prog_code}/{adm_year}/{random.randint(1001, 9999)}"
        rows.append([
            student_id, fn, ln, dob, gender, email, phone,
            apaar_id, inst_id, enrollment_no, adm_year, prog_name
        ])
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    header = [
        "student_id", "first_name", "last_name", "date_of_birth", "gender",
        "email", "phone", "apaar_id", "institution_id", "enrollment_number",
        "admission_year", "program"
    ]
    with open(CSV_PATH, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"Successfully created: {CSV_PATH.name} ({len(rows):,} rows)")
if __name__ == "__main__":
    generate_csv(10000)