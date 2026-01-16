// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion"; // Animation
import { Plus, ChevronRight, FileText } from "lucide-react"; // Icons
import api from '../services/api';

const getStatusBadge = (status) => {
  const styles = {
    pending: "badge-pending",
    verified: "badge-verified",
    forwarded: "badge-verified",
    resolved: "badge-resolved",
    escalated: "badge-escalated",
  };
  return <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status.replace('_', ' ')}</span>;
};

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('civic_user') || 'null');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMyComplaints() {
      try {
        setLoading(true);
        const res = await api.get('/complaints/my-complaints');
        setComplaints(res.data || []);
      } catch (err) {
        console.error("Failed to fetch user complaints:", err);
        setError("Could not load your reports.");
      } finally {
        setLoading(false);
      }
    }
    fetchMyComplaints();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || "Citizen"}
          </h2>
          <p className="text-gray-500">Track your active reports and submissions</p>
        </div>
        <Link to="/submit" className="btn btn-primary shadow-lg shadow-blue-500/20">
          <Plus size={20} /> New Report
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <FileText className="text-blue-500" size={20} />
            My Reports
          </h3>
        </div>

        <div className="p-4">
          {loading && <div className="text-center py-12 text-gray-400">Loading your reports...</div>}
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}
          
          {!loading && !error && (
            <div className="space-y-3">
              {complaints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FileText size={32} />
                  </div>
                  <p className="text-gray-900 font-medium">No reports yet</p>
                  <p className="text-gray-500 text-sm mt-1">Your submitted issues will appear here.</p>
                </div>
              ) : (
                complaints.map((c, index) => (
                  <motion.div 
                    key={c.complaintId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/complaint/${c._id}`} 
                      className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-gray-900 capitalize text-lg">
                              {c.issueType}
                            </span>
                            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                              {c.complaintId}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-1 mb-3">{c.description}</p>
                          {getStatusBadge(c.status)}
                        </div>
                        <div className="text-gray-300 group-hover:text-blue-500 transition-colors">
                          <ChevronRight size={24} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}