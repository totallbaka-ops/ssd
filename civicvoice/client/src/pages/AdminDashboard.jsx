// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import { BarChart3, Users, AlertTriangle, CheckCircle } from "lucide-react";

// ---
// ⬇️ 1. DEFINE YOUR DEPARTMENTS HERE
// No database accounts needed. Just names for the dropdown.
// ---
const DEPARTMENT_OPTIONS = [
  "Water Supply Department",
  "Sanitation & Waste",
  "Roads & Traffic",
  "Electricity Board",
  "General Administration",
  "Health Department"
];

// Modern Stat Widget
function StatCard({ title, value, unit, icon: Icon, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
      <div>
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm font-medium text-gray-400">{unit}</span>}
        </div>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        // ---
        // ⬇️ 2. REMOVED: api.get("/department")
        // We don't need to fetch users anymore.
        // ---
        const [cRes, aRes] = await Promise.all([
          api.get("/admin/complaints"),
          api.get("/admin/analytics")
        ]);
        setComplaints(cRes.data || []);
        setAnalytics(aRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleAction = async (action, id, payload = {}) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/${action}/${id}`, payload);
      
      // Optimistic Update
      setComplaints(prev => prev.map(c => {
        if (c._id !== id) return c;
        if (action === 'verify') return { ...c, status: 'verified' };
        // If assigning, update status and the department name
        if (action === 'assign') return { ...c, status: 'forwarded', assignedDepartment: payload.department };
        if (action === 'resolve') return { ...c, status: 'resolved' };
        return c;
      }));
    } catch (err) {
      console.error(err);
      alert("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading admin dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Reports" 
          value={analytics?.totalComplaints || 0} 
          icon={BarChart3} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Escalations" 
          value={analytics?.escalatedComplaints || 0} 
          icon={AlertTriangle} 
          color="bg-red-50 text-red-600" 
        />
        <StatCard 
          title="Avg Resolution" 
          value={analytics?.averageResolutionDays || 0} 
          unit="days" 
          icon={CheckCircle} 
          color="bg-green-50 text-green-600" 
        />
      </div>

      {/* Complaints Management */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Complaint Management</h3>
          <span className="badge bg-blue-50 text-blue-700">{complaints.length} Active</span>
        </div>

        <div className="divide-y divide-gray-100">
          {complaints.map((c) => (
            <motion.div 
              key={c._id} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6"
            >
              {/* Complaint Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`badge ${c.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}`}>
                    {c.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900 capitalize">{c.issueType}</span>
                  <span className="text-xs font-mono text-gray-400">{c.complaintId}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{c.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>📍 {c.locationText || "Pinned on Map"}</span>
                  <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                  <span>👍 {c.upvotes || 0} Upvotes</span>
                </div>
              </div>

              {/* Actions Column */}
              <div className="flex flex-col gap-2 w-full md:w-48 justify-center">
                {c.status === 'pending' && (
                  <button 
                    onClick={() => handleAction('verify', c._id)} 
                    disabled={actionLoading}
                    className="btn btn-primary w-full"
                  >
                    Verify Report
                  </button>
                )}

                {c.status === 'verified' && (
                  <div className="flex flex-col gap-2">
                    <select 
                      id={`dept-${c._id}`} 
                      className="input py-2 text-sm"
                    >
                      <option value="">Select Dept...</option>
                      {/* ⬇️ 3. MODIFIED: Mapping over the static list
                      */}
                      {DEPARTMENT_OPTIONS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        const dept = document.getElementById(`dept-${c._id}`).value;
                        if(dept) handleAction('assign', c._id, { department: dept });
                      }}
                      disabled={actionLoading}
                      className="btn btn-outline w-full justify-center"
                    >
                      Assign & Forward
                    </button>
                  </div>
                )}

                {(['forwarded', 'in_progress', 'escalated'].includes(c.status)) && (
                  <div className="space-y-2 text-center">
                    <div className="text-xs text-gray-500 mb-1">Assigned: <strong className="text-gray-800">{c.assignedDepartment}</strong></div>
                    <button 
                      onClick={() => handleAction('resolve', c._id)} 
                      disabled={actionLoading}
                      className="btn btn-primary bg-green-600 hover:bg-green-700 w-full justify-center"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}