from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    department = Column(String(100), nullable=False)
    duration = Column(String(50), nullable=False)
    fee = Column(Float, nullable=False, default=0.0)


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    course_id = Column(Integer, nullable=False, index=True)