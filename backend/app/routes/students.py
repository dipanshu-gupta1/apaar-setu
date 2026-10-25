import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from app.models.student import StudentCreate
from database import supabase

router = APIRouter(prefix="/students", tags=["students"])

# Local persistence registry (Active when Supabase is not configured)
LOCAL_REGISTRY = [
    {
        "student_id": "STU-1001",
        "institution_id": "INST-AICTE-101",
        "first_name": "Aarav",
        "last_name": "Sharma",
        "date_of_birth": "2003-04-12",
        "apaar_id": "987654321012",
        "enrollment_number": "SVNIT21CS042",
        "program": "B.Tech Computer Science & Engineering",
        "admission_year": 2021,
        "status": "verified",
        "updated": "2026-10-24",
    },
    {
        "student_id": "STU-1002",
        "institution_id": "INST-AICTE-101",
        "first_name": "Rahul",
        "last_name": "Reddy",
        "date_of_birth": "2002-11-05",
        "apaar_id": "876543210987",
        "enrollment_number": "SVNIT21CS088",
        "program": "B.Tech Electrical Engineering",
        "admission_year": 2022,
        "status": "pending",
        "updated": "2026-10-25",
    },
    {
        "student_id": "STU-1003",
        "institution_id": "INST-AICTE-101",
        "first_name": "Sneha",
        "last_name": "Patel",
        "date_of_birth": "2003-09-18",
        "apaar_id": "765432109876",
        "enrollment_number": "SVNIT21EC015",
        "program": "B.Tech Electronics & Communication",
        "admission_year": 2021,
        "status": "verified",
        "updated": "2026-10-23",
    },
]

@router.post("")
def create_student(
    student: StudentCreate,
    institution_id: str = Query("INST-AICTE-101", description="Institution UUID"),
):
    payload = student.model_dump(exclude_none=True, mode="json")
    payload["institution_id"] = institution_id
    payload["student_id"] = f"STU-{uuid.uuid4().hex[:5].upper()}"
    payload["status"] = "pending"
    payload["updated"] = datetime.now().strftime("%Y-%m-%d")

    if supabase is not None:
        try:
            result = supabase.table("students").insert(payload).execute()
            return {"message": "Student added successfully", "data": result.data}
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    # Add to local registry
    LOCAL_REGISTRY.insert(0, payload)
    return {"message": "Student registered successfully in central registry", "data": [payload]}

@router.get("")
def get_students(institution_id: str = Query("INST-AICTE-101", description="Institution UUID")):
    if supabase is not None:
        try:
            result = (supabase.table("students").select("*")
                      .eq("institution_id", institution_id).execute())
            return result.data
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    return LOCAL_REGISTRY