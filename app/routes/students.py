from fastapi import APIRouter, HTTPException, Query
from app.models.student import StudentCreate
from database import supabase

router = APIRouter(prefix="/students", tags=["students"])

@router.post("")
def create_student(
    student: StudentCreate,
    institution_id: str = Query(..., description="Institution UUID"),
):
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    payload = student.model_dump(exclude_none=True, mode="json")
    payload["institution_id"] = institution_id
    try:
        result = supabase.table("students").insert(payload).execute()
        return {"message": "Student added successfully", "data": result.data}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("")
def get_students(institution_id: str = Query(..., description="Institution UUID")):
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        result = (supabase.table("students").select("*")
                  .eq("institution_id", institution_id).execute())
        return result.data
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
