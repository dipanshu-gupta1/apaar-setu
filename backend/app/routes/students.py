import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from app.models.student import StudentCreate
from database import supabase

router = APIRouter(prefix="/students", tags=["students"])

LOCAL_REGISTRY = [
    {
        "student_id": "STU-409AC",
        "institution_id": "INST-AICTE-101",
        "first_name": "Dipanshu",
        "last_name": "Gupta",
        "date_of_birth": "2004-03-12",
        "apaar_id": "123456785234",
        "enrollment_number": "SVNIT24CS001",
        "program": "B.Tech Computer Science and Engineering",
        "admission_year": 2024,
        "status": "verified",
        "updated": "2026-10-25",
    },
    {
        "student_id": "STU-F445A",
        "institution_id": "INST-AICTE-101",
        "first_name": "Vibha",
        "last_name": "Manocha",
        "date_of_birth": "2004-07-19",
        "apaar_id": "987654322321",
        "enrollment_number": "SVNIT24CS002",
        "program": "B.Tech Computer Science and Engineering",
        "admission_year": 2024,
        "status": "correction_needed",
        "updated": "2026-10-25",
    },
    {
        "student_id": "STU-0F844",
        "institution_id": "INST-AICTE-101",
        "first_name": "Mukul",
        "last_name": "Sahu",
        "date_of_birth": "2004-10-05",
        "apaar_id": "876543217564",
        "enrollment_number": "SVNIT24AIML01",
        "program": "B.Tech Artificial Intelligence & Machine Learning",
        "admission_year": 2024,
        "status": "verified",
        "updated": "2026-10-25",
    },
    {
        "student_id": "STU-2AB80",
        "institution_id": "INST-AICTE-101",
        "first_name": "Sonu",
        "last_name": "Mittal",
        "date_of_birth": "2003-12-14",
        "apaar_id": "998877665544",
        "enrollment_number": "SVNIT24CS045",
        "program": "B.Tech Computer Science and Engineering",
        "admission_year": 2024,
        "status": "verified",
        "updated": "2026-10-25",
    },
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

@router.patch("/{student_id}/status")
def update_student_status(
    student_id: str,
    status: str = Query(..., description="verified / correction_needed / failed"),
):
    """Allows Verification Officer to approve or reject pending student records"""
    if supabase is not None:
        try:
            result = supabase.table("students").update({"status": status}).eq("student_id", student_id).execute()
            return {"message": f"Student status updated to {status}", "data": result.data}
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    for s in LOCAL_REGISTRY:
        if s.get("student_id") == student_id:
            s["status"] = status
            return {"message": f"Student status updated to {status}", "data": [s]}

    raise HTTPException(status_code=404, detail="Student not found")

@router.patch("/{student_id}")
def update_student(
    student_id: str,
    updates: dict,
):
    """Updates student record in Supabase upon approved discrepancy resolution"""
    updates["updated"] = datetime.now().strftime("%Y-%m-%d")

    if supabase is not None:
        try:
            result = supabase.table("students").update(updates).eq("student_id", student_id).execute()
            return {"message": "Student record updated successfully in Supabase", "data": result.data}
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    for s in LOCAL_REGISTRY:
        if s.get("student_id") == student_id:
            s.update(updates)
            return {"message": "Student record updated in local registry", "data": [s]}

    raise HTTPException(status_code=404, detail="Student not found")
