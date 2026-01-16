// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute"; // <-- 1. IMPORT CITIZEN PROTECTOR

import PublicMap from "./pages/PublicMap";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SubmitComplaint from "./pages/SubmitComplaint";
import ComplaintView from "./pages/ComplaintView";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-content">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<PublicMap />} />
          <Route path="/login" element={<Login />} />
          <Route path="/complaint/:id" element={<ComplaintView />} />

          {/* --- Citizen Protected Routes --- */}
          <Route
            path="/submit"
            element={
              <ProtectedRoute> {/* <-- 2. WRAP ROUTE */}
                <SubmitComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute> {/* <-- 3. WRAP ROUTE */}
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* --- Admin Routes --- */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
        <footer className="relative bg-[#1e2060] text-white py-8 mt-40 rounded-t-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#F5BC5B]">GHMC Head Office</h3>
              <p>CC Complex Tank Bund Road,</p>
              <p>Lower Tank Bund,</p>
              <p>Hyderabad: 500063</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#F5BC5B]">Contact Us</h3>
              <p>Helpline: 040-21111111</p>
              <p>Email: commissioner@ghmc.gov.in</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#F5BC5B]">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#5FB6EA]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#5FB6EA]">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#5FB6EA]">RTI</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-blue-900 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Greater Hyderabad Municipal Corporation. All Rights Reserved. | Powered by CivicVoice
          </div>
        </footer>
      </main>
    </div>
  );
}