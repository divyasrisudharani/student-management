from fastapi import FastAPI, Request, Body,Security
from fastapi.responses import Response, JSONResponse
import httpx
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
bearer_scheme= HTTPBearer()
app = FastAPI(
    title="Student Management API Gateway",
    description="API Gateway for Auth, Student and Course microservices",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Microservice URLs
AUTH_URL = "http://127.0.0.1:8001"
STUDENT_URL = "http://127.0.0.1:8002"
COURSE_URL = "http://127.0.0.1:8003"


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/", tags=["Gateway"])
async def home():
    return {
        "message": "Student Management API Gateway is running",
        "auth_service": AUTH_URL,
        "student_service": STUDENT_URL,
        "course_service": COURSE_URL,
    }


# --------------------------------------------------
# COMMON REQUEST FORWARDER
# --------------------------------------------------

async def forward_request(
    request: Request,
    service_url: str,
    path: str,
):
    url = f"{service_url.rstrip('/')}/{path.lstrip('/')}"

    # Forward request headers, including the JWT Bearer token
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {
            "host",
            "content-length",
            "connection",
            "transfer-encoding",
            "accept-encoding",
        }
    }

    # Preserve the original request body and query parameters
    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            upstream = await client.request(
                method=request.method,
                url=url,
                params=request.query_params,
                content=body,
                headers=headers,
            )

        # Do not forward transport-specific response headers
        excluded_headers = {
            "content-encoding",
            "content-length",
            "transfer-encoding",
            "connection",
        }

        response_headers = {
            key: value
            for key, value in upstream.headers.items()
            if key.lower() not in excluded_headers
        }

        return Response(
            content=upstream.content,
            status_code=upstream.status_code,
            headers=response_headers,
        )

    except httpx.TimeoutException:
        return JSONResponse(
            status_code=504,
            content={"detail": "Backend service request timed out"},
        )

    except httpx.RequestError:
        return JSONResponse(
            status_code=503,
            content={
                "detail": (
                    "Backend service unavailable. "
                    "Check whether the microservice is running."
                )
            },
        )


# --------------------------------------------------
# AUTHENTICATION SERVICE - PORT 8001
# --------------------------------------------------

@app.post("/auth/register", tags=["Authentication"])
async def register(
    request: Request,
    body: dict = Body(
        ...,
        example={
            "name": "Test Student",
            "email": "student@example.com",
            "password": "Student123!",
        },
    ),
):
    return await forward_request(
        request, AUTH_URL, "auth/register"
    )


@app.post("/auth/login", tags=["Authentication"])
async def login(
    request: Request,
    body: dict = Body(
        ...,
        example={
            "email": "student@example.com",
            "password": "Student123!",
        },
    ),
):
    return await forward_request(
        request, AUTH_URL, "auth/login"
    )


@app.get("/auth/me", tags=["Authentication"])
async def get_current_user(
    request: Request,
    credentials=Security(bearer_scheme),
):
    return await forward_request(
        request, AUTH_URL, "auth/me"
    )


# --------------------------------------------------
# STUDENT SERVICE - PORT 8002
# --------------------------------------------------

@app.post("/students", tags=["Students"])
async def create_student(
    request: Request,
    body: dict = Body(
        ...,
        example={
            "name": "Ravi Kumar",
            "email": "ravi@example.com",
            "phone": "9876543210",
            "department": "Computer Science",
            "course": "Python",
        },
    ),
):
    return await forward_request(
        request, STUDENT_URL, "students"
    )


@app.get("/students", tags=["Students"])
async def get_students(request: Request):
    return await forward_request(
        request, STUDENT_URL, "students"
    )


@app.get("/students/{student_id}", tags=["Students"])
async def get_student(
    student_id: int,
    request: Request,
):
    return await forward_request(
        request, STUDENT_URL, f"students/{student_id}"
    )


@app.put("/students/{student_id}", tags=["Students"])
async def update_student(
    student_id: int,
    request: Request,
    body: dict = Body(
        ...,
        example={
            "name": "Ravi Kumar",
            "email": "ravi@example.com",
            "phone": "9876543210",
            "department": "Computer Science",
            "course": "Python",
        },
    ),
):
    return await forward_request(
        request, STUDENT_URL, f"students/{student_id}"
    )


@app.delete("/students/{student_id}", tags=["Students"])
async def delete_student(
    student_id: int,
    request: Request,
):
    return await forward_request(
        request, STUDENT_URL, f"students/{student_id}"
    )


# --------------------------------------------------
# COURSE SERVICE - PORT 8003
# --------------------------------------------------

@app.post("/courses", tags=["Courses"])
async def create_course(
    request: Request,
    body: dict = Body(
        ...,
        example={
            "name": "Python Programming",
            "description": "Learn Python fundamentals",
            "department": "Computer Science",
            "duration": "3 months",
            "fee": 5000,
        },
    ),
):
    return await forward_request(
        request, COURSE_URL, "courses"
    )


@app.get("/courses", tags=["Courses"])
async def get_courses(request: Request):
    return await forward_request(
        request, COURSE_URL, "courses"
    )


@app.get("/courses/{course_id}", tags=["Courses"])
async def get_course(
    course_id: int,
    request: Request,
):
    return await forward_request(
        request, COURSE_URL, f"courses/{course_id}"
    )


@app.put("/courses/{course_id}", tags=["Courses"])
async def update_course(
    course_id: int,
    request: Request,
    body: dict = Body(
        ...,
        example={
            "name": "Python Programming",
            "description": "Updated course description",
            "department": "Computer Science",
            "duration": "4 months",
            "fee": 6000,
        },
    ),
):
    return await forward_request(
        request, COURSE_URL, f"courses/{course_id}"
    )


@app.delete("/courses/{course_id}", tags=["Courses"])
async def delete_course(
    course_id: int,
    request: Request,
):
    return await forward_request(
        request, COURSE_URL, f"courses/{course_id}"
    )

@app.get(
    "/courses/{course_id}/students",
    tags=["Enrollments"],
)
async def get_course_students(
    course_id: int,
    request: Request,
):
    return await forward_request(
        request,
        COURSE_URL,
        f"courses/{course_id}/students",
    )
# --------------------------------------------------
# ENROLLMENTS - COURSE SERVICE
# --------------------------------------------------

@app.post("/enrollments", tags=["Enrollments"])
async def create_enrollment(
    request: Request,
    body: dict = Body(
        ...,
        example={
            "student_id": 1,
            "course_id": 1,
        },
    ),
):
    return await forward_request(
        request, COURSE_URL, "enrollments"
    )


@app.get(
    "/courses/{course_id}/students",
    tags=["Enrollments"],
)
async def get_course_students(
    course_id: int,
    request: Request,
):
    return await forward_request(
        request,
        COURSE_URL,
        f"courses/{course_id}/students",
    )
@app.delete(
    "/enrollments/{enrollment_id}",
    tags=["Enrollments"],
)
async def delete_enrollment(
    enrollment_id: int,
    request: Request,
):
    return await forward_request(
        request,
        COURSE_URL,
        f"enrollments/{enrollment_id}",
    )