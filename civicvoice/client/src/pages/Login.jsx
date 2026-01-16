// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Animation library
import { requestOtp, verifyOtp, setClientToken } from "../services/auth";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [stage, setStage] = useState("enter");
  const [tempToken, setTempToken] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const MOBILE_REGEX = /^(\+91)?\s?\d{10}$/;

  async function onSendOtp(e) {
    e.preventDefault(); // ✅ Keep this one

    console.log("onSendOtp called", { mobile });

    // ⬇️ REMOVED: The "length < 9" check (it's redundant)
    // ⬇️ REMOVED: The second "e.preventDefault()" check (it's redundant)

    // ✅ Keep this Regex check (it is the strongest validation)
    if (!mobile || !MOBILE_REGEX.test(mobile)) {
      setMessage({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await requestOtp(mobile);
      const t = res?.tempToken || res?.data?.tempToken || null;
      setTempToken(t);
      setMessage({ type: "success", text: "OTP sent successfully." });
      setStage("verify");
    } catch (err) {
      setMessage({ type: "error", text: "Failed to send OTP. Try again." });
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e) {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await verifyOtp(mobile, otp, tempToken);
      const data = res?.data ? res.data : res;
      const token = data?.token || data?.accessToken || null;
      const user = data?.user || data?.data?.user || null;

      if (token) {
        setClientToken(token);
        if (user) localStorage.setItem("civic_user", JSON.stringify(user));
        navigate("/dashboard");
      } else {
        setMessage({ type: "error", text: "Login failed. No token received." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Invalid OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card w-full max-w-md p-8 relative overflow-hidden shadow-lg border-t-4 border-[#2D3092]"
      >


        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Citizen Login</h2>
          <p className="text-gray-500 mt-2 text-sm">Enter your mobile to report issues & track status</p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`p-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
              }`}
          >
            {message.text}
          </motion.div>
        )}

        {stage === "enter" ? (
          <form onSubmit={onSendOtp} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
              <input
                className="input text-lg"
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center text-base py-3" disabled={loading}>
              {loading ? "Sending Code..." : "Get OTP Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Enter Verification Code
                <span className="block text-xs font-normal text-gray-400 mt-0.5">Sent to {mobile}</span>
              </label>
              <input
                className="input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="••••••"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center text-base py-3" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button
              type="button"
              onClick={() => { setStage("enter"); setMessage(null); }}
              className="text-sm text-gray-500 hover:text-blue-600 w-full text-center font-medium transition-colors"
            >
              ← Wrong number? Go back
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}