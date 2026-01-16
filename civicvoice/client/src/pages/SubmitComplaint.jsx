import React, { useState } from "react";
import ChatWidget from "../components/ChatWidget";
import MediaUploader from "../components/MediaUploader";
import MapPicker from "../components/MapPicker";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { MapPin, Camera, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

export default function SubmitComplaint() {
  const [partial, setPartial] = useState({});
  const [description, setDescription] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  function onMediaUploaded(meta) {
    if (meta?.url) setMediaUrls((m) => [...m, meta.url]);
  }

  function onPartial(p) {
    setPartial((prev) => ({ ...prev, ...p }));
    if (p.description && !description) setDescription(p.description);
  }

  async function onSubmit() {
    setMessage(null);
    if (!description && !partial.description) {
      setMessage({ type: "error", text: "Please describe the issue." });
      return;
    }
    if (!location) {
      setMessage({ type: "error", text: "Please pick a location on the map." });
      return;
    }
    setSubmitting(true);
    try {
      let locationGeo;
      if (Array.isArray(location) && location.length === 2) {
        const [maybeLon, maybeLat] = location;
        locationGeo = { type: "Point", coordinates: [maybeLon, maybeLat] }; // GeoJSON is [lon, lat]
      } else if (location?.type === "Point" && Array.isArray(location.coordinates)) {
        locationGeo = location;
      } else {
        locationGeo = { type: "Point", coordinates: [0, 0] };
      }

      const payload = {
        issueType: partial.issueType || "others",
        description: description || partial.description,
        locationText: partial.locationText || "",
        locationGeo,
        evidence: mediaUrls,
        reporterMobile: (JSON.parse(localStorage.getItem("civic_user") || "null") || {}).mobile || null,
        summary: partial.summary,
      };

      const res = await api.post("/complaints", payload);
      const complaint = res.data.complaint || res.data;
      setMessage({ type: "success", text: `Complaint submitted successfully!` });
      setTimeout(() => {
        navigate(`/complaint/${complaint._id || complaint.complaintId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err?.response?.data?.error || "Failed to submit complaint." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Report an Issue</h1>
        <p className="text-gray-500">Help us improve your city by reporting problems quickly and accurately.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Chat Interface */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
            <ChatWidget onPartial={onPartial} />
          </div>

          {/* Optional Description Edit */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-blue-600" />
              Review Description
            </h3>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm text-gray-700"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The AI will auto-fill this, but you can edit it here..."
            />
          </div>
        </div>

        {/* Right Column: Map & Evidence */}
        <div className="space-y-6">

          {/* Map Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                Pin Location
              </h3>
              <span className="text-xs text-gray-400">Click on map</span>
            </div>
            <div className="h-[320px] w-full relative z-0">
              <MapPicker onChange={(coords) => setLocation(coords)} />
            </div>
            <div className="p-3 bg-gray-50 text-xs text-gray-500 flex justify-between">
              <span>Selected Coordinates:</span>
              <span className="font-mono">{location ? (Array.isArray(location) ? `${location[1]?.toFixed(5)}, ${location[0]?.toFixed(5)}` : "Point Selected") : "None"}</span>
            </div>
          </div>

          {/* Media Upload Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Camera size={18} className="text-green-600" />
              Add Evidence
            </h3>
            <MediaUploader onUploaded={onMediaUploaded} />
            <div className="mt-3 text-xs text-gray-400 flex justify-between">
              <span>Supported: JPG, PNG, MP4</span>
              <span>{mediaUrls.length} uploaded</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={onSubmit}
              disabled={submitting}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2
                    ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'}`}
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>Submit Report <CheckCircle size={18} /></>
              )}
            </button>

            <button
              onClick={() => { setDescription(""); setMediaUrls([]); setLocation(null); }}
              className="px-6 py-3 rounded-lg font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={18} /> Reset
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
              {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              {message.text}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
