const issueKeywords = {
  water: ["leak", "pipe", "water", "sewage", "drain"],
  waste: ["garbage", "trash", "waste", "dustbin", "cleaning"],
  roads: ["pothole", "road", "streetlight", "traffic", "signal"],
  electricity: ["power", "light", "electric", "transformer"],
  others: []
};

exports.parseComplaintText = (text) => {
  text = text.toLowerCase();

  let issueType = "others";
  for (const [type, words] of Object.entries(issueKeywords)) {
    if (words.some((w) => text.includes(w))) {
      issueType = type;
      break;
    }
  }

  // Basic extraction for location phrases
  const locationMatch = text.match(/near\s([\w\s]+)/);
  const locationText = locationMatch ? locationMatch[1] : "Location not specified";

  return {
    issueType,
    description: text,
    locationText,
    severity: "medium"
  };
};
