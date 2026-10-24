from fastapi import FastAPI
from app.routes.students import router as students_router
from app.routes.quality import router as quality_router
from database import supabase

app = FastAPI(title="SIH26263 Backend", version="0.1.0")

@app.get("/")
def home():
    return {"message": "SIH26263 Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "sih26263-backend"}

@app.get("/db-health")
def db_health():
    if supabase is None:
        return {"status": "not_configured"}
    try:
        supabase.table("students").select("student_id").limit(1).execute()
        return {"status": "database_connected"}
    except Exception as exc:
        return {"status": "database_error", "detail": str(exc)}

app.include_router(students_router)
app.include_router(quality_router)
