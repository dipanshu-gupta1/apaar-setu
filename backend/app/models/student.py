from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Gender = Literal["male", "female", "other"]

class StudentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    
    # 1. Identity & Academic Identifier (Requirement #1 & #6)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    date_of_birth: date
    gender: Optional[Gender] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    apaar_id: Optional[str] = Field(None, description="12-digit unique national APAAR ID")
    enrollment_number: Optional[str] = None
    admission_year: Optional[int] = Field(default=None, ge=1900, le=2200)
    program: Optional[str] = None

    # 2. AICTE Mandatory Quota & Intake Fields (Requirement #2)
    approved_intake: Optional[int] = Field(default=60, ge=1, description="AICTE Approved Program Intake Capacity")
    is_supernumerary: bool = Field(default=False, description="Supernumerary quota seat (TFWS, J&K, PMSSS, etc.)")
    is_nri: bool = Field(default=False, description="Non-Resident Indian (NRI) Quota Status")
    is_oci: bool = Field(default=False, description="Overseas Citizen of India Status")
    is_fn: bool = Field(default=False, description="Foreign National (FN) Category")
    category: Optional[str] = Field(default="General", description="Social reservation category (General/OBC/SC/ST/EWS)")

    @field_validator("phone")
    @classmethod
    def phone_must_be_10_digits(cls, value):
        if value is not None and (len(value) != 10 or not value.isdigit()):
            raise ValueError("phone must contain exactly 10 digits")
        return value

class StudentResponse(StudentCreate):
    student_id: str
    institution_id: str

class StudentRecord(StudentCreate):
    student_id: str
    institution_id: str