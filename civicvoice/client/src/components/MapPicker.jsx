// src/components/MapPicker.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

// ---
// ⬇️ 1. IMPORT THE CSS FOR THE SEARCH BAR
// ---
import 'leaflet-geosearch/dist/geosearch.css';

// This component handles the search bar UI
const SearchField = ({ onLocationFound }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',         // This gives it a search-bar look
      showMarker: false,    // We'll use our own marker
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
    });

    map.addControl(searchControl);

    // Listen for when a location is found
    map.on('geosearch/showlocation', (result) => {
      // result.location.y is latitude, result.location.x is longitude
      const [lat, lon] = [result.location.y, result.location.x];
      onLocationFound([lon, lat]); // Pass [lon, lat] up
    });

    return () => map.removeControl(searchControl);
  }, [map, onLocationFound]);

  return null;
};

// This component handles clicking on the map
const ClickableMarker = ({ pos, onPosChange }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      // Pass [lon, lat] up
      onPosChange([lng, lat]);
    },
  });

  // Use the parent's position state
  return pos ? <Marker position={[pos[1], pos[0]]} /> : null;
};

// ---
// ⬇️ 2. THIS IS YOUR MODIFIED MAP PICKER COMPONENT
// ---
export default function MapPicker({ onChange, defaultPos = [17.4455, 78.3489] }) {
  // We use [lon, lat] format for our state
  const [position, setPosition] = useState([defaultPos[1], defaultPos[0]]);

  // This function is called by BOTH click and search
  const handlePositionChange = (newPos) => {
    // newPos is [lon, lat]
    setPosition(newPos);
    onChange(newPos); // Pass [lon, lat] up to SubmitComplaint.jsx

    // Also update the map's view
    // (This part is tricky, so we'll skip it for simplicity, 
    // the search bar already moves the map)
  };

  return (
    <div>
      <MapContainer
        center={defaultPos} // Map still centers on default
        zoom={13}
        style={{ height: 400 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Pass the new handler to both components */}
        <ClickableMarker pos={position} onPosChange={handlePositionChange} />
        <SearchField onLocationFound={handlePositionChange} />
      </MapContainer>
    </div>
  );
}