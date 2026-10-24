from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Gender = Literal["male", "female", "other"]

class StudentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    date_of_birth: date
    gender: Optional[Gender] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    apaar_id: Optional[str] = None
    enrollment_number: Optional[str] = None
    admission_year: Optional[int] = Field(default=None, ge=1900, le=2200)
    program: Optional[str] = None

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
