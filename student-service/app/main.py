from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Student
from app.schemas import StudentCreate, StudentUpdate, StudentResponse

app = FastAPI(
    title="Student Management Service",
    description="API for managing student records",
    version="1.0.0",
)

# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {"message": "Student Service is running"}


# Create a student
@app.post(
    "/students",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
):
    existing_student = (
        db.query(Student)
        .filter(Student.email == str(student_data.email).lower())
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student email already exists",
        )

    student = Student(
        name=student_data.name,
        email=str(student_data.email).lower(),
        phone=student_data.phone,
        department=student_data.department,
        course=student_data.course,
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return student


# Retrieve all students
@app.get("/students", response_model=list[StudentResponse])
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).order_by(Student.id).all()


# Retrieve one student
@app.get("/students/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return student


# Update a student
@app.put("/students/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    email = str(student_data.email).lower()

    duplicate = (
        db.query(Student)
        .filter(Student.email == email, Student.id != student_id)
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another student already uses this email",
        )

    student.name = student_data.name
    student.email = email
    student.phone = student_data.phone
    student.department = student_data.department
    student.course = student_data.course

    db.commit()
    db.refresh(student)

    return student


# Delete a student
@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    db.delete(student)
    db.commit()

    return {"message": "Student deleted successfully"}