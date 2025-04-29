// utils/auth.js

// Save token to localStorage
export const saveToken = (token) => {
  localStorage.setItem("authToken", token);
};

// Get token and user details
export const getToken = () => {
  const token = localStorage.getItem("authToken");
  const userInfo = localStorage.getItem("userInfo"); // <-- changed to userInfo

  if (!token) return null;

  try {
    if (userInfo) {
      const parsedData = JSON.parse(userInfo);
      return {
        token,
        role: parsedData.role,
        username: parsedData.username,
        email: parsedData.email,
      };
    }

    // Fallback to decoding JWT manually (unsafe, but acceptable for simple apps)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    return {
      token,
      role: payload.role || null,
      username: payload.username || null,
      email: payload.email || null,
    };
  } catch (error) {
    console.error("Error parsing token or user info:", error);
    return null;
  }
};

// Clear token and user info
export const clearToken = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userInfo");
};

// Save user info to localStorage
export const saveUserInfo = (userInfo) => {
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
};

// Get user info
export const getUserInfo = () => {
  const userInfo = localStorage.getItem("userInfo");
  return userInfo ? JSON.parse(userInfo) : null;
};
