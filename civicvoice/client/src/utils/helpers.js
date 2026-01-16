// src/utils/helpers.js

// Normalize coordinates to [lat, lon] for Leaflet.
// Accepts GeoJSON-style [lon, lat] OR [lat, lon] and returns [lat, lon].
// If the input is invalid, returns [0, 0].
export function geoToLeaflet(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return [0, 0];
  }

  // coerce to numbers
  const a = Number(coordinates[0]);
  const b = Number(coordinates[1]);
  if (!isFinite(a) || !isFinite(b)) {
    return [0, 0];
  }

  // lat is always between -90 and 90. If the first value is outside that range,
  // it's almost certainly a longitude (i.e. the array is [lon, lat]) and we must swap.
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
    // input is [lon, lat] -> return [lat, lon]
    return [b, a];
  }

  // else assume input is [lat, lon] (or ambiguous but within valid ranges) -> return as-is
  return [a, b];
}

export function leafletToGeo(latLngArray) {
  const [lat, lon] = latLngArray || [0, 0];
  return { type: "Point", coordinates: [Number(lon) || 0, Number(lat) || 0] };
}
