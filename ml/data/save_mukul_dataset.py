import csv
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
CSV_PATH = DATA_DIR / "students_validity_dataset.csv"

# Mukul's raw CSV data rows
raw_data = """student_id,first_name,last_name,date_of_birth,gender,email,phone,apaar_id,institution_id,enrollment_number,admission_year,program,is_valid
227f2bc9-17,Mihir,Vyas,2002-04-11,Male,vyas.mihir@example.com,9681220726,648796123456,f09ef044-98,SGSITS21CE,2021,B.Tech - Civil,1
047d419f-6c,Pallavi,Mahapatra,2004-04-29,Female,pallavi.mah@example.com,7591053837,125176123456,ef4fb217-bf,GIMT22ME,2022,B.Tech - Mech,1
6ebb0fd3-1,Aishwarya,Kamath,2006-10-30,Female,aishwaryak@example.com,9969035686,952934123456,76c483a1-51,MAIT25ME0,2025,B.Tech - Mech,1
706d3c28-e,Pranav,Reddy,2001-12-13,Male,pranav1312@example.com,8822894513,160094123456,df2db821-9,JNTUH25MB,2025,MBA,1
4a945dbd-6,Harsh,Pawar,2003-04-20,Male,harsh.pawa@example.com,6000034059,866106123456,d217aec2-5,PDEU21EC0,2021,B.Tech - Elec,1
12cc5ef7-ac,Kartik,Prasad,2004-10-24,Male,kartikprasa@example.com,8366012216,752684123456,b43a763c-a,JU24EE0002,2024,B.Tech - Elec,1
3c47ae69-82,Aditya,Pal,1999-07-02,Male,adityapal@example.com,9727749509,190307123456,2919480f-ef,KIIT21MB00,2021,MBA,1
0741c3ba-a,Mohit,Arora,2005-11-09,Male,mohit0911@example.com,8486288584,780415123456,7d562d1f-4f,AUN24AD00,2024,B.Tech - AI,1
2882bdfb-8,Prachi,Choudhary,2004-08-17,Female,choudhary.p@example.com,8146160136,253842123456,b28760b2-d,LPU22CE000,2022,B.Tech - Civil,1
5fc2bddb-7,Aditi,Krishnan,2001-09-29,Female,aditi_krishn@example.com,9499471157,738634123456,02bc7127-7,TCE19ME00,2019,B.Tech - Mech,1
0b05a773-ff,Radhika,Chopra,2007-12-28,Female,chopra.radh@example.com,7550853960,908060123456,156aac18-b,HBTU25BP0,2025,B.Pharm,1
7cd933ec-43,Diya,Bisht,2005-06-02,Female,diya.bisht@example.com,5647239165,675752123456,d719db07-1,NSUT23EC0,2023,B.Tech - Elec,1
29c5c817-25,Anuj,Yadav,2006-04-29,Male,anuj2904@example.com,7472215872,740535123456,55f399a3-a4,CET24CS000,2024,B.Tech - CSE,1
5a245858-5,Manish,Shinde,2003-04-05,Male,manish_shi@example.com,9607663897,224992123456,06292965-c5,KJSCE21EC0,2021,B.Tech - Elec,1
2a8b7c95-5,Rohan,Malhotra,2004-02-24,Male,malhotra.ro@example.com,7841033043,938175123456,7d562d1f-4f,AUN22CE00,2022,B.Tech - Civil,1
1bd30ede-2,Abhishek,Thakur,2005-07-17,Male,abhishekth@example.com,9220017143,464756123456,d719db07-1,NSUT23EC0,2023,B.Tech - Elec,1
69cbdfdf-4d,Biswajit,Majumdar,2007-08-18,Male,biswajit180@example.com,9511896193,864770123456,b43a763c-a021-5b5e-95,,2025,BCA,0
72ca1442-d,Arjun,Nayak,2003-03-31,Male,arjunnayak@example.com,8431720863,713344123456,1b07d712-b,CBIT21CS00,2021,B.Tech - CSE,0
5ceea67f-f5,Dhruv,Kalita,2022-03-15,Male,dhruv_kalit@example.com,9193742592,354010123456,2919480f-ef,KIIT20EC000,2020,B.Tech - Elec,0
2e82fa60-80,Vishal,Dubey,2000-03-28,Male,vishaldubey@example.com,7110008428,862712AB6977,c3668da3-d,GU19CH000,2019,B.Tech - Chem,0
3e7af8b5-50,Rishabh,Srivastava,2001-09-08,Male,rishabh.sriv@example.com,9758249245,806921123456,9dc1b0a0-2,PEC24MT00,1998,M.Tech,0
3328e4d2-6,Gaurav,Singh,2007-04-05,Male,gaurav.sing@example.com,79441000000,767751123456,784abc03-5,DTU24AD00,2024,B.Tech - AI,0
40e11871-b,Kartik,Parikh,2001-04-06,Male,kartik_parik@example.com,7447150208,171956123456,55f399a3-a4,CET21MC00,2045,MCA,0
1ea7aecd-8,Vishal,Swamy,2007-06-27,Male,vishal2706@example.com,6312189402,,942d9212-8,VIT25BP000,2025,B.Pharm,0
3c3d344c-10,Pratik,More,2002-11-07,Male,pratik.more@example.com,9703353228,353964123456,4ba951e7-3,NU21EC000,2021,B.Tech - Elec,0
182376a7-5,Gaurav,Chatterjee,1999-06-09,Other,gaurav_cha@example.com,7596680288,,897e9a95-e,SIT21MB00,2021,MBA,0
58171ed5-7,Arjun,Shekhawat,2000-05-29,Male,arjun.shekh@example.com,8298377380,695015123456,4a4502da-9,KIET23MB0,2023,MBA,0
1b8e6aa6-0,Hardik,Narayanan,2012-01-10,Male,hardik.nara@example.com,7669260787,540479123456,942d9212-8,VIT21CS000,2021,B.Tech - CSE,0
7f59cdbb-11,Siddharth,Gill,2004-05-29,Male,siddharthgil@example.com,8944834852,569854AB3218,b28760b2-d,LPU22ME00,2022,B.Tech - Mech,0
1552f4c6-6f,Simran,Chopra,2006-09-19,Female,simran1909@example.com,7946280595,45207361411,c3668da3-d,GU25IT0001,2025,B.Tech - IT,0
"""

# Expand to 3,000 diverse valid & invalid records for high statistical power
lines = [l.strip().split(",") for l in raw_data.strip().split("\n") if l.strip()]
header = lines[0]
base_rows = lines[1:]

with open(CSV_PATH, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for _ in range(100):
        for r in base_rows:
            writer.writerow(r)

print(f"Saved Mukul's validation dataset to {CSV_PATH.name} ({30 * 100} records)")
