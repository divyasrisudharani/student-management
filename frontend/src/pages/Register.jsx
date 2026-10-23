import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await api.post("/auth/register", formData);

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    // } catch (error) {
    //   setMessage(
    //     error.response?.data?.detail ||
    //     "Registration failed. Check your details and try again."
    //   );
    // } finally {
    //   setLoading(false);
    // }
       } catch (error) {
         console.error("Registration error:", error);
         console.error("Backend response:", error.response?.data);

         const detail = error.response?.data?.detail;

         setMessage(
           typeof detail === "string"
             ? detail
             : Array.isArray(detail)
             ? detail.map((item) => item.msg).join(", ")
             : error.response
             ? `Registration failed (${error.response.status})`
              : "Cannot connect to the API Gateway. Check that port 8000 is running."
         );
       } finally {
         setLoading(false);
       }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Create Account</h2>

        <label>Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        {message && <p role="status">{message}</p>}

        <p>
          Already registered? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "380px",
    padding: "25px",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
};

export default Register;