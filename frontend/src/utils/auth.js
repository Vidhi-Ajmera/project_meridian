// utils/auth.js
export const saveToken = (token) => localStorage.setItem("authToken", token);
export const getToken = () => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("userData");

  if (!token) return null;

  try {
    // If you have stored the user data separately in localStorage
    if (userData) {
      const parsedData = JSON.parse(userData);
      return {
        token: token,
        role: parsedData.role,
        username: parsedData.username,
        email: parsedData.email,
      };
    }

    // Fallback to parsing JWT if userData isn't available
    // (assuming token is JWT with role in payload)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      token: token,
      role: payload.role || null,
      username: payload.username || null,
      email: payload.email || null,
    };
  } catch (error) {
    console.error("Error parsing token data", error);
    return null;
  }
};
export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
};
export const saveUserInfo = (userInfo) =>
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
export const getUserInfo = () => {
  const userInfo = localStorage.getItem("userInfo");
  return userInfo ? JSON.parse(userInfo) : null;
};
