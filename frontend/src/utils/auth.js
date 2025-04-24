
// utils/auth.js
export const saveToken = (token) => localStorage.setItem("authToken", token);
export const getToken = () => localStorage.getItem("authToken");
export const clearToken = () => localStorage.removeItem("authToken");
export const saveUserInfo = (userInfo) =>
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
export const getUserInfo = () => {
  const userInfo = localStorage.getItem("userInfo");
  return userInfo ? JSON.parse(userInfo) : null;
};