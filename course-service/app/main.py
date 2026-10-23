from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx

from app.database import Base, engine, get_db
from app.models import Course, Enrollment
from app.schemas import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    EnrollmentCreate,
    EnrollmentResponse,
)

app = FastAPI(
    title="Course Management Service",
    description="Manage courses and student enrollments",
    version="1.0.0",
)

Base.metadata.create_all(bind=engine)

STUDENT_SERVICE_URL = "http://127.0.0.1:8002"


@app.get("/")
def home():
    return {"message": "Course Service is running"}


# Create a course
@app.post("/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Course)
        .filter(Course.name == course_data.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Course already exists",
        )

    course = Course(**course_data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)

    return course


# Retrieve all courses
@app.get("/courses", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.id).all()


# Retrieve one course
@app.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    return course


# Update a course
@app.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    duplicate = (
        db.query(Course)
        .filter(Course.name == course_data.name, Course.id != course_id)
        .first()
    )

    if duplicate:
        raise HTTPException(status_code=409, detail="Course name already exists")

    for field, value in course_data.model_dump().items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)

    return course


# Delete a course
@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    db.query(Enrollment).filter(
        Enrollment.course_id == course_id
    ).delete()

    db.delete(course)
    db.commit()

    return {"message": "Course deleted successfully"}


# Enroll a student in a course
@app.post(
    "/enrollments",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def enroll_student(
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
):
    course = (
        db.query(Course)
        .filter(Course.id == enrollment_data.course_id)
        .first()
    )

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == enrollment_data.student_id,
            Enrollment.course_id == enrollment_data.course_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Student is already enrolled in this course",
        )

    # Verify that the student exists in the Student Service.
    try:
        response = httpx.get(
            f"{STUDENT_SERVICE_URL}/students/{enrollment_data.student_id}",
            timeout=5.0,
        )
        if response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )
        response.raise_for_status()

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail="Student Service returned an error",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail="Student Service is unavailable. Ensure port 8002 is running.",
        ) from exc

    enrollment = Enrollment(**enrollment_data.model_dump())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return enrollment


# Retrieve students enrolled in a particular course
@app.get("/courses/{course_id}/students")
def get_enrolled_students(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.course_id == course_id)
        .all()
    )

    students = []

    for enrollment in enrollments:
        try:
            response = httpx.get(
              f"{STUDENT_SERVICE_URL}/students/{enrollment.student_id}",timeout=5.0,)
                 

            print("Enrollment student ID:", enrollment.student_id)
            print("Student URL:", response.request.url)
            print("Student response:", response.status_code, response.text)

            response.raise_for_status()
            student_data = response.json()
            student_data["enrollment_id"] = enrollment.id
            students.append(student_data)

        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=503,
                detail="Student Service is unavailable",
            ) from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                continue

            raise HTTPException(
                status_code=502,
                detail="Could not retrieve a student record",
            ) from exc

    return {
        "course_id": course_id,
        "course_name": course.name,
        "students": students,
    }
# Delete a student enrollment
@app.delete("/enrollments/{enrollment_id}")
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
):
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.id == enrollment_id)
        .first()
    )

    if enrollment is None:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found",
        )

    db.delete(enrollment)
    db.commit()

    return {
        "message": "Enrollment deleted successfully",
        "enrollment_id": enrollment_id,
    }