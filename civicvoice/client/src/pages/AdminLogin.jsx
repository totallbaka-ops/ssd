// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setClientToken } from "../services/auth"; // We'll add 'adminLogin' to this file
import api from "../services/api"; // Assuming you have this from your auth service

/**
 * Admin/Department login page (Email + Password)
 */
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  // This function assumes an API call to your /api/department/login route
  async function onAdminLogin(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setMessage({ type: "error", text: "Please enter email and password." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      // This matches your 'departmentController.js' login function
      const res = await api.post("/department/login", { email, password });

      const data = res.data;
      const token = data.token;

      const user = {
        email: email,
        role: "admin", // Manually setting 'admin' role on login
        name: "Admin"
      };

      if (token) {
        setClientToken(token); // Save token for API calls
        localStorage.setItem("civic_user", JSON.stringify(user)); // Save user info
        localStorage.setItem("civic_token", token); // Save token
        
        setMessage({ type: "success", text: "Login successful." });
        navigate("/admin"); // Redirect to the admin dashboard
      } else {
        setMessage({ type: "error", text: data.message || "Login failed." });
      }
    } catch (err) {
      console.error("Admin login error:", err);
      const serverMsg = err?.response?.data?.message || err?.message;
      setMessage({ type: "error", text: serverMsg || "Login failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card-header">
        <div>
          <div className="card-title">Admin / Department Login</div>
          <div className="card-sub">Login with your Email and Password</div>
        </div>
      </div>

      <div style={{ padding: 12 }}>
        {message && (
          <div style={{ marginBottom: 12, color: message.type === "error" ? "var(--danger)" : "var(--gov-navy-700)" }}>
            {message.text}
          </div>
        )}

        <form onSubmit={onAdminLogin}>
          <div className="form-row">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}