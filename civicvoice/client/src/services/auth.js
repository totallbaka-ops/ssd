import api from "./api";

export async function requestOtp(mobile) {
  const res = await api.post("/auth/request-otp", { mobile });
  return res.data;
}

export async function verifyOtp(mobile, otp, tempToken) {
  // send payload in a flexible way
  const payload = { mobile, otp };
  if (tempToken) payload.tempToken = tempToken;
  return api.post("/auth/verify-otp", payload).then(r => r.data);
}
export function setClientToken(token) {
  localStorage.setItem("civic_token", token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export function logout() {
  localStorage.removeItem("civic_token");
  localStorage.removeItem("civic_user");
  delete api.defaults.headers.common["Authorization"];
}
