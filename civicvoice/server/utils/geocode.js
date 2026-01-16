const axios = require("axios");

exports.getCoordinates = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await axios.get(url);
    if (res.data.length > 0) {
      const loc = res.data[0];
      return [parseFloat(loc.lon), parseFloat(loc.lat)];
    }
    return [0, 0];
  } catch (err) {
    console.error("Error fetching coordinates:", err.message);
    return [0, 0];
  }
};
