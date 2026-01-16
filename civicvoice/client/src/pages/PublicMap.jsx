// src/pages/PublicMap.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { Filter, EyeOff, CheckCircle, AlertCircle, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import api from '../services/api';
import { geoToLeaflet } from '../utils/helpers';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';

// --- Icons Setup ---
const createIcon = (colorUrl) => new L.Icon({
  iconUrl: colorUrl,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const GreenIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png');
const RedIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png');

// --- Search Component ---
const SearchField = () => {
  const map = useMap();
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
    });
    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);
  return null;
};

// --- Filter Button ---
const FilterButton = ({ active, onClick, icon: Icon, label, colorClass }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-sm border ${active
        ? `bg-white ${colorClass} border-gray-200 ring-2 ring-black/5 scale-105`
        : 'bg-gray-50 text-gray-500 border-transparent hover:bg-white hover:shadow-md'
      }`}
  >
    <Icon size={14} strokeWidth={2.5} />
    {label}
  </button>
);

export default function PublicMap() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all');

  const defaultPos = [17.4455, 78.3489]; // IIIT Hyderabad

  useEffect(() => {
    async function fetchPublicComplaints() {
      try {
        setLoading(true);
        const res = await api.get('/complaints/public/list');
        setComplaints(res.data || []);
        setError(null);
      } catch (err) {
        setError("Could not load complaint data.");
      } finally {
        setLoading(false);
      }
    }
    fetchPublicComplaints();
  }, []);

  const getVisibleComplaints = () => {
    if (filterMode === 'none') return [];
    return complaints.filter(c => {
      const isResolved = c.status === 'resolved';
      if (filterMode === 'all') return true;
      if (filterMode === 'resolved') return isResolved;
      if (filterMode === 'active') return !isResolved;
      return true;
    });
  };

  const visibleComplaints = getVisibleComplaints();

  return (
    // 1. OUTER CARD: No movement animation here to keep map stable.
    <div className="card relative overflow-hidden border-0 shadow-2xl ring-1 ring-black/5 h-[calc(100vh-100px)] min-h-[600px]">

      {/* 2. HEADER: Slides Down */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none"
      >
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Layers size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Public Issues Map</h1>
              <p className="text-xs text-gray-500 font-medium">Real-time citizen reports</p>
            </div>
          </div>

          <div className="flex gap-2">
            <FilterButton active={filterMode === 'all'} onClick={() => setFilterMode('all')} icon={Layers} label="All" colorClass="text-blue-600" />
            <FilterButton active={filterMode === 'active'} onClick={() => setFilterMode('active')} icon={AlertCircle} label="Active" colorClass="text-red-600" />
            <FilterButton active={filterMode === 'resolved'} onClick={() => setFilterMode('resolved')} icon={CheckCircle} label="Solved" colorClass="text-green-600" />
            <FilterButton active={filterMode === 'none'} onClick={() => setFilterMode('none')} icon={EyeOff} label="Hide" colorClass="text-gray-600" />
          </div>
        </div>
      </motion.div>

      {/* 3. MAP: Only Fades In (No Movement) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-full z-0 bg-gray-100"
      >
        <MapContainer center={defaultPos} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <SearchField />

          {visibleComplaints.map(complaint => {
            const position = geoToLeaflet(complaint.locationGeo?.coordinates);
            const isResolved = complaint.status === 'resolved';
            const markerIcon = isResolved ? GreenIcon : RedIcon;

            return (
              <Marker key={complaint._id} position={position} icon={markerIcon}>
                <Popup className="custom-popup">
                  <div className="p-1">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{complaint.complaintId}</div>
                    <div className="text-base font-bold text-gray-900 capitalize mb-1">{complaint.issueType}</div>
                    <div className="text-sm text-gray-600 mb-2 line-clamp-2">{complaint.locationText}</div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isResolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {complaint.status}
                      </span>
                      <a href={`/complaint/${complaint._id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
                        VIEW DETAILS →
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[2000] bg-white flex flex-col items-center justify-center"
          >
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100">
              <Loader2 className="animate-spin text-blue-600" size={24} />
              <span className="text-sm font-medium text-gray-700">Loading live reports...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] bg-red-50 p-4 rounded-xl border border-red-100 shadow-xl text-red-600 font-medium flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* 4. STATUS BAR: Slides Up */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 shadow-lg text-xs font-bold text-gray-600 flex items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          {visibleComplaints.length} reports visible
        </div>
      </motion.div>
    </div>
  );
}