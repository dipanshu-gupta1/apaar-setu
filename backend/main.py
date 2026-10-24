from fastapi import FastAPI
from app.routes.students import router as students_router
from app.routes.quality import router as quality_router
from app.routes.analytics import router as analytics_router
from app.routes.verification import router as verification_router
from database import supabase

app = FastAPI(
    title="AICTE APAAR-Setu Platform (SIH26263)",
    description="National Integrated Student Data Management, Anomaly Detection & Verification Ecosystem",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "service": "AICTE APAAR-Setu Central Registry",
        "status": "OPERATIONAL",
        "docs_url": "/docs"
    }

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

# All Routers Registered
app.include_router(students_router)
app.include_router(quality_router)
app.include_router(analytics_router)
app.include_router(verification_router)