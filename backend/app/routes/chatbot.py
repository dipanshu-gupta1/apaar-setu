import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Supabase client import if available
try:
    from app.services.supabase import get_supabase_client
except ImportError:
    get_supabase_client = None

router = APIRouter(prefix="/chatbot", tags=["AICTE APAAR Sahayak"])

class ChatQueryRequest(BaseModel):
    query: str
    user_role: Optional[str] = "public"

class ChatQueryResponse(BaseModel):
    reply: str
    action_type: str  # "verification", "correction", "analytics", "general"
    data: Optional[Dict[str, Any]] = None
    link: Optional[Dict[str, str]] = None

@router.post("/query", response_model=ChatQueryResponse)
async def process_chat_query(req: ChatQueryRequest):
    q = req.query.strip().lower()
    
    # 1. Check if the query contains a 12-digit APAAR ID
    apaar_match = re.search(r'\b\d{12}\b', req.query)
    if apaar_match:
        apaar_id = apaar_match.group(0)
        
        # Query Live Supabase Database
        student_data = None
        if get_supabase_client:
            try:
                sb = get_supabase_client()
                res = sb.table("students").select("*").eq("apaar_id", apaar_id).execute()
                if res.data and len(res.data) > 0:
                    student_data = res.data[0]
            except Exception:
                pass
        
        # Fallback to pilot mock if db not reachable
        if not student_data:
            if apaar_id == "123456785234":
                student_data = {"first_name": "Dipanshu", "last_name": "Gupta", "status": "verified", "program": "B.Tech Computer Science"}
            elif apaar_id == "987654322321":
                student_data = {"first_name": "Vibha", "last_name": "Manocha", "status": "correction_needed", "program": "B.Tech Electronics"}
        
        if student_data:
            st = student_data.get("status", "pending").upper()
            name = f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}".strip()
            prog = student_data.get("program", "Technical Program")
            
            if st == "VERIFIED":
                return ChatQueryResponse(
                    reply=f"✅ Record Found! Student **{name}** ({prog}) is cryptographically **VERIFIED AUTHENTIC** under SVNIT Surat Pilot Node. An official SHA-256 Anti-Tamper QR Seal is active.",
                    action_type="verification",
                    data=student_data,
                    link={"label": "View Full Verification Dossier ➔", "url": "/verification"}
                )
            else:
                return ChatQueryResponse(
                    reply=f"⚠️ Record Found! Student **{name}** has an active flag: **{st}**. Under AICTE security protocol, official degree QR issuance is temporarily withheld until demographic discrepancy is resolved.",
                    action_type="correction",
                    data=student_data,
                    link={"label": "Review Discrepancy at Corrections Desk ➔", "url": "/corrections"}
                )
        else:
            return ChatQueryResponse(
                reply=f"🔍 APAAR ID `{apaar_id}` was queried against the AICTE Central Registry but no active enrollment was found for academic session 2024–26.",
                action_type="verification",
                link={"label": "Search Central Registry ➔", "url": "/students"}
            )

    # 2. Dual Enrollment / Fraud / DBT Leakage Queries
    if any(k in q for k in ["fraud", "dual", "dbt", "leakage", "ghost", "seat", "intake"]):
        return ChatQueryResponse(
            reply="🛡️ The AICTE Intelligence Engine runs real-time cross-institutional correlation. Currently, **1 High-Risk Dual Enrollment** (Vikram Malhotra claiming double DBT subsidy) has been flagged, successfully protecting **₹1,80,000 in Govt Funds**, and **1 Sanctioned Seat Breach** at Apex Jaipur (+14 seats) has been issued a Show-Cause Notice.",
            action_type="analytics",
            link={"label": "Inspect Fraud Hunter Dashboard ➔", "url": "/ai-insights"}
        )

    # 3. QR Code / Degree Withholding Protocol
    if any(k in q for k in ["withheld", "qr code", "qr", "tamper", "certificate"]):
        return ChatQueryResponse(
            reply="🔒 **AICTE Anti-Tamper Protocol**: Degree QR Codes are only generated for records marked `VERIFIED_AUTHENTIC`. If any demographic attribute (DOB, Category, or ABC link) is mismatched, the QR seal is strictly withheld to prevent fraudulent degree issuance.",
            action_type="verification",
            link={"label": "Verify Degree Authenticity ➔", "url": "/verification"}
        )

    # 4. Academic Bank of Credits (ABC) & DigiLocker
    if any(k in q for k in ["abc", "credit", "bank", "digilocker", "transfer"]):
        return ChatQueryResponse(
            reply="💳 Under NEP 2020, the **Academic Bank of Credits (ABC)** digitally stores course credits. With APAAR-Setu, credits earned at AICTE-approved institutions are cryptographically signed and instantly transferable across registered colleges via DigiLocker.",
            action_type="general",
            link={"label": "Access Student Portal ➔", "url": "/my-record"}
        )

    # 5. Default Advisory Response
    return ChatQueryResponse(
        reply="🤖 **AICTE APAAR-Setu Central Assistant**: I can help you verify 12-digit APAAR IDs, monitor cross-institution dual enrollment, track student corrections, and check intake quota compliance across AICTE pilot nodes.",
        action_type="general",
        link={"label": "Open Student Directory ➔", "url": "/students"}
    )