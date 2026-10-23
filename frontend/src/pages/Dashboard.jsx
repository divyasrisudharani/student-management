import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const emptyStudent = {
  name: "",
  email: "",
  phone: "",
  department: "",
  course: "",
};

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  if (error.response?.status === 401) {
    return "Your session may have expired. Please log in again.";
  }

  if (error.response?.status === 503) {
    return "A backend service is unavailable. Check that all services are running.";
  }

  return fallback;
}

function Dashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentForm, setStudentForm] = useState({ ...emptyStudent });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedEnrollmentCourse, setSelectedEnrollmentCourse] = useState("");
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState("");
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, courseResponse] = await Promise.all([
        api.get("/students"),
        api.get("/courses"),
      ]);

      setStudents(
        Array.isArray(studentResponse.data)
          ? studentResponse.data
          : []
      );

      setCourses(
        Array.isArray(courseResponse.data)
          ? courseResponse.data
          : []
      );
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to load students and courses. Check the API Gateway and backend services."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  const loadEnrolledStudents = async (courseId) => {
    if (!courseId) {
    setEnrolledStudents([]);
      return;
    }

    setEnrollmentLoading(true);
    setEnrollmentError("");

    try {
      const response = await api.get(
      `/courses/${courseId}/students`);

      const data = response.data;

    // Support either a direct array or the response format
    // { course_id, course_name, students: [...] }.
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.students)
        ? data.students
        : [];

      setEnrolledStudents(list);
    } catch (err) {
      console.error("Load enrolled students error:", err);
      setEnrolledStudents([]);
      setEnrollmentError(
        err.response?.data?.detail ||
        "Unable to load enrolled students. Check the API Gateway.");
    } finally {
      setEnrollmentLoading(false);
  }
};

  const handleStudentChange = (event) => {
    const { name, value } = event.target;

    setStudentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setStudentForm({ ...emptyStudent });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!studentForm.course) {
      setError("Please select a course.");
      return;
    }

    setSaving(true);

    const payload = {
      name: studentForm.name.trim(),
      email: studentForm.email.trim(),
      phone: studentForm.phone.trim(),
      department: studentForm.department.trim(),
      course: studentForm.course,
    };

    try {
      if (editingId === null) {
        await api.post("/students", payload);
        setMessage("Student added successfully!");
      } else {
        await api.put(`/students/${editingId}`, payload);
        setMessage("Student details updated successfully!");
      }

      resetForm();
      await loadDashboard();
    } catch (err) {
      console.error("Saving student error:", err);
      setError(
        getErrorMessage(
          err,
          "Unable to save student details. Check the entered information."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student) => {
    setError("");
    setMessage("");

    setStudentForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      department: student.department || "",
      course: student.course || "",
    });

    setEditingId(student.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/students/${student.id}`);

      if (editingId === student.id) {
        resetForm();
      }

      setMessage("Student deleted successfully!");
      await loadDashboard();
    } catch (err) {
      console.error("Deleting student error:", err);
      setError(
        getErrorMessage(err, "Unable to delete this student.")
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Student Management System</h1>
          <p style={styles.subtitle}>
            Manage student records and view available courses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={styles.logout}
        >
          Logout
        </button>
      </header>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      {message && (
        <div role="status" style={styles.success}>
          {message}
        </div>
      )}

      <section style={styles.cards}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Students</h3>
          <p style={styles.number}>{students.length}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Courses</h3>
          <p style={styles.number}>{courses.length}</p>
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>
          {editingId === null ? "Add Student" : `Edit Student #${editingId}`}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            name="name"
            placeholder="Student name"
            value={studentForm.name}
            onChange={handleStudentChange}
            style={styles.input}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={studentForm.email}
            onChange={handleStudentChange}
            style={styles.input}
            required
          />

          <input
            name="phone"
            placeholder="Phone number"
            value={studentForm.phone}
            onChange={handleStudentChange}
            style={styles.input}
          />

          <input
            name="department"
            placeholder="Department"
            value={studentForm.department}
            onChange={handleStudentChange}
            style={styles.input}
            required
          />

          <select
            name="course"
            value={studentForm.course}
            onChange={handleStudentChange}
            style={styles.input}
            required
          >
            <option value="">Select a course</option>

            {studentForm.course &&
              !courses.some(
                (course) => course.name === studentForm.course
              ) && (
                <option value={studentForm.course}>
                  {studentForm.course} (existing)
                </option>
              )}

            {courses.map((course) => (
              <option key={course.id} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>

          <div style={styles.formActions}>
            <button
              type="submit"
              style={styles.primary}
              disabled={saving || loading}
            >
              {saving
                ? "Saving..."
                : editingId === null
                ? "Add Student"
                : "Save Changes"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                style={styles.cancel}
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>


      <section style={styles.panel}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Students ({students.length})
          </h2>

          <button
            type="button"
            style={styles.refresh}
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p>Loading students...</p>
        ) : students.length === 0 ? (
          <p>No students found. Add your first student above.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "ID",
                    "Name",
                    "Email",
                    "Phone",
                    "Department",
                    "Course",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} style={styles.th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={styles.td}>{student.id}</td>
                    <td style={styles.td}>{student.name}</td>
                    <td style={styles.td}>{student.email}</td>
                    <td style={styles.td}>{student.phone || "—"}</td>
                    <td style={styles.td}>{student.department}</td>
                    <td style={styles.td}>{student.course || "—"}</td>
                    <td style={styles.td}>
                      <div style={styles.rowActions}>
                        <button
                          type="button"
                          style={styles.edit}
                          onClick={() => handleEdit(student)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          style={styles.delete}
                          onClick={() => handleDelete(student)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>
          Courses ({courses.length})
        </h2>

        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>No courses found. Add courses through the Course Service.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Name", "Department", "Duration", "Fee"].map(
                    (heading) => (
                      <th key={heading} style={styles.th}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td style={styles.td}>{course.id}</td>
                    <td style={styles.td}>{course.name}</td>
                    <td style={styles.td}>{course.department || "—"}</td>
                    <td style={styles.td}>{course.duration || "—"}</td>
                    <td style={styles.td}>
                      {course.fee == null
                        ? "—"
                        : Number(course.fee).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section style={styles.panel}>
  <h2>Enrolled Students</h2>

  <select
    style={styles.input}
    value={selectedEnrollmentCourse}
    onChange={(event) => {
      const courseId = event.target.value;
      setSelectedEnrollmentCourse(courseId);
      loadEnrolledStudents(courseId);
    }}
  >
    <option value="">Select a course</option>

    {courses.map((course) => (
      <option key={course.id} value={course.id}>
        {course.name}
      </option>
    ))}
  </select>

  {enrollmentLoading && <p>Loading enrolled students...</p>}

  {enrollmentError && (
    <p style={styles.error}>{enrollmentError}</p>
  )}

  {!enrollmentLoading &&
    !enrollmentError &&
    selectedEnrollmentCourse &&
    enrolledStudents.length === 0 && (
      <p>No students enrolled in this course yet.</p>
    )}

  {enrolledStudents.length > 0 && (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
          </tr>
        </thead>

        <tbody>
          {enrolledStudents.map((student) => (
            <tr key={student.id}>
              <td style={styles.td}>{student.id}</td>
              <td style={styles.td}>{student.name}</td>
              <td style={styles.td}>{student.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
      <footer style={styles.footer}>
        Student Management System · React + FastAPI Microservices
      </footer>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "1250px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
    background: "#f8fafc",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  heading: {
    margin: "0 0 8px",
    fontSize: "28px",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
  },
  logout: {
    padding: "10px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    cursor: "pointer",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow: "0 2px 5px rgba(15, 23, 42, 0.04)",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
    color: "#475569",
  },
  number: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: "8px 0 0",
    color: "#2563eb",
  },
  panel: {
    marginBottom: "24px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 2px 5px rgba(15, 23, 42, 0.04)",
  },
  sectionTitle: {
    margin: "0 0 18px",
    fontSize: "21px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    boxSizing: "border-box",
    background: "#ffffff",
    fontSize: "14px",
  },
  formActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  primary: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
  },
  cancel: {
    padding: "11px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    cursor: "pointer",
  },
  refresh: {
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    cursor: "pointer",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "850px",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "12px",
    borderBottom: "2px solid #cbd5e1",
    background: "#f1f5f9",
    whiteSpace: "nowrap",
    fontSize: "14px",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    fontSize: "14px",
  },
  rowActions: {
    display: "flex",
    gap: "6px",
  },
  edit: {
    padding: "6px 10px",
    border: "none",
    borderRadius: "5px",
    background: "#dbeafe",
    color: "#1d4ed8",
    cursor: "pointer",
  },
  delete: {
    padding: "6px 10px",
    border: "none",
    borderRadius: "5px",
    background: "#fee2e2",
    color: "#b91c1c",
    cursor: "pointer",
  },
  error: {
    padding: "12px",
    marginBottom: "16px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "6px",
  },
  success: {
    padding: "12px",
    marginBottom: "16px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "6px",
  },
  footer: {
    padding: "16px 0",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
  },
};

export default Dashboard;