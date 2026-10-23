Student Management System – Microservices

Project Overview

The Student Management System is a full-stack application built using a microservices architecture. It allows users to register and log in, manage student records, manage courses, and enroll students in courses.

Technology Stack

Frontend

- React
- Vite
- JavaScript
- Axios

Backend

- Python
- FastAPI
- REST APIs
- Uvicorn
- HTTPX

Database

- SQLite
- SQLAlchemy

Authentication

- JWT-based authentication

Project Structure

student-management/
├── frontend/
├── api-gateway/
├── auth-service/
├── student-service/
├── course-service/
├── postman/
├── venv/
└── README.md

Main Features

- User registration and login
- Student CRUD operations
- Course CRUD operations
- Student enrollment in courses
- View enrolled students by course
- API Gateway for routing requests to backend services
- React-based dashboard

Services and Ports

Service| Port
Frontend| 5173
API Gateway| 8000
Auth Service| 8001
Student Service| 8002
Course Service| 8003

Setup Instructions

1. Activate the virtual environment:

From the project root in Windows Command Prompt:

venv\Scripts\activate

2. Start the Auth Service:

cd auth-service
uvicorn app.main:app --reload --port 8001

3. Start the Student Service:

In a separate terminal:

cd student-service
uvicorn app.main:app --reload --port 8002

4. Start the Course Service:

In a separate terminal:

cd course-service
uvicorn app.main:app --reload --port 8003

5. Start the API Gateway:

In a separate terminal:

cd api-gateway
uvicorn main:app --reload --port 8000

6. Start the Frontend:

In another terminal:

cd frontend
npm install
npm run dev

Open the frontend URL displayed by Vite, usually "http://localhost:5173".

API Documentation

Open the Swagger documentation for each running service:

- API Gateway: http://127.0.0.1:8000/docs
- Auth Service: http://127.0.0.1:8001/docs
- Student Service: http://127.0.0.1:8002/docs
- Course Service: http://127.0.0.1:8003/docs

Enrollment Workflow

1. Register and log in.
2. Create student records.
3. Create course records.
4. Enroll a student using the enrollment API.
5. Select a course in the dashboard to view its enrolled students.

Author
Student Management System Project