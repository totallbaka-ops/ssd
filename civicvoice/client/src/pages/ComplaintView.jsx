// src/pages/ComplaintView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Building, ThumbsUp, ArrowLeft, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import api from '../services/api';

export default function ComplaintView() {
    const { id } = useParams();
    const [complaint, setComplaint] = useState(null);
    const [error, setError] = useState(null);
    const [selectedRating, setSelectedRating] = useState(0);

    // Get current user info to check if they have rated
    const user = JSON.parse(localStorage.getItem('civic_user') || 'null');
    const userId = user?.id || user?._id; 

    useEffect(() => {
        api.get(`/complaints/${id}`)
            .then(r => setComplaint(r.data))
            .catch(err => {
                console.error(err);
                setError(err.response?.data?.message || "Could not load complaint.");
            });
    }, [id]);

    async function upvote() {
        try {
            setError(null);
            await api.post(`/complaints/${id}/upvote`);
            const r = await api.get(`/complaints/${id}`);
            setComplaint(r.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to upvote.");
        }
    }

    async function submitRating() {
        if (selectedRating === 0) {
            setError("Please select a rating from 1 to 5.");
            return;
        }
        try {
            setError(null);
            const res = await api.post(`/complaints/${id}/rate`, { rating: selectedRating });
            // Update local state with the new ratings array
            setComplaint(c => ({ ...c, ratings: res.data.ratings }));
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to submit rating.");
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'verified': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    // --- Helper: Calculate Average ---
    const getAverageRating = () => {
        const ratings = complaint.ratings || [];
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, curr) => acc + curr.value, 0);
        return (sum / ratings.length).toFixed(1);
    };

    // --- Helper: Get Current User's Rating ---
    const getUserRating = () => {
        if (!userId || !complaint.ratings) return null;
        return complaint.ratings.find(r => r.user === userId)?.value;
    };

    const renderRatingUI = () => {
        // Only show rating UI if resolved
        if (complaint.status !== 'resolved') return null;

        const average = getAverageRating();
        const myRating = getUserRating();
        const ratingsCount = complaint.ratings?.length || 0;

        // SCENARIO 1: User Logged In & Already Rated -> Show Result
        if (userId && myRating) {
            return (
                <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-100 text-center">
                    <div className="flex justify-center items-center gap-2 mb-2 text-green-800 font-bold text-lg">
                        <CheckCircle size={24} />
                        You rated this resolution: {myRating} / 5
                    </div>
                    <p className="text-green-600 text-sm">Thank you for your feedback!</p>
                    <div className="mt-4 pt-4 border-t border-green-200/50 text-sm text-green-700">
                        Community Average: <strong>{average}</strong> ({ratingsCount} votes)
                    </div>
                </div>
            );
        }

        // SCENARIO 2: User Logged In & Not Rated -> Show Input
        if (userId && !myRating) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center"
                >
                    <h4 className="font-semibold text-blue-900 mb-4">How was the resolution?</h4>
                    <div className="flex justify-center gap-3 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => setSelectedRating(star)}
                                className={`w-10 h-10 rounded-full text-lg font-bold transition-all transform hover:scale-110 flex items-center justify-center ${selectedRating >= star
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white text-blue-600 border border-blue-200'
                                    }`}
                            >
                                {star}
                            </button>
                        ))}
                    </div>
                    <button onClick={submitRating} className="btn btn-primary px-8">Submit Feedback</button>
                </motion.div>
            );
        }

        // SCENARIO 3: User Not Logged In -> Show Average Only
        return (
            <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <h4 className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Community Feedback</h4>
                <div className="flex justify-center items-center gap-2 mb-1">
                    <Star className="fill-yellow-400 text-yellow-400" size={28} />
                    <span className="text-3xl font-bold text-gray-900">{average}</span>
                    <span className="text-gray-400 text-xl">/ 5</span>
                </div>
                <p className="text-gray-500 text-sm">Based on {ratingsCount} citizen votes</p>
                <div className="mt-4">
                    <Link to="/login" className="text-sm text-blue-600 font-medium hover:underline">
                        Login to verify & rate this work
                    </Link>
                </div>
            </div>
        );
    };

    if (error) return (
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
            <AlertTriangle /> {error}
        </div>
    );

    if (!complaint) return <div className="text-center mt-20 text-gray-400">Loading details...</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium">
                <ArrowLeft size={18} className="mr-2" /> Back to Map
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 md:p-10 relative overflow-hidden"
            >
                {/* Decorative Blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(complaint.status)}`}>
                                {complaint.status}
                            </span>
                            <span className="text-gray-400 font-mono text-sm">{complaint.complaintId}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 capitalize leading-tight">
                            {complaint.issueType}
                        </h1>
                    </div>

                    {complaint.status !== 'resolved' && (
                        <button
                            onClick={upvote}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group"
                        >
                            <ThumbsUp size={18} className={complaint.upvoters?.includes(userId) ? "fill-blue-600 text-blue-600" : "group-hover:scale-110 transition-transform"} />
                            <span className="font-medium">{complaint.upvotes || 0} Affected</span>
                        </button>
                    )}
                </div>

                {/* Description Box */}
                <div className="bg-white/60 p-6 rounded-2xl border border-gray-100 mb-8 text-gray-700 leading-relaxed">
                    {complaint.description}
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Location</div>
                            <div className="text-sm text-gray-500">{complaint.locationText}</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                            <Building size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Department</div>
                            <div className="text-sm text-gray-500">{complaint.assignedDepartment || "Pending Assignment"}</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Reported On</div>
                            <div className="text-sm text-gray-500">
                                {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evidence Gallery */}
                {complaint.media && complaint.media.length > 0 && (
                    <div className="mb-8">
                        <h4 className="font-semibold text-gray-900 mb-4">Evidence Uploaded</h4>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {complaint.media.map((m, i) => (
                                <div key={i} className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                    {m.type?.includes('video') ? (
                                        <video src={m.url} className="w-full h-full object-cover" controls />
                                    ) : (
                                        <img src={m.url} alt="evidence" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rating Section */}
                {renderRatingUI()}

            </motion.div>
        </div>
    );
}